import { Monaco } from '@monaco-editor/react';
import OpenAI from 'openai';
import * as ts from 'typescript';
import { EventEmitter } from 'events';

interface CodeSuggestion {
  text: string;
  kind: string;
  documentation?: string;
  insertText: string;
  range: {
    startLineNumber: number;
    endLineNumber: number;
    startColumn: number;
    endColumn: number;
  };
}

interface RefactoringOperation {
  type: 'rename' | 'extractFunction' | 'extractVariable' | 'moveDeclaration';
  target: string;
  newName?: string;
  scope?: {
    start: number;
    end: number;
  };
}

export class IntelligentCodeService extends EventEmitter {
  private monaco: Monaco;
  private openai: OpenAI;
  private typeChecker: ts.TypeChecker | null = null;
  private program: ts.Program | null = null;

  constructor(monaco: Monaco, openaiApiKey: string) {
    super();
    this.monaco = monaco;
    this.openai = new OpenAI({
      apiKey: openaiApiKey
    });
    this.initializeTypeScript();
    this.setupCompletionProviders();
  }

  private initializeTypeScript() {
    // Create a TypeScript program for static analysis
    const configPath = ts.findConfigFile(
      process.cwd(),
      ts.sys.fileExists,
      'tsconfig.json'
    );

    if (configPath) {
      const config = ts.readConfigFile(configPath, ts.sys.readFile);
      const parsedConfig = ts.parseJsonConfigFileContent(
        config.config,
        ts.sys,
        process.cwd()
      );

      this.program = ts.createProgram(
        parsedConfig.fileNames,
        parsedConfig.options
      );
      this.typeChecker = this.program.getTypeChecker();
    }
  }

  private setupCompletionProviders() {
    // Register intelligent code completion provider
    this.monaco.languages.registerCompletionItemProvider('typescript', {
      provideCompletionItems: async (model, position) => {
        const suggestions = await this.generateCompletionSuggestions(
          model,
          position
        );
        return {
          suggestions: suggestions.map(suggestion => ({
            ...suggestion,
            kind: this.monaco.languages.CompletionItemKind[
              suggestion.kind as keyof typeof this.monaco.languages.CompletionItemKind
            ],
          }))
        };
      }
    });
  }

  private async generateCompletionSuggestions(
    model: any,
    position: any
  ): Promise<CodeSuggestion[]> {
    const code = model.getValue();
    const lineContent = model.getLineContent(position.lineNumber);
    const wordUntilPosition = model.getWordUntilPosition(position);

    // Get context from surrounding code
    const contextLines = this.getContextLines(model, position.lineNumber, 5);
    
    try {
      // Use OpenAI to generate context-aware suggestions
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an intelligent code completion assistant. Provide relevant code suggestions based on the context."
          },
          {
            role: "user",
            content: `Given the following code context:\n${contextLines.join('\n')}\n\nProvide code completion suggestions for: ${wordUntilPosition.word}`
          }
        ],
        max_tokens: 150,
        temperature: 0.3,
      });

      // Parse and format the AI suggestions
      return this.parseAISuggestions(completion.choices[0].message.content || '', position);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      return this.getFallbackSuggestions(model, position);
    }
  }

  private getContextLines(model: any, lineNumber: number, context: number): string[] {
    const startLine = Math.max(1, lineNumber - context);
    const endLine = Math.min(model.getLineCount(), lineNumber + context);
    const lines = [];

    for (let i = startLine; i <= endLine; i++) {
      lines.push(model.getLineContent(i));
    }

    return lines;
  }

  private parseAISuggestions(aiResponse: string, position: any): CodeSuggestion[] {
    // Parse AI response and convert to CodeSuggestion format
    const suggestions: CodeSuggestion[] = [];
    const lines = aiResponse.split('\n');

    lines.forEach(line => {
      if (line.trim()) {
        suggestions.push({
          text: line,
          kind: 'Snippet',
          documentation: 'AI-generated suggestion',
          insertText: line,
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: position.column,
            endColumn: position.column
          }
        });
      }
    });

    return suggestions;
  }

  private getFallbackSuggestions(model: any, position: any): CodeSuggestion[] {
    // Provide basic fallback suggestions when AI is unavailable
    return [
      {
        text: 'console.log()',
        kind: 'Function',
        documentation: 'Log to console',
        insertText: 'console.log($1)',
        range: {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: position.column,
          endColumn: position.column
        }
      }
    ];
  }

  // Refactoring Operations
  async renameSymbol(
    filePath: string,
    position: { line: number; column: number },
    newName: string
  ): Promise<void> {
    if (!this.program || !this.typeChecker) {
      throw new Error('TypeScript program not initialized');
    }

    const sourceFile = this.program.getSourceFile(filePath);
    if (!sourceFile) return;

    const node = this.findNode(sourceFile, position);
    if (!node) return;

    const changes = ts.getRenameLocations(
      this.program,
      this.typeChecker,
      ts.createLanguageService({}),
      sourceFile,
      position,
      newName,
      {},
      false
    );

    this.applyChanges(changes);
  }

  async extractFunction(
    filePath: string,
    selection: { start: number; end: number },
    newFunctionName: string
  ): Promise<void> {
    if (!this.program || !this.typeChecker) {
      throw new Error('TypeScript program not initialized');
    }

    const sourceFile = this.program.getSourceFile(filePath);
    if (!sourceFile) return;

    // Analyze selected code
    const selectedNodes = this.getNodesInRange(sourceFile, selection);
    const extractedCode = this.generateExtractedFunction(
      selectedNodes,
      newFunctionName
    );

    // Apply the refactoring
    this.applyRefactoring({
      type: 'extractFunction',
      target: selectedNodes.map(n => n.getText()).join('\n'),
      newName: newFunctionName,
      scope: selection
    });
  }

  private findNode(sourceFile: ts.SourceFile, position: { line: number; column: number }): ts.Node | undefined {
    function find(node: ts.Node): ts.Node | undefined {
      if (nodeContainsPosition(node, position)) {
        return ts.forEachChild(node, find) || node;
      }
      return undefined;
    }

    return find(sourceFile);
  }

  private nodeContainsPosition(node: ts.Node, position: { line: number; column: number }): boolean {
    const { line, character } = ts.getLineAndCharacterOfPosition(
      node.getSourceFile(),
      node.getStart()
    );
    return line === position.line && character <= position.column;
  }

  private getNodesInRange(sourceFile: ts.SourceFile, range: { start: number; end: number }): ts.Node[] {
    const nodes: ts.Node[] = [];

    function visit(node: ts.Node) {
      if (node.getStart() >= range.start && node.getEnd() <= range.end) {
        nodes.push(node);
      }
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return nodes;
  }

  private generateExtractedFunction(nodes: ts.Node[], functionName: string): string {
    // Analyze dependencies and generate function signature
    const usedVariables = this.analyzeVariableUsage(nodes);
    const returnType = this.inferReturnType(nodes);

    // Generate function declaration
    return `function ${functionName}(${usedVariables.map(v => `${v.name}: ${v.type}`).join(', ')}): ${returnType} {
      ${nodes.map(n => n.getText()).join('\n')}
    }`;
  }

  private analyzeVariableUsage(nodes: ts.Node[]): Array<{ name: string; type: string }> {
    const variables: Array<{ name: string; type: string }> = [];
    
    nodes.forEach(node => {
      if (ts.isIdentifier(node) && this.typeChecker) {
        const symbol = this.typeChecker.getSymbolAtLocation(node);
        if (symbol) {
          const type = this.typeChecker.typeToString(
            this.typeChecker.getTypeOfSymbolAtLocation(symbol, node)
          );
          variables.push({ name: node.getText(), type });
        }
      }
    });

    return variables;
  }

  private inferReturnType(nodes: ts.Node[]): string {
    // Find return statements and infer type
    const returnStatements = nodes.filter(n => ts.isReturnStatement(n));
    if (returnStatements.length === 0) return 'void';

    if (this.typeChecker) {
      const returnTypes = returnStatements.map(ret => {
        const expression = (ret as ts.ReturnStatement).expression;
        if (expression) {
          return this.typeChecker!.typeToString(
            this.typeChecker!.getTypeAtLocation(expression)
          );
        }
        return 'void';
      });

      // Union all return types
      return returnTypes.join(' | ');
    }

    return 'any';
  }

  private applyChanges(changes: readonly ts.RenameLocation[] | undefined): void {
    if (!changes) return;

    // Apply rename changes
    changes.forEach(change => {
      this.emit('refactoring', {
        type: 'rename',
        location: change.textSpan,
        newText: change.prefixText || ''
      });
    });
  }

  private applyRefactoring(operation: RefactoringOperation): void {
    this.emit('refactoring', operation);
  }

  // Event handlers
  onRefactoring(handler: (operation: RefactoringOperation) => void): void {
    this.on('refactoring', handler);
  }
}

export default IntelligentCodeService;
