import { useCallback, useEffect, useRef } from 'react';
import { accessibilityService } from '@services/accessibility';

export const useA11y = () => {
  const containerRef = useRef<HTMLElement | null>(null);

  const announce = useCallback((
    message: string,
    options?: { priority?: 'polite' | 'assertive'; timeout?: number }
  ) => {
    accessibilityService.announce({
      message,
      ...options,
    });
  }, []);

  const setFocus = useCallback((element: HTMLElement) => {
    accessibilityService.setFocus(element);
  }, []);

  const enhanceElement = useCallback((
    element: HTMLElement,
    options: {
      role?: string;
      label?: string;
      description?: string;
      keyboardShortcut?: string;
    }
  ) => {
    accessibilityService.enhanceWithA11y(element, options);
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (containerRef.current) {
      cleanup = accessibilityService.trapFocus(containerRef.current);
    }

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  return {
    announce,
    setFocus,
    enhanceElement,
    containerRef,
  };
};
