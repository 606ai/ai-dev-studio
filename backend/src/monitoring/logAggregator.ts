import { Client } from '@elastic/elasticsearch';
import config from '../config';

class LogAggregator {
  private static instance: LogAggregator;
  private client: Client;

  private constructor() {
    this.client = new Client({
      node: config.ELASTICSEARCH_URL || 'http://localhost:9200',
      auth: {
        username: config.ELASTICSEARCH_USERNAME || 'elastic',
        password: config.ELASTICSEARCH_PASSWORD || 'changeme'
      }
    });
  }

  public static getInstance(): LogAggregator {
    if (!LogAggregator.instance) {
      LogAggregator.instance = new LogAggregator();
    }
    return LogAggregator.instance;
  }

  async indexLog(logEntry: any) {
    try {
      const timestamp = new Date();
      const indexName = `logs-${timestamp.getFullYear()}.${String(timestamp.getMonth() + 1).padStart(2, '0')}`;
      
      await this.client.index({
        index: indexName,
        document: {
          ...logEntry,
          '@timestamp': timestamp,
        },
      });
    } catch (error) {
      console.error('Failed to index log to Elasticsearch:', error);
    }
  }

  async searchLogs(query: any) {
    try {
      const result = await this.client.search({
        index: 'logs-*',
        ...query,
      });
      return result;
    } catch (error) {
      console.error('Failed to search logs in Elasticsearch:', error);
      throw error;
    }
  }

  async createIndexTemplate() {
    try {
      await this.client.indices.putIndexTemplate({
        name: 'logs-template',
        template: {
          mappings: {
            properties: {
              '@timestamp': { type: 'date' },
              'level': { type: 'keyword' },
              'message': { type: 'text' },
              'service': { type: 'keyword' },
              'traceId': { type: 'keyword' },
              'userId': { type: 'keyword' },
              'duration': { type: 'long' },
              'method': { type: 'keyword' },
              'path': { type: 'keyword' },
              'statusCode': { type: 'integer' },
            }
          }
        }
      });
    } catch (error) {
      console.error('Failed to create index template:', error);
    }
  }
}

export default LogAggregator;
