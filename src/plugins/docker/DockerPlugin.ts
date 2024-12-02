import { Plugin, PluginMetadata, PluginContext } from '../PluginSystem';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  ports: string;
  created: string;
}

export interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  created: string;
  size: string;
}

export class DockerService {
  async listContainers(all: boolean = false): Promise<DockerContainer[]> {
    const { stdout } = await execAsync(`docker ps ${all ? '-a' : ''} --format "{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}|{{.CreatedAt}}"`);
    
    return stdout.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [id, name, image, status, ports, created] = line.split('|');
        return { id, name, image, status, ports, created };
      });
  }

  async listImages(): Promise<DockerImage[]> {
    const { stdout } = await execAsync('docker images --format "{{.ID}}|{{.Repository}}|{{.Tag}}|{{.CreatedAt}}|{{.Size}}"');
    
    return stdout.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [id, repository, tag, created, size] = line.split('|');
        return { id, repository, tag, created, size };
      });
  }

  async startContainer(containerId: string): Promise<void> {
    await execAsync(`docker start ${containerId}`);
  }

  async stopContainer(containerId: string): Promise<void> {
    await execAsync(`docker stop ${containerId}`);
  }

  async removeContainer(containerId: string, force: boolean = false): Promise<void> {
    await execAsync(`docker rm ${force ? '-f' : ''} ${containerId}`);
  }

  async pullImage(image: string): Promise<void> {
    await execAsync(`docker pull ${image}`);
  }

  async removeImage(imageId: string, force: boolean = false): Promise<void> {
    await execAsync(`docker rmi ${force ? '-f' : ''} ${imageId}`);
  }

  async getLogs(containerId: string, tail: number = 100): Promise<string> {
    const { stdout } = await execAsync(`docker logs --tail ${tail} ${containerId}`);
    return stdout;
  }

  async buildImage(dockerfile: string, tag: string): Promise<void> {
    await execAsync(`docker build -f ${dockerfile} -t ${tag} .`);
  }

  async getStats(containerId: string): Promise<string> {
    const { stdout } = await execAsync(`docker stats ${containerId} --no-stream --format "{{.Container}}|{{.CPUPerc}}|{{.MemUsage}}|{{.NetIO}}|{{.BlockIO}}"`);
    return stdout;
  }

  async inspectContainer(containerId: string): Promise<any> {
    const { stdout } = await execAsync(`docker inspect ${containerId}`);
    return JSON.parse(stdout)[0];
  }

  async execInContainer(containerId: string, command: string): Promise<string> {
    const { stdout } = await execAsync(`docker exec ${containerId} ${command}`);
    return stdout;
  }
}

export class DockerPlugin implements Plugin {
  metadata: PluginMetadata = {
    id: 'docker-integration',
    name: 'Docker Integration',
    version: '1.0.0',
    description: 'Provides Docker integration features',
    author: 'AI Dev Studio'
  };

  private context!: PluginContext;
  private dockerService!: DockerService;
  private refreshInterval: NodeJS.Timeout | null = null;

  async activate(context: PluginContext): Promise<void> {
    this.context = context;
    this.dockerService = new DockerService();

    // Register the Docker service
    context.services['docker'] = this.dockerService;

    // Register commands
    this.registerCommands();

    // Register views
    this.registerViews();

    // Start container watcher
    this.startContainerWatcher();
  }

  private registerCommands(): void {
    const commands = {
      'docker.listContainers': async () => {
        const containers = await this.dockerService.listContainers(true);
        this.context.events.emit('docker:containersUpdated', containers);
      },
      'docker.listImages': async () => {
        const images = await this.dockerService.listImages();
        this.context.events.emit('docker:imagesUpdated', images);
      },
      'docker.startContainer': async (containerId: string) => {
        await this.dockerService.startContainer(containerId);
        this.context.events.emit('docker:containerStateChanged', containerId);
      },
      'docker.stopContainer': async (containerId: string) => {
        await this.dockerService.stopContainer(containerId);
        this.context.events.emit('docker:containerStateChanged', containerId);
      },
      'docker.removeContainer': async (containerId: string) => {
        await this.dockerService.removeContainer(containerId);
        this.context.events.emit('docker:containerRemoved', containerId);
      },
      'docker.pullImage': async (image: string) => {
        await this.dockerService.pullImage(image);
        this.context.events.emit('docker:imagesPulled');
      },
      'docker.buildImage': async (options: { dockerfile: string; tag: string }) => {
        await this.dockerService.buildImage(options.dockerfile, options.tag);
        this.context.events.emit('docker:imageBuilt');
      },
      'docker.showLogs': async (containerId: string) => {
        const logs = await this.dockerService.getLogs(containerId);
        this.context.events.emit('panel:show', {
          id: `docker-logs-${containerId}`,
          title: `Logs: ${containerId}`,
          content: {
            type: 'terminal',
            data: logs
          }
        });
      }
    };

    Object.entries(commands).forEach(([id, handler]) => {
      this.context.events.emit('commands:register', { id, handler });
    });
  }

  private registerViews(): void {
    // Register Docker explorer view
    this.context.events.emit('views:register', {
      id: 'docker-explorer',
      title: 'Docker',
      component: 'DockerExplorer',
      icon: 'docker',
      position: 'left'
    });

    // Register container logs view
    this.context.events.emit('views:register', {
      id: 'docker-logs',
      title: 'Docker Logs',
      component: 'DockerLogs',
      icon: 'output'
    });

    // Register container stats view
    this.context.events.emit('views:register', {
      id: 'docker-stats',
      title: 'Docker Stats',
      component: 'DockerStats',
      icon: 'graph'
    });
  }

  private startContainerWatcher(): void {
    this.refreshInterval = setInterval(async () => {
      try {
        const containers = await this.dockerService.listContainers(true);
        this.context.events.emit('docker:containersUpdated', containers);
      } catch (error) {
        console.error('Error watching Docker containers:', error);
      }
    }, 5000);
  }

  async deactivate(): Promise<void> {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}

export default DockerPlugin;
