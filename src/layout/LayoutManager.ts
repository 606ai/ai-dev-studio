import { EventEmitter } from 'events';

export interface LayoutPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PanelConfig {
  id: string;
  title: string;
  component: string;
  position: LayoutPosition;
  isVisible: boolean;
  isFloating: boolean;
  zIndex?: number;
  props?: Record<string, any>;
}

export interface LayoutConfig {
  id: string;
  name: string;
  description: string;
  panels: PanelConfig[];
}

export class LayoutManager {
  private layouts: Map<string, LayoutConfig> = new Map();
  private activeLayoutId: string | null = null;
  private events: EventEmitter = new EventEmitter();

  constructor() {
    this.registerDefaultLayout();
  }

  private registerDefaultLayout(): void {
    const defaultLayout: LayoutConfig = {
      id: 'default',
      name: 'Default Layout',
      description: 'Default IDE layout with standard panels',
      panels: [
        {
          id: 'explorer',
          title: 'Explorer',
          component: 'FileExplorer',
          position: { x: 0, y: 0, width: 240, height: 1000 },
          isVisible: true,
          isFloating: false,
        },
        {
          id: 'editor',
          title: 'Editor',
          component: 'CodeEditor',
          position: { x: 240, y: 0, width: 800, height: 700 },
          isVisible: true,
          isFloating: false,
        },
        {
          id: 'terminal',
          title: 'Terminal',
          component: 'Terminal',
          position: { x: 240, y: 700, width: 800, height: 300 },
          isVisible: true,
          isFloating: false,
        },
        {
          id: 'ai-assistant',
          title: 'AI Assistant',
          component: 'AICodeAssistant',
          position: { x: 1040, y: 0, width: 300, height: 1000 },
          isVisible: true,
          isFloating: false,
        },
      ],
    };

    this.registerLayout(defaultLayout);
    this.activeLayoutId = defaultLayout.id;
  }

  public registerLayout(layout: LayoutConfig): void {
    this.layouts.set(layout.id, layout);
    this.events.emit('layoutRegistered', layout);
  }

  public getLayout(layoutId: string): LayoutConfig {
    const layout = this.layouts.get(layoutId);
    if (!layout) {
      throw new Error(`Layout ${layoutId} not found`);
    }
    return layout;
  }

  public getActiveLayout(): LayoutConfig {
    if (!this.activeLayoutId || !this.layouts.has(this.activeLayoutId)) {
      this.activeLayoutId = 'default';
    }
    return this.getLayout(this.activeLayoutId);
  }

  public setActiveLayout(layoutId: string): void {
    if (!this.layouts.has(layoutId)) {
      throw new Error(`Layout ${layoutId} not found`);
    }
    this.activeLayoutId = layoutId;
    this.events.emit('layoutChanged', this.getLayout(layoutId));
  }

  public updatePanelPosition(layoutId: string, panelId: string, position: Partial<LayoutPosition>): void {
    const layout = this.getLayout(layoutId);
    const panel = layout.panels.find(p => p.id === panelId);
    if (!panel) {
      throw new Error(`Panel ${panelId} not found in layout ${layoutId}`);
    }

    panel.position = {
      ...panel.position,
      ...position,
    };

    this.events.emit('panelPositionChanged', { layoutId, panelId, position: panel.position });
  }

  public updatePanelVisibility(layoutId: string, panelId: string, isVisible: boolean): void {
    const layout = this.getLayout(layoutId);
    const panel = layout.panels.find(p => p.id === panelId);
    if (!panel) {
      throw new Error(`Panel ${panelId} not found in layout ${layoutId}`);
    }

    panel.isVisible = isVisible;
    this.events.emit('panelVisibilityChanged', { layoutId, panelId, isVisible });
  }

  public togglePanelFloating(layoutId: string, panelId: string): void {
    const layout = this.getLayout(layoutId);
    const panel = layout.panels.find(p => p.id === panelId);
    if (!panel) {
      throw new Error(`Panel ${panelId} not found in layout ${layoutId}`);
    }

    panel.isFloating = !panel.isFloating;
    if (panel.isFloating) {
      panel.zIndex = Math.max(...layout.panels.map(p => p.zIndex || 0)) + 1;
    } else {
      delete panel.zIndex;
    }

    this.events.emit('panelFloatingChanged', { layoutId, panelId, isFloating: panel.isFloating });
  }

  public createCustomLayout(layout: LayoutConfig): void {
    if (this.layouts.has(layout.id)) {
      throw new Error(`Layout ${layout.id} already exists`);
    }
    this.registerLayout(layout);
  }

  public deleteLayout(layoutId: string): void {
    if (layoutId === 'default') {
      throw new Error('Cannot delete default layout');
    }
    if (!this.layouts.has(layoutId)) {
      throw new Error(`Layout ${layoutId} not found`);
    }
    if (this.activeLayoutId === layoutId) {
      this.activeLayoutId = 'default';
    }
    this.layouts.delete(layoutId);
    this.events.emit('layoutDeleted', layoutId);
  }

  public getAvailableLayouts(): LayoutConfig[] {
    return Array.from(this.layouts.values());
  }

  public on(event: string, handler: (...args: any[]) => void): void {
    this.events.on(event, handler);
  }

  public off(event: string, handler: (...args: any[]) => void): void {
    this.events.off(event, handler);
  }
}

export default LayoutManager;
