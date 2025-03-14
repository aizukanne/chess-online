import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define types for our state
export interface User {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  rating: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesTied: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isAuthenticated = false;
      state.user = null;
      state.isLoading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    updateUserStats: (state, action: PayloadAction<{
      gamesPlayed?: number;
      gamesWon?: number;
      gamesLost?: number;
      gamesTied?: number;
      rating?: number;
    }>) => {
      if (state.user) {
        state.user = {
          ...state.user,
          gamesPlayed: action.payload.gamesPlayed !== undefined 
            ? action.payload.gamesPlayed 
            : state.user.gamesPlayed,
          gamesWon: action.payload.gamesWon !== undefined 
            ? action.payload.gamesWon 
            : state.user.gamesWon,
          gamesLost: action.payload.gamesLost !== undefined 
            ? action.payload.gamesLost 
            : state.user.gamesLost,
          gamesTied: action.payload.gamesTied !== undefined 
            ? action.payload.gamesTied 
            : state.user.gamesTied,
          rating: action.payload.rating !== undefined 
            ? action.payload.rating 
            : state.user.rating,
        };
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUserProfile,
  updateUserStats,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;