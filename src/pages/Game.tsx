import React, { useState } from 'react';
import {
  Grid,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Select,
  MenuItem,
  Switch,
  SelectChangeEvent
} from '@mui/material';
import { isUsingGeminiAPI, setUseGeminiAPI } from '../services/ai/aiService';
import { useAppDispatch, useAppSelector } from '../store';
import { startNewGame } from '../store/gameSlice';
import ChessBoard from '../components/chess/ChessBoard';
import GameHistory from '../components/chess/GameHistory';
import ChatBox from '../components/chess/ChatBox';
import AIChat from '../components/chess/AIChat';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`game-tabpanel-${index}`}
      aria-labelledby={`game-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Game: React.FC = () => {
  const { status, blackPlayer, gameType, aiDifficulty } = useAppSelector(state => state.game);
  const { user } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const [tabValue, setTabValue] = useState(0);
  const [selectedGameType, setSelectedGameType] = useState<'real-time' | 'turn-based' | 'vs-computer'>(gameType);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | 'master'>(
    aiDifficulty || 'beginner'
  );
  const [useGemini, setUseGemini] = useState<boolean>(false);
  
  // Load Gemini state on mount
  React.useEffect(() => {
    setUseGemini(isUsingGeminiAPI());
  }, []);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleGameTypeChange = (event: SelectChangeEvent) => {
    setSelectedGameType(event.target.value as 'real-time' | 'turn-based' | 'vs-computer');
  };

  const handleDifficultyChange = (event: SelectChangeEvent) => {
    setSelectedDifficulty(event.target.value as 'beginner' | 'intermediate' | 'advanced' | 'master');
  };
  
  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setUseGemini(newValue);
    setUseGeminiAPI(newValue);
  };
  
  const handleStartNewGame = () => {
    dispatch(startNewGame({
      gameType: selectedGameType,
      aiDifficulty: selectedGameType === 'vs-computer' ? selectedDifficulty : undefined,
      whitePlayer: user?.username || 'Player',
      blackPlayer: selectedGameType === 'vs-computer' ? 'AI' : undefined,
    }));
  };
  
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2, py: 2 }}>
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          bgcolor: '#1e2a3a',
          color: 'white',
          p: 2,
          mb: 2,
          textAlign: 'center',
          borderRadius: '4px 4px 0 0'
        }}
      >
        <Typography variant="h5" component="h1">
          Play Chess
        </Typography>
      </Paper>
      
      {/* Game Controls and Settings */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Game Settings */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">Game Settings</Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption">Game Type</Typography>
                <Select
                  fullWidth
                  size="small"
                  value={selectedGameType}
                  onChange={handleGameTypeChange}
                >
                  <MenuItem value="vs-computer">Play vs Computer</MenuItem>
                  <MenuItem value="real-time">Real-time Multiplayer</MenuItem>
                  <MenuItem value="turn-based">Turn-based Multiplayer</MenuItem>
                </Select>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="caption">AI Difficulty</Typography>
                <Select
                  fullWidth
                  size="small"
                  value={selectedDifficulty}
                  onChange={handleDifficultyChange}
                  disabled={selectedGameType !== 'vs-computer'}
                >
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                  <MenuItem value="master">Master</MenuItem>
                </Select>
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleStartNewGame}
              >
                New Game
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Gemini AI Config */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Gemini AI</Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Switch
                  checked={useGemini}
                  onChange={handleToggleChange}
                  color="primary"
                  size="small"
                />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {useGemini ? "Use Gemini AI for chess engine" : "Use local chess engine"}
                </Typography>
              </Box>
              
              <Typography variant="caption" color="text.secondary">
                Toggle affects only the chess engine. "Ask Kasparov" is always available.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Status Bar */}
      <Paper elevation={1} sx={{ p: 1, mb: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color={status === 'in-progress' ? 'error.main' : 'text.primary'}>
          {status === 'not-started'
            ? 'Game not started - Click "New Game" to begin'
            : blackPlayer ? `Black: ${blackPlayer}` : 'Black waiting for player...'}
        </Typography>
        <Typography variant="body2">
          {status === 'not-started'
            ? 'Select game options above'
            : `White to move: ${user?.username || 'You'}`}
        </Typography>
      </Paper>
      
      {/* Main Game Area */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <ChessBoard width={600} />
          </Box>
        </Grid>
        
        {/* History & Chat */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
            <Paper elevation={1} sx={{ width: '100%' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
              >
                <Tab label="History" />
                <Tab label="Ask Kasparov" />
                {gameType !== 'vs-computer' && <Tab label="Player Chat" />}
              </Tabs>
              
              <TabPanel value={tabValue} index={0}>
                <GameHistory maxHeight={300} />
              </TabPanel>
              
              <TabPanel value={tabValue} index={1}>
                <AIChat />
              </TabPanel>
              
              {gameType !== 'vs-computer' && (
                <TabPanel value={tabValue} index={2}>
                  <ChatBox maxHeight={300} />
                </TabPanel>
              )}
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Game;