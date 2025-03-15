import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square } from 'chess.js';
import { useAppDispatch, useAppSelector } from '../../store';
import { makeMove } from '../../store/gameSlice';
import { Box, Button, Typography } from '@mui/material';

interface ChessBoardProps {
  width?: number;
  showNotation?: boolean;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ 
  width = 500, 
  showNotation = true 
}) => {
  const dispatch = useAppDispatch();
  const { fen, turn, isCheck, isCheckmate, isDraw, status } = useAppSelector(state => state.game);
  
  // Create a chess instance for move validation
  const [chess] = useState<Chess>(new Chess(fen));
  
  // Update the chess instance when fen changes
  React.useEffect(() => {
    console.log('ChessBoard - Updating chess instance with FEN:', fen);
    console.log('ChessBoard - Current history before load:', chess.history());
    
    // Load the new position
    chess.load(fen);
    
    console.log('ChessBoard - History after load:', chess.history());
  }, [fen, chess]);

  // Handle piece movement
  const onDrop = (sourceSquare: Square, targetSquare: Square, piece: string): boolean => {
    console.log(`ChessBoard - onDrop: from ${sourceSquare} to ${targetSquare}, piece: ${piece}`);
    
    // Check if the game is over
    if (status !== 'in-progress') {
      console.log('ChessBoard - Game is not in progress, ignoring move');
      return false;
    }
    
    try {
      // Create a temporary chess instance to validate the move
      const tempChess = new Chess(fen);
      
      // Check if this is a pawn promotion move
      const isPawnPromotion =
        piece[1].toLowerCase() === 'p' &&
        ((piece[0] === 'w' && targetSquare[1] === '8') ||
         (piece[0] === 'b' && targetSquare[1] === '1'));
      
      console.log(`ChessBoard - Is pawn promotion: ${isPawnPromotion}`);
      
      // For pawn promotion, we need to validate the move first
      if (isPawnPromotion) {
        // Try the move with queen promotion (default)
        try {
          const result = tempChess.move({
            from: sourceSquare,
            to: targetSquare,
            promotion: 'q' // Default to queen for validation
          });
          
          if (!result) {
            console.error('ChessBoard - Invalid promotion move');
            return false;
          }
          
          console.log('ChessBoard - Promotion move is valid, promoting to queen');
        } catch (validationError) {
          console.error('ChessBoard - Promotion move validation error:', validationError);
          return false;
        }
      } else {
        // For non-promotion moves, validate the move
        try {
          const result = tempChess.move({
            from: sourceSquare,
            to: targetSquare
          });
          
          if (!result) {
            console.error('ChessBoard - Invalid move');
            return false;
          }
        } catch (validationError) {
          console.error('ChessBoard - Move validation error:', validationError);
          return false;
        }
      }
      
      // Create the move object
      const moveObj = {
        from: sourceSquare,
        to: targetSquare,
        // For promotion, we'll default to queen if it's a pawn promotion move
        promotion: isPawnPromotion ? 'q' : undefined
      };
      
      console.log('ChessBoard - Dispatching move:', moveObj);
      
      // Dispatch the move action
      dispatch(makeMove(moveObj));
      
      return true;
    } catch (error) {
      console.error('Move error:', error);
      return false;
    }
  };

  // This function can be used later for highlighting possible moves
  // Keeping it commented out for now to avoid the unused variable warning
  /*
  const getMoveOptions = (square: Square): { [square: string]: { background: string } } => {
    const moves = chess.moves({ square, verbose: true });
    if (moves.length === 0) {
      return {};
    }

    const newSquares: { [square: string]: { background: string } } = {};
    moves.forEach((move: any) => {
      const sourceSquarePiece = chess.get(square);
      const targetSquarePiece = chess.get(move.to);
      
      newSquares[move.to] = {
        background:
          targetSquarePiece && sourceSquarePiece && targetSquarePiece.color !== sourceSquarePiece.color
            ? 'rgba(255, 0, 0, 0.4)' // Capture square
            : 'rgba(0, 255, 0, 0.4)', // Regular move square
      };
    });
    return newSquares;
  };
  */

  // Game status display
  const renderGameStatus = () => {
    if (isCheckmate) {
      return <Typography variant="h6" color="error">Checkmate! {turn === 'w' ? 'Black' : 'White'} wins</Typography>;
    } else if (isDraw) {
      return <Typography variant="h6" color="info.main">Game ended in a draw</Typography>;
    } else if (isCheck) {
      return <Typography variant="h6" color="warning.main">Check! {turn === 'w' ? 'White' : 'Black'} to move</Typography>;
    } else {
      return <Typography variant="h6">{turn === 'w' ? 'White' : 'Black'} to move</Typography>;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {renderGameStatus()}
      
      <Chessboard
        id="chess-board"
        position={fen}
        onPieceDrop={onDrop}
        customBoardStyle={{
          borderRadius: '4px',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)'
        }}
        customSquareStyles={{
          ...(isCheck && turn === 'w' ? { e1: { backgroundColor: 'rgba(255, 0, 0, 0.5)' } } : {}),
          ...(isCheck && turn === 'b' ? { e8: { backgroundColor: 'rgba(255, 0, 0, 0.5)' } } : {})
        }}
        areArrowsAllowed={true}
        showBoardNotation={showNotation}
        boardWidth={width}
      />
      
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={() => dispatch({ type: 'game/resignGame' })}
          disabled={status !== 'in-progress'}
        >
          Resign
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => dispatch({ type: 'game/offerDraw' })}
          disabled={status !== 'in-progress'}
        >
          Offer Draw
        </Button>
      </Box>
    </Box>
  );
};

export default ChessBoard;