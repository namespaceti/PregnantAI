import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  hasCompletedOnboarding: false, // Для тестирования новых экранов онбординга
  isLoading: true, // Initially loading to check auth status
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
      state.isLoading = false;
    },
    setOnboardingCompleted: (state, action: PayloadAction<boolean>) => {
      state.hasCompletedOnboarding = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.hasCompletedOnboarding = false;
      state.isLoading = false;
    },
  },
});

export const { setAuthenticated, setOnboardingCompleted, setLoading, logout } = authSlice.actions;
