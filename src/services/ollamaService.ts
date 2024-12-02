import axios from 'axios';

const OLLAMA_API_BASE = 'http://localhost:11434/api';

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface GenerateResponse {
  model: string;
  response: string;
  context: number[];
  done: boolean;
}

export interface CreateModelOptions {
  name: string;
  modelfile: string;
}

export interface ModelCreateResponse {
  status: string;
}

export interface ModelRunOptions {
  model: string;
  prompt: string;
  system?: string;
  template?: string;
  context?: number[];
  stream?: boolean;
  raw?: boolean;
}

export interface OllamaEmbedding {
  embedding: number[];
}

class OllamaService {
  // Model Management
  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await axios.get(`${OLLAMA_API_BASE}/tags`);
      return response.data.models;
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  async pullModel(model: string, options?: { insecure?: boolean }): Promise<void> {
    try {
      await axios.post(`${OLLAMA_API_BASE}/pull`, {
        name: model,
        insecure: options?.insecure || false,
      }, {
        timeout: 300000, // 5 minutes for large model downloads
      });
    } catch (error) {
      console.error('Error pulling model:', error);
      throw error;
    }
  }

  async deleteModel(model: string): Promise<void> {
    try {
      await axios.delete(`${OLLAMA_API_BASE}/delete`, {
        data: { name: model }
      });
    } catch (error) {
      console.error('Error deleting model:', error);
      throw error;
    }
  }

  async createModel(options: CreateModelOptions): Promise<ModelCreateResponse> {
    try {
      const response = await axios.post(`${OLLAMA_API_BASE}/create`, {
        name: options.name,
        modelfile: options.modelfile
      });
      return response.data;
    } catch (error) {
      console.error('Error creating model:', error);
      throw error;
    }
  }

  // Text Generation
  async generateResponse(options: ModelRunOptions): Promise<GenerateResponse> {
    try {
      const response = await axios.post(`${OLLAMA_API_BASE}/generate`, {
        model: options.model,
        prompt: options.prompt,
        system: options.system,
        template: options.template,
        context: options.context,
        stream: options.stream ?? false,
        raw: options.raw ?? false
      });
      return response.data;
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  // Embeddings
  async generateEmbeddings(model: string, prompt: string): Promise<OllamaEmbedding> {
    try {
      const response = await axios.post(`${OLLAMA_API_BASE}/embeddings`, {
        model,
        prompt
      });
      return response.data;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }

  // Chat Completion
  async chatCompletion(options: {
    model: string;
    messages: Array<{role: string, content: string}>;
    stream?: boolean;
  }): Promise<GenerateResponse> {
    try {
      const response = await axios.post(`${OLLAMA_API_BASE}/chat`, {
        model: options.model,
        messages: options.messages,
        stream: options.stream ?? false
      });
      return response.data;
    } catch (error) {
      console.error('Error in chat completion:', error);
      throw error;
    }
  }

  // Model Information
  async showModelInfo(model: string): Promise<OllamaModel> {
    try {
      const response = await axios.post(`${OLLAMA_API_BASE}/show`, { name: model });
      return response.data;
    } catch (error) {
      console.error('Error fetching model info:', error);
      throw error;
    }
  }
}

export const ollamaService = new OllamaService();
