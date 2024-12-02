import { logInfo } from '@utils/logger';

interface PerformanceMetric {
  name: string;
  startTime: number;
  duration: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private marks: Map<string, number> = new Map();
  private readonly MAX_METRICS = 1000;

  private constructor() {
    // Initialize performance observer
    if (typeof window !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.addMetric({
            name: entry.name,
            startTime: entry.startTime,
            duration: entry.duration,
          });
        });
      });

      observer.observe({ entryTypes: ['measure', 'resource'] });
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMark(name: string): void {
    this.marks.set(name, performance.now());
    performance.mark(name + '_start');
  }

  endMark(name: string, metadata?: Record<string, any>): void {
    const startTime = this.marks.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.marks.delete(name);
      performance.mark(name + '_end');
      performance.measure(name, name + '_start', name + '_end');
      
      this.addMetric({
        name,
        startTime,
        duration,
        metadata,
      });
    }
  }

  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }
    
    // Log significant performance issues
    if (metric.duration > 1000) { // 1 second threshold
      logInfo('Performance Warning', {
        metric: metric.name,
        duration: metric.duration,
        metadata: metric.metadata,
      });
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
    this.marks.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }

  measureResourceTiming(): void {
    if (typeof window !== 'undefined') {
      const resources = performance.getEntriesByType('resource');
      resources.forEach((resource) => {
        this.addMetric({
          name: `Resource: ${resource.name}`,
          startTime: resource.startTime,
          duration: resource.duration,
          metadata: {
            initiatorType: resource.initiatorType,
            size: (resource as any).transferSize,
          },
        });
      });
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
