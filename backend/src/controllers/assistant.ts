import { Request, Response } from 'express';
import { z } from 'zod';
import CodeAssistantService from '../services/assistant/CodeAssistantService';
import logger from '../utils/logger';

const codeAssistantService = CodeAssistantService.getInstance();

const analyzeCodeSchema = z.object({
  files: z.array(
    z.object({
      path: z.string(),
      content: z.string(),
    })
  ),
});

const getSuggestionsSchema = z.object({
  code: z.string(),
  context: z.object({
    file: z.string(),
    language: z.string(),
    dependencies: z.record(z.string()),
  }),
});

const optimizeCodeSchema = z.object({
  code: z.string(),
  options: z.object({
    target: z.enum(['performance', 'readability', 'memory']),
    aggressive: z.boolean(),
  }),
});

const generateTestsSchema = z.object({
  code: z.string(),
  options: z.object({
    framework: z.string(),
    coverage: z.enum(['full', 'critical', 'basic']),
  }),
});

export const analyzeCode = async (req: Request, res: Response) => {
  try {
    const { files } = analyzeCodeSchema.parse(req.body);
    const analysis = await codeAssistantService.analyzeCode(files);
    res.json(analysis);
  } catch (error) {
    logger.error('Error analyzing code:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
};

export const getSuggestions = async (req: Request, res: Response) => {
  try {
    const { code, context } = getSuggestionsSchema.parse(req.body);
    const suggestions = await codeAssistantService.getSuggestions(code, context);
    res.json(suggestions);
  } catch (error) {
    logger.error('Error getting suggestions:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
};

export const optimizeCode = async (req: Request, res: Response) => {
  try {
    const { code, options } = optimizeCodeSchema.parse(req.body);
    const optimized = await codeAssistantService.optimizeCode(code, options);
    res.json({ optimizedCode: optimized });
  } catch (error) {
    logger.error('Error optimizing code:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
};

export const generateTests = async (req: Request, res: Response) => {
  try {
    const { code, options } = generateTestsSchema.parse(req.body);
    const tests = await codeAssistantService.generateTests(code, options);
    res.json({ tests });
  } catch (error) {
    logger.error('Error generating tests:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
};
