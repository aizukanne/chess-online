import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Chess, Square } from 'chess.js';

// Define types for our state
export interface GameState {
  fen: string;
  history: string[];
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  turn: 'w' | 'b';
  gameId: string | undefined;
  whitePlayer: string | undefined;
  blackPlayer: string | undefined;
  gameType: 'real-time' | 'turn-based' | 'vs-computer';
  aiDifficulty?: 'beginner' | 'intermediate' | 'advanced' | 'master';
  status: 'not-started' | 'in-progress' | 'white-won' | 'black-won' | 'draw';
  chatHistory: { sender: string; message: string; timestamp: number }[];
}

// Create a chess instance for initial state
const chess = new Chess();

const initialState: GameState = {
  fen: chess.fen(),
  history: [],
  isCheck: chess.isCheck(),
  isCheckmate: chess.isCheckmate(),
  isDraw: chess.isDraw(),
  turn: 'w',
  gameId: undefined,
  whitePlayer: undefined,
  blackPlayer: undefined,
  gameType: 'vs-computer',
  aiDifficulty: 'beginner',
  status: 'not-started',
  chatHistory: [],
};

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    makeMove: (state, action: PayloadAction<{ from: string; to: string; promotion?: string }>) => {
      const { from, to, promotion } = action.payload;
      const chess = new Chess(state.fen);
      
      try {
        // Check if this is a pawn promotion move
        const piece = chess.get(from as Square);
        const isPawnPromotion =
          piece &&
          piece.type === 'p' &&
          ((piece.color === 'w' && to[1] === '8') ||
           (piece.color === 'b' && to[1] === '1'));
        
        console.log(`makeMove - Is pawn promotion: ${isPawnPromotion}`);
        
        // If it's a promotion move, ensure we have a promotion piece
        const movePromotion = isPawnPromotion ? (promotion || 'q') : promotion;
        
        // Attempt to make the move
        const move = chess.move({ from, to, promotion: movePromotion });
        
        if (move) {
          console.log('makeMove - Move made:', move);
          
          // Update state with new board position
          state.fen = chess.fen();
          
          // Debug: Log the history from chess.js
          const moveHistory = chess.history();
          console.log('makeMove - Chess.js history():', moveHistory);
          
          // The chess.js history() method returns the moves in Standard Algebraic Notation (SAN)
          // But it only includes the moves made with that specific Chess instance
          // Since we create a new Chess instance for each move, we need to maintain the history ourselves
          
          // Get the SAN notation of the move that was just made
          const moveSAN = move.san;
          console.log('makeMove - Move SAN notation:', moveSAN);
          
          // Append the new move to our history
          state.history = [...state.history, moveSAN];
          console.log('makeMove - Updated history:', state.history);
          
          state.isCheck = chess.isCheck();
          state.isCheckmate = chess.isCheckmate();
          state.isDraw = chess.isDraw();
          state.turn = chess.turn();
          
          // Update game status
          if (state.isCheckmate) {
            state.status = state.turn === 'w' ? 'black-won' : 'white-won';
          } else if (state.isDraw) {
            state.status = 'draw';
          }
        } else {
          console.error('Move not made, but no error thrown');
        }
      } catch (error) {
        console.error('Invalid move:', error);
      }
    },
    
    startNewGame: (state, action: PayloadAction<{
      gameType: 'real-time' | 'turn-based' | 'vs-computer';
      aiDifficulty?: 'beginner' | 'intermediate' | 'advanced' | 'master';
      whitePlayer?: string;
      blackPlayer?: string;
    }>) => {
      console.log('startNewGame - Creating new game');
      
      const chess = new Chess();
      state.fen = chess.fen();
      
      // Debug: Check the initial history
      console.log('startNewGame - Initial chess.js history():', chess.history());
      
      state.history = [];
      console.log('startNewGame - Reset state history to empty array');
      
      state.isCheck = false;
      state.isCheckmate = false;
      state.isDraw = false;
      state.turn = 'w';
      state.gameType = action.payload.gameType;
      state.aiDifficulty = action.payload.aiDifficulty;
      state.whitePlayer = action.payload.whitePlayer || undefined;
      state.blackPlayer = action.payload.blackPlayer || undefined;
      state.status = 'in-progress';
      state.chatHistory = [];
    },
    
    setGameId: (state, action: PayloadAction<string>) => {
      state.gameId = action.payload;
    },
    
    addChatMessage: (state, action: PayloadAction<{ sender: string; message: string }>) => {
      state.chatHistory.push({
        ...action.payload,
        timestamp: Date.now(),
      });
    },
    
    resignGame: (state) => {
      state.status = state.turn === 'w' ? 'black-won' : 'white-won';
    },
    
    offerDraw: (state) => {
      // This would typically set a flag and be handled by the opponent
      // For now, we'll just implement the state change
    },
    
    acceptDraw: (state) => {
      state.status = 'draw';
    },
  },
});

export const {
  makeMove,
  startNewGame,
  setGameId,
  addChatMessage,
  resignGame,
  offerDraw,
  acceptDraw,
} = gameSlice.actions;

export default gameSlice.reducer;