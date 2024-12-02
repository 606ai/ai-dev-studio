import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface EditorState {
  currentFile: string | null;
  files: {
    [path: string]: {
      content: string;
      language: string;
      isDirty: boolean;
      lastSaved: string | null;
    };
  };
  theme: 'light' | 'dark';
  fontSize: number;
  tabSize: number;
}

const initialState: EditorState = {
  currentFile: null,
  files: {},
  theme: 'light',
  fontSize: 14,
  tabSize: 2,
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setCurrentFile: (state, action: PayloadAction<string | null>) => {
      state.currentFile = action.payload;
    },
    updateFileContent: (
      state,
      action: PayloadAction<{ path: string; content: string; language: string }>
    ) => {
      const { path, content, language } = action.payload;
      state.files[path] = {
        ...state.files[path],
        content,
        language,
        isDirty: true,
        lastSaved: null,
      };
    },
    markFileSaved: (state, action: PayloadAction<string>) => {
      const path = action.payload;
      if (state.files[path]) {
        state.files[path].isDirty = false;
        state.files[path].lastSaved = new Date().toISOString();
      }
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setFontSize: (state, action: PayloadAction<number>) => {
      state.fontSize = action.payload;
    },
    setTabSize: (state, action: PayloadAction<number>) => {
      state.tabSize = action.payload;
    },
    closeFile: (state, action: PayloadAction<string>) => {
      const path = action.payload;
      delete state.files[path];
      if (state.currentFile === path) {
        state.currentFile = null;
      }
    },
  },
});

export const {
  setCurrentFile,
  updateFileContent,
  markFileSaved,
  setTheme,
  setFontSize,
  setTabSize,
  closeFile,
} = editorSlice.actions;

export default editorSlice.reducer;
