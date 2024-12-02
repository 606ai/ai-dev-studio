import { useEffect, useRef } from 'react';
import { Monaco } from '@monaco-editor/react';
import LanguageService from '../services/LanguageService';

export function useLanguageService(monaco: Monaco | null) {
  const languageServiceRef = useRef<LanguageService | null>(null);

  useEffect(() => {
    if (monaco) {
      languageServiceRef.current = new LanguageService(monaco);

      return () => {
        languageServiceRef.current?.dispose();
      };
    }
  }, [monaco]);

  return languageServiceRef.current;
}

export default useLanguageService;
