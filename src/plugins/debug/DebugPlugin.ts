import { Plugin, PluginMetadata, PluginContext } from '../PluginSystem';
import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'events';

export interface DebugConfiguration {
  type: string;
  name: string;
  request: 'launch' | 'attach';
  program?: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  port?: number;
  stopOnEntry?: boolean;
  console?: 'internalConsole' | 'integratedTerminal' | 'externalTerminal';
}

export interface Breakpoint {
  id: string;
  file: string;
  line: number;
  column?: number;
  condition?: string;
  hitCount?: number;
  enabled: boolean;
}

export interface DebugVariable {
  name: string;
  value: string;
  type: string;
  variablesReference: number;
}

export interface StackFrame {
  id: number;
  name: string;
  source: {
    path: string;
    name: string;
  };
  line: number;
  column: number;
}

export class DebugSession extends EventEmitter {
  private process: ChildProcess | null = null;
  private breakpoints: Map<string, Breakpoint[]> = new Map();
  private isRunning: boolean = false;
  private config: DebugConfiguration;

  constructor(config: DebugConfiguration) {
    super();
    this.config = config;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Debug session is already running');
    }

    if (this.config.request === 'launch') {
      await this.launch();
    } else {
      await this.attach();
    }
  }

  private async launch(): Promise<void> {
    if (!this.config.program) {
      throw new Error('Program path is required for launch configuration');
    }

    let debuggerCommand: string;
    let debuggerArgs: string[] = [];

    switch (this.config.type) {
      case 'python':
        debuggerCommand = 'python';
        debuggerArgs = ['-m', 'debugpy', '--wait-for-client', '--listen', '5678', this.config.program];
        break;
      case 'node':
        debuggerCommand = 'node';
        debuggerArgs = ['--inspect-brk', this.config.program];
        break;
      default:
        throw new Error(`Unsupported debug type: ${this.config.type}`);
    }

    this.process = spawn(debuggerCommand, debuggerArgs, {
      cwd: this.config.cwd,
      env: { ...process.env, ...this.config.env }
    });

    this.process.stdout?.on('data', (data) => {
      this.emit('output', { category: 'stdout', output: data.toString() });
    });

    this.process.stderr?.on('data', (data) => {
      this.emit('output', { category: 'stderr', output: data.toString() });
    });

    this.process.on('exit', (code) => {
      this.isRunning = false;
      this.emit('terminated', { code });
    });

    this.isRunning = true;
    this.emit('started');
  }

  private async attach(): Promise<void> {
    if (!this.config.port) {
      throw new Error('Port is required for attach configuration');
    }

    // Implementation would depend on the specific debugger protocol
    this.isRunning = true;
    this.emit('started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    if (this.process) {
      this.process.kill();
    }

    this.isRunning = false;
    this.emit('terminated', { code: 0 });
  }

  async pause(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Debug session is not running');
    }

    // Implementation would depend on the specific debugger protocol
    this.emit('paused');
  }

  async continue(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Debug session is not running');
    }

    // Implementation would depend on the specific debugger protocol
    this.emit('continued');
  }

  async stepOver(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Debug session is not running');
    }

    // Implementation would depend on the specific debugger protocol
    this.emit('stepped');
  }

  async stepInto(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Debug session is not running');
    }

    // Implementation would depend on the specific debugger protocol
    this.emit('stepped');
  }

  async stepOut(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Debug session is not running');
    }

    // Implementation would depend on the specific debugger protocol
    this.emit('stepped');
  }

  async setBreakpoint(breakpoint: Omit<Breakpoint, 'id'>): Promise<Breakpoint> {
    const id = Math.random().toString(36).substr(2, 9);
    const newBreakpoint: Breakpoint = { ...breakpoint, id, enabled: true };

    if (!this.breakpoints.has(breakpoint.file)) {
      this.breakpoints.set(breakpoint.file, []);
    }

    this.breakpoints.get(breakpoint.file)!.push(newBreakpoint);
    this.emit('breakpointAdded', newBreakpoint);

    return newBreakpoint;
  }

  async removeBreakpoint(id: string): Promise<void> {
    for (const [file, breakpoints] of this.breakpoints) {
      const index = breakpoints.findIndex(bp => bp.id === id);
      if (index !== -1) {
        breakpoints.splice(index, 1);
        this.emit('breakpointRemoved', id);
        return;
      }
    }
  }

  getBreakpoints(file?: string): Breakpoint[] {
    if (file) {
      return this.breakpoints.get(file) || [];
    }
    return Array.from(this.breakpoints.values()).flat();
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

export class DebugPlugin implements Plugin {
  metadata: PluginMetadata = {
    id: 'debug',
    name: 'Debug',
    version: '1.0.0',
    description: 'Provides debugging capabilities',
    author: 'AI Dev Studio'
  };

  private context!: PluginContext;
  private activeSession: DebugSession | null = null;

  async activate(context: PluginContext): Promise<void> {
    this.context = context;

    // Register commands
    this.registerCommands();

    // Register views
    this.registerViews();

    // Register debug configurations provider
    this.registerDebugConfigProvider();
  }

  private registerCommands(): void {
    const commands = {
      'debug.start': async (config: DebugConfiguration) => {
        await this.startDebugSession(config);
      },
      'debug.stop': async () => {
        await this.stopDebugSession();
      },
      'debug.pause': async () => {
        await this.activeSession?.pause();
      },
      'debug.continue': async () => {
        await this.activeSession?.continue();
      },
      'debug.stepOver': async () => {
        await this.activeSession?.stepOver();
      },
      'debug.stepInto': async () => {
        await this.activeSession?.stepInto();
      },
      'debug.stepOut': async () => {
        await this.activeSession?.stepOut();
      },
      'debug.toggleBreakpoint': async (file: string, line: number) => {
        await this.toggleBreakpoint(file, line);
      }
    };

    Object.entries(commands).forEach(([id, handler]) => {
      this.context.events.emit('commands:register', { id, handler });
    });
  }

  private registerViews(): void {
    // Register debug view container
    this.context.events.emit('views:register', {
      id: 'debug',
      title: 'Debug',
      component: 'DebugView',
      icon: 'debug-alt',
      position: 'left'
    });

    // Register debug toolbar
    this.context.events.emit('toolbar:register', {
      id: 'debug',
      items: [
        {
          id: 'start',
          icon: 'debug-start',
          command: 'debug.start',
          tooltip: 'Start Debugging'
        },
        {
          id: 'stop',
          icon: 'debug-stop',
          command: 'debug.stop',
          tooltip: 'Stop Debugging'
        },
        {
          id: 'pause',
          icon: 'debug-pause',
          command: 'debug.pause',
          tooltip: 'Pause'
        },
        {
          id: 'continue',
          icon: 'debug-continue',
          command: 'debug.continue',
          tooltip: 'Continue'
        },
        {
          id: 'step-over',
          icon: 'debug-step-over',
          command: 'debug.stepOver',
          tooltip: 'Step Over'
        },
        {
          id: 'step-into',
          icon: 'debug-step-into',
          command: 'debug.stepInto',
          tooltip: 'Step Into'
        },
        {
          id: 'step-out',
          icon: 'debug-step-out',
          command: 'debug.stepOut',
          tooltip: 'Step Out'
        }
      ]
    });
  }

  private registerDebugConfigProvider(): void {
    this.context.events.emit('debug:registerConfigProvider', {
      getConfigurations: async () => {
        // This would typically read from a launch.json file
        return [
          {
            type: 'python',
            name: 'Python: Current File',
            request: 'launch',
            program: '${file}',
            console: 'integratedTerminal'
          },
          {
            type: 'node',
            name: 'Node: Current File',
            request: 'launch',
            program: '${file}',
            console: 'integratedTerminal'
          }
        ];
      }
    });
  }

  private async startDebugSession(config: DebugConfiguration): Promise<void> {
    if (this.activeSession) {
      await this.stopDebugSession();
    }

    this.activeSession = new DebugSession(config);

    // Forward debug events
    this.activeSession.on('started', () => {
      this.context.events.emit('debug:started');
    });

    this.activeSession.on('terminated', (event) => {
      this.context.events.emit('debug:terminated', event);
      this.activeSession = null;
    });

    this.activeSession.on('output', (event) => {
      this.context.events.emit('debug:output', event);
    });

    await this.activeSession.start();
  }

  private async stopDebugSession(): Promise<void> {
    if (this.activeSession) {
      await this.activeSession.stop();
      this.activeSession = null;
    }
  }

  private async toggleBreakpoint(file: string, line: number): Promise<void> {
    if (!this.activeSession) {
      return;
    }

    const existingBreakpoint = this.activeSession.getBreakpoints(file)
      .find(bp => bp.line === line);

    if (existingBreakpoint) {
      await this.activeSession.removeBreakpoint(existingBreakpoint.id);
    } else {
      await this.activeSession.setBreakpoint({ file, line });
    }
  }

  async deactivate(): Promise<void> {
    await this.stopDebugSession();
  }
}

export default DebugPlugin;
