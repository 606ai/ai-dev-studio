import { languages, sdkIntegrations } from '../config/languageSupport';
import { Monaco } from '@monaco-editor/react';

export interface CompletionItem {
  label: string;
  kind: number;
  detail?: string;
  documentation?: string;
  insertText: string;
}

export class LanguageService {
  private monaco: Monaco;
  private completionProviders: Map<string, any>;

  constructor(monaco: Monaco) {
    this.monaco = monaco;
    this.completionProviders = new Map();
    this.initializeLanguageSupport();
  }

  private initializeLanguageSupport() {
    languages.forEach(lang => {
      // Register language-specific providers
      this.registerCompletionProvider(lang.id);
      this.registerDiagnosticsProvider(lang.id);
      this.registerHoverProvider(lang.id);
      this.registerFormattingProvider(lang.id);
    });
  }

  private registerCompletionProvider(languageId: string) {
    const provider = this.monaco.languages.registerCompletionItemProvider(languageId, {
      provideCompletionItems: (model, position) => {
        const suggestions = this.getLanguageSpecificCompletions(languageId);
        return { suggestions };
      }
    });
    this.completionProviders.set(languageId, provider);
  }

  private registerDiagnosticsProvider(languageId: string) {
    // Set up diagnostics (error checking, linting)
    const diagnosticsProvider = this.monaco.languages.registerDiagnosticsProvider(languageId, {
      provideDiagnostics: async (model) => {
        return this.getLintingDiagnostics(languageId, model);
      }
    });
  }

  private registerHoverProvider(languageId: string) {
    this.monaco.languages.registerHoverProvider(languageId, {
      provideHover: (model, position) => {
        return this.getHoverInformation(languageId, model, position);
      }
    });
  }

  private registerFormattingProvider(languageId: string) {
    this.monaco.languages.registerDocumentFormattingEditProvider(languageId, {
      provideDocumentFormattingEdits: (model) => {
        return this.formatDocument(languageId, model);
      }
    });
  }

  private getLanguageSpecificCompletions(languageId: string): CompletionItem[] {
    // Implement language-specific completions
    const completions: CompletionItem[] = [];
    
    switch (languageId) {
      case 'python':
        completions.push(
          {
            label: 'def',
            kind: this.monaco.languages.CompletionItemKind.Keyword,
            insertText: 'def ${1:function_name}(${2:parameters}):\n\t${0}',
            detail: 'Function definition'
          },
          {
            label: 'class',
            kind: this.monaco.languages.CompletionItemKind.Keyword,
            insertText: 'class ${1:ClassName}:\n\tdef __init__(self):\n\t\t${0}',
            detail: 'Class definition'
          }
        );
        break;

      case 'cpp':
        completions.push(
          {
            label: 'class',
            kind: this.monaco.languages.CompletionItemKind.Keyword,
            insertText: 'class ${1:ClassName} {\npublic:\n\t${0}\n};',
            detail: 'Class definition'
          },
          {
            label: 'include',
            kind: this.monaco.languages.CompletionItemKind.Keyword,
            insertText: '#include <${1:header}>',
            detail: 'Include directive'
          }
        );
        break;
    }

    return completions;
  }

  private async getLintingDiagnostics(languageId: string, model: any) {
    // Implement language-specific linting
    const diagnostics = [];
    
    // Example linting rules
    const text = model.getValue();
    switch (languageId) {
      case 'python':
        // Check for common Python issues
        if (text.includes('print ')) {
          diagnostics.push({
            message: 'Use print() instead of print statement',
            severity: this.monaco.MarkerSeverity.Warning,
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 1
          });
        }
        break;

      case 'cpp':
        // Check for common C++ issues
        if (text.includes('using namespace std;')) {
          diagnostics.push({
            message: 'Avoid using namespace std in header files',
            severity: this.monaco.MarkerSeverity.Warning,
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 1
          });
        }
        break;
    }

    return diagnostics;
  }

  private getHoverInformation(languageId: string, model: any, position: any) {
    // Implement hover information
    const word = model.getWordAtPosition(position);
    if (!word) return null;

    switch (languageId) {
      case 'python':
        return {
          contents: [
            { value: '**Python Documentation**' },
            { value: `Information about: ${word.word}` }
          ]
        };

      case 'cpp':
        return {
          contents: [
            { value: '**C++ Documentation**' },
            { value: `Information about: ${word.word}` }
          ]
        };
    }

    return null;
  }

  private formatDocument(languageId: string, model: any) {
    // Implement document formatting
    const text = model.getValue();
    let formattedText = text;

    switch (languageId) {
      case 'python':
        // Basic Python formatting
        formattedText = text.replace(/\n{3,}/g, '\n\n');
        break;

      case 'cpp':
        // Basic C++ formatting
        formattedText = text.replace(/\s*([{}])\s*/g, ' $1\n');
        break;
    }

    return [{
      range: model.getFullModelRange(),
      text: formattedText
    }];
  }

  // SDK Integration methods
  public getSDKCommands(sdkType: keyof typeof sdkIntegrations) {
    return sdkIntegrations[sdkType].commands;
  }

  public getSDKPath(sdkType: keyof typeof sdkIntegrations) {
    return sdkIntegrations[sdkType].sdkPath;
  }

  public dispose() {
    this.completionProviders.forEach(provider => provider.dispose());
  }
}

export default LanguageService;
