import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.number().default(3000),
  
  // Database
  DATABASE_URL: z.string(),
  
  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // RabbitMQ
  RABBITMQ_URL: z.string().default('amqp://localhost:5672'),
  
  // JWT
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('24h'),
  
  // WebSocket
  WS_PORT: z.number().default(3001),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // CORS
  CORS_ORIGIN: z.string().default('*'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: z.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX: z.number().default(100),
  
  // File Upload
  MAX_FILE_SIZE: z.number().default(50 * 1024 * 1024), // 50MB
  UPLOAD_DIR: z.string().default('./uploads'),
  
  // Elasticsearch Configuration
  ELASTICSEARCH_URL: z.string().default('http://localhost:9200'),
  ELASTICSEARCH_USERNAME: z.string().optional(),
  ELASTICSEARCH_PASSWORD: z.string().optional(),
  
  // Notification Configuration
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.number().default(587),
  SMTP_SECURE: z.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default('noreply@aidevstudio.com'),
  
  SLACK_TOKEN: z.string().optional(),
  ALERT_SLACK_CHANNEL: z.string().default('monitoring-alerts'),
  ALERT_EMAIL_RECIPIENTS: z.array(z.string()).default(['admin@aidevstudio.com']),
});

type Config = z.infer<typeof configSchema>;

const config: Config = {
  NODE_ENV: process.env.NODE_ENV as Config['NODE_ENV'],
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL!,
  RABBITMQ_URL: process.env.RABBITMQ_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN!,
  WS_PORT: parseInt(process.env.WS_PORT || '3001', 10),
  LOG_LEVEL: process.env.LOG_LEVEL as Config['LOG_LEVEL'],
  CORS_ORIGIN: process.env.CORS_ORIGIN!,
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10),
  UPLOAD_DIR: process.env.UPLOAD_DIR!,
  ELASTICSEARCH_URL: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  ELASTICSEARCH_USERNAME: process.env.ELASTICSEARCH_USERNAME,
  ELASTICSEARCH_PASSWORD: process.env.ELASTICSEARCH_PASSWORD,
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_FROM: process.env.SMTP_FROM || 'noreply@aidevstudio.com',
  SLACK_TOKEN: process.env.SLACK_TOKEN,
  ALERT_SLACK_CHANNEL: process.env.ALERT_SLACK_CHANNEL || 'monitoring-alerts',
  ALERT_EMAIL_RECIPIENTS: (process.env.ALERT_EMAIL_RECIPIENTS || 'admin@aidevstudio.com').split(','),
};

try {
  configSchema.parse(config);
} catch (error) {
  console.error('Invalid configuration:', error);
  process.exit(1);
}

export default config;
