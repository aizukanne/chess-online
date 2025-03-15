import { AIDifficulty } from './aiService';

// Interface for Gemini API request
interface GeminiRequest {
  contents: {
    parts: {
      text: string;
    }[];
  }[];
  generationConfig: {
    temperature: number;
    topP: number;
    topK: number;
    maxOutputTokens: number;
  };
}

// Interface for Gemini API response
interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
    finishReason: string;
  }[];
}

/**
 * Gemini API service for chess AI
 * This service integrates with Google's Gemini API to provide AI moves and analysis
 */
export class GeminiService {
  private apiKey: string;
  private apiUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Make a request to the Gemini API
   * @param prompt The prompt to send to the API
   * @param temperature Temperature for generation (higher = more creative)
   * @returns The API response
   */
  private async makeRequest(prompt: string, temperature: number = 0.7): Promise<GeminiResponse> {
    const request: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024
      }
    };

    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Gemini API request failed:', error);
      throw error;
    }
  }

  /**
   * Get the best move for a given position using Gemini API
   * @param fen FEN string representing the current position
   * @param difficulty AI difficulty level
   * @returns The best move in the format { from, to, promotion }
   */
  async getBestMove(fen: string, difficulty: AIDifficulty, retryCount = 0): Promise<{ from: string; to: string; promotion?: string }> {
    // Maximum number of retries
    const MAX_RETRIES = 3;
    
    // Adjust temperature based on difficulty
    const temperatureMap: Record<AIDifficulty, number> = {
      beginner: 0.9,
      intermediate: 0.7,
      advanced: 0.5,
      master: 0.2
    };

    const temperature = temperatureMap[difficulty];

    // Create a prompt for the Gemini API
    let prompt = `
You are a chess engine assistant. Analyze the following chess position in FEN notation and suggest the best move.

FEN: ${fen}

Difficulty level: ${difficulty}

Rules:
1. First, provide a brief explanation of your move in clear English (1-2 sentences).
2. Then, provide the move in the format "e2e4" (from square to square), NOT in algebraic notation.
3. DO NOT use algebraic notation like "Nxf3+" or "Qd8". Always use the exact square-to-square format.
4. If it's a pawn promotion, add the promotion piece at the end, like "e7e8q" for queen promotion.
5. The move must be legal according to chess rules.
6. For beginner difficulty, you can make suboptimal but reasonable moves.
7. For master difficulty, provide the strongest move you can find.
8. Format your response as: "Explanation: [your explanation]. Move: [from-square][to-square]"

Example response:
"Explanation: I'm developing my knight to a good square with tempo. Move: g1f3"

IMPORTANT: Always use the exact square-to-square format (like "g1f3"), never use algebraic notation (like "Nf3").
`;

    // If this is a retry, add feedback about the previous error
    if (retryCount > 0) {
      prompt = `
Your previous response contained an invalid move format. Please try again with a valid move.

${prompt}

CRITICAL: Your last response was invalid. You MUST provide the move in the format of exact squares like "e2e4" or "g1f3", NOT in algebraic notation like "Nxf3+" or "e4".
`;
    }

    try {
      const response = await this.makeRequest(prompt, temperature);
      
      if (response.candidates && response.candidates.length > 0) {
        const responseText = response.candidates[0].content.parts[0].text.trim();
        console.log(`Gemini response for move: ${responseText}`);
        
        // Extract the move from the response
        // Look for patterns like "Move: e2e4" or just "e2e4"
        const moveMatch = responseText.match(/Move:\s*([a-h][1-8][a-h][1-8][qrbnQRBN]?)/i) ||
                          responseText.match(/([a-h][1-8][a-h][1-8][qrbnQRBN]?)/);
        
        if (moveMatch && moveMatch[1]) {
          const moveText = moveMatch[1].toLowerCase();
          
          // Parse the move text (format: e2e4 or e7e8q)
          if (moveText.length >= 4) {
            const from = moveText.substring(0, 2);
            const to = moveText.substring(2, 4);
            const promotion = moveText.length > 4 ? moveText.substring(4, 5) : undefined;
            
            console.log(`Extracted move: from=${from}, to=${to}, promotion=${promotion || 'none'}`);
            
            // Validate that the move format is correct
            if (/^[a-h][1-8]$/.test(from) && /^[a-h][1-8]$/.test(to)) {
              return { from, to, promotion };
            } else {
              console.error(`Invalid move format: from=${from}, to=${to}`);
              
              // Retry with feedback if we haven't exceeded the maximum retries
              if (retryCount < MAX_RETRIES) {
                console.log(`Retrying getBestMove (attempt ${retryCount + 1} of ${MAX_RETRIES})`);
                return this.getBestMove(fen, difficulty, retryCount + 1);
              }
            }
          }
        }
        
        // If we couldn't extract a move using regex, fall back to the old method
        console.log('Could not extract move using regex, falling back to direct extraction');
        if (responseText.length >= 4) {
          // Try to find any 4-character sequence that looks like a chess move
          for (let i = 0; i < responseText.length - 3; i++) {
            const potentialMove = responseText.substring(i, i + 4).toLowerCase();
            if (/[a-h][1-8][a-h][1-8]/.test(potentialMove)) {
              const from = potentialMove.substring(0, 2);
              const to = potentialMove.substring(2, 4);
              const promotion = i + 5 <= responseText.length && /[qrbnQRBN]/.test(responseText[i + 4])
                ? responseText[i + 4].toLowerCase()
                : undefined;
              
              console.log(`Found move using fallback: from=${from}, to=${to}, promotion=${promotion || 'none'}`);
              return { from, to, promotion };
            }
          }
        }
        
        // If we still couldn't find a valid move and haven't exceeded retries
        if (retryCount < MAX_RETRIES) {
          console.log(`No valid move found, retrying (attempt ${retryCount + 1} of ${MAX_RETRIES})`);
          return this.getBestMove(fen, difficulty, retryCount + 1);
        }
      }
      
      throw new Error('Could not extract a valid move from Gemini API response after multiple attempts');
    } catch (error) {
      console.error('Failed to get move from Gemini API:', error);
      
      // Retry on error if we haven't exceeded the maximum retries
      if (retryCount < MAX_RETRIES) {
        console.log(`Error getting move, retrying (attempt ${retryCount + 1} of ${MAX_RETRIES})`);
        return this.getBestMove(fen, difficulty, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Get analysis for a given position using Gemini API
   * @param fen FEN string representing the current position
   * @param difficulty AI difficulty level
   * @returns Analysis text
   */
  async getPositionAnalysis(fen: string, difficulty: AIDifficulty, retryCount = 0): Promise<string> {
    // Maximum number of retries
    const MAX_RETRIES = 2;
    
    // Adjust temperature based on difficulty
    const temperatureMap: Record<AIDifficulty, number> = {
      beginner: 0.8,
      intermediate: 0.7,
      advanced: 0.6,
      master: 0.5
    };

    const temperature = temperatureMap[difficulty];

    // Create a prompt for the Gemini API
    let prompt = `
You are a chess coach analyzing a position. Provide analysis for the following chess position in FEN notation.

FEN: ${fen}

Difficulty level: ${difficulty}

Rules:
1. Analyze the position based on the difficulty level.
2. For beginner difficulty, use simple language and focus on basic concepts.
3. For master difficulty, provide deeper analysis with concrete variations.
4. Mention material balance, piece activity, and potential tactics.
5. Keep your analysis concise (2-3 sentences).
6. Include the current FEN notation in your response.
7. Format your response as: "Analysis: [your analysis]. Position: [FEN notation]"

Respond with ONLY the analysis and FEN notation as described above.
`;

    // If this is a retry, add feedback about the previous error
    if (retryCount > 0) {
      prompt = `
Your previous response was not in the correct format. Please try again.

${prompt}

IMPORTANT: Make sure to follow the format exactly as requested.
`;
    }

    try {
      const response = await this.makeRequest(prompt, temperature);
      
      if (response.candidates && response.candidates.length > 0) {
        const analysisText = response.candidates[0].content.parts[0].text.trim();
        console.log(`Gemini response for analysis: ${analysisText.substring(0, 100)}...`);
        
        // Validate that the response contains both analysis and position
        if (analysisText.includes("Analysis:") && analysisText.includes("Position:")) {
          return analysisText;
        } else if (retryCount < MAX_RETRIES) {
          console.log(`Analysis response not in correct format, retrying (attempt ${retryCount + 1} of ${MAX_RETRIES})`);
          return this.getPositionAnalysis(fen, difficulty, retryCount + 1);
        }
        
        // If we've exceeded retries but the format is still wrong, return it anyway
        return analysisText;
      }
      
      if (retryCount < MAX_RETRIES) {
        console.log(`Invalid response, retrying (attempt ${retryCount + 1} of ${MAX_RETRIES})`);
        return this.getPositionAnalysis(fen, difficulty, retryCount + 1);
      }
      
      throw new Error('Invalid response from Gemini API after multiple attempts');
    } catch (error) {
      console.error('Failed to get analysis from Gemini API:', error);
      
      if (retryCount < MAX_RETRIES) {
        console.log(`Error getting analysis, retrying (attempt ${retryCount + 1} of ${MAX_RETRIES})`);
        return this.getPositionAnalysis(fen, difficulty, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Get a chat response using Gemini API
   * @param fen FEN string representing the current position
   * @param message User's message
   * @param difficulty AI difficulty level
   * @returns Chat response text
   */
  async getChatResponse(fen: string, message: string, difficulty: AIDifficulty, retryCount = 0): Promise<string> {
    // Maximum number of retries
    const MAX_RETRIES = 2;
    
    // Adjust temperature based on difficulty and message content
    let temperature = 0.7;
    
    if (message.toLowerCase().includes('hint') || message.toLowerCase().includes('help')) {
      temperature = 0.5; // More focused for hints
    } else if (message.toLowerCase().includes('joke') || message.toLowerCase().includes('funny')) {
      temperature = 0.9; // More creative for jokes
    }

    // Create a prompt for the Gemini API
    let prompt = `
You are a chess AI assistant responding to a player's message during a game. The current chess position is given in FEN notation.

FEN: ${fen}
Player's message: "${message}"
Difficulty level: ${difficulty}

Rules:
1. Respond in a helpful, concise manner (1-3 sentences).
2. If the player asks for a hint or help, suggest a good move or strategy based on the position.
3. If the player asks about the position, provide a brief analysis.
4. Adjust your language based on the difficulty level (simpler for beginner, more technical for master).
5. Stay in character as a chess AI assistant.
6. If the player asks something unrelated to chess, politely redirect to the game.
7. Include the current FEN notation in your response.
8. Format your response as: "Response: [your message]. Position: [FEN notation]"

Respond with ONLY your chat message and the FEN notation as described above.
`;

    // If this is a retry, add feedback about the previous error
    if (retryCount > 0) {
      prompt = `
Your previous response was not in the correct format. Please try again.

${prompt}

IMPORTANT: Make sure to follow the format exactly as requested, including both the response and the position.
`;
    }

    try {
      const response = await this.makeRequest(prompt, temperature);
      
      if (response.candidates && response.candidates.length > 0) {
        const chatText = response.candidates[0].content.parts[0].text.trim();
        console.log(`Gemini response for chat: ${chatText.substring(0, 100)}...`);
        
        // Validate that the response contains both response and position
        if (chatText.includes("Response:") && chatText.includes("Position:")) {
          return chatText;
        } else if (retryCount < MAX_RETRIES) {
          console.log(`Chat response not in correct format, retrying (attempt ${retryCount + 1} of ${MAX_RETRIES})`);
          return this.getChatResponse(fen, message, difficulty, retryCount + 1);
        }
        
        // If we've exceeded retries but the format is still wrong, return it anyway
        return chatText;
      }
      
      if (retryCount < MAX_RETRIES) {
        console.log(`Invalid response, retrying (attempt ${retryCount + 1} of ${MAX_RETRIES})`);
        return this.getChatResponse(fen, message, difficulty, retryCount + 1);
      }
      
      throw new Error('Invalid response from Gemini API after multiple attempts');
    } catch (error) {
      console.error('Failed to get chat response from Gemini API:', error);
      
      if (retryCount < MAX_RETRIES) {
        console.log(`Error getting chat response, retrying (attempt ${retryCount + 1} of ${MAX_RETRIES})`);
        return this.getChatResponse(fen, message, difficulty, retryCount + 1);
      }
      
      throw error;
    }
  }
}

// Create and export a singleton instance
let geminiService: GeminiService | null = null;

export const initGeminiService = (apiKey: string): GeminiService => {
  geminiService = new GeminiService(apiKey);
  return geminiService;
};

export const getGeminiService = (): GeminiService => {
  if (!geminiService) {
    throw new Error('Gemini service not initialized. Call initGeminiService first.');
  }
  return geminiService;
};