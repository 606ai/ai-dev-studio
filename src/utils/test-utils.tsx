import React, { PropsWithChildren } from 'react';
import { render as rtlRender } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '@/styles/theme';
import editorReducer from '@store/slices/editorSlice';
import aiReducer from '@store/slices/aiSlice';

function render(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        editor: editorReducer,
        ai: aiReducer,
      },
      preloadedState,
    }),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            {children}
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    );
  }

  return {
    store,
    ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Mock worker
export const mockWorker = {
  postMessage: jest.fn(),
  terminate: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock performance monitoring
export const mockPerformanceMonitor = {
  startMark: jest.fn(),
  endMark: jest.fn(),
  getMetrics: jest.fn(),
  clearMetrics: jest.fn(),
};

// Mock collaboration service
export const mockCollaborationService = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  joinRoom: jest.fn(),
  leaveRoom: jest.fn(),
  broadcastEvent: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

// Mock security service
export const mockSecurityService = {
  validateInput: jest.fn(),
  validateFile: jest.fn(),
  sanitizeHtml: jest.fn(),
  getRequestHeaders: jest.fn(),
};

// Re-export everything
export * from '@testing-library/react';
export { render };
