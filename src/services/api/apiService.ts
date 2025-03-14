import { User } from '../../store/authSlice';

// This is a placeholder API service that will be replaced with actual AWS API calls
// when we integrate with AWS services

// Base URL for API calls - would be replaced with actual API Gateway URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.example.com';

// Mock authentication token
let mockAuthToken: string | null = null;

// Helper function for making API requests
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  try {
    // In a real implementation, this would get the token from AWS Cognito
    const token = mockAuthToken || 'mock-jwt-token';
    
    // Add authorization header
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    
    // Make the request
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Mock user storage
let currentUser: User | null = null;

// Auth API
export const authAPI = {
  // Social login - this would be handled by Cognito in a real implementation
  socialLogin: async (provider: string): Promise<User> => {
    // This is a mock implementation
    console.log(`Logging in with ${provider}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create mock user data
    const user = {
      id: `user-${Math.floor(Math.random() * 10000)}`,
      username: `User_${provider}`,
      email: `user@${provider.toLowerCase()}.com`,
      profilePicture: `/avatars/${provider.toLowerCase()}.png`,
      rating: 1200,
      gamesPlayed: 10,
      gamesWon: 5,
      gamesLost: 3,
      gamesTied: 2
    };
    
    // Store the user and generate a mock token
    currentUser = user;
    mockAuthToken = `mock-jwt-token-${user.id}`;
    
    return user;
  },
  
  logout: async (): Promise<void> => {
    // Clear the current user and token
    currentUser = null;
    mockAuthToken = null;
  },
  
  getCurrentUser: async (): Promise<User | null> => {
    // Return the current user if it exists
    return currentUser;
  }
};

// Game API
export const gameAPI = {
  createGame: async (gameData: {
    gameType: 'real-time' | 'turn-based' | 'vs-computer';
    aiDifficulty?: 'beginner' | 'intermediate' | 'advanced' | 'master';
  }) => {
    return fetchWithAuth('/games', {
      method: 'POST',
      body: JSON.stringify(gameData),
    });
  },
  
  getGame: async (gameId: string) => {
    return fetchWithAuth(`/games/${gameId}`);
  },
  
  makeMove: async (gameId: string, moveData: {
    from: string;
    to: string;
    promotion?: string;
  }) => {
    return fetchWithAuth(`/games/${gameId}/move`, {
      method: 'POST',
      body: JSON.stringify(moveData),
    });
  },
  
  getAIMove: async (position: string, difficulty: string) => {
    return fetchWithAuth('/ai/move', {
      method: 'POST',
      body: JSON.stringify({ position, difficulty }),
    });
  },
  
  sendChatMessage: async (gameId: string, message: string) => {
    return fetchWithAuth(`/games/${gameId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
  
  resignGame: async (gameId: string) => {
    return fetchWithAuth(`/games/${gameId}/resign`, {
      method: 'POST',
    });
  },
  
  offerDraw: async (gameId: string) => {
    return fetchWithAuth(`/games/${gameId}/draw-offer`, {
      method: 'POST',
    });
  },
  
  respondToDraw: async (gameId: string, accept: boolean) => {
    return fetchWithAuth(`/games/${gameId}/draw-response`, {
      method: 'POST',
      body: JSON.stringify({ accept }),
    });
  },
};

// User API
export const userAPI = {
  getUserProfile: async (userId: string) => {
    return fetchWithAuth(`/users/${userId}`);
  },
  
  updateUserProfile: async (userId: string, profileData: Partial<User>) => {
    return fetchWithAuth(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
  
  getUserStats: async (userId: string) => {
    return fetchWithAuth(`/users/${userId}/stats`);
  },
  
  getUserGames: async (userId: string) => {
    return fetchWithAuth(`/users/${userId}/games`);
  },
};

// Tutorial API
export const tutorialAPI = {
  getTutorials: async () => {
    return fetchWithAuth('/tutorials');
  },
  
  getTutorial: async (tutorialId: string) => {
    return fetchWithAuth(`/tutorials/${tutorialId}`);
  },
  
  updateTutorialProgress: async (tutorialId: string, progress: number) => {
    return fetchWithAuth(`/tutorials/${tutorialId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ progress }),
    });
  },
};