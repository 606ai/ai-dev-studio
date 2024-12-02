export const AI_MODELS = {
  CODE_COMPLETION: {
    OLLAMA: {
      CODELLAMA: 'codellama',
      STARCODER: 'starcoder',
    },
    HUGGINGFACE: {
      BIGCODE: 'bigcode/starcoder',
      CODEGEN: 'salesforce/codegen-350M-multi',
    },
    OPENAI: {
      CODEX: 'code-davinci-002',
    }
  },
  LANGUAGE_SUPPORT: {
    PYTHON: 'python',
    TYPESCRIPT: 'typescript',
    JAVASCRIPT: 'javascript',
    RUST: 'rust',
    GO: 'go'
  }
};

export const CODE_COMPLETION_CONFIG = {
  MAX_TOKENS: 200,
  TEMPERATURE: 0.7,
  TOP_P: 0.9,
  FREQUENCY_PENALTY: 0.5,
  PRESENCE_PENALTY: 0.5
};

export const ERROR_MESSAGES = {
  API_CALL_FAILED: 'Failed to generate code suggestions',
  NO_MODEL_AVAILABLE: 'No AI model available for code completion',
  NETWORK_ERROR: 'Network error occurred during API call'
};

export const CACHING_CONFIG = {
  TTL: 1000 * 60 * 60, // 1 hour
  MAX_CACHE_SIZE: 100
};
