import React from 'react';
import { Preview } from '@storybook/react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { theme } from '../src/styles/theme';
import { store } from '../src/store';
import { themes } from '@storybook/theming';
import { useDarkMode } from 'storybook-dark-mode';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    darkMode: {
      dark: { ...themes.dark },
      light: { ...themes.normal },
    },
  },
  decorators: [
    (Story) => {
      const isDark = useDarkMode();
      return (
        <Provider store={store}>
          <BrowserRouter>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <Story />
            </ThemeProvider>
          </BrowserRouter>
        </Provider>
      );
    },
  ],
};
