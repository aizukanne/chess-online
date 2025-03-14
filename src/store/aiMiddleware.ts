import { Middleware } from 'redux';
import { makeMove } from './gameSlice';
import { findBestMove } from '../services/ai/aiService';

// Define a type for the game state to avoid circular dependencies
interface GameState {
  gameType: 'real-time' | 'turn-based' | 'vs-computer';
  turn: 'w' | 'b';
  blackPlayer?: string;
  status: string;
  fen: string;
  aiDifficulty?: 'beginner' | 'intermediate' | 'advanced' | 'master';
}

/**
 * Create the AI middleware
 * This function returns a middleware that listens for game state changes and makes AI moves when it's the AI's turn
 */
export const createAIMiddleware = () => {
  const middleware: Middleware = store => next => action => {
    // First, pass the action to the next middleware or reducer
    const result = next(action);
    
    // After state update, check if it's AI's turn
    const state = store.getState();
    const game = state.game as GameState;
    
    // Check if it's a game vs computer, it's black's turn, and the black player is AI
    if (
      game.gameType === 'vs-computer' &&
      game.turn === 'b' &&
      game.blackPlayer === 'AI' &&
      game.status === 'in-progress'
    ) {
      // Use setTimeout to add a small delay before the AI move
      // This makes the game feel more natural
      setTimeout(async () => {
        try {
          // Find the best move for the current position
          const bestMove = await findBestMove(game.fen, game.aiDifficulty);
          
          if (bestMove) {
            // Dispatch the move action
            store.dispatch(makeMove({
              from: bestMove.from,
              to: bestMove.to,
              promotion: bestMove.promotion
            }));
          }
        } catch (error) {
          console.error('Error getting AI move:', error);
        }
      }, 500); // 500ms delay
    }
    
    return result;
  };
  
  return middleware;
};