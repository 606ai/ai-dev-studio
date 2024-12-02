import { useState, useCallback } from 'react';
import {
  AICodeAssistService,
  CodeSuggestion,
  CodeContext,
  AIModelConfig
} from '../services/AICodeAssistService';

interface UseAICodeAssistOptions {
  modelConfig: AIModelConfig;
  onError?: (error: Error) => void;
}

export function useAICodeAssist({ modelConfig, onError }: UseAICodeAssistOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [suggestions, setSuggestions] = useState<CodeSuggestion[]>([]);

  const aiService = new AICodeAssistService(modelConfig);

  const handleError = useCallback((error: Error) => {
    setError(error);
    if (onError) {
      onError(error);
    }
  }, [onError]);

  const getCompletion = useCallback(async (context: CodeContext) => {
    setLoading(true);
    try {
      const suggestion = await aiService.getCodeCompletion(context);
      setSuggestions(prev => [...prev, suggestion]);
      return suggestion;
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to get code completion'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [aiService, handleError]);

  const getRefactoringSuggestions = useCallback(async (context: CodeContext) => {
    setLoading(true);
    try {
      const suggestion = await aiService.getRefactoringSuggestions(context);
      setSuggestions(prev => [...prev, suggestion]);
      return suggestion;
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to get refactoring suggestions'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [aiService, handleError]);

  const fixError = useCallback(async (context: CodeContext, errorMessage: string) => {
    setLoading(true);
    try {
      const suggestion = await aiService.getErrorFixes(context, errorMessage);
      setSuggestions(prev => [...prev, suggestion]);
      return suggestion;
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to get error fixes'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [aiService, handleError]);

  const optimizeCode = useCallback(async (context: CodeContext) => {
    setLoading(true);
    try {
      const suggestion = await aiService.getOptimizationSuggestions(context);
      setSuggestions(prev => [...prev, suggestion]);
      return suggestion;
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to get optimization suggestions'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [aiService, handleError]);

  const generateDocs = useCallback(async (context: CodeContext) => {
    setLoading(true);
    try {
      const suggestion = await aiService.generateDocumentation(context);
      setSuggestions(prev => [...prev, suggestion]);
      return suggestion;
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to generate documentation'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [aiService, handleError]);

  const analyzeDependencies = useCallback(async (context: CodeContext) => {
    setLoading(true);
    try {
      return await aiService.analyzeDependencies(context);
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to analyze dependencies'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [aiService, handleError]);

  const suggestTests = useCallback(async (context: CodeContext) => {
    setLoading(true);
    try {
      return await aiService.suggestTests(context);
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to suggest tests'));
      return '';
    } finally {
      setLoading(false);
    }
  }, [aiService, handleError]);

  const explainCode = useCallback(async (context: CodeContext) => {
    setLoading(true);
    try {
      return await aiService.explainCode(context);
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to explain code'));
      return '';
    } finally {
      setLoading(false);
    }
  }, [aiService, handleError]);

  const reviewCode = useCallback(async (context: CodeContext) => {
    setLoading(true);
    try {
      return await aiService.reviewCode(context);
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to review code'));
      return {
        issues: [],
        suggestions: [],
        securityConcerns: []
      };
    } finally {
      setLoading(false);
    }
  }, [aiService, handleError]);

  const getTypeDefinitions = useCallback(async (context: CodeContext) => {
    setLoading(true);
    try {
      return await aiService.getTypeDefinitions(context);
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to get type definitions'));
      return '';
    } finally {
      setLoading(false);
    }
  }, [aiService, handleError]);

  const getPerformanceImprovements = useCallback(async (context: CodeContext) => {
    setLoading(true);
    try {
      return await aiService.suggestPerformanceImprovements(context);
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to get performance improvements'));
      return {
        suggestions: [],
        impact: [],
        complexity: []
      };
    } finally {
      setLoading(false);
    }
  }, [aiService, handleError]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    suggestions,
    getCompletion,
    getRefactoringSuggestions,
    fixError,
    optimizeCode,
    generateDocs,
    analyzeDependencies,
    suggestTests,
    explainCode,
    reviewCode,
    getTypeDefinitions,
    getPerformanceImprovements,
    clearSuggestions,
    clearError
  };
}

export default useAICodeAssist;
