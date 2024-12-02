import { logInfo } from '@utils/logger';

interface A11yAnnouncement {
  message: string;
  priority?: 'polite' | 'assertive';
  timeout?: number;
}

class AccessibilityService {
  private static instance: AccessibilityService;
  private liveRegion: HTMLElement | null = null;
  private announcementQueue: A11yAnnouncement[] = [];
  private isProcessing = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initLiveRegion();
    }
  }

  static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService();
    }
    return AccessibilityService.instance;
  }

  private initLiveRegion(): void {
    if (!this.liveRegion) {
      this.liveRegion = document.createElement('div');
      this.liveRegion.setAttribute('aria-live', 'polite');
      this.liveRegion.setAttribute('aria-atomic', 'true');
      this.liveRegion.setAttribute('role', 'status');
      this.liveRegion.style.position = 'absolute';
      this.liveRegion.style.width = '1px';
      this.liveRegion.style.height = '1px';
      this.liveRegion.style.padding = '0';
      this.liveRegion.style.margin = '-1px';
      this.liveRegion.style.overflow = 'hidden';
      this.liveRegion.style.clip = 'rect(0, 0, 0, 0)';
      this.liveRegion.style.whiteSpace = 'nowrap';
      this.liveRegion.style.border = '0';
      
      document.body.appendChild(this.liveRegion);
    }
  }

  announce(announcement: A11yAnnouncement): void {
    this.announcementQueue.push(announcement);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (!this.liveRegion || this.announcementQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const announcement = this.announcementQueue.shift();

    if (announcement) {
      this.liveRegion.setAttribute('aria-live', announcement.priority || 'polite');
      this.liveRegion.textContent = announcement.message;

      await new Promise(resolve => 
        setTimeout(resolve, announcement.timeout || 1000)
      );

      this.liveRegion.textContent = '';
      this.processQueue();
    }
  }

  setFocus(element: HTMLElement): void {
    element.focus();
    logInfo('Focus set to element', { 
      elementId: element.id, 
      elementRole: element.getAttribute('role') 
    });
  }

  trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  }

  enhanceWithA11y(element: HTMLElement, options: {
    role?: string;
    label?: string;
    description?: string;
    keyboardShortcut?: string;
  }): void {
    if (options.role) {
      element.setAttribute('role', options.role);
    }
    
    if (options.label) {
      element.setAttribute('aria-label', options.label);
    }

    if (options.description) {
      element.setAttribute('aria-description', options.description);
    }

    if (options.keyboardShortcut) {
      element.setAttribute('aria-keyshortcuts', options.keyboardShortcut);
    }
  }
}

export const accessibilityService = AccessibilityService.getInstance();
