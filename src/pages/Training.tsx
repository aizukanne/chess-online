import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActionArea,
  Tabs,
  Tab,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import SchoolIcon from '@mui/icons-material/School';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ExtensionIcon from '@mui/icons-material/Extension';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

// Mock tutorial data
const tutorials = [
  {
    id: 1,
    title: 'Basic Moves',
    description: 'Learn how each piece moves on the chess board',
    difficulty: 'Beginner',
    image: '/tutorials/basic-moves.jpg',
    position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  },
  {
    id: 2,
    title: 'Basic Checkmates',
    description: 'Learn fundamental checkmate patterns',
    difficulty: 'Beginner',
    image: '/tutorials/checkmates.jpg',
    position: '8/8/8/8/8/7k/1Q6/7K w - - 0 1'
  },
  {
    id: 3,
    title: 'Opening Principles',
    description: 'Master the fundamentals of strong openings',
    difficulty: 'Intermediate',
    image: '/tutorials/openings.jpg',
    position: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
  },
  {
    id: 4,
    title: 'Tactical Patterns',
    description: 'Recognize and execute common tactical patterns',
    difficulty: 'Intermediate',
    image: '/tutorials/tactics.jpg',
    position: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1'
  },
  {
    id: 5,
    title: 'Endgame Fundamentals',
    description: 'Master essential endgame techniques',
    difficulty: 'Advanced',
    image: '/tutorials/endgames.jpg',
    position: '8/8/8/8/8/k7/p7/K7 w - - 0 1'
  },
];

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
      id={`training-tabpanel-${index}`}
      aria-labelledby={`training-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Training: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedTutorial, setSelectedTutorial] = useState<typeof tutorials[0] | null>(null);
  const [chess] = useState<Chess>(new Chess());
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setSelectedTutorial(null);
  };
  
  const handleTutorialSelect = (tutorial: typeof tutorials[0]) => {
    setSelectedTutorial(tutorial);
    chess.load(tutorial.position);
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Training Center
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Tutorials" icon={<SchoolIcon />} iconPosition="start" />
          <Tab label="Puzzles" icon={<ExtensionIcon />} iconPosition="start" />
          <Tab label="Analysis" icon={<LightbulbIcon />} iconPosition="start" />
          <Tab label="Achievements" icon={<EmojiEventsIcon />} iconPosition="start" />
        </Tabs>
        
        {/* Tutorials Tab */}
        <TabPanel value={tabValue} index={0}>
          {selectedTutorial ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h5" gutterBottom>
                  {selectedTutorial.title}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Difficulty: {selectedTutorial.difficulty}
                </Typography>
                <Typography paragraph>
                  {selectedTutorial.description}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>
                  Instructions
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <LightbulbIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Study the position on the board" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <LightbulbIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Try to understand the key concepts" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <LightbulbIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Practice with the interactive examples" />
                  </ListItem>
                </List>
                
                <Button 
                  variant="outlined" 
                  onClick={() => setSelectedTutorial(null)}
                  sx={{ mt: 2 }}
                >
                  Back to Tutorials
                </Button>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Chessboard
                    id="tutorial-board"
                    position={selectedTutorial.position}
                    boardWidth={400}
                    areArrowsAllowed={true}
                    customBoardStyle={{
                      borderRadius: '4px',
                      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)'
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={3}>
              {tutorials.map((tutorial) => (
                <Grid item key={tutorial.id} xs={12} sm={6} md={4}>
                  <Card sx={{ height: '100%' }}>
                    <CardActionArea onClick={() => handleTutorialSelect(tutorial)}>
                      <CardMedia
                        component="div"
                        sx={{
                          height: 140,
                          bgcolor: 'grey.300',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography variant="h6" color="text.secondary">
                          {tutorial.title}
                        </Typography>
                      </CardMedia>
                      <CardContent>
                        <Typography gutterBottom variant="h6" component="div">
                          {tutorial.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Difficulty: {tutorial.difficulty}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {tutorial.description}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
        
        {/* Puzzles Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" gutterBottom>
              Chess Puzzles
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Solve tactical puzzles to improve your chess skills.
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              Coming soon!
            </Typography>
          </Box>
        </TabPanel>
        
        {/* Analysis Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" gutterBottom>
              Game Analysis
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Upload your games for AI-powered analysis and improvement suggestions.
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              Coming soon!
            </Typography>
          </Box>
        </TabPanel>
        
        {/* Achievements Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" gutterBottom>
              Achievements
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track your progress and earn achievements as you improve.
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              Coming soon!
            </Typography>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Training;