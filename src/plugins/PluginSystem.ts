import { EventEmitter } from 'events';

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  dependencies?: string[];
  config?: Record<string, any>;
}

export interface PluginContext {
  services: Record<string, any>;
  events: EventEmitter;
  config: Record<string, any>;
}

export interface Plugin {
  metadata: PluginMetadata;
  activate: (context: PluginContext) => Promise<void> | void;
  deactivate: () => Promise<void> | void;
}

export interface PluginHook {
  id: string;
  handler: (...args: any[]) => any;
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<string, Set<PluginHook>> = new Map();
  private events: EventEmitter = new EventEmitter();
  private services: Record<string, any> = {};
  private config: Record<string, any> = {};

  constructor(config: Record<string, any> = {}) {
    this.config = config;
  }

  public registerService(name: string, service: any): void {
    this.services[name] = service;
  }

  public async loadPlugin(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.metadata.id)) {
      throw new Error(`Plugin ${plugin.metadata.id} is already loaded`);
    }

    // Check dependencies
    if (plugin.metadata.dependencies) {
      for (const dep of plugin.metadata.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(`Plugin ${plugin.metadata.id} depends on ${dep} which is not loaded`);
        }
      }
    }

    // Create plugin context
    const context: PluginContext = {
      services: this.services,
      events: this.events,
      config: plugin.metadata.config || {}
    };

    // Activate plugin
    await plugin.activate(context);
    this.plugins.set(plugin.metadata.id, plugin);
  }

  public async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not loaded`);
    }

    // Check if other plugins depend on this one
    for (const [id, p] of this.plugins) {
      if (p.metadata.dependencies?.includes(pluginId)) {
        throw new Error(`Cannot unload plugin ${pluginId} because ${id} depends on it`);
      }
    }

    // Deactivate plugin
    await plugin.deactivate();
    this.plugins.delete(pluginId);

    // Remove plugin's hooks
    for (const [hookName, hooks] of this.hooks) {
      const pluginHooks = Array.from(hooks).filter(h => h.id.startsWith(pluginId));
      pluginHooks.forEach(h => hooks.delete(h));
    }
  }

  public registerHook(hookName: string, hook: PluginHook): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, new Set());
    }
    this.hooks.get(hookName)!.add(hook);
  }

  public unregisterHook(hookName: string, hookId: string): void {
    const hooks = this.hooks.get(hookName);
    if (hooks) {
      const hook = Array.from(hooks).find(h => h.id === hookId);
      if (hook) {
        hooks.delete(hook);
      }
    }
  }

  public async executeHook<T>(hookName: string, ...args: any[]): Promise<T[]> {
    const hooks = this.hooks.get(hookName);
    if (!hooks) {
      return [];
    }

    const results: T[] = [];
    for (const hook of hooks) {
      try {
        const result = await hook.handler(...args);
        if (result !== undefined) {
          results.push(result);
        }
      } catch (error) {
        console.error(`Error executing hook ${hookName} from plugin ${hook.id}:`, error);
      }
    }
    return results;
  }

  public getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  public getLoadedPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  public on(event: string, handler: (...args: any[]) => void): void {
    this.events.on(event, handler);
  }

  public off(event: string, handler: (...args: any[]) => void): void {
    this.events.off(event, handler);
  }

  public emit(event: string, ...args: any[]): void {
    this.events.emit(event, ...args);
  }
}

export default PluginManager;
