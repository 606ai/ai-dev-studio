import { useCallback } from 'react';
import { securityService } from '@services/security';
import { logError } from '@utils/logger';

export const useSecurity = () => {
  const validateUserInput = useCallback((
    input: string,
    options: { maxLength?: number; pattern?: RegExp } = {}
  ) => {
    try {
      return securityService.validateInput(input, options);
    } catch (error) {
      logError('Input validation failed', error);
      return false;
    }
  }, []);

  const validateFileUpload = useCallback((
    file: File,
    allowedTypes: string[]
  ) => {
    try {
      return securityService.validateFile(file, allowedTypes);
    } catch (error) {
      logError('File validation failed', error);
      return false;
    }
  }, []);

  const sanitizeContent = useCallback((content: string) => {
    try {
      return securityService.sanitizeHtml(content);
    } catch (error) {
      logError('Content sanitization failed', error);
      return '';
    }
  }, []);

  const getSecureHeaders = useCallback(() => {
    return securityService.getRequestHeaders();
  }, []);

  return {
    validateUserInput,
    validateFileUpload,
    sanitizeContent,
    getSecureHeaders,
  };
};
