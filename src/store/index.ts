import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Import reducers
import authReducer from './authSlice';
import gameReducer from './gameSlice';

// Import middleware
import { createAIMiddleware } from './aiMiddleware';

// Define RootState type first to avoid circular dependencies
export type RootState = {
  auth: ReturnType<typeof authReducer>;
  game: ReturnType<typeof gameReducer>;
};

// Create the middleware with the RootState type
const aiMiddleware = createAIMiddleware();

// Create the store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    game: gameReducer,
    // Add more reducers as needed
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(aiMiddleware),
});

// Infer the `AppDispatch` type from the store
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;