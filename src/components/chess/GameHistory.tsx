import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemText,
  Divider
} from '@mui/material';
import { useAppSelector } from '../../store';

interface GameHistoryProps {
  maxHeight?: number | string;
}

const GameHistory: React.FC<GameHistoryProps> = ({ maxHeight = 400 }) => {
  const { history } = useAppSelector(state => state.game);
  const historyEndRef = React.useRef<HTMLDivElement>(null);
  
  // Debug: Log the history array
  React.useEffect(() => {
    console.log('GameHistory - Current history array:', history);
  }, [history]);
  
  // Auto-scroll to the bottom when history updates
  React.useEffect(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  // Format the move history into pairs (white move, black move)
  const formatHistory = () => {
    console.log('formatHistory - Input history array:', history);
    
    const formattedHistory = [];
    
    for (let i = 0; i < history.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      const whiteMove = history[i];
      const blackMove = i + 1 < history.length ? history[i + 1] : undefined;
      
      console.log(`formatHistory - Move ${moveNumber}: White: ${whiteMove}, Black: ${blackMove || 'none'}`);
      
      formattedHistory.push({
        moveNumber,
        whiteMove,
        blackMove
      });
    }
    
    console.log('formatHistory - Formatted history:', formattedHistory);
    return formattedHistory;
  };

  return (
    <Paper elevation={3} sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
        Move History
      </Typography>
      
      <Box sx={{
        flexGrow: 1,
        overflow: 'auto',
        overflowY: 'scroll !important', // Always show vertical scrollbar
        minHeight: '200px', // Ensure minimum height for content
        ...(maxHeight !== 'none' ? { maxHeight } : {}),
        '&::-webkit-scrollbar': {
          width: '10px',
          display: 'block !important'
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#888',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#555',
        },
        // Firefox scrollbar
        scrollbarWidth: 'thin',
        scrollbarColor: '#888 #f1f1f1',
      }}>
        {history.length === 0 ? (
          <Typography sx={{ p: 2, color: 'text.secondary' }}>
            No moves yet. The game history will appear here.
          </Typography>
        ) : (
          <List disablePadding>
            {formatHistory().map((item, index) => (
              <React.Fragment key={item.moveNumber}>
                <ListItem>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ width: '20%', fontWeight: 'bold' }}>
                          {item.moveNumber}.
                        </Typography>
                        <Typography variant="body2" sx={{ width: '40%' }}>
                          {item.whiteMove}
                        </Typography>
                        <Typography variant="body2" sx={{ width: '40%' }}>
                          {item.blackMove}
                        </Typography>
                      </Box>
                    } 
                  />
                </ListItem>
                {index < formatHistory().length - 1 && <Divider />}
              </React.Fragment>
            ))}
            <div ref={historyEndRef} />
          </List>
        )}
      </Box>
    </Paper>
  );
};

export default GameHistory;