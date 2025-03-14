import { Chess, Move, Square } from 'chess.js';

/**
 * Utility functions for chess operations
 */

/**
 * Get the color of a square on the chess board (light or dark)
 * @param square The square to check (e.g., 'e4')
 * @returns 'light' or 'dark'
 */
export const getSquareColor = (square: string): 'light' | 'dark' => {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 0-7 for a-h
  const rank = parseInt(square[1]) - 1; // 0-7 for 1-8
  
  // If the sum of file and rank is even, the square is dark, otherwise it's light
  return (file + rank) % 2 === 0 ? 'dark' : 'light';
};

/**
 * Get all legal moves for a piece on a specific square
 * @param fen The FEN string representing the current board position
 * @param square The square to get moves for (e.g., 'e2')
 * @returns Array of legal moves
 */
export const getLegalMovesForSquare = (fen: string, square: Square): Move[] => {
  const chess = new Chess(fen);
  return chess.moves({ square, verbose: true }) as Move[];
};

/**
 * Check if a move is legal
 * @param fen The FEN string representing the current board position
 * @param from The source square (e.g., 'e2')
 * @param to The target square (e.g., 'e4')
 * @returns Boolean indicating if the move is legal
 */
export const isLegalMove = (fen: string, from: Square, to: Square): boolean => {
  const chess = new Chess(fen);
  const moves = chess.moves({ square: from, verbose: true }) as Move[];
  return moves.some(move => move.to === to);
};

/**
 * Make a move on the board and return the new FEN
 * @param fen The FEN string representing the current board position
 * @param from The source square (e.g., 'e2')
 * @param to The target square (e.g., 'e4')
 * @param promotion Optional promotion piece ('q', 'r', 'b', 'n')
 * @returns The new FEN string after the move, or the original FEN if the move is illegal
 */
export const makeMove = (fen: string, from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n'): string => {
  const chess = new Chess(fen);
  try {
    chess.move({ from, to, promotion });
    return chess.fen();
  } catch (error) {
    console.error('Invalid move:', error);
    return fen; // Return original FEN if move is invalid
  }
};

/**
 * Get the game status from a FEN string
 * @param fen The FEN string representing the current board position
 * @returns Object with game status information
 */
export const getGameStatus = (fen: string) => {
  const chess = new Chess(fen);
  
  return {
    isCheck: chess.isCheck(),
    isCheckmate: chess.isCheckmate(),
    isDraw: chess.isDraw(),
    isGameOver: chess.isGameOver(),
    turn: chess.turn(),
    inDraw: chess.isDraw(),
    insufficientMaterial: chess.isInsufficientMaterial(),
    inThreefoldRepetition: chess.isThreefoldRepetition(),
    // These properties are not directly accessible in the latest chess.js
    // We can extract them from the FEN string instead
    halfMoves: parseInt(fen.split(' ')[4]) || 0,
    fullMoves: parseInt(fen.split(' ')[5]) || 1,
  };
};

/**
 * Get a simple evaluation of the current position
 * This is a very basic evaluation based on material count
 * @param fen The FEN string representing the current board position
 * @returns A number representing the evaluation (positive for white advantage, negative for black)
 */
export const getBasicEvaluation = (fen: string): number => {
  const chess = new Chess(fen);
  const board = chess.board();
  
  // Piece values
  const pieceValues = {
    p: -1,
    n: -3,
    b: -3,
    r: -5,
    q: -9,
    k: 0,
    P: 1,
    N: 3,
    B: 3,
    R: 5,
    Q: 9,
    K: 0,
  };
  
  // Calculate material balance
  let evaluation = 0;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        evaluation += pieceValues[piece.type as keyof typeof pieceValues];
      }
    }
  }
  
  return evaluation;
};

/**
 * Convert a move in algebraic notation to a move object
 * @param fen The FEN string representing the current board position
 * @param move The move in algebraic notation (e.g., 'e4', 'Nf3')
 * @returns The move object with from and to squares, or null if the move is invalid
 */
export const algebraicToMove = (fen: string, move: string): { from: Square; to: Square } | null => {
  const chess = new Chess(fen);
  try {
    const moveObj = chess.move(move);
    if (moveObj) {
      return {
        from: moveObj.from as Square,
        to: moveObj.to as Square,
      };
    }
    return null;
  } catch (error) {
    console.error('Invalid algebraic move:', error);
    return null;
  }
};

/**
 * Generate a hint for the current position
 * @param fen The FEN string representing the current board position
 * @returns The best move in algebraic notation, or null if no moves are available
 */
export const generateHint = (fen: string): string | null => {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true }) as Move[];
  
  if (moves.length === 0) {
    return null;
  }
  
  // This is a very basic implementation that just returns a random legal move
  // In a real implementation, this would use an engine or AI to find the best move
  const randomMove = moves[Math.floor(Math.random() * moves.length)];
  return randomMove.san;
};