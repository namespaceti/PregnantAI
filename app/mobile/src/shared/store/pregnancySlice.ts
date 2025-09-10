import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Pregnancy } from '../../entities';

interface PregnancyState {
  pregnancy: Pregnancy | null;
  currentWeek: number;
  currentDay: number;
  isLoading: boolean;
}

const initialState: PregnancyState = {
  pregnancy: null,
  currentWeek: 23, // Default for demo
  currentDay: 3,
  isLoading: false,
};

export const pregnancySlice = createSlice({
  name: 'pregnancy',
  initialState,
  reducers: {
    setPregnancy: (state, action: PayloadAction<Pregnancy>) => {
      state.pregnancy = action.payload;
      state.currentWeek = action.payload.week;
      state.currentDay = action.payload.day;
      state.isLoading = false;
    },
    updateWeekDay: (state, action: PayloadAction<{ week: number; day: number }>) => {
      state.currentWeek = action.payload.week;
      state.currentDay = action.payload.day;
      if (state.pregnancy) {
        state.pregnancy.week = action.payload.week;
        state.pregnancy.day = action.payload.day;
      }
    },
    updateUserPhysicalData: (state, action: PayloadAction<{ height?: number; prePregnancyWeight?: number }>) => {
      if (state.pregnancy) {
        if (action.payload.height) state.pregnancy.height = action.payload.height;
        if (action.payload.prePregnancyWeight) state.pregnancy.prePregnancyWeight = action.payload.prePregnancyWeight;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setPregnancy, updateWeekDay, updateUserPhysicalData, setLoading } = pregnancySlice.actions;
