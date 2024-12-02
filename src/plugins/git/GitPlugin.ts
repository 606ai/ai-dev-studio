import { Plugin, PluginMetadata, PluginContext } from '../PluginSystem';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitStatus {
  branch: string;
  isClean: boolean;
  staged: string[];
  unstaged: string[];
  untracked: string[];
}

export interface GitCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
}

export class GitService {
  private workingDirectory: string;

  constructor(workingDirectory: string) {
    this.workingDirectory = workingDirectory;
  }

  async getStatus(): Promise<GitStatus> {
    const { stdout } = await execAsync('git status --porcelain -b', { cwd: this.workingDirectory });
    const lines = stdout.split('\n');
    const branchLine = lines[0];
    const branch = branchLine.match(/## (.+?)(?:\.{3}|$)/)?.[1] || 'HEAD';

    const status: GitStatus = {
      branch,
      isClean: lines.length === 1,
      staged: [],
      unstaged: [],
      untracked: []
    };

    lines.slice(1).forEach(line => {
      if (!line) return;
      const [state, file] = [line.slice(0, 2), line.slice(3)];
      
      if (state[0] !== ' ' && state[0] !== '?') {
        status.staged.push(file);
      }
      if (state[1] !== ' ') {
        if (state[1] === '?') {
          status.untracked.push(file);
        } else {
          status.unstaged.push(file);
        }
      }
    });

    return status;
  }

  async getLog(limit: number = 10): Promise<GitCommit[]> {
    const { stdout } = await execAsync(
      `git log -n ${limit} --pretty=format:"%H|%an|%ad|%s"`,
      { cwd: this.workingDirectory }
    );

    return stdout.split('\n').map(line => {
      const [hash, author, date, message] = line.split('|');
      return { hash, author, date, message };
    });
  }

  async stage(files: string[]): Promise<void> {
    await execAsync(`git add ${files.join(' ')}`, { cwd: this.workingDirectory });
  }

  async unstage(files: string[]): Promise<void> {
    await execAsync(`git reset HEAD ${files.join(' ')}`, { cwd: this.workingDirectory });
  }

  async commit(message: string): Promise<void> {
    await execAsync(`git commit -m "${message}"`, { cwd: this.workingDirectory });
  }

  async push(): Promise<void> {
    await execAsync('git push', { cwd: this.workingDirectory });
  }

  async pull(): Promise<void> {
    await execAsync('git pull', { cwd: this.workingDirectory });
  }

  async checkout(branch: string, create: boolean = false): Promise<void> {
    const command = create ? `git checkout -b ${branch}` : `git checkout ${branch}`;
    await execAsync(command, { cwd: this.workingDirectory });
  }

  async merge(branch: string): Promise<void> {
    await execAsync(`git merge ${branch}`, { cwd: this.workingDirectory });
  }

  async getDiff(file?: string): Promise<string> {
    const command = file ? `git diff ${file}` : 'git diff';
    const { stdout } = await execAsync(command, { cwd: this.workingDirectory });
    return stdout;
  }

  async getBlame(file: string): Promise<string> {
    const { stdout } = await execAsync(`git blame ${file}`, { cwd: this.workingDirectory });
    return stdout;
  }
}

export class GitPlugin implements Plugin {
  metadata: PluginMetadata = {
    id: 'git-integration',
    name: 'Git Integration',
    version: '1.0.0',
    description: 'Provides Git integration features',
    author: 'AI Dev Studio'
  };

  private context!: PluginContext;
  private gitService!: GitService;

  async activate(context: PluginContext): Promise<void> {
    this.context = context;
    this.gitService = new GitService(process.cwd());

    // Register the Git service
    context.services['git'] = this.gitService;

    // Register status bar contribution
    this.registerStatusBarContribution();

    // Register commands
    this.registerCommands();

    // Register file decorations
    this.registerFileDecorations();

    // Start watching Git status
    this.startStatusWatcher();
  }

  private registerStatusBarContribution(): void {
    this.context.events.emit('statusBar:register', {
      id: 'git-status',
      position: 'right',
      priority: 100,
      render: async () => {
        const status = await this.gitService.getStatus();
        return {
          text: `$(git-branch) ${status.branch}`,
          tooltip: `Git: ${status.branch}`,
          command: 'git.showStatus'
        };
      }
    });
  }

  private registerCommands(): void {
    const commands = {
      'git.showStatus': async () => {
        const status = await this.gitService.getStatus();
        this.context.events.emit('panel:show', {
          id: 'git-status',
          title: 'Git Status',
          content: {
            type: 'git-status',
            data: status
          }
        });
      },
      'git.stage': async (files: string[]) => {
        await this.gitService.stage(files);
        this.context.events.emit('git:statusChanged');
      },
      'git.unstage': async (files: string[]) => {
        await this.gitService.unstage(files);
        this.context.events.emit('git:statusChanged');
      },
      'git.commit': async (message: string) => {
        await this.gitService.commit(message);
        this.context.events.emit('git:statusChanged');
      },
      'git.push': async () => {
        await this.gitService.push();
        this.context.events.emit('git:statusChanged');
      },
      'git.pull': async () => {
        await this.gitService.pull();
        this.context.events.emit('git:statusChanged');
      }
    };

    Object.entries(commands).forEach(([id, handler]) => {
      this.context.events.emit('commands:register', { id, handler });
    });
  }

  private registerFileDecorations(): void {
    this.context.events.emit('fileExplorer:registerDecorator', {
      id: 'git-status',
      getDecoration: async (file: string) => {
        const status = await this.gitService.getStatus();
        if (status.staged.includes(file)) {
          return { badge: 'S', color: '#4CAF50' };
        }
        if (status.unstaged.includes(file)) {
          return { badge: 'M', color: '#FFC107' };
        }
        if (status.untracked.includes(file)) {
          return { badge: 'U', color: '#9E9E9E' };
        }
        return null;
      }
    });
  }

  private startStatusWatcher(): void {
    setInterval(async () => {
      const status = await this.gitService.getStatus();
      this.context.events.emit('git:status', status);
    }, 5000);
  }

  async deactivate(): Promise<void> {
    // Clean up resources
  }
}

export default GitPlugin;
