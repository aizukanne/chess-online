import { AIDifficulty } from '../ai/aiService';

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
  difficulty: AIDifficulty
): Promise<string> => {
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

  const request: GeminiRequest = {
    prompt,
    temperature,
    difficulty,
    requestType: 'chat',
    fen,
    message
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