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
  
  // Auto-scroll to the bottom when history updates
  React.useEffect(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  // Format the move history into pairs (white move, black move)
  const formatHistory = () => {
    const formattedHistory = [];
    
    for (let i = 0; i < history.length; i += 2) {
      formattedHistory.push({
        moveNumber: Math.floor(i / 2) + 1,
        whiteMove: history[i],
        blackMove: i + 1 < history.length ? history[i + 1] : undefined
      });
    }
    
    return formattedHistory;
  };

  return (
    <Paper elevation={3} sx={{ width: '100%', mb: 2 }}>
      <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
        Move History
      </Typography>
      
      <Box sx={{ 
        maxHeight, 
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: '8px',
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