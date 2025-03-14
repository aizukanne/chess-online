import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Avatar, 
  Button, 
  Divider, 
  List, 
  ListItem, 
  ListItemText,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store';
import EditIcon from '@mui/icons-material/Edit';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';

// Mock game history data
const mockGameHistory = [
  {
    id: '1',
    opponent: 'AI (Beginner)',
    result: 'win',
    date: '2025-03-14',
    moves: 24
  },
  {
    id: '2',
    opponent: 'AI (Intermediate)',
    result: 'loss',
    date: '2025-03-13',
    moves: 32
  },
  {
    id: '3',
    opponent: 'User_Google',
    result: 'win',
    date: '2025-03-12',
    moves: 41
  },
  {
    id: '4',
    opponent: 'AI (Advanced)',
    result: 'draw',
    date: '2025-03-11',
    moves: 60
  },
  {
    id: '5',
    opponent: 'User_Facebook',
    result: 'loss',
    date: '2025-03-10',
    moves: 28
  }
];

// Mock achievements data
const mockAchievements = [
  {
    id: '1',
    title: 'First Victory',
    description: 'Win your first game',
    completed: true,
    progress: 100
  },
  {
    id: '2',
    title: 'Chess Apprentice',
    description: 'Play 10 games',
    completed: true,
    progress: 100
  },
  {
    id: '3',
    title: 'Tactical Genius',
    description: 'Win 5 games in a row',
    completed: false,
    progress: 40
  },
  {
    id: '4',
    title: 'Grandmaster',
    description: 'Reach a rating of 2000',
    completed: false,
    progress: 60
  }
];

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  
  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" align="center">
          Please log in to view your profile
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/login')}
          >
            Go to Login
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Player Profile
      </Typography>
      
      <Grid container spacing={4}>
        {/* Profile Summary */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar 
                src={user.profilePicture} 
                alt={user.username}
                sx={{ width: 120, height: 120, mb: 2 }}
              >
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
              
              <Typography variant="h5" gutterBottom>
                {user.username}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user.email}
              </Typography>
              
              <Chip 
                label={`Rating: ${user.rating}`} 
                color="primary" 
                sx={{ mt: 1 }}
              />
              
              <Button 
                variant="outlined" 
                startIcon={<EditIcon />}
                sx={{ mt: 2 }}
              >
                Edit Profile
              </Button>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>
              Statistics
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Games Played" 
                  secondary={user.gamesPlayed} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Games Won" 
                  secondary={user.gamesWon} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Games Lost" 
                  secondary={user.gamesLost} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Games Tied" 
                  secondary={user.gamesTied} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Win Rate" 
                  secondary={`${user.gamesPlayed > 0 ? Math.round((user.gamesWon / user.gamesPlayed) * 100) : 0}%`} 
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        
        {/* Game History */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ mb: 4 }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <SportsEsportsIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">
                Recent Games
              </Typography>
            </Box>
            
            <Divider />
            
            <List>
              {mockGameHistory.map((game) => (
                <React.Fragment key={game.id}>
                  <ListItem
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/game/${game.id}`)}
                  >
                    <Grid container alignItems="center">
                      <Grid item xs={6} md={4}>
                        <ListItemText 
                          primary={game.opponent} 
                          secondary={`${game.date}`} 
                        />
                      </Grid>
                      <Grid item xs={3} md={3} sx={{ textAlign: 'center' }}>
                        <Chip 
                          label={game.result.toUpperCase()} 
                          color={
                            game.result === 'win' ? 'success' : 
                            game.result === 'loss' ? 'error' : 
                            'default'
                          }
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={3} md={3} sx={{ textAlign: 'center' }}>
                        <Typography variant="body2">
                          {game.moves} moves
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={2} sx={{ textAlign: 'right' }}>
                        <Button size="small">
                          Review
                        </Button>
                      </Grid>
                    </Grid>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
            
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Button variant="text">
                View All Games
              </Button>
            </Box>
          </Paper>
          
          {/* Achievements */}
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <EmojiEventsIcon color="primary" sx={{ mr: 1 }} />
            Achievements
          </Typography>
          
          <Grid container spacing={2}>
            {mockAchievements.map((achievement) => (
              <Grid item xs={12} sm={6} key={achievement.id}>
                <Card>
                  <CardHeader
                    title={achievement.title}
                    subheader={achievement.completed ? 'Completed' : 'In Progress'}
                    action={
                      achievement.completed && (
                        <EmojiEventsIcon color="primary" />
                      )
                    }
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {achievement.description}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={achievement.progress} 
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, textAlign: 'right' }}>
                      {achievement.progress}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {/* Progress Chart */}
          <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">
                Rating Progress
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              Rating chart will be displayed here
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;