import { createTheme, Theme, ThemeOptions } from '@mui/material/styles';

export interface CustomThemeOptions extends ThemeOptions {
  custom?: {
    sidebar?: {
      width: number;
      collapsedWidth: number;
      background: string;
    };
    editor?: {
      fontFamily: string;
      fontSize: number;
      lineHeight: number;
      background: string;
    };
    terminal?: {
      fontFamily: string;
      fontSize: number;
      background: string;
      foreground: string;
    };
    statusBar?: {
      height: number;
      background: string;
    };
  };
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  theme: CustomThemeOptions;
}

export class ThemeManager {
  private themes: Map<string, ThemePreset> = new Map();
  private activeThemeId: string | null = null;
  private listeners: Set<(theme: Theme) => void> = new Set();

  constructor() {
    // Register default themes
    this.registerDefaultThemes();
  }

  private registerDefaultThemes(): void {
    this.registerTheme({
      id: 'light',
      name: 'Light Theme',
      description: 'Default light theme',
      theme: {
        palette: {
          mode: 'light',
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
          background: {
            default: '#f5f5f5',
            paper: '#ffffff',
          },
        },
        custom: {
          sidebar: {
            width: 240,
            collapsedWidth: 64,
            background: '#ffffff',
          },
          editor: {
            fontFamily: '"Fira Code", monospace',
            fontSize: 14,
            lineHeight: 1.5,
            background: '#ffffff',
          },
          terminal: {
            fontFamily: '"Fira Code", monospace',
            fontSize: 14,
            background: '#1e1e1e',
            foreground: '#ffffff',
          },
          statusBar: {
            height: 24,
            background: '#1976d2',
          },
        },
      },
    });

    this.registerTheme({
      id: 'dark',
      name: 'Dark Theme',
      description: 'Default dark theme',
      theme: {
        palette: {
          mode: 'dark',
          primary: {
            main: '#90caf9',
          },
          secondary: {
            main: '#f48fb1',
          },
          background: {
            default: '#121212',
            paper: '#1e1e1e',
          },
        },
        custom: {
          sidebar: {
            width: 240,
            collapsedWidth: 64,
            background: '#1e1e1e',
          },
          editor: {
            fontFamily: '"Fira Code", monospace',
            fontSize: 14,
            lineHeight: 1.5,
            background: '#1e1e1e',
          },
          terminal: {
            fontFamily: '"Fira Code", monospace',
            fontSize: 14,
            background: '#000000',
            foreground: '#ffffff',
          },
          statusBar: {
            height: 24,
            background: '#1e1e1e',
          },
        },
      },
    });
  }

  public registerTheme(preset: ThemePreset): void {
    this.themes.set(preset.id, preset);
  }

  public getTheme(themeId: string): Theme {
    const preset = this.themes.get(themeId);
    if (!preset) {
      throw new Error(`Theme ${themeId} not found`);
    }
    return createTheme(preset.theme);
  }

  public getActiveTheme(): Theme {
    if (!this.activeThemeId || !this.themes.has(this.activeThemeId)) {
      this.activeThemeId = 'light';
    }
    return this.getTheme(this.activeThemeId);
  }

  public setActiveTheme(themeId: string): void {
    if (!this.themes.has(themeId)) {
      throw new Error(`Theme ${themeId} not found`);
    }
    this.activeThemeId = themeId;
    const theme = this.getTheme(themeId);
    this.notifyListeners(theme);
  }

  public getAvailableThemes(): ThemePreset[] {
    return Array.from(this.themes.values());
  }

  public customizeTheme(themeId: string, customizations: Partial<CustomThemeOptions>): void {
    const preset = this.themes.get(themeId);
    if (!preset) {
      throw new Error(`Theme ${themeId} not found`);
    }

    const customizedTheme: ThemePreset = {
      ...preset,
      theme: {
        ...preset.theme,
        ...customizations,
        custom: {
          ...preset.theme.custom,
          ...customizations.custom,
        },
      },
    };

    this.themes.set(themeId, customizedTheme);
    if (this.activeThemeId === themeId) {
      this.notifyListeners(this.getTheme(themeId));
    }
  }

  public createCustomTheme(preset: ThemePreset): void {
    if (this.themes.has(preset.id)) {
      throw new Error(`Theme ${preset.id} already exists`);
    }
    this.registerTheme(preset);
  }

  public subscribe(listener: (theme: Theme) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(theme: Theme): void {
    this.listeners.forEach(listener => listener(theme));
  }
}

export default ThemeManager;
