import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import storageReducer from './slices/storageSlice';
import projectReducer from './slices/projectSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    storage: storageReducer,
    project: projectReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
