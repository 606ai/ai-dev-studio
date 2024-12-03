import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// Mock services
jest.mock('../services/queue');
jest.mock('../services/cache');
jest.mock('../services/websocket');
jest.mock('../config', () => ({
  default: {
    database: {
      url: process.env.DATABASE_URL,
    },
    redis: {
      url: process.env.REDIS_URL,
    },
    rabbitmq: {
      url: process.env.RABBITMQ_URL,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
    },
    frontend: {
      url: process.env.FRONTEND_URL,
    },
  },
}));

// Mock Prisma
const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
});

export { prismaMock };
