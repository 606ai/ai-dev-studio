import axios from 'axios';

export interface HuggingFaceModel {
  modelId: string;
  name: string;
  task: string;
  description?: string;
  downloads?: number;
  likes?: number;
}

export interface InferenceParams {
  model: string;
  inputs: string;
  parameters?: Record<string, any>;
}

export interface ModelTrainingConfig {
  model: string;
  dataset: string;
  hyperparameters: {
    learningRate: number;
    batchSize: number;
    epochs: number;
  };
}

class HuggingFaceService {
  private API_URL = 'https://api-inference.huggingface.co/models';
  private API_MODELS_URL = 'https://huggingface.co/api/models';
  private apiKey: string | null = null;

  constructor() {
    // Try to load API key from local storage on initialization
    this.apiKey = localStorage.getItem('HUGGINGFACE_API_KEY');
  }

  // Method to set and store API key
  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('HUGGINGFACE_API_KEY', key);
  }

  // Method to clear API key
  clearApiKey() {
    this.apiKey = null;
    localStorage.removeItem('HUGGINGFACE_API_KEY');
  }

  // Get authentication headers
  private getHeaders() {
    return this.apiKey 
      ? { 'Authorization': `Bearer ${this.apiKey}` }
      : {};
  }

  // Fetch list of trending models
  async listTrendingModels(limit = 50): Promise<HuggingFaceModel[]> {
    try {
      const response = await axios.get(`${this.API_MODELS_URL}?sort=trending&limit=${limit}`);
      return response.data.map((model: any) => ({
        modelId: model.modelId,
        name: model.name,
        task: model.task,
        description: model.description,
        downloads: model.downloads,
        likes: model.likes
      }));
    } catch (error) {
      console.error('Failed to fetch Hugging Face models', error);
      return [];
    }
  }

  // Search models by task or keyword
  async searchModels(query: string, task?: string): Promise<HuggingFaceModel[]> {
    try {
      const params = new URLSearchParams({
        search: query,
        ...(task ? { task } : {})
      });
      const response = await axios.get(`${this.API_MODELS_URL}?${params}`);
      return response.data.map((model: any) => ({
        modelId: model.modelId,
        name: model.name,
        task: model.task,
        description: model.description,
        downloads: model.downloads,
        likes: model.likes
      }));
    } catch (error) {
      console.error('Failed to search Hugging Face models', error);
      return [];
    }
  }

  // Perform inference on a model
  async inference(params: InferenceParams): Promise<any> {
    try {
      const response = await axios.post(
        `${this.API_URL}/${params.model}/inference`, 
        {
          inputs: params.inputs,
          parameters: params.parameters || {}
        },
        {
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Hugging Face inference failed', error);
      throw error;
    }
  }

  // Get model details
  async getModelDetails(modelId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.API_MODELS_URL}/${modelId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch details for model ${modelId}`, error);
      return null;
    }
  }

  // New method for model fine-tuning
  async fineTuneModel(config: ModelTrainingConfig): Promise<any> {
    try {
      const response = await axios.post(
        `${this.API_URL}/${config.model}/finetune`,
        {
          dataset: config.dataset,
          hyperparameters: config.hyperparameters
        },
        {
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Model fine-tuning failed', error);
      throw error;
    }
  }

  // Method to estimate training costs and resources
  async estimateTrainingCosts(config: ModelTrainingConfig): Promise<{
    estimatedTime: number;
    estimatedCost: number;
    requiredResources: string;
  }> {
    try {
      const response = await axios.post(
        `${this.API_URL}/training-estimate`,
        {
          model: config.model,
          dataset: config.dataset,
          hyperparameters: config.hyperparameters
        },
        {
          headers: this.getHeaders()
        }
      );
      return response.data;
    } catch (error) {
      console.error('Training cost estimation failed', error);
      return {
        estimatedTime: -1,
        estimatedCost: -1,
        requiredResources: 'Unable to estimate'
      };
    }
  }

  // Method to generate model performance visualization data
  async generateModelPerformanceMetrics(modelId: string): Promise<{
    accuracy: number[];
    loss: number[];
    trainingProgress: number;
  }> {
    try {
      const response = await axios.get(
        `${this.API_URL}/${modelId}/metrics`,
        {
          headers: this.getHeaders()
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch model metrics', error);
      return {
        accuracy: [],
        loss: [],
        trainingProgress: 0
      };
    }
  }
}

export const huggingfaceService = new HuggingFaceService();

export default huggingfaceService;
