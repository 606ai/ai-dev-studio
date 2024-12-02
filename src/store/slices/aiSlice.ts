import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  parameters: Record<string, any>;
}

interface AIState {
  selectedModel: string | null;
  availableModels: AIModel[];
  isProcessing: boolean;
  lastResponse: string | null;
  error: string | null;
  history: Array<{
    timestamp: string;
    prompt: string;
    response: string;
    model: string;
  }>;
}

const initialState: AIState = {
  selectedModel: null,
  availableModels: [],
  isProcessing: false,
  lastResponse: null,
  error: null,
  history: [],
};

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setSelectedModel: (state, action: PayloadAction<string | null>) => {
      state.selectedModel = action.payload;
    },
    setAvailableModels: (state, action: PayloadAction<AIModel[]>) => {
      state.availableModels = action.payload;
    },
    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
    },
    setLastResponse: (state, action: PayloadAction<string | null>) => {
      state.lastResponse = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addToHistory: (
      state,
      action: PayloadAction<{
        prompt: string;
        response: string;
        model: string;
      }>
    ) => {
      state.history.push({
        ...action.payload,
        timestamp: new Date().toISOString(),
      });
    },
    clearHistory: (state) => {
      state.history = [];
    },
  },
});

export const {
  setSelectedModel,
  setAvailableModels,
  setProcessing,
  setLastResponse,
  setError,
  addToHistory,
  clearHistory,
} = aiSlice.actions;

export default aiSlice.reducer;
