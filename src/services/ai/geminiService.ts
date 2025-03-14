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
  private apiUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

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
  async getBestMove(fen: string, difficulty: AIDifficulty): Promise<{ from: string; to: string; promotion?: string }> {
    // Adjust temperature based on difficulty
    const temperatureMap: Record<AIDifficulty, number> = {
      beginner: 0.9,
      intermediate: 0.7,
      advanced: 0.5,
      master: 0.2
    };

    const temperature = temperatureMap[difficulty];

    // Create a prompt for the Gemini API
    const prompt = `
You are a chess engine assistant. Analyze the following chess position in FEN notation and suggest the best move.

FEN: ${fen}

Difficulty level: ${difficulty}

Rules:
1. Provide only a single move in the format "e2e4" (from square to square).
2. If it's a pawn promotion, add the promotion piece at the end, like "e7e8q" for queen promotion.
3. The move must be legal according to chess rules.
4. For beginner difficulty, you can make suboptimal but reasonable moves.
5. For master difficulty, provide the strongest move you can find.

Respond with ONLY the move in the format described, nothing else.
`;

    try {
      const response = await this.makeRequest(prompt, temperature);
      
      if (response.candidates && response.candidates.length > 0) {
        const moveText = response.candidates[0].content.parts[0].text.trim();
        
        // Parse the move text (format: e2e4 or e7e8q)
        if (moveText.length >= 4) {
          const from = moveText.substring(0, 2);
          const to = moveText.substring(2, 4);
          const promotion = moveText.length > 4 ? moveText.substring(4, 5) : undefined;
          
          return { from, to, promotion };
        }
      }
      
      throw new Error('Invalid response from Gemini API');
    } catch (error) {
      console.error('Failed to get move from Gemini API:', error);
      throw error;
    }
  }

  /**
   * Get analysis for a given position using Gemini API
   * @param fen FEN string representing the current position
   * @param difficulty AI difficulty level
   * @returns Analysis text
   */
  async getPositionAnalysis(fen: string, difficulty: AIDifficulty): Promise<string> {
    // Adjust temperature based on difficulty
    const temperatureMap: Record<AIDifficulty, number> = {
      beginner: 0.8,
      intermediate: 0.7,
      advanced: 0.6,
      master: 0.5
    };

    const temperature = temperatureMap[difficulty];

    // Create a prompt for the Gemini API
    const prompt = `
You are a chess coach analyzing a position. Provide analysis for the following chess position in FEN notation.

FEN: ${fen}

Difficulty level: ${difficulty}

Rules:
1. Analyze the position based on the difficulty level.
2. For beginner difficulty, use simple language and focus on basic concepts.
3. For master difficulty, provide deeper analysis with concrete variations.
4. Mention material balance, piece activity, and potential tactics.
5. Keep your analysis concise (2-3 sentences).

Respond with ONLY the analysis, nothing else.
`;

    try {
      const response = await this.makeRequest(prompt, temperature);
      
      if (response.candidates && response.candidates.length > 0) {
        return response.candidates[0].content.parts[0].text.trim();
      }
      
      throw new Error('Invalid response from Gemini API');
    } catch (error) {
      console.error('Failed to get analysis from Gemini API:', error);
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
  async getChatResponse(fen: string, message: string, difficulty: AIDifficulty): Promise<string> {
    // Adjust temperature based on difficulty and message content
    let temperature = 0.7;
    
    if (message.toLowerCase().includes('hint') || message.toLowerCase().includes('help')) {
      temperature = 0.5; // More focused for hints
    } else if (message.toLowerCase().includes('joke') || message.toLowerCase().includes('funny')) {
      temperature = 0.9; // More creative for jokes
    }

    // Create a prompt for the Gemini API
    const prompt = `
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

Respond with ONLY your chat message, nothing else.
`;

    try {
      const response = await this.makeRequest(prompt, temperature);
      
      if (response.candidates && response.candidates.length > 0) {
        return response.candidates[0].content.parts[0].text.trim();
      }
      
      throw new Error('Invalid response from Gemini API');
    } catch (error) {
      console.error('Failed to get chat response from Gemini API:', error);
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