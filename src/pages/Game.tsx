import React, { useState } from 'react';
import { Container, Grid, Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import ChessBoard from '../components/chess/ChessBoard';
import GameControls from '../components/chess/GameControls';
import GameHistory from '../components/chess/GameHistory';
import ChatBox from '../components/chess/ChatBox';
import AIChat from '../components/chess/AIChat';
import GeminiConfig from '../components/ui/GeminiConfig';
import { useAppSelector } from '../store';

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
  const { status, whitePlayer, blackPlayer, gameType } = useAppSelector(state => state.game);
  const { user } = useAppSelector(state => state.auth);
  const [tabValue, setTabValue] = useState(0);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Chess Online
      </Typography>
      
      <Grid container spacing={3}>
        {/* Game Controls */}
        <Grid item xs={12}>
          <GameControls />
        </Grid>
        
        {/* Gemini AI Configuration */}
        <Grid item xs={12}>
          <GeminiConfig />
        </Grid>
        
        {/* Main Game Area */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Player Info - Top */}
            <Paper elevation={2} sx={{ width: '100%', mb: 2, p: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">
                Black: {blackPlayer || 'Waiting for player...'}
              </Typography>
              {status !== 'not-started' && (
                <Typography variant="body1">
                  Game Status: {status.replace(/-/g, ' ').toUpperCase()}
                </Typography>
              )}
            </Paper>
            
            {/* Chess Board */}
            <ChessBoard width={600} />
            
            {/* Player Info - Bottom */}
            <Paper elevation={2} sx={{ width: '100%', mt: 2, p: 2 }}>
              <Typography variant="h6">
                White: {whitePlayer || user?.username || 'You'}
              </Typography>
            </Paper>
          </Box>
        </Grid>
        
        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 3 }}>
            {gameType === 'vs-computer' && blackPlayer === 'AI' ? (
              <Paper elevation={3} sx={{ width: '100%' }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  indicatorColor="primary"
                  textColor="primary"
                  variant="fullWidth"
                >
                  <Tab label="Game History" />
                  <Tab label="AI Chat" />
                </Tabs>
                
                <TabPanel value={tabValue} index={0}>
                  <GameHistory maxHeight={300} />
                </TabPanel>
                
                <TabPanel value={tabValue} index={1}>
                  <AIChat />
                </TabPanel>
              </Paper>
            ) : (
              <>
                {/* Game History */}
                <GameHistory maxHeight={300} />
                
                {/* Chat */}
                <ChatBox maxHeight={300} />
              </>
            )}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Game;