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
    
    // Debug: Log action type and game state
    if (typeof action === 'object' && action !== null && 'type' in action) {
      console.log('AIMiddleware - Action:', (action as any).type);
    }
    
    console.log('AIMiddleware - Current game state:', {
      gameType: game.gameType,
      turn: game.turn,
      blackPlayer: game.blackPlayer,
      status: game.status
    });
    
    // Debug: Log history if available
    if ('history' in game) {
      console.log('AIMiddleware - Game history:', (game as any).history);
    }
    
    // Check if it's a game vs computer, it's black's turn, and the black player is AI
    if (
      game.gameType === 'vs-computer' &&
      game.turn === 'b' &&
      game.blackPlayer === 'AI' &&
      game.status === 'in-progress'
    ) {
      console.log('AIMiddleware - AI turn detected, preparing to make a move');
      
      // Use setTimeout to add a small delay before the AI move
      // This makes the game feel more natural
      setTimeout(async () => {
        try {
          console.log('AIMiddleware - Finding best move for FEN:', game.fen);
          console.log('AIMiddleware - Using difficulty:', game.aiDifficulty);
          
          // Find the best move for the current position
          const bestMove = await findBestMove(game.fen, game.aiDifficulty);
          
          if (bestMove) {
            console.log('AIMiddleware - AI selected move:', bestMove);
            
            // Debug: Log the state before dispatching the move
            const beforeState = store.getState();
            console.log('AIMiddleware - State before AI move:', {
              fen: beforeState.game.fen,
              history: beforeState.game.history
            });
            
            // Dispatch the move action
            store.dispatch(makeMove({
              from: bestMove.from,
              to: bestMove.to,
              promotion: bestMove.promotion
            }));
            
            // Debug: Log the state after dispatching the move
            setTimeout(() => {
              const afterState = store.getState();
              console.log('AIMiddleware - State after AI move:', {
                fen: afterState.game.fen,
                history: afterState.game.history
              });
            }, 100);
          } else {
            console.warn('AIMiddleware - No valid move found for AI');
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