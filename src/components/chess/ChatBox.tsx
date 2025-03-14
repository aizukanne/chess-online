import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  Avatar,
  Divider
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useAppDispatch, useAppSelector } from '../../store';
import { addChatMessage } from '../../store/gameSlice';

interface ChatBoxProps {
  maxHeight?: number | string;
}

const ChatBox: React.FC<ChatBoxProps> = ({ maxHeight = 300 }) => {
  const dispatch = useAppDispatch();
  const { chatHistory, gameType, blackPlayer } = useAppSelector(state => state.game);
  const { user } = useAppSelector(state => state.auth);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleSendMessage = () => {
    if (message.trim()) {
      dispatch(addChatMessage({
        sender: user?.username || 'Player',
        message: message.trim()
      }));
      setMessage('');
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

  // Get avatar for sender
  const getAvatar = (sender: string) => {
    if (sender === 'AI') {
      return '/robot.png'; // You would need to add this image to public folder
    }
    
    // For users, use first letter of their name
    return sender.charAt(0).toUpperCase();
  };

  return (
    <Paper elevation={3} sx={{ width: '100%' }}>
      <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
        Chat
      </Typography>
      
      <Box sx={{ 
        height: maxHeight, 
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
            {gameType === 'vs-computer' 
              ? 'Chat with the AI opponent. Ask for advice or discuss your moves!'
              : 'No messages yet. Start the conversation!'}
          </Typography>
        ) : (
          <List>
            {chatHistory.map((chat: { sender: string; message: string; timestamp: number }, index: number) => (
              <ListItem key={index} alignItems="flex-start" sx={{
                flexDirection: chat.sender === (user?.username || 'Player') ? 'row-reverse' : 'row',
                px: 1,
                py: 0.5
              }}>
                <Avatar 
                  sx={{ 
                    bgcolor: chat.sender === 'AI' ? 'secondary.main' : 'primary.main',
                    width: 32,
                    height: 32,
                    mr: chat.sender === (user?.username || 'Player') ? 0 : 1,
                    ml: chat.sender === (user?.username || 'Player') ? 1 : 0
                  }}
                >
                  {getAvatar(chat.sender)}
                </Avatar>
                <Box sx={{ 
                  maxWidth: '70%',
                  bgcolor: chat.sender === (user?.username || 'Player') ? 'primary.light' : 'grey.100',
                  borderRadius: 2,
                  p: 1,
                  color: chat.sender === (user?.username || 'Player') ? 'white' : 'text.primary'
                }}>
                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                    {chat.message}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    display: 'block', 
                    textAlign: 'right',
                    color: chat.sender === (user?.username || 'Player') ? 'rgba(255,255,255,0.7)' : 'text.secondary'
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
          placeholder="Type a message..."
          size="small"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={gameType === 'vs-computer' && blackPlayer !== 'AI'}
        />
        <Button 
          variant="contained" 
          color="primary" 
          endIcon={<SendIcon />}
          onClick={handleSendMessage}
          disabled={!message.trim() || (gameType === 'vs-computer' && blackPlayer !== 'AI')}
          sx={{ ml: 1 }}
        >
          Send
        </Button>
      </Box>
    </Paper>
  );
};

export default ChatBox;