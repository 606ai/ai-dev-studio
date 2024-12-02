import { EventEmitter } from 'events';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface Environment {
  id: string;
  name: string;
  type: 'conda' | 'virtualenv' | 'poetry' | 'pipenv';
  path: string;
  pythonPath: string;
  packages: Package[];
  isActive: boolean;
  python_version: string;
  created_at: Date;
  last_used: Date;
}

export interface Package {
  name: string;
  version: string;
  installed_version?: string;
  latest_version?: string;
  dependencies?: string[];
  description?: string;
}

export interface EnvironmentCreateOptions {
  name: string;
  type: 'conda' | 'virtualenv' | 'poetry' | 'pipenv';
  python_version: string;
  packages?: string[];
}

export class EnvironmentService extends EventEmitter {
  private environments: Map<string, Environment> = new Map();
  private activeEnvironment: Environment | null = null;

  constructor() {
    super();
  }

  public async listEnvironments(): Promise<Environment[]> {
    const environments: Environment[] = [];
    
    try {
      // List Conda environments
      const condaResult = await this.runCommand('conda', ['env', 'list', '--json']);
      const condaEnvs = JSON.parse(condaResult);
      for (const env of condaEnvs.envs) {
        const envName = path.basename(env);
        const pythonPath = path.join(env, 'python.exe');
        const packages = await this.listPackages('conda', env);
        
        environments.push({
          id: uuidv4(),
          name: envName,
          type: 'conda',
          path: env,
          pythonPath,
          packages,
          isActive: false,
          python_version: await this.getPythonVersion(pythonPath),
          created_at: new Date(),
          last_used: new Date()
        });
      }

      // List virtualenv environments
      const venvPath = path.join(process.env.USERPROFILE || '', 'venvs');
      const venvResult = await this.runCommand('dir', ['/b', venvPath]);
      const venvs = venvResult.split('\n').filter(Boolean);
      
      for (const venv of venvs) {
        const envPath = path.join(venvPath, venv);
        const pythonPath = path.join(envPath, 'Scripts', 'python.exe');
        const packages = await this.listPackages('virtualenv', envPath);

        environments.push({
          id: uuidv4(),
          name: venv,
          type: 'virtualenv',
          path: envPath,
          pythonPath,
          packages,
          isActive: false,
          python_version: await this.getPythonVersion(pythonPath),
          created_at: new Date(),
          last_used: new Date()
        });
      }
    } catch (error) {
      console.error('Error listing environments:', error);
    }

    return environments;
  }

  public async createEnvironment(options: EnvironmentCreateOptions): Promise<Environment> {
    const { name, type, python_version, packages = [] } = options;

    try {
      let envPath: string;
      let pythonPath: string;

      switch (type) {
        case 'conda':
          await this.runCommand('conda', ['create', '-n', name, `python=${python_version}`, '-y']);
          envPath = path.join(process.env.USERPROFILE || '', 'anaconda3', 'envs', name);
          pythonPath = path.join(envPath, 'python.exe');
          break;

        case 'virtualenv':
          const venvPath = path.join(process.env.USERPROFILE || '', 'venvs', name);
          await this.runCommand('python', ['-m', 'virtualenv', venvPath, `--python=${python_version}`]);
          envPath = venvPath;
          pythonPath = path.join(envPath, 'Scripts', 'python.exe');
          break;

        case 'poetry':
          await this.runCommand('poetry', ['new', name]);
          await this.runCommand('poetry', ['env', 'use', python_version]);
          envPath = path.join(process.cwd(), name);
          pythonPath = await this.getPoetryPythonPath(name);
          break;

        case 'pipenv':
          process.env.PIPENV_VENV_IN_PROJECT = '1';
          await this.runCommand('pipenv', ['--python', python_version]);
          envPath = path.join(process.cwd(), '.venv');
          pythonPath = path.join(envPath, 'Scripts', 'python.exe');
          break;

        default:
          throw new Error(`Unsupported environment type: ${type}`);
      }

      // Install packages if specified
      if (packages.length > 0) {
        await this.installPackages(type, envPath, packages);
      }

      const environment: Environment = {
        id: uuidv4(),
        name,
        type,
        path: envPath,
        pythonPath,
        packages: await this.listPackages(type, envPath),
        isActive: false,
        python_version,
        created_at: new Date(),
        last_used: new Date()
      };

      this.environments.set(environment.id, environment);
      this.emit('environmentCreated', environment);

      return environment;
    } catch (error) {
      console.error('Error creating environment:', error);
      throw error;
    }
  }

  public async activateEnvironment(envId: string): Promise<void> {
    const environment = this.environments.get(envId);
    if (!environment) {
      throw new Error(`Environment not found: ${envId}`);
    }

    try {
      switch (environment.type) {
        case 'conda':
          await this.runCommand('conda', ['activate', environment.name]);
          break;

        case 'virtualenv':
          // For virtualenv, we'll update the PATH environment variable
          process.env.PATH = `${path.join(environment.path, 'Scripts')};${process.env.PATH}`;
          process.env.VIRTUAL_ENV = environment.path;
          break;

        case 'poetry':
          await this.runCommand('poetry', ['shell']);
          break;

        case 'pipenv':
          await this.runCommand('pipenv', ['shell']);
          break;
      }

      if (this.activeEnvironment) {
        this.activeEnvironment.isActive = false;
      }

      environment.isActive = true;
      environment.last_used = new Date();
      this.activeEnvironment = environment;

      this.emit('environmentActivated', environment);
    } catch (error) {
      console.error('Error activating environment:', error);
      throw error;
    }
  }

  public async installPackages(type: string, envPath: string, packages: string[]): Promise<void> {
    try {
      switch (type) {
        case 'conda':
          await this.runCommand('conda', ['install', '-y', ...packages]);
          break;

        case 'virtualenv':
          await this.runCommand(path.join(envPath, 'Scripts', 'pip'), ['install', ...packages]);
          break;

        case 'poetry':
          await this.runCommand('poetry', ['add', ...packages]);
          break;

        case 'pipenv':
          await this.runCommand('pipenv', ['install', ...packages]);
          break;
      }

      this.emit('packagesInstalled', { type, packages });
    } catch (error) {
      console.error('Error installing packages:', error);
      throw error;
    }
  }

  public async uninstallPackages(type: string, envPath: string, packages: string[]): Promise<void> {
    try {
      switch (type) {
        case 'conda':
          await this.runCommand('conda', ['remove', '-y', ...packages]);
          break;

        case 'virtualenv':
          await this.runCommand(path.join(envPath, 'Scripts', 'pip'), ['uninstall', '-y', ...packages]);
          break;

        case 'poetry':
          await this.runCommand('poetry', ['remove', ...packages]);
          break;

        case 'pipenv':
          await this.runCommand('pipenv', ['uninstall', ...packages]);
          break;
      }

      this.emit('packagesUninstalled', { type, packages });
    } catch (error) {
      console.error('Error uninstalling packages:', error);
      throw error;
    }
  }

  public async updatePackages(type: string, envPath: string, packages: string[]): Promise<void> {
    try {
      switch (type) {
        case 'conda':
          await this.runCommand('conda', ['update', '-y', ...packages]);
          break;

        case 'virtualenv':
          await this.runCommand(path.join(envPath, 'Scripts', 'pip'), ['install', '--upgrade', ...packages]);
          break;

        case 'poetry':
          await this.runCommand('poetry', ['update', ...packages]);
          break;

        case 'pipenv':
          await this.runCommand('pipenv', ['update', ...packages]);
          break;
      }

      this.emit('packagesUpdated', { type, packages });
    } catch (error) {
      console.error('Error updating packages:', error);
      throw error;
    }
  }

  private async runCommand(command: string, args: string[]): Promise<string> {
    // Implementation using child_process.exec or similar
    // This is a placeholder - actual implementation would use the run_command tool
    return '';
  }

  private async listPackages(type: string, envPath: string): Promise<Package[]> {
    try {
      let result: string;
      switch (type) {
        case 'conda':
          result = await this.runCommand('conda', ['list', '--json']);
          return JSON.parse(result);

        case 'virtualenv':
          result = await this.runCommand(path.join(envPath, 'Scripts', 'pip'), ['list', '--format=json']);
          return JSON.parse(result);

        case 'poetry':
          result = await this.runCommand('poetry', ['show', '--tree']);
          // Parse poetry output format
          return this.parsePoetryPackages(result);

        case 'pipenv':
          result = await this.runCommand('pipenv', ['graph', '--json']);
          return JSON.parse(result);

        default:
          return [];
      }
    } catch (error) {
      console.error('Error listing packages:', error);
      return [];
    }
  }

  private async getPythonVersion(pythonPath: string): Promise<string> {
    try {
      const result = await this.runCommand(pythonPath, ['--version']);
      return result.trim().split(' ')[1];
    } catch (error) {
      console.error('Error getting Python version:', error);
      return '';
    }
  }

  private async getPoetryPythonPath(projectName: string): Promise<string> {
    try {
      const result = await this.runCommand('poetry', ['env', 'info', '--path']);
      return path.join(result.trim(), 'Scripts', 'python.exe');
    } catch (error) {
      console.error('Error getting Poetry Python path:', error);
      return '';
    }
  }

  private parsePoetryPackages(output: string): Package[] {
    // Implementation to parse Poetry's tree output format
    return [];
  }

  public getActiveEnvironment(): Environment | null {
    return this.activeEnvironment;
  }

  public async exportEnvironment(envId: string, format: 'requirements.txt' | 'environment.yml'): Promise<string> {
    const environment = this.environments.get(envId);
    if (!environment) {
      throw new Error(`Environment not found: ${envId}`);
    }

    try {
      switch (format) {
        case 'requirements.txt':
          const reqsPath = path.join(environment.path, 'requirements.txt');
          await this.runCommand(path.join(environment.path, 'Scripts', 'pip'), ['freeze', '>', reqsPath]);
          return reqsPath;

        case 'environment.yml':
          const ymlPath = path.join(environment.path, 'environment.yml');
          await this.runCommand('conda', ['env', 'export', '-n', environment.name, '-f', ymlPath]);
          return ymlPath;

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Error exporting environment:', error);
      throw error;
    }
  }
}

export default EnvironmentService;
