import { AIDifficulty } from '../ai/aiService';
import { Chess } from 'chess.js';

/**
 * Backend service for handling Gemini API requests
 * This service communicates with the Lambda function that handles Gemini API calls
 */

// Log environment variables on load
console.log('Environment variables in geminiBackendService.ts:');
console.log('REACT_APP_LAMBDA_API_ENDPOINT:', process.env.REACT_APP_LAMBDA_API_ENDPOINT);
console.log('REACT_APP_DEBUG:', process.env.REACT_APP_DEBUG);

// API endpoint for the Lambda function
const LAMBDA_API_ENDPOINT = process.env.REACT_APP_LAMBDA_API_ENDPOINT || 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod';

// Enable console logging for debugging
const DEBUG = process.env.REACT_APP_DEBUG === 'true' || true;

console.log('Configured LAMBDA_API_ENDPOINT:', LAMBDA_API_ENDPOINT);
console.log('Debugging enabled:', DEBUG);

/**
 * Interface for Gemini API request
 */
interface GeminiRequest {
  prompt: string;
  temperature: number;
  difficulty: AIDifficulty;
  requestType: 'move' | 'analysis' | 'chat';
  fen: string;
  message?: string;
  chatHistory?: Array<{ sender: string; message: string; timestamp: number }>;
}

/**
 * Interface for Gemini API response
 */
interface GeminiResponse {
  content: string;
  success: boolean;
  error?: string;
}

/**
 * Send a request to the Gemini API through the Lambda function
 * @param request The request to send
 * @returns The response from the API
 */
const sendGeminiRequest = async (request: GeminiRequest): Promise<GeminiResponse> => {
  if (DEBUG) {
    console.log('Sending request to Gemini API:', {
      endpoint: LAMBDA_API_ENDPOINT,
      request
    });
  }
  
  try {
    // Check if the API endpoint is configured
    if (LAMBDA_API_ENDPOINT === 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod') {
      console.warn('Lambda API endpoint not configured. Please set REACT_APP_LAMBDA_API_ENDPOINT in .env file.');
    }
    
    const response = await fetch(`${LAMBDA_API_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (DEBUG) {
      console.log('Received response from Gemini API:', {
        status: response.status,
        statusText: response.statusText
      });
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (DEBUG) {
      console.log('Parsed response data:', data);
    }

    return data;
  } catch (error) {
    console.error('Gemini API request failed:', error);
    throw error;
  }
};

/**
 * Get the best move for a given position using Gemini API
 * @param fen FEN string representing the current position
 * @param difficulty AI difficulty level
 * @returns The best move in the format { from, to, promotion }
 */
export const getBestMove = async (
  fen: string,
  difficulty: AIDifficulty
): Promise<{ from: string; to: string; promotion?: string }> => {
  // Adjust temperature based on difficulty
  const temperatureMap: Record<AIDifficulty, number> = {
    beginner: 0.9,
    intermediate: 0.7,
    advanced: 0.5,
    master: 0.2
  };

  const temperature = temperatureMap[difficulty];

  // Create a prompt for the Gemini API
  // Use Chess.js to properly analyze the position
  const chess = new Chess(fen);
  const isCheck = chess.isCheck();
  const isCheckmate = chess.isCheckmate();
  const turn = chess.turn();
  
  const prompt = `
You are Garry Kasparov, a world-class chess grandmaster with particular expertise in the Sicilian Defense Najdorf Variation. Analyze the following chess position in FEN notation and suggest the best move.

FEN: ${fen}

Difficulty level: ${difficulty}
Current turn: ${turn === 'w' ? 'White' : 'Black'}
Check status: ${isCheck ? 'The king is IN CHECK' : 'The king is not in check'}
Checkmate status: ${isCheckmate ? 'CHECKMATE' : 'Not checkmate'}

As a grandmaster, you have:
- Deep understanding of complex interplay between tactical opportunities and long-term strategic considerations
- Expertise in pattern recognition and positional evaluation
- Knowledge of recent theoretical developments from 2020-2024 top-level tournament play
- Ability to analyze psychological aspects of choosing specific variations

Algorithm to use:
Use the Minimax algorithm with Alpha-Beta pruning to evaluate positions. For each position:
1. Evaluate material balance using standard piece values (pawn=100, knight=320, bishop=330, rook=500, queen=900)
2. Consider piece-square tables for positional evaluation (piece placement quality)
3. Look ahead ${difficulty === 'beginner' ? '1-2' : difficulty === 'intermediate' ? '2-3' : difficulty === 'advanced' ? '3-4' : '4-5'} moves
4. For beginner difficulty, occasionally (30-40% chance) choose a suboptimal but reasonable move
5. For intermediate difficulty, occasionally (10-20% chance) choose a slightly suboptimal move
6. For advanced difficulty, rarely (5-10% chance) choose a slightly suboptimal move
7. For master difficulty, always choose the objectively strongest move

Rules:
1. Provide only a single move in the format "e2e4" (from square to square).
2. If it's a pawn promotion, add the promotion piece at the end, like "e7e8q" for queen promotion.
3. The move must be legal according to chess rules.
4. ${isCheck ? 'IMPORTANT: The king is in check! You MUST address the check with your move.' : ''}
5. For beginner difficulty, make instructive moves that teach good principles rather than completely random moves.
6. For intermediate difficulty, play solid positional chess with occasional tactical opportunities.
7. For advanced difficulty, play strong tactical and strategic moves considering long-term plans.
8. For master difficulty, provide the strongest tournament-level move you can find, as if playing in a world championship match.

Respond with ONLY the move in the format described, nothing else.

${isCheck ? 'CRITICAL: Your king is in check! You MUST make a move that addresses the check. This can be done by: 1) Moving the king, 2) Capturing the checking piece, or 3) Blocking the check.' : ''}
`;

  const request: GeminiRequest = {
    prompt,
    temperature,
    difficulty,
    requestType: 'move',
    fen
  };

  try {
    const response = await sendGeminiRequest(request);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get move from Gemini API');
    }
    
    const moveText = response.content.trim();
    
    // Parse the move text (format: e2e4 or e7e8q)
    if (moveText.length >= 4) {
      const from = moveText.substring(0, 2);
      const to = moveText.substring(2, 4);
      const promotion = moveText.length > 4 ? moveText.substring(4, 5) : undefined;
      
      return { from, to, promotion };
    }
    
    throw new Error('Invalid response format from Gemini API');
  } catch (error) {
    console.error('Failed to get move from Gemini API:', error);
    throw error;
  }
};

/**
 * Get analysis for a given position using Gemini API
 * @param fen FEN string representing the current position
 * @param difficulty AI difficulty level
 * @returns Analysis text
 */
export const getPositionAnalysis = async (
  fen: string,
  difficulty: AIDifficulty
): Promise<string> => {
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
You are Garry Kasparov, a world-class chess grandmaster with particular expertise in the Sicilian Defense Najdorf Variation. Provide a comprehensive analysis of the following chess position in FEN notation.

FEN: ${fen}

Difficulty level: ${difficulty}

As a grandmaster, you have:
- Deep understanding of complex interplay between tactical opportunities and long-term strategic considerations
- Expertise in pattern recognition and positional evaluation
- Knowledge of recent theoretical developments from 2020-2024 top-level tournament play
- Ability to analyze psychological aspects of choosing specific variations

Algorithm to use:
Use the Minimax algorithm with Alpha-Beta pruning to evaluate positions. For each position:
1. Evaluate material balance using standard piece values (pawn=100, knight=320, bishop=330, rook=500, queen=900)
2. Consider piece-square tables for positional evaluation (piece placement quality)
3. Look ahead ${difficulty === 'beginner' ? '1-2' : difficulty === 'intermediate' ? '2-3' : difficulty === 'advanced' ? '3-4' : '4-5'} moves
4. Evaluate positions based on:
   - Material balance
   - Piece activity and coordination
   - Pawn structure
   - King safety
   - Control of key squares and center
   - Development and tempo

Rules:
1. Analyze the position based on the difficulty level.
2. For beginner difficulty, use simple language and focus on basic concepts (2-3 sentences).
3. For intermediate difficulty, provide a balanced analysis of material, position, and basic tactics (3-5 sentences).
4. For advanced difficulty, include concrete variations and deeper strategic themes (5-7 sentences).
5. For master difficulty, provide tournament-level analysis with precise variations, including:
   - Detailed evaluation of the position with numerical assessments
   - Key tactical motifs and pattern recognition
   - Strategic themes and middlegame plans
   - Critical pawn structures and their implications
   - Typical piece placement and coordination
   - Potential endgame scenarios
6. Use proper chess notation and provide evaluations using both traditional symbols (±, =, ∓) and numerical assessments where appropriate.
7. Explain the reasoning behind critical moves rather than just listing them.

Respond with ONLY the analysis, nothing else.
`;

  const request: GeminiRequest = {
    prompt,
    temperature,
    difficulty,
    requestType: 'analysis',
    fen
  };

  try {
    const response = await sendGeminiRequest(request);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get analysis from Gemini API');
    }
    
    return response.content.trim();
  } catch (error) {
    console.error('Failed to get analysis from Gemini API:', error);
    throw error;
  }
};

/**
 * Get a chat response using Gemini API
 * @param fen FEN string representing the current position
 * @param message User's message
 * @param difficulty AI difficulty level
 * @returns Chat response text
 */
export const getChatResponse = async (
  fen: string,
  message: string,
  difficulty: AIDifficulty,
  chatHistory: Array<{ sender: string; message: string; timestamp: number }> = []
): Promise<string> => {
  // Adjust temperature based on difficulty and message content
  let temperature = 0.7;
  
  if (message.toLowerCase().includes('hint') || message.toLowerCase().includes('help')) {
    temperature = 0.5; // More focused for hints
  } else if (message.toLowerCase().includes('joke') || message.toLowerCase().includes('funny')) {
    temperature = 0.9; // More creative for jokes
  }

  // Format chat history for the prompt
  // Sanitize messages to prevent JSON issues
  const sanitizeMessage = (text: string): string => {
    if (!text) return '';
    
    // More aggressive sanitization to ensure it doesn't contain any characters that could break JSON
    return text
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\\(?!["\\/bfnrt])/g, '\\\\') // Escape backslashes not followed by valid escape chars
      .replace(/"/g, '\\"') // Escape double quotes
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\r/g, ' ') // Replace carriage returns with spaces
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .replace(/[\u2028\u2029]/g, ''); // Remove line/paragraph separators
  };
  
  // Format chat history in a more robust way
  let formattedChatHistory = '';
  
  if (chatHistory && chatHistory.length > 0) {
    try {
      // Build history string with explicit try/catch for each message
      const historyLines = [];
      
      for (let i = 0; i < chatHistory.length; i++) {
        try {
          const chat = chatHistory[i];
          if (chat && typeof chat === 'object') {
            const sender = chat.sender === 'AI' ? 'Kasparov' : 'Player';
            const message = chat.message ? sanitizeMessage(chat.message) : '[empty message]';
            historyLines.push(`${sender}: ${message}`);
          }
        } catch (error) {
          console.error('Error processing chat history item:', error);
        }
      }
      
      if (historyLines.length > 0) {
        formattedChatHistory = `\nConversation history:\n${historyLines.join('\n')}\n`;
      }
    } catch (error) {
      console.error('Error formatting chat history:', error);
      formattedChatHistory = ''; // Reset to empty if there's an error
    }
  }

  // Create a prompt for the Gemini API
  const prompt = `
You are Garry Kasparov, a world-class chess grandmaster with particular expertise in the Sicilian Defense Najdorf Variation. You are responding to a player's message during a game. The current chess position is given in FEN notation.

FEN: ${fen}
Player's message: "${message}"
Difficulty level: ${difficulty}
${formattedChatHistory}

As a grandmaster, you have:
- Deep understanding of complex interplay between tactical opportunities and long-term strategic considerations
- Expertise in pattern recognition and positional evaluation
- Knowledge of recent theoretical developments from 2020-2024 top-level tournament play
- Ability to analyze psychological aspects of choosing specific variations

Algorithm to use:
When analyzing positions or suggesting moves, use the Minimax algorithm with Alpha-Beta pruning:
1. Evaluate material balance using standard piece values (pawn=100, knight=320, bishop=330, rook=500, queen=900)
2. Consider piece-square tables for positional evaluation (piece placement quality)
3. Look ahead ${difficulty === 'beginner' ? '1-2' : difficulty === 'intermediate' ? '2-3' : difficulty === 'advanced' ? '3-4' : '4-5'} moves
4. Evaluate positions based on:
   - Material balance
   - Piece activity and coordination
   - Pawn structure
   - King safety
   - Control of key squares and center
   - Development and tempo
5. For beginner difficulty, occasionally suggest instructive moves rather than the objectively strongest ones
6. For master difficulty, always suggest the objectively strongest moves

Rules:
1. Respond in a helpful, concise manner (1-3 sentences for beginners, more detailed for advanced players).
2. If the player asks for a hint or help, provide tournament-level analysis with precise variations.
3. If the player asks about the position, provide a detailed evaluation including:
   - Material balance and piece activity
   - Key tactical motifs and pattern recognition
   - Strategic themes and middlegame plans
   - Critical pawn structures and their implications
   - Typical piece placement and coordination
4. When describing chess moves, always explain them in plain English first, followed by the notation in parentheses.
   Example: "Moving your knight to attack the queen (Nf3)" or "Capturing the pawn with your bishop (Bxe5)"
5. Adjust your language based on the difficulty level (simpler for beginner, tournament-level analysis for master).
6. Stay in character as Kasparov, the chess grandmaster.
7. If the player asks something unrelated to chess, politely redirect to the game.
8. When discussing concrete variations, use proper chess notation and provide evaluations using both traditional symbols (±, =, ∓) and numerical assessments where appropriate.
9. Maintain continuity with the conversation history - refer back to previous exchanges when relevant.

Respond with ONLY your chat message, nothing else.
`;

  const request: GeminiRequest = {
    prompt,
    temperature,
    difficulty,
    requestType: 'chat',
    fen,
    message,
    chatHistory
  };

  try {
    const response = await sendGeminiRequest(request);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get chat response from Gemini API');
    }
    
    return response.content.trim();
  } catch (error) {
    console.error('Failed to get chat response from Gemini API:', error);
    throw error;
  }
};