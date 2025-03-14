import React from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  FormControl, 
  InputLabel, 
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
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Game Settings</Typography>
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel id="game-type-label">Game Type</InputLabel>
          <Select
            labelId="game-type-label"
            id="game-type-select"
            value={selectedGameType}
            label="Game Type"
            onChange={handleGameTypeChange}
          >
            <MenuItem value="vs-computer">Play vs Computer</MenuItem>
            <MenuItem value="real-time">Real-time Multiplayer</MenuItem>
            <MenuItem value="turn-based">Turn-based Multiplayer</MenuItem>
          </Select>
        </FormControl>
        
        {selectedGameType === 'vs-computer' && (
          <FormControl fullWidth>
            <InputLabel id="difficulty-label">AI Difficulty</InputLabel>
            <Select
              labelId="difficulty-label"
              id="difficulty-select"
              value={selectedDifficulty}
              label="AI Difficulty"
              onChange={handleDifficultyChange}
            >
              <MenuItem value="beginner">Beginner</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="advanced">Advanced</MenuItem>
              <MenuItem value="master">Master</MenuItem>
            </Select>
          </FormControl>
        )}
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleStartNewGame}
        >
          Start New Game
        </Button>
        
        {status === 'in-progress' && (
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={() => dispatch({ type: 'game/resignGame' })}
          >
            Resign Game
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default GameControls;