import { useEffect, useCallback } from 'react';
import { performanceMonitor } from '@services/performance';

export const usePerformance = (componentName: string) => {
  useEffect(() => {
    performanceMonitor.startMark(`${componentName}_mount`);
    return () => {
      performanceMonitor.endMark(`${componentName}_mount`, { type: 'component_lifecycle' });
    };
  }, [componentName]);

  const measureOperation = useCallback((
    operationName: string,
    operation: () => Promise<any> | void,
    metadata?: Record<string, any>
  ) => {
    const markName = `${componentName}_${operationName}`;
    performanceMonitor.startMark(markName);

    const execute = async () => {
      try {
        const result = await operation();
        performanceMonitor.endMark(markName, { ...metadata, success: true });
        return result;
      } catch (error) {
        performanceMonitor.endMark(markName, { ...metadata, success: false, error });
        throw error;
      }
    };

    return execute();
  }, [componentName]);

  return {
    measureOperation,
  };
};
