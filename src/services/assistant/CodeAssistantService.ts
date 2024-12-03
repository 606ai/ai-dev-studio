import { EventEmitter } from 'events';
import ApiGateway from '../gateway/ApiGateway';

export interface CodeSuggestion {
  id: string;
  type: 'completion' | 'optimization' | 'bug' | 'pattern';
  code: string;
  explanation: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  context: {
    file: string;
    startLine: number;
    endLine: number;
  };
}

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
  security: {
    vulnerabilities: Array<{
      type: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      description: string;
      fix: string;
    }>;
  };
}

class CodeAssistantService extends EventEmitter {
  private static instance: CodeAssistantService;
  private api: ApiGateway;
  private suggestions: Map<string, CodeSuggestion>;

  private constructor() {
    super();
    this.api = ApiGateway.getInstance();
    this.suggestions = new Map();
  }

  public static getInstance(): CodeAssistantService {
    if (!CodeAssistantService.instance) {
      CodeAssistantService.instance = new CodeAssistantService();
    }
    return CodeAssistantService.instance;
  }

  public async getSuggestions(
    code: string,
    context: {
      file: string;
      language: string;
      dependencies: Record<string, string>;
    }
  ): Promise<CodeSuggestion[]> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.getCodeSuggestions(code, context);
      const suggestions = response.data;
      suggestions.forEach((suggestion: CodeSuggestion) =>
        this.suggestions.set(suggestion.id, suggestion)
      );
      return suggestions;
    });
  }

  public async analyzeCode(
    files: Array<{ path: string; content: string }>
  ): Promise<CodeAnalysis> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.analyzeCode(files);
      return response.data;
    });
  }

  public async applySuggestion(
    suggestionId: string,
    file: string
  ): Promise<string> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.client.post(
        `/assistant/apply/${suggestionId}`,
        { file }
      );
      return response.data.code;
    });
  }

  public async optimizeCode(
    code: string,
    options: {
      target: 'performance' | 'readability' | 'memory';
      aggressive: boolean;
    }
  ): Promise<string> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.client.post('/assistant/optimize', {
        code,
        options,
      });
      return response.data.optimizedCode;
    });
  }

  public async fixBugs(code: string): Promise<{
    fixes: Array<{
      description: string;
      code: string;
    }>;
  }> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.client.post('/assistant/fix-bugs', {
        code,
      });
      return response.data;
    });
  }

  public async generateTests(
    code: string,
    options: {
      framework: string;
      coverage: 'full' | 'critical' | 'basic';
    }
  ): Promise<string> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.client.post('/assistant/generate-tests', {
        code,
        options,
      });
      return response.data.tests;
    });
  }

  public async generateDocumentation(
    code: string,
    format: 'markdown' | 'jsdoc' | 'docstring'
  ): Promise<string> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.client.post(
        '/assistant/generate-documentation',
        {
          code,
          format,
        }
      );
      return response.data.documentation;
    });
  }

  public async refactorCode(
    code: string,
    options: {
      pattern: string;
      style: 'functional' | 'oop' | 'modular';
    }
  ): Promise<string> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.client.post('/assistant/refactor', {
        code,
        options,
      });
      return response.data.refactoredCode;
    });
  }

  public dispose() {
    this.removeAllListeners();
  }
}

export default CodeAssistantService;
