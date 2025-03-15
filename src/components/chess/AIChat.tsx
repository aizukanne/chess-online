import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  Avatar,
  Divider,
  CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useAppSelector, useAppDispatch } from '../../store';
import { addChatMessage } from '../../store/gameSlice';
import { generateAIChatResponse } from '../../services/ai/aiService';

const AIChat: React.FC = () => {
  const dispatch = useAppDispatch();
  const { fen, chatHistory, aiDifficulty } = useAppSelector(state => state.game);
  const { user } = useAppSelector(state => state.auth);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleSendMessage = async () => {
    if (message.trim()) {
      console.log('AIChat: Sending message:', message.trim());
      
      // Add user message to chat
      dispatch(addChatMessage({
        sender: user?.username || 'Player',
        message: message.trim()
      }));
      
      // Clear input
      setMessage('');
      
      // Set loading state
      setIsLoading(true);
      
      try {
        // Log current state
        console.log('AIChat: Current state:');
        console.log('- FEN:', fen);
        console.log('- AI Difficulty:', aiDifficulty || 'intermediate');
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('AIChat: Calling AI for Kasparov response...');
        
        // Generate AI response
        const aiResponse = await generateAIChatResponse(
          fen,
          message.trim(),
          aiDifficulty || 'intermediate'
        );
        
        console.log('AIChat: Received AI response:', aiResponse);
        
        // Add AI response to chat
        dispatch(addChatMessage({
          sender: 'AI',
          message: aiResponse
        }));
      } catch (error) {
        console.error('Error generating AI response:', error);
        
        // Add fallback response
        dispatch(addChatMessage({
          sender: 'AI',
          message: "I'm sorry, I couldn't process that. Let's focus on the game."
        }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format timestamp to readable time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Paper elevation={3} sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)', display: 'flex', alignItems: 'center', gap: 1 }}>
        <SmartToyIcon color="primary" />
        Ask Kasparov
      </Typography>
      
      <Box sx={{ 
        flexGrow: 1,
        overflow: 'auto',
        p: 2,
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
        {chatHistory.length === 0 ? (
          <Typography sx={{ color: 'text.secondary', textAlign: 'center', mt: 2 }}>
            Start a conversation with Kasparov. Ask for advice or discuss your moves!
          </Typography>
        ) : (
          <List>
            {chatHistory.map((chat: { sender: string; message: string; timestamp: number }, index: number) => (
              <ListItem key={index} alignItems="flex-start" sx={{ 
                flexDirection: chat.sender === 'AI' ? 'row' : 'row-reverse',
                px: 1,
                py: 0.5
              }}>
                <Avatar 
                  sx={{ 
                    bgcolor: chat.sender === 'AI' ? 'secondary.main' : 'primary.main',
                    width: 32,
                    height: 32,
                    mr: chat.sender === 'AI' ? 1 : 0,
                    ml: chat.sender === 'AI' ? 0 : 1
                  }}
                >
                  {chat.sender === 'AI' ? <SmartToyIcon fontSize="small" /> : chat.sender.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ 
                  maxWidth: '70%',
                  bgcolor: chat.sender === 'AI' ? 'grey.100' : 'primary.light',
                  borderRadius: 2,
                  p: 1,
                  color: chat.sender === 'AI' ? 'text.primary' : 'white'
                }}>
                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                    {chat.message}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    display: 'block', 
                    textAlign: 'right',
                    color: chat.sender === 'AI' ? 'text.secondary' : 'rgba(255,255,255,0.7)'
                  }}>
                    {formatTime(chat.timestamp)}
                  </Typography>
                </Box>
              </ListItem>
            ))}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>
      
      <Divider />
      
      <Box sx={{ p: 2, display: 'flex' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Ask Kasparov about your moves or for advice..."
          size="small"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <Button 
          variant="contained" 
          color="primary" 
          endIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          onClick={handleSendMessage}
          disabled={!message.trim() || isLoading}
          sx={{ ml: 1 }}
        >
          {isLoading ? 'Sending' : 'Send'}
        </Button>
      </Box>
    </Paper>
  );
};

export default AIChat;