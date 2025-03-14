import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  CardMedia,
  Paper
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAppSelector } from '../store';

// Feature card component
interface FeatureCardProps {
  title: string;
  description: string;
  image: string;
  buttonText: string;
  to: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, image, buttonText, to }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardMedia
      component="img"
      height="140"
      image={image}
      alt={title}
    />
    <CardContent sx={{ flexGrow: 1 }}>
      <Typography gutterBottom variant="h5" component="h2">
        {title}
      </Typography>
      <Typography>
        {description}
      </Typography>
    </CardContent>
    <CardActions>
      <Button size="small" component={RouterLink} to={to}>
        {buttonText}
      </Button>
    </CardActions>
  </Card>
);

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  
  return (
    <Box>
      {/* Hero Section */}
      <Paper 
        elevation={0}
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'white', 
          py: 8,
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(/chess-hero.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography
            component="h1"
            variant="h2"
            align="center"
            color="inherit"
            gutterBottom
          >
            Chess Online
          </Typography>
          <Typography variant="h5" align="center" color="inherit" paragraph>
            Play chess against friends or AI opponents. Improve your skills with training tools and tutorials.
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              color="secondary" 
              size="large" 
              component={RouterLink} 
              to="/game"
              sx={{ mx: 1 }}
            >
              Play Now
            </Button>
            {!isAuthenticated && (
              <Button 
                variant="outlined" 
                color="inherit" 
                size="large" 
                component={RouterLink} 
                to="/login"
                sx={{ mx: 1 }}
              >
                Sign In
              </Button>
            )}
          </Box>
        </Container>
      </Paper>

      {/* Features Section */}
      <Container sx={{ py: 8 }} maxWidth="md">
        <Typography variant="h4" align="center" gutterBottom>
          Features
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={4}>
            <FeatureCard
              title="Play vs Computer"
              description="Challenge our AI at different difficulty levels, from beginner to master."
              image="/feature-ai.jpg"
              buttonText="Play vs AI"
              to="/game"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FeatureCard
              title="Multiplayer"
              description="Play against friends in real-time or turn-based matches."
              image="/feature-multiplayer.jpg"
              buttonText="Find Opponents"
              to="/game"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FeatureCard
              title="Training"
              description="Improve your skills with tutorials and suggested moves."
              image="/feature-training.jpg"
              buttonText="Start Training"
              to="/training"
            />
          </Grid>
        </Grid>
      </Container>

      {/* Welcome Back Section (for logged in users) */}
      {isAuthenticated && user && (
        <Container sx={{ py: 4 }} maxWidth="md">
          <Paper sx={{ p: 4, bgcolor: 'background.paper' }}>
            <Typography variant="h4" gutterBottom>
              Welcome back, {user.username}!
            </Typography>
            <Typography variant="body1" paragraph>
              Your current rating: <strong>{user.rating}</strong>
            </Typography>
            <Typography variant="body1" paragraph>
              Games played: {user.gamesPlayed} (Won: {user.gamesWon}, Lost: {user.gamesLost}, Tied: {user.gamesTied})
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              component={RouterLink} 
              to="/game"
              sx={{ mt: 2 }}
            >
              Continue Playing
            </Button>
          </Paper>
        </Container>
      )}
    </Box>
  );
};

export default Home;