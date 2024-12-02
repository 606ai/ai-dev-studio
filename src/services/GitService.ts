import { Octokit } from '@octokit/rest';
import { SimpleGit, simpleGit, SimpleGitOptions } from 'simple-git';
import { EventEmitter } from 'events';

export interface GitConfig {
  username: string;
  email: string;
  accessToken?: string;
  defaultBranch?: string;
}

export interface GitDiff {
  file: string;
  hunks: Array<{
    content: string;
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
  }>;
}

export class GitService extends EventEmitter {
  private git: SimpleGit;
  private octokit: Octokit | null = null;
  private workingDirectory: string;

  constructor(workingDirectory: string, config?: GitConfig) {
    super();
    this.workingDirectory = workingDirectory;
    
    const options: SimpleGitOptions = {
      baseDir: workingDirectory,
      binary: 'git',
      maxConcurrentProcesses: 6,
    };

    this.git = simpleGit(options);
    
    if (config?.accessToken) {
      this.octokit = new Octokit({
        auth: config.accessToken
      });
    }

    this.initialize(config);
  }

  private async initialize(config?: GitConfig) {
    try {
      if (config) {
        await this.git.addConfig('user.name', config.username);
        await this.git.addConfig('user.email', config.email);
      }
    } catch (error) {
      this.emit('error', error);
    }
  }

  // Repository Management
  async initRepo(): Promise<void> {
    try {
      await this.git.init();
      this.emit('repo-initialized');
    } catch (error) {
      this.emit('error', error);
    }
  }

  async cloneRepo(url: string, directory?: string): Promise<void> {
    try {
      await this.git.clone(url, directory);
      this.emit('repo-cloned', { url, directory });
    } catch (error) {
      this.emit('error', error);
    }
  }

  // Branch Management
  async createBranch(branchName: string): Promise<void> {
    try {
      await this.git.checkoutLocalBranch(branchName);
      this.emit('branch-created', branchName);
    } catch (error) {
      this.emit('error', error);
    }
  }

  async switchBranch(branchName: string): Promise<void> {
    try {
      await this.git.checkout(branchName);
      this.emit('branch-switched', branchName);
    } catch (error) {
      this.emit('error', error);
    }
  }

  async mergeBranch(from: string, to: string): Promise<void> {
    try {
      await this.git.checkout(to);
      await this.git.merge([from]);
      this.emit('branch-merged', { from, to });
    } catch (error) {
      this.emit('error', error);
    }
  }

  // File Management
  async getStatus(): Promise<any> {
    try {
      const status = await this.git.status();
      this.emit('status-checked', status);
      return status;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async stageFiles(files: string[]): Promise<void> {
    try {
      await this.git.add(files);
      this.emit('files-staged', files);
    } catch (error) {
      this.emit('error', error);
    }
  }

  async unstageFiles(files: string[]): Promise<void> {
    try {
      await this.git.reset(['--', ...files]);
      this.emit('files-unstaged', files);
    } catch (error) {
      this.emit('error', error);
    }
  }

  // Commit Management
  async commit(message: string): Promise<void> {
    try {
      await this.git.commit(message);
      this.emit('changes-committed', message);
    } catch (error) {
      this.emit('error', error);
    }
  }

  async getCommitHistory(branch?: string): Promise<any> {
    try {
      const log = await this.git.log({ branch });
      this.emit('history-fetched', log);
      return log;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Remote Operations
  async addRemote(name: string, url: string): Promise<void> {
    try {
      await this.git.addRemote(name, url);
      this.emit('remote-added', { name, url });
    } catch (error) {
      this.emit('error', error);
    }
  }

  async push(remote?: string, branch?: string): Promise<void> {
    try {
      await this.git.push(remote, branch);
      this.emit('changes-pushed', { remote, branch });
    } catch (error) {
      this.emit('error', error);
    }
  }

  async pull(remote?: string, branch?: string): Promise<void> {
    try {
      await this.git.pull(remote, branch);
      this.emit('changes-pulled', { remote, branch });
    } catch (error) {
      this.emit('error', error);
    }
  }

  // Diff & Merge Tools
  async getDiff(filepath?: string): Promise<GitDiff[]> {
    try {
      const diff = await this.git.diff(['--unified=3', filepath].filter(Boolean));
      const parsedDiff = this.parseDiff(diff);
      this.emit('diff-generated', parsedDiff);
      return parsedDiff;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private parseDiff(diffOutput: string): GitDiff[] {
    // Basic diff parsing implementation
    const diffs: GitDiff[] = [];
    const diffLines = diffOutput.split('\n');
    let currentDiff: GitDiff | null = null;

    diffLines.forEach(line => {
      if (line.startsWith('diff --git')) {
        if (currentDiff) {
          diffs.push(currentDiff);
        }
        currentDiff = {
          file: line.split(' b/')[1],
          hunks: []
        };
      } else if (line.startsWith('@@ ')) {
        const match = line.match(/@@ -(\d+),?(\d+)? \+(\d+),?(\d+)? @@/);
        if (match && currentDiff) {
          currentDiff.hunks.push({
            oldStart: parseInt(match[1]),
            oldLines: parseInt(match[2] || '1'),
            newStart: parseInt(match[3]),
            newLines: parseInt(match[4] || '1'),
            content: line
          });
        }
      }
    });

    if (currentDiff) {
      diffs.push(currentDiff);
    }

    return diffs;
  }

  // GitHub/GitLab Integration
  async createPullRequest(title: string, body: string, base: string, head: string): Promise<void> {
    if (!this.octokit) {
      throw new Error('GitHub integration not configured');
    }

    try {
      const repoInfo = await this.getRepoInfo();
      await this.octokit.pulls.create({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        title,
        body,
        head,
        base
      });
      this.emit('pr-created', { title, head, base });
    } catch (error) {
      this.emit('error', error);
    }
  }

  private async getRepoInfo(): Promise<{ owner: string; repo: string }> {
    const remoteUrl = await this.git.remote(['get-url', 'origin']);
    const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (!match) {
      throw new Error('Unable to parse repository information');
    }
    return { owner: match[1], repo: match[2] };
  }

  // Event Handling
  onError(handler: (error: Error) => void): void {
    this.on('error', handler);
  }

  onStateChange(handler: (event: string, data: any) => void): void {
    const events = [
      'repo-initialized',
      'repo-cloned',
      'branch-created',
      'branch-switched',
      'branch-merged',
      'status-checked',
      'files-staged',
      'files-unstaged',
      'changes-committed',
      'history-fetched',
      'remote-added',
      'changes-pushed',
      'changes-pulled',
      'diff-generated',
      'pr-created'
    ];

    events.forEach(event => {
      this.on(event, (data) => handler(event, data));
    });
  }
}

export default GitService;
