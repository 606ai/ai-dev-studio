import { EventEmitter } from 'events';

export interface SettingsSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  default?: any;
  enum?: any[];
  description?: string;
  minimum?: number;
  maximum?: number;
  items?: SettingsSchema;
  properties?: Record<string, SettingsSchema>;
  required?: string[];
}

export interface SettingsCategory {
  id: string;
  title: string;
  description?: string;
  schema: Record<string, SettingsSchema>;
}

export class SettingsManager {
  private settings: Map<string, any> = new Map();
  private schemas: Map<string, SettingsCategory> = new Map();
  private events: EventEmitter = new EventEmitter();

  constructor() {
    this.registerDefaultSettings();
  }

  private registerDefaultSettings(): void {
    // Editor settings
    this.registerCategory({
      id: 'editor',
      title: 'Editor',
      description: 'Code editor settings',
      schema: {
        'editor.fontSize': {
          type: 'number',
          default: 14,
          minimum: 8,
          maximum: 32,
          description: 'Controls the font size in pixels',
        },
        'editor.fontFamily': {
          type: 'string',
          default: '"Fira Code", monospace',
          description: 'Controls the font family',
        },
        'editor.tabSize': {
          type: 'number',
          default: 2,
          minimum: 1,
          maximum: 8,
          description: 'Controls the number of spaces a tab is equal to',
        },
        'editor.wordWrap': {
          type: 'string',
          default: 'off',
          enum: ['off', 'on', 'wordWrapColumn', 'bounded'],
          description: 'Controls how lines should wrap',
        },
        'editor.minimap.enabled': {
          type: 'boolean',
          default: true,
          description: 'Controls if the minimap is shown',
        },
      },
    });

    // Terminal settings
    this.registerCategory({
      id: 'terminal',
      title: 'Terminal',
      description: 'Integrated terminal settings',
      schema: {
        'terminal.fontSize': {
          type: 'number',
          default: 14,
          minimum: 8,
          maximum: 32,
          description: 'Controls the font size in pixels',
        },
        'terminal.fontFamily': {
          type: 'string',
          default: '"Fira Code", monospace',
          description: 'Controls the font family',
        },
        'terminal.lineHeight': {
          type: 'number',
          default: 1.2,
          minimum: 1,
          maximum: 2,
          description: 'Controls the line height',
        },
      },
    });

    // AI settings
    this.registerCategory({
      id: 'ai',
      title: 'AI Assistant',
      description: 'AI code assistance settings',
      schema: {
        'ai.model': {
          type: 'string',
          default: 'codellama',
          enum: ['codellama', 'starcoder', 'gpt-3.5-turbo'],
          description: 'The AI model to use for code assistance',
        },
        'ai.temperature': {
          type: 'number',
          default: 0.7,
          minimum: 0,
          maximum: 1,
          description: 'Controls the randomness of AI responses',
        },
        'ai.maxTokens': {
          type: 'number',
          default: 1000,
          minimum: 100,
          maximum: 4000,
          description: 'Maximum number of tokens in AI responses',
        },
      },
    });

    // Theme settings
    this.registerCategory({
      id: 'theme',
      title: 'Theme',
      description: 'Visual theme settings',
      schema: {
        'theme.name': {
          type: 'string',
          default: 'light',
          enum: ['light', 'dark'],
          description: 'The color theme to use',
        },
        'theme.customColors': {
          type: 'object',
          description: 'Custom color overrides',
          properties: {
            primary: {
              type: 'string',
              description: 'Primary color',
            },
            secondary: {
              type: 'string',
              description: 'Secondary color',
            },
            background: {
              type: 'string',
              description: 'Background color',
            },
          },
        },
      },
    });
  }

  public registerCategory(category: SettingsCategory): void {
    this.schemas.set(category.id, category);
    
    // Initialize default values
    Object.entries(category.schema).forEach(([key, schema]) => {
      if (!this.settings.has(key) && schema.default !== undefined) {
        this.settings.set(key, schema.default);
      }
    });

    this.events.emit('categoryRegistered', category);
  }

  public getSetting<T>(key: string): T {
    return this.settings.get(key);
  }

  public updateSetting(key: string, value: any): void {
    const [categoryId] = key.split('.');
    const category = this.schemas.get(categoryId);
    if (!category) {
      throw new Error(`Category not found for setting ${key}`);
    }

    const schema = category.schema[key];
    if (!schema) {
      throw new Error(`Schema not found for setting ${key}`);
    }

    // Validate value against schema
    this.validateValue(value, schema);

    this.settings.set(key, value);
    this.events.emit('settingChanged', { key, value });
  }

  public getCategory(categoryId: string): SettingsCategory {
    const category = this.schemas.get(categoryId);
    if (!category) {
      throw new Error(`Category ${categoryId} not found`);
    }
    return category;
  }

  public getCategories(): SettingsCategory[] {
    return Array.from(this.schemas.values());
  }

  public exportSettings(): Record<string, any> {
    const settings: Record<string, any> = {};
    this.settings.forEach((value, key) => {
      settings[key] = value;
    });
    return settings;
  }

  public importSettings(settings: Record<string, any>): void {
    Object.entries(settings).forEach(([key, value]) => {
      try {
        this.updateSetting(key, value);
      } catch (error) {
        console.warn(`Failed to import setting ${key}:`, error);
      }
    });
  }

  public resetToDefaults(categoryId?: string): void {
    const categories = categoryId 
      ? [this.getCategory(categoryId)]
      : this.getCategories();

    categories.forEach(category => {
      Object.entries(category.schema).forEach(([key, schema]) => {
        if (schema.default !== undefined) {
          this.settings.set(key, schema.default);
        }
      });
    });

    this.events.emit('settingsReset', categoryId);
  }

  public on(event: string, handler: (...args: any[]) => void): void {
    this.events.on(event, handler);
  }

  public off(event: string, handler: (...args: any[]) => void): void {
    this.events.off(event, handler);
  }

  private validateValue(value: any, schema: SettingsSchema): void {
    switch (schema.type) {
      case 'number':
        if (typeof value !== 'number') {
          throw new Error('Value must be a number');
        }
        if (schema.minimum !== undefined && value < schema.minimum) {
          throw new Error(`Value must be >= ${schema.minimum}`);
        }
        if (schema.maximum !== undefined && value > schema.maximum) {
          throw new Error(`Value must be <= ${schema.maximum}`);
        }
        break;

      case 'string':
        if (typeof value !== 'string') {
          throw new Error('Value must be a string');
        }
        if (schema.enum && !schema.enum.includes(value)) {
          throw new Error(`Value must be one of: ${schema.enum.join(', ')}`);
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error('Value must be a boolean');
        }
        break;

      case 'object':
        if (typeof value !== 'object' || value === null) {
          throw new Error('Value must be an object');
        }
        if (schema.properties) {
          Object.entries(schema.properties).forEach(([propKey, propSchema]) => {
            if (value[propKey] !== undefined) {
              this.validateValue(value[propKey], propSchema);
            }
          });
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          throw new Error('Value must be an array');
        }
        if (schema.items) {
          value.forEach(item => this.validateValue(item, schema.items!));
        }
        break;
    }
  }
}

export default SettingsManager;
