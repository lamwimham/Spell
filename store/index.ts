// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import spellReducer from './spellSlice';

export const store = configureStore({
  reducer: {
    spellsReducer: spellReducer,
  },
});

// 导出类型，用于在 useSelector 中使用类型推断
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;