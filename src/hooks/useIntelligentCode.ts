import { useEffect, useRef, useState } from 'react';
import { Monaco } from '@monaco-editor/react';
import IntelligentCodeService from '../services/IntelligentCodeService';

interface RefactoringOperation {
  type: 'rename' | 'extractFunction' | 'extractVariable' | 'moveDeclaration';
  target: string;
  newName?: string;
  scope?: {
    start: number;
    end: number;
  };
}

interface IntelligentCodeState {
  isLoading: boolean;
  error: Error | null;
  lastOperation: RefactoringOperation | null;
}

export function useIntelligentCode(monaco: Monaco | null, openaiApiKey: string) {
  const serviceRef = useRef<IntelligentCodeService | null>(null);
  const [state, setState] = useState<IntelligentCodeState>({
    isLoading: false,
    error: null,
    lastOperation: null
  });

  useEffect(() => {
    if (monaco) {
      serviceRef.current = new IntelligentCodeService(monaco, openaiApiKey);

      serviceRef.current.onRefactoring((operation: RefactoringOperation) => {
        setState(prev => ({
          ...prev,
          lastOperation: operation,
          isLoading: false
        }));
      });
    }

    return () => {
      serviceRef.current = null;
    };
  }, [monaco, openaiApiKey]);

  const renameSymbol = async (
    filePath: string,
    position: { line: number; column: number },
    newName: string
  ) => {
    if (!serviceRef.current) return;

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await serviceRef.current.renameSymbol(filePath, position, newName);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        isLoading: false
      }));
    }
  };

  const extractFunction = async (
    filePath: string,
    selection: { start: number; end: number },
    newFunctionName: string
  ) => {
    if (!serviceRef.current) return;

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await serviceRef.current.extractFunction(
        filePath,
        selection,
        newFunctionName
      );
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        isLoading: false
      }));
    }
  };

  return {
    ...state,
    renameSymbol,
    extractFunction
  };
}

export default useIntelligentCode;
