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

  // Handle promotion piece selection
  const handlePromotionPieceSelect = (
    piece: string | undefined,
    sourceSquare: Square | undefined,
    targetSquare: Square | undefined
  ) => {
    // If any parameter is undefined, return false
    if (!piece || !sourceSquare || !targetSquare) {
      console.error('ChessBoard - Promotion piece selection missing parameters');
      return false;
    }
    
    console.log(`ChessBoard - Promotion piece selected: ${piece}, from ${sourceSquare} to ${targetSquare}`);
    
    // Extract the promotion piece type (q, r, n, b) from the piece string (e.g., "wQ" -> "q")
    const promotionPiece = piece.charAt(1).toLowerCase();
    
    // Create the move object with the selected promotion piece
    const moveObj = {
      from: sourceSquare,
      to: targetSquare,
      promotion: promotionPiece
    };
    
    console.log('ChessBoard - Dispatching promotion move:', moveObj);
    dispatch(makeMove(moveObj));
    
    return true;
  };
  
  // Handle piece movement
  const onDrop = (sourceSquare: Square, targetSquare: Square, piece: string): boolean => {
    console.log(`ChessBoard - onDrop: from ${sourceSquare} to ${targetSquare}, piece: ${piece}`);
    
    // Check if the game is over
    if (status !== 'in-progress') {
      console.log('ChessBoard - Game is not in progress, ignoring move');
      return false;
    }
    
    try {
      // Check if this is a pawn promotion move
      const isPawnPromotion =
        piece[1].toLowerCase() === 'p' &&
        ((piece[0] === 'w' && targetSquare[1] === '8') ||
         (piece[0] === 'b' && targetSquare[1] === '1'));
      
      console.log(`ChessBoard - Is pawn promotion: ${isPawnPromotion}`);
      
      // For non-promotion moves, dispatch immediately
      if (!isPawnPromotion) {
        const moveObj = {
          from: sourceSquare,
          to: targetSquare,
          promotion: undefined
        };
        
        console.log('ChessBoard - Dispatching non-promotion move:', moveObj);
        dispatch(makeMove(moveObj));
        return true;
      }
      
      // For promotion moves, the react-chessboard library will show a promotion dialog
      // The selected piece will be passed to onPieceDrop in a subsequent call
      // We don't need to do anything special here, just return true to allow the promotion dialog
      console.log('ChessBoard - Allowing promotion dialog to show');
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
    if (status === 'not-started') {
      return <Typography variant="h6" color="text.secondary">Game not started</Typography>;
    } else if (isCheckmate) {
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
      
      <Box sx={{ position: 'relative' }}>
        <Chessboard
          id="chess-board"
          position={fen}
          onPieceDrop={status === 'in-progress' ? onDrop : () => false}
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
            ...(status !== 'in-progress' ? { opacity: 0.7 } : {})
          }}
          customSquareStyles={{
            ...(isCheck && turn === 'w' ? { e1: { backgroundColor: 'rgba(255, 0, 0, 0.5)' } } : {}),
            ...(isCheck && turn === 'b' ? { e8: { backgroundColor: 'rgba(255, 0, 0, 0.5)' } } : {})
          }}
          areArrowsAllowed={status === 'in-progress'}
          showBoardNotation={showNotation}
          boardWidth={width}
          // Allow user to select promotion piece
          onPromotionPieceSelect={handlePromotionPieceSelect}
        />
        
        {status === 'not-started' && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              p: 2,
              borderRadius: 2,
              textAlign: 'center',
              zIndex: 10
            }}
          >
            <Typography variant="h6">Click "New Game" to Start</Typography>
          </Box>
        )}
      </Box>
      
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