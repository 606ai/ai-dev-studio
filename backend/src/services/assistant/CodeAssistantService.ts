import { PrismaClient } from '@prisma/client';
import QueueService from '../queue';
import CacheService from '../cache';
import logger from '../../utils/logger';

export interface CodeAnalysis {
  quality: {
    score: number;
    issues: Array<{
      type: string;
      message: string;
      severity: 'high' | 'medium' | 'low';
      location: {
        file: string;
        line: number;
      };
    }>;
  };
  complexity: {
    cognitive: number;
    cyclomatic: number;
    maintainability: number;
  };
  performance: {
    suggestions: Array<{
      description: string;
      impact: 'high' | 'medium' | 'low';
      fix: string;
    }>;
  };
}

class CodeAssistantService {
  private static instance: CodeAssistantService;
  private prisma: PrismaClient;
  private queue: QueueService;
  private cache: CacheService;

  private constructor() {
    this.prisma = new PrismaClient();
    this.queue = QueueService.getInstance();
    this.cache = CacheService.getInstance();
  }

  public static getInstance(): CodeAssistantService {
    if (!CodeAssistantService.instance) {
      CodeAssistantService.instance = new CodeAssistantService();
    }
    return CodeAssistantService.instance;
  }

  public async analyzeCode(
    files: Array<{ path: string; content: string }>
  ): Promise<CodeAnalysis> {
    const cacheKey = `analysis:${this.hashFiles(files)}`;
    const cached = await this.cache.get<CodeAnalysis>(cacheKey);
    if (cached) return cached;

    const analysis = await new Promise<CodeAnalysis>((resolve, reject) => {
      this.queue.publishMessage(
        'code.analysis',
        { files },
        {
          correlationId: cacheKey,
          replyTo: 'code.analysis.results',
        }
      );

      // Set up temporary consumer for results
      this.queue.consumeMessages('code.analysis.results', async (msg) => {
        if (msg.correlationId === cacheKey) {
          resolve(msg.analysis);
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => reject(new Error('Analysis timeout')), 30000);
    });

    await this.cache.set(cacheKey, analysis, { ttl: 3600 });
    return analysis;
  }

  public async getSuggestions(
    code: string,
    context: {
      file: string;
      language: string;
      dependencies: Record<string, string>;
    }
  ): Promise<any[]> {
    const cacheKey = `suggestions:${this.hashCode(code)}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const suggestions = await new Promise<any[]>((resolve, reject) => {
      this.queue.publishMessage(
        'code.suggestions',
        { code, context },
        {
          correlationId: cacheKey,
          replyTo: 'code.suggestions.results',
        }
      );

      this.queue.consumeMessages('code.suggestions.results', async (msg) => {
        if (msg.correlationId === cacheKey) {
          resolve(msg.suggestions);
        }
      });

      setTimeout(() => reject(new Error('Suggestions timeout')), 10000);
    });

    await this.cache.set(cacheKey, suggestions, { ttl: 1800 });
    return suggestions;
  }

  public async optimizeCode(
    code: string,
    options: {
      target: 'performance' | 'readability' | 'memory';
      aggressive: boolean;
    }
  ): Promise<string> {
    const cacheKey = `optimization:${this.hashCode(code)}:${options.target}:${options.aggressive}`;
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) return cached;

    const optimized = await new Promise<string>((resolve, reject) => {
      this.queue.publishMessage(
        'code.optimization',
        { code, options },
        {
          correlationId: cacheKey,
          replyTo: 'code.optimization.results',
        }
      );

      this.queue.consumeMessages('code.optimization.results', async (msg) => {
        if (msg.correlationId === cacheKey) {
          resolve(msg.optimizedCode);
        }
      });

      setTimeout(() => reject(new Error('Optimization timeout')), 20000);
    });

    await this.cache.set(cacheKey, optimized, { ttl: 3600 });
    return optimized;
  }

  public async generateTests(
    code: string,
    options: {
      framework: string;
      coverage: 'full' | 'critical' | 'basic';
    }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.queue.publishMessage(
        'code.tests',
        { code, options },
        {
          replyTo: 'code.tests.results',
        }
      );

      this.queue.consumeMessages('code.tests.results', async (msg) => {
        resolve(msg.tests);
      });

      setTimeout(() => reject(new Error('Test generation timeout')), 30000);
    });
  }

  private hashCode(code: string): string {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private hashFiles(files: Array<{ path: string; content: string }>): string {
    return this.hashCode(
      files.map(f => `${f.path}:${f.content}`).join('|')
    );
  }
}

export default CodeAssistantService;
