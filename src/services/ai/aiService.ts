import { Chess, Move, Square } from 'chess.js';
import * as geminiBackendService from '../api/geminiBackendService';

/**
 * AI Service for chess game
 * This provides both a local implementation and integration with Google Gemini API through a backend service
 */

// Difficulty levels and their corresponding "strength"
export type AIDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'master';

// Flag to determine if Gemini API should be used
let useGeminiAPI = false;

/**
 * Enable or disable the use of Gemini API
 * @param enable Whether to enable Gemini API
 */
export const setUseGeminiAPI = (enable: boolean): void => {
  useGeminiAPI = enable;
  console.log(`Gemini API ${enable ? 'enabled' : 'disabled'} in aiService.ts`);
};

/**
 * Check if Gemini API is being used
 * @returns Whether Gemini API is being used
 */
export const isUsingGeminiAPI = (): boolean => {
  console.log(`Current Gemini API status: ${useGeminiAPI ? 'enabled' : 'disabled'}`);
  return useGeminiAPI;
};

interface DifficultySettings {
  depth: number;
  makeRandomMoves: boolean;
  randomMoveChance: number;
  evaluationNoise: number;
}

const difficultySettings: Record<AIDifficulty, DifficultySettings> = {
  beginner: {
    depth: 1,
    makeRandomMoves: true,
    randomMoveChance: 0.4, // 40% chance to make a random move
    evaluationNoise: 2.0, // Add significant noise to evaluation
  },
  intermediate: {
    depth: 2,
    makeRandomMoves: true,
    randomMoveChance: 0.2, // 20% chance to make a random move
    evaluationNoise: 1.0, // Add moderate noise to evaluation
  },
  advanced: {
    depth: 3,
    makeRandomMoves: true,
    randomMoveChance: 0.1, // 10% chance to make a random move
    evaluationNoise: 0.5, // Add slight noise to evaluation
  },
  master: {
    depth: 4,
    makeRandomMoves: false,
    randomMoveChance: 0,
    evaluationNoise: 0, // No noise
  },
};

/**
 * Simple piece-square tables for positional evaluation
 * These tables assign values to each square for each piece type
 * Higher values are better positions for the piece
 */
const pieceSquareTables = {
  p: [ // Pawn
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ],
  n: [ // Knight
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ],
  b: [ // Bishop
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5,  5,  5,  5,  5,-10],
    [-10,  0,  5,  0,  0,  5,  0,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
  ],
  r: [ // Rook
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
  ],
  q: [ // Queen
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
  ],
  k: [ // King (middlegame)
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [20, 30, 10,  0,  0, 10, 30, 20]
  ]
};

// Piece values for material evaluation
const pieceValues: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

/**
 * Evaluate a chess position
 * @param chess Chess instance
 * @returns Evaluation score (positive for white advantage, negative for black)
 */
const evaluatePosition = (chess: Chess): number => {
  // If the game is over, return a high value
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -10000 : 10000; // If it's white's turn and checkmate, black wins
  }
  
  if (chess.isDraw()) {
    return 0; // Draw is neutral
  }
  
  const board = chess.board();
  let score = 0;
  
  // Evaluate material and position
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        // Material value
        const value = pieceValues[piece.type.toLowerCase()];
        
        // Position value from piece-square tables
        const positionValue = pieceSquareTables[piece.type.toLowerCase() as keyof typeof pieceSquareTables][piece.color === 'w' ? i : 7 - i][j];
        
        // Add or subtract based on piece color
        score += piece.color === 'w' ? (value + positionValue) : -(value + positionValue);
      }
    }
  }
  
  return score;
};

/**
 * Find the best move using minimax algorithm with alpha-beta pruning
 * @param chess Chess instance
 * @param depth Search depth
 * @param alpha Alpha value for pruning
 * @param beta Beta value for pruning
 * @param isMaximizing Whether we're maximizing or minimizing
 * @returns Best score at this position
 */
const minimax = (
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number => {
  if (depth === 0 || chess.isGameOver()) {
    return evaluatePosition(chess);
  }
  
  const moves = chess.moves({ verbose: true }) as Move[];
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) {
        break; // Beta cutoff
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) {
        break; // Alpha cutoff
      }
    }
    return minEval;
  }
};

/**
 * Find the best move for the current position
 * @param fen FEN string representing the current position
 * @param difficulty AI difficulty level
 * @returns Best move in the format { from, to }
 */
export const findBestMove = async (
  fen: string,
  difficulty: AIDifficulty = 'intermediate'
): Promise<{ from: Square; to: Square; promotion?: 'q' | 'r' | 'b' | 'n' } | null> => {
  // Try to use Gemini API if enabled
  if (useGeminiAPI) {
    console.log(`Attempting to use Gemini API for move generation (difficulty: ${difficulty})`);
    try {
      console.log(`Calling geminiBackendService.getBestMove with FEN: ${fen}`);
      const move = await geminiBackendService.getBestMove(fen, difficulty);
      console.log(`Received move from Gemini API:`, move);
      return {
        from: move.from as Square,
        to: move.to as Square,
        promotion: move.promotion as 'q' | 'r' | 'b' | 'n' | undefined
      };
    } catch (error) {
      console.error('Failed to get move from Gemini API, falling back to local implementation:', error);
      // Fall back to local implementation
    }
  } else {
    console.log(`Using local implementation for move generation (Gemini API disabled)`);
  }
  
  // Local implementation
  const chess = new Chess(fen);
  const settings = difficultySettings[difficulty];
  
  // If the game is over, return null
  if (chess.isGameOver()) {
    return null;
  }
  
  const moves = chess.moves({ verbose: true }) as Move[];
  
  // Make a random move based on difficulty
  if (settings.makeRandomMoves && Math.random() < settings.randomMoveChance) {
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    return {
      from: randomMove.from as Square,
      to: randomMove.to as Square,
      promotion: randomMove.promotion as 'q' | 'r' | 'b' | 'n' | undefined
    };
  }
  
  let bestMove: Move | null = null;
  let bestScore = chess.turn() === 'w' ? -Infinity : Infinity;
  
  // Evaluate each move
  for (const move of moves) {
    chess.move(move);
    
    // Add some noise to the evaluation based on difficulty
    const noise = (Math.random() * 2 - 1) * settings.evaluationNoise * 10;
    
    // Use minimax to evaluate the position
    const score = minimax(
      chess,
      settings.depth - 1,
      -Infinity,
      Infinity,
      chess.turn() === 'w'
    ) + noise;
    
    chess.undo();
    
    // Update best move
    if ((chess.turn() === 'w' && score > bestScore) ||
        (chess.turn() === 'b' && score < bestScore)) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  if (bestMove) {
    return {
      from: bestMove.from as Square,
      to: bestMove.to as Square,
      promotion: bestMove.promotion as 'q' | 'r' | 'b' | 'n' | undefined
    };
  }
  
  return null;
};

/**
 * Generate a response from the AI about the current position
 * @param fen FEN string representing the current position
 * @param difficulty AI difficulty level
 * @returns AI's analysis of the position
 */
export const generateAIAnalysis = async (
  fen: string,
  difficulty: AIDifficulty = 'intermediate'
): Promise<string> => {
  // Try to use Gemini API if enabled
  if (useGeminiAPI) {
    try {
      return await geminiBackendService.getPositionAnalysis(fen, difficulty);
    } catch (error) {
      console.error('Failed to get analysis from Gemini API, falling back to local implementation:', error);
      // Fall back to local implementation
    }
  }
  
  // Local implementation
  const chess = new Chess(fen);
  
  // Game state messages
  if (chess.isCheckmate()) {
    return "The game is over. It's checkmate!";
  }
  
  if (chess.isDraw()) {
    if (chess.isStalemate()) {
      return "The game is a draw due to stalemate. Neither player can make a move.";
    }
    if (chess.isThreefoldRepetition()) {
      return "The game is a draw due to threefold repetition. The same position has occurred three times.";
    }
    if (chess.isInsufficientMaterial()) {
      return "The game is a draw due to insufficient material. Neither player has enough pieces to checkmate.";
    }
    return "The game is a draw.";
  }
  
  if (chess.isCheck()) {
    return `${chess.turn() === 'w' ? 'White' : 'Black'} is in check. You need to address this threat.`;
  }
  
  // Basic position analysis based on difficulty
  const evaluation = evaluatePosition(chess);
  const absEval = Math.abs(evaluation);
  
  let message = "";
  
  // Add different analysis based on difficulty
  switch (difficulty) {
    case 'beginner':
      if (absEval < 100) {
        message = "The position looks fairly even.";
      } else if (absEval < 300) {
        message = `${evaluation > 0 ? 'White' : 'Black'} has a slight advantage.`;
      } else if (absEval < 900) {
        message = `${evaluation > 0 ? 'White' : 'Black'} has a clear advantage.`;
      } else {
        message = `${evaluation > 0 ? 'White' : 'Black'} is winning.`;
      }
      
      // Add a simple tip
      message += " Remember to develop your pieces and control the center.";
      break;
      
    case 'intermediate':
      if (absEval < 100) {
        message = "The position is approximately equal.";
      } else if (absEval < 300) {
        message = `${evaluation > 0 ? 'White' : 'Black'} has a small advantage (${(absEval / 100).toFixed(1)} pawns).`;
      } else if (absEval < 900) {
        message = `${evaluation > 0 ? 'White' : 'Black'} has a significant advantage (${(absEval / 100).toFixed(1)} pawns).`;
      } else {
        message = `${evaluation > 0 ? 'White' : 'Black'} has a winning position.`;
      }
      
      // Add a more detailed tip
      message += " Consider your piece coordination and potential tactical opportunities.";
      break;
      
    case 'advanced':
    case 'master':
      if (absEval < 50) {
        message = "The position is balanced with equal chances.";
      } else if (absEval < 200) {
        message = `${evaluation > 0 ? 'White' : 'Black'} has a slight edge (${(absEval / 100).toFixed(2)} pawns).`;
      } else if (absEval < 500) {
        message = `${evaluation > 0 ? 'White' : 'Black'} has a clear advantage (${(absEval / 100).toFixed(2)} pawns).`;
      } else if (absEval < 900) {
        message = `${evaluation > 0 ? 'White' : 'Black'} has a decisive advantage (${(absEval / 100).toFixed(2)} pawns).`;
      } else {
        message = `${evaluation > 0 ? 'White' : 'Black'} has a technically winning position.`;
      }
      
      // Add a strategic tip
      const bestMove = await findBestMove(fen, difficulty);
      if (bestMove) {
        const moveString = `${bestMove.from}${bestMove.to}${bestMove.promotion ? bestMove.promotion : ''}`;
        message += ` I recommend considering the move ${moveString}.`;
      }
      break;
  }
  
  return message;
};

/**
 * Generate a chat response from the AI
 * @param fen FEN string representing the current position
 * @param message User's message
 * @param difficulty AI difficulty level
 * @returns AI's response to the user's message
 */
export const generateAIChatResponse = async (
  fen: string,
  message: string,
  difficulty: AIDifficulty = 'intermediate',
  chatHistory: Array<{ sender: string; message: string; timestamp: number }> = []
): Promise<string> => {
  // Always try to use Gemini API for chat responses first
  try {
    console.log('Attempting to use Gemini API for chat response');
    return await geminiBackendService.getChatResponse(fen, message, difficulty, chatHistory);
  } catch (error) {
    console.error('Failed to get chat response from Gemini API, falling back to local implementation:', error);
    // Fall back to local implementation
  }
  
  // Local implementation
  // Convert message to lowercase for easier matching
  const lowerMessage = message.toLowerCase();
  
  // Check for specific questions or commands
  if (lowerMessage.includes('hint') || lowerMessage.includes('help') || lowerMessage.includes('what should i do')) {
    const bestMove = await findBestMove(fen, difficulty);
    if (bestMove) {
      // Get piece type and create a more descriptive move
      const chess = new Chess(fen);
      const piece = chess.get(bestMove.from as Square);
      const targetPiece = chess.get(bestMove.to as Square);
      
      let pieceType = '';
      switch (piece?.type) {
        case 'p': pieceType = 'pawn'; break;
        case 'n': pieceType = 'knight'; break;
        case 'b': pieceType = 'bishop'; break;
        case 'r': pieceType = 'rook'; break;
        case 'q': pieceType = 'queen'; break;
        case 'k': pieceType = 'king'; break;
      }
      
      // Create notation
      const notation = `${bestMove.from}-${bestMove.to}${bestMove.promotion ? '=' + bestMove.promotion.toUpperCase() : ''}`;
      
      // Create description
      let moveDescription = '';
      if (targetPiece) {
        moveDescription = `capturing the ${targetPiece.type === 'p' ? 'pawn' :
                                         targetPiece.type === 'n' ? 'knight' :
                                         targetPiece.type === 'b' ? 'bishop' :
                                         targetPiece.type === 'r' ? 'rook' :
                                         targetPiece.type === 'q' ? 'queen' : 'king'} with your ${pieceType}`;
      } else if (bestMove.promotion) {
        moveDescription = `advancing your pawn to promote to a ${bestMove.promotion === 'q' ? 'queen' :
                                                                 bestMove.promotion === 'r' ? 'rook' :
                                                                 bestMove.promotion === 'b' ? 'bishop' : 'knight'}`;
      } else {
        moveDescription = `moving your ${pieceType} from ${bestMove.from} to ${bestMove.to}`;
      }
      
      if (difficulty === 'beginner') {
        return `I suggest ${moveDescription} (${notation}). This looks like a good move to me.`;
      } else if (difficulty === 'intermediate') {
        return `You might want to consider ${moveDescription} (${notation}). This move helps improve your position.`;
      } else {
        return `A strong move would be ${moveDescription} (${notation}). This improves your piece coordination and creates threats.`;
      }
    } else {
      return "I don't see any good moves in this position. The game might be over.";
    }
  }
  
  if (lowerMessage.includes('analysis') || lowerMessage.includes('evaluate') || lowerMessage.includes('how is the position')) {
    return await generateAIAnalysis(fen, difficulty);
  }
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! I'm your chess assistant. How can I help you with your game?";
  }
  
  if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    return "You're welcome! Let me know if you need more help with your game.";
  }
  
  if (lowerMessage.includes('good move') || lowerMessage.includes('nice move')) {
    return "Thank you! I'm trying my best to play good chess. Your moves are challenging too!";
  }
  
  // Default responses based on difficulty
  const defaultResponses = {
    beginner: [
      "I'm still learning chess. What's your next move?",
      "Chess is fun! I'm enjoying our game.",
      "I'm trying to improve my chess skills. Any tips?",
      "I'm thinking about my next move carefully.",
      "Chess is a great game for developing strategic thinking!"
    ],
    intermediate: [
      "I'm analyzing the position. It's getting interesting.",
      "That's a thought-provoking position. I'm considering my options.",
      "Chess requires patience and calculation. I'm working on both.",
      "I see several possibilities here. Let me think...",
      "The middlegame is where strategy really comes into play."
    ],
    advanced: [
      "I'm calculating several variations. This position has depth.",
      "The pawn structure is defining the character of this position.",
      "I'm looking for tactical opportunities while maintaining strategic pressure.",
      "Piece coordination is crucial in this type of position.",
      "I'm evaluating the long-term implications of each potential move."
    ],
    master: [
      "This position requires precise calculation. I'm analyzing all critical lines.",
      "The dynamic and static elements of this position are in an interesting balance.",
      "I'm considering the transformation of advantages across different potential variations.",
      "The strategic complexity here offers multiple valid approaches.",
      "I'm evaluating this position both tactically and positionally to find the optimal continuation."
    ]
  };
  
  // Return a random default response based on difficulty
  const responses = defaultResponses[difficulty];
  return responses[Math.floor(Math.random() * responses.length)];
};