import React from 'react';
import {
  Box,
  Button,
  Typography,
  Select,
  MenuItem,
  SelectChangeEvent,
  Paper
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store';
import { startNewGame } from '../../store/gameSlice';

interface GameControlsProps {
  onNewGame?: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({ onNewGame }) => {
  const dispatch = useAppDispatch();
  const { gameType, aiDifficulty, status } = useAppSelector(state => state.game);
  const { user } = useAppSelector(state => state.auth);
  
  const [selectedGameType, setSelectedGameType] = React.useState<'real-time' | 'turn-based' | 'vs-computer'>(gameType);
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<'beginner' | 'intermediate' | 'advanced' | 'master'>(
    aiDifficulty || 'beginner'
  );

  const handleGameTypeChange = (event: SelectChangeEvent) => {
    setSelectedGameType(event.target.value as 'real-time' | 'turn-based' | 'vs-computer');
  };

  const handleDifficultyChange = (event: SelectChangeEvent) => {
    setSelectedDifficulty(event.target.value as 'beginner' | 'intermediate' | 'advanced' | 'master');
  };

  const handleStartNewGame = () => {
    dispatch(startNewGame({
      gameType: selectedGameType,
      aiDifficulty: selectedGameType === 'vs-computer' ? selectedDifficulty : undefined,
      whitePlayer: user?.username || 'Player',
      blackPlayer: selectedGameType === 'vs-computer' ? 'AI' : undefined,
    }));
    
    if (onNewGame) {
      onNewGame();
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1">Game Settings</Typography>
          
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handleStartNewGame}
          >
            New Game
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: '140px' }}>
            <Typography variant="caption" sx={{ mb: 0.5 }}>Game Type</Typography>
            <Select
              size="small"
              value={selectedGameType}
              onChange={handleGameTypeChange}
              sx={{ height: '36px' }}
            >
              <MenuItem value="vs-computer">Play vs Computer</MenuItem>
              <MenuItem value="real-time">Real-time Multiplayer</MenuItem>
              <MenuItem value="turn-based">Turn-based Multiplayer</MenuItem>
            </Select>
          </Box>
          
          {selectedGameType === 'vs-computer' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: '140px' }}>
              <Typography variant="caption" sx={{ mb: 0.5 }}>AI Difficulty</Typography>
              <Select
                size="small"
                value={selectedDifficulty}
                onChange={handleDifficultyChange}
                sx={{ height: '36px' }}
              >
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
                <MenuItem value="master">Master</MenuItem>
              </Select>
            </Box>
          )}
        </Box>
        
        {status === 'in-progress' && (
          <Box sx={{ mt: 1 }}>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              onClick={() => dispatch({ type: 'game/resignGame' })}
            >
              Resign Game
            </Button>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default GameControls;