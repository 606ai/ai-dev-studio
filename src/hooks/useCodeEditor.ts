import { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import CodeEditorService, {
  CodeSuggestion,
  CodeSnippet,
  LanguageConfig
} from '../services/CodeEditorService';

interface EditorOptions extends monaco.editor.IStandaloneEditorConstructionOptions {
  enableAI?: boolean;
  maxSuggestions?: number;
  theme?: string;
}

export const useCodeEditor = (openAIKey: string, initialOptions?: EditorOptions) => {
  const serviceRef = useRef<CodeEditorService | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = new CodeEditorService(openAIKey);
      setIsReady(true);
    }

    return () => {
      if (serviceRef.current) {
        serviceRef.current.dispose();
      }
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, [openAIKey]);

  const createEditor = (
    container: HTMLElement,
    options: EditorOptions = {}
  ): monaco.editor.IStandaloneCodeEditor => {
    const defaultOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
      theme: 'vs-dark',
      fontSize: 14,
      minimap: { enabled: true },
      automaticLayout: true,
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: true,
      tabSize: 4,
      wordWrap: 'on',
      ...initialOptions,
      ...options
    };

    const editor = monaco.editor.create(container, defaultOptions);
    editorRef.current = editor;

    // Register AI-powered completions if enabled
    if (options.enableAI && serviceRef.current) {
      monaco.languages.registerCompletionItemProvider('*', {
        triggerCharacters: ['.', '(', '{', '['],
        provideCompletionItems: async (model, position, context) => {
          const suggestions = await serviceRef.current!.getCompletionSuggestions(
            model,
            position,
            context,
            options.maxSuggestions
          );

          return {
            suggestions: suggestions.map(suggestion => ({
              ...suggestion,
              kind: suggestion.kind,
              insertText: suggestion.text,
              range: suggestion.range
            }))
          };
        }
      });
    }

    return editor;
  };

  const setValue = (value: string) => {
    if (editorRef.current) {
      editorRef.current.setValue(value);
    }
  };

  const getValue = (): string => {
    return editorRef.current?.getValue() || '';
  };

  const setLanguage = (languageId: string) => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, languageId);
      }
    }
  };

  const insertSnippet = (snippet: CodeSnippet) => {
    if (editorRef.current) {
      const position = editorRef.current.getPosition();
      if (position) {
        editorRef.current.executeEdits('', [
          {
            range: new monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column
            ),
            text: snippet.code
          }
        ]);
      }
    }
  };

  const getSnippets = (language: string, tag?: string): CodeSnippet[] => {
    return serviceRef.current?.getSnippets(language, tag) || [];
  };

  const registerLanguage = (config: LanguageConfig) => {
    serviceRef.current?.registerLanguage(config);
  };

  const registerSnippet = (language: string, snippet: CodeSnippet) => {
    serviceRef.current?.registerSnippet(language, snippet);
  };

  const formatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  const setTheme = (theme: string) => {
    monaco.editor.setTheme(theme);
  };

  const addAction = (
    id: string,
    label: string,
    keybinding: number,
    run: () => void
  ) => {
    if (editorRef.current) {
      editorRef.current.addAction({
        id,
        label,
        keybindings: [keybinding],
        run
      });
    }
  };

  const onDidChangeModelContent = (
    callback: (e: monaco.editor.IModelContentChangedEvent) => void
  ) => {
    if (editorRef.current) {
      return editorRef.current.onDidChangeModelContent(callback);
    }
    return { dispose: () => {} };
  };

  const getModelMarkers = (): monaco.editor.IMarker[] => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        return monaco.editor.getModelMarkers({ resource: model.uri });
      }
    }
    return [];
  };

  return {
    isReady,
    createEditor,
    setValue,
    getValue,
    setLanguage,
    insertSnippet,
    getSnippets,
    registerLanguage,
    registerSnippet,
    formatCode,
    setTheme,
    addAction,
    onDidChangeModelContent,
    getModelMarkers,
    editor: editorRef.current
  };
};

export default useCodeEditor;
