import axios, { AxiosInstance } from 'axios';

class ApiGateway {
  private static instance: ApiGateway;
  private client: AxiosInstance;
  private token: string | null = null;

  private constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): ApiGateway {
    if (!ApiGateway.instance) {
      ApiGateway.instance = new ApiGateway();
    }
    return ApiGateway.instance;
  }

  private handleUnauthorized() {
    // Clear token and redirect to login
    this.token = null;
    window.location.href = '/login';
  }

  public setToken(token: string) {
    this.token = token;
  }

  // Model Management Service
  public async getModels() {
    return this.client.get('/models');
  }

  public async createModel(modelData: any) {
    return this.client.post('/models', modelData);
  }

  public async updateModel(modelId: string, modelData: any) {
    return this.client.put(`/models/${modelId}`, modelData);
  }

  public async deleteModel(modelId: string) {
    return this.client.delete(`/models/${modelId}`);
  }

  // Training Service
  public async startTraining(modelId: string, config: any) {
    return this.client.post(`/training/${modelId}/start`, config);
  }

  public async stopTraining(modelId: string) {
    return this.client.post(`/training/${modelId}/stop`);
  }

  public async getTrainingMetrics(modelId: string) {
    return this.client.get(`/training/${modelId}/metrics`);
  }

  // AutoML Service
  public async startAutoML(config: any) {
    return this.client.post('/automl/start', config);
  }

  public async getAutoMLStatus(jobId: string) {
    return this.client.get(`/automl/${jobId}/status`);
  }

  public async getAutoMLResults(jobId: string) {
    return this.client.get(`/automl/${jobId}/results`);
  }

  // Deployment Service
  public async deployModel(modelId: string, config: any) {
    return this.client.post(`/deployment/${modelId}`, config);
  }

  public async getDeployments() {
    return this.client.get('/deployment');
  }

  public async getDeploymentStatus(deploymentId: string) {
    return this.client.get(`/deployment/${deploymentId}/status`);
  }

  public async updateDeployment(deploymentId: string, config: any) {
    return this.client.put(`/deployment/${deploymentId}`, config);
  }

  public async deleteDeployment(deploymentId: string) {
    return this.client.delete(`/deployment/${deploymentId}`);
  }

  // Code Assistant Service
  public async getCodeSuggestions(code: string, context: any) {
    return this.client.post('/assistant/suggest', { code, context });
  }

  public async analyzeCode(code: string) {
    return this.client.post('/assistant/analyze', { code });
  }

  // Monitoring Service
  public async getModelMetrics(modelId: string, timeRange: string) {
    return this.client.get(`/monitoring/${modelId}/metrics`, {
      params: { timeRange },
    });
  }

  public async getSystemMetrics(deploymentId: string) {
    return this.client.get(`/monitoring/${deploymentId}/system`);
  }

  // Collaboration Service
  public async shareModel(modelId: string, users: string[]) {
    return this.client.post(`/collaboration/${modelId}/share`, { users });
  }

  public async getCollaborators(modelId: string) {
    return this.client.get(`/collaboration/${modelId}/users`);
  }

  // Version Control Service
  public async createVersion(modelId: string, version: any) {
    return this.client.post(`/versions/${modelId}`, version);
  }

  public async getVersions(modelId: string) {
    return this.client.get(`/versions/${modelId}`);
  }

  public async rollbackVersion(modelId: string, versionId: string) {
    return this.client.post(`/versions/${modelId}/rollback/${versionId}`);
  }

  // Error handling wrapper
  public async withErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage = 'Operation failed'
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      console.error(error);
      throw new Error(
        error.response?.data?.message || error.message || errorMessage
      );
    }
  }
}

export default ApiGateway;
