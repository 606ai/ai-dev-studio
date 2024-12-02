import axios from 'axios';

export interface CodeSuggestion {
  code: string;
  explanation: string;
  confidence: number;
  type: 'completion' | 'refactor' | 'fix' | 'optimize' | 'documentation';
}

export interface AIModelConfig {
  model: string;
  baseUrl: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CodeContext {
  code: string;
  language: string;
  cursor?: {
    line: number;
    column: number;
  };
  filePath?: string;
  projectContext?: string;
}

export class AICodeAssistService {
  private config: AIModelConfig;

  constructor(config: AIModelConfig) {
    this.config = {
      temperature: 0.7,
      maxTokens: 1000,
      ...config
    };
  }

  private async callOllama(prompt: string): Promise<string> {
    try {
      const response = await axios.post(`${this.config.baseUrl}/api/generate`, {
        model: this.config.model,
        prompt,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: false
      });

      return response.data.response;
    } catch (error) {
      console.error('Error calling Ollama:', error);
      throw new Error('Failed to get AI response');
    }
  }

  private createPrompt(context: CodeContext, task: string): string {
    return `
Language: ${context.language}
Task: ${task}

Code Context:
\`\`\`${context.language}
${context.code}
\`\`\`

${context.projectContext ? `Project Context: ${context.projectContext}\n` : ''}
${context.cursor ? `Cursor Position: Line ${context.cursor.line}, Column ${context.cursor.column}\n` : ''}

Please provide:
1. The suggested code changes
2. A brief explanation of the changes
3. Any potential considerations or warnings
`;
  }

  public async getCodeCompletion(context: CodeContext): Promise<CodeSuggestion> {
    const prompt = this.createPrompt(context, 'Provide code completion suggestions for the current cursor position.');
    const response = await this.callOllama(prompt);

    return this.parseResponse(response, 'completion');
  }

  public async getRefactoringSuggestions(context: CodeContext): Promise<CodeSuggestion> {
    const prompt = this.createPrompt(context, 'Suggest refactoring improvements for better code organization, readability, and maintainability.');
    const response = await this.callOllama(prompt);

    return this.parseResponse(response, 'refactor');
  }

  public async getErrorFixes(context: CodeContext, error: string): Promise<CodeSuggestion> {
    const prompt = this.createPrompt(context, `Fix the following error: ${error}`);
    const response = await this.callOllama(prompt);

    return this.parseResponse(response, 'fix');
  }

  public async getOptimizationSuggestions(context: CodeContext): Promise<CodeSuggestion> {
    const prompt = this.createPrompt(context, 'Suggest optimizations for better performance and efficiency.');
    const response = await this.callOllama(prompt);

    return this.parseResponse(response, 'optimize');
  }

  public async generateDocumentation(context: CodeContext): Promise<CodeSuggestion> {
    const prompt = this.createPrompt(context, 'Generate comprehensive documentation including function descriptions, parameters, return values, and usage examples.');
    const response = await this.callOllama(prompt);

    return this.parseResponse(response, 'documentation');
  }

  private parseResponse(response: string, type: CodeSuggestion['type']): CodeSuggestion {
    // Basic response parsing - can be enhanced based on actual Ollama response format
    const sections = response.split('\n\n');
    let code = '';
    let explanation = '';
    
    for (const section of sections) {
      if (section.includes('```')) {
        code = section.replace(/```[\w-]*\n|```/g, '').trim();
      } else if (!section.toLowerCase().includes('consideration') && 
                 !section.toLowerCase().includes('warning')) {
        explanation += section.trim() + '\n';
      }
    }

    return {
      code,
      explanation: explanation.trim(),
      confidence: 0.8, // This could be calculated based on model output
      type
    };
  }

  public async analyzeDependencies(context: CodeContext): Promise<string[]> {
    const prompt = this.createPrompt(context, 'Analyze the code and suggest required dependencies or imports.');
    const response = await this.callOllama(prompt);
    
    // Parse response to extract dependency suggestions
    return response
      .split('\n')
      .filter(line => line.includes('import') || line.includes('require'))
      .map(line => line.trim());
  }

  public async suggestTests(context: CodeContext): Promise<string> {
    const prompt = this.createPrompt(context, 'Generate unit tests for this code, including edge cases and error scenarios.');
    return this.callOllama(prompt);
  }

  public async explainCode(context: CodeContext): Promise<string> {
    const prompt = this.createPrompt(context, 'Explain this code in detail, including its purpose, functionality, and any potential issues.');
    return this.callOllama(prompt);
  }

  public async reviewCode(context: CodeContext): Promise<{
    issues: string[];
    suggestions: string[];
    securityConcerns: string[];
  }> {
    const prompt = this.createPrompt(context, 'Perform a comprehensive code review, including potential issues, improvement suggestions, and security concerns.');
    const response = await this.callOllama(prompt);

    // Parse response into categories
    const sections = response.split('\n\n');
    const result = {
      issues: [] as string[],
      suggestions: [] as string[],
      securityConcerns: [] as string[]
    };

    let currentSection: 'issues' | 'suggestions' | 'securityConcerns' = 'issues';

    for (const section of sections) {
      if (section.toLowerCase().includes('issue')) {
        currentSection = 'issues';
      } else if (section.toLowerCase().includes('suggestion')) {
        currentSection = 'suggestions';
      } else if (section.toLowerCase().includes('security')) {
        currentSection = 'securityConcerns';
      } else {
        result[currentSection].push(section.trim());
      }
    }

    return result;
  }

  public async getTypeDefinitions(context: CodeContext): Promise<string> {
    const prompt = this.createPrompt(context, 'Generate TypeScript type definitions or interfaces for this code.');
    return this.callOllama(prompt);
  }

  public async suggestPerformanceImprovements(context: CodeContext): Promise<{
    suggestions: string[];
    impact: ('high' | 'medium' | 'low')[];
    complexity: ('easy' | 'medium' | 'hard')[];
  }> {
    const prompt = this.createPrompt(context, 'Analyze code performance and suggest improvements, including their impact and implementation complexity.');
    const response = await this.callOllama(prompt);

    // Parse response to extract structured performance suggestions
    const suggestions: string[] = [];
    const impact: ('high' | 'medium' | 'low')[] = [];
    const complexity: ('easy' | 'medium' | 'hard')[] = [];

    response.split('\n').forEach(line => {
      if (line.includes('-')) {
        const suggestion = line.split('-')[1].trim();
        suggestions.push(suggestion);
        
        // Extract impact and complexity from the suggestion text
        if (line.toLowerCase().includes('high')) impact.push('high');
        else if (line.toLowerCase().includes('medium')) impact.push('medium');
        else impact.push('low');

        if (line.toLowerCase().includes('easy')) complexity.push('easy');
        else if (line.toLowerCase().includes('hard')) complexity.push('hard');
        else complexity.push('medium');
      }
    });

    return { suggestions, impact, complexity };
  }
}

export default AICodeAssistService;
