import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Project from '../models/Project';
import AIModel from '../models/AIModel';
import Dataset from '../models/Dataset';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-dev-studio';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      AIModel.deleteMany({}),
      Dataset.deleteMany({}),
    ]);

    // Create test users
    const users = await User.create([
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        settings: {
          theme: 'dark',
          notifications: { email: true, push: true },
        },
      },
      {
        username: 'demo',
        email: 'demo@example.com',
        password: 'demo123',
        firstName: 'Demo',
        lastName: 'User',
        settings: {
          theme: 'light',
          notifications: { email: false, push: true },
        },
      },
    ]);

    // Create test projects
    const projects = await Project.create([
      {
        name: 'Image Classification',
        description: 'A deep learning project for image classification',
        language: 'Python',
        framework: 'TensorFlow',
        userId: users[0]._id,
      },
      {
        name: 'NLP Analysis',
        description: 'Natural Language Processing for sentiment analysis',
        language: 'Python',
        framework: 'PyTorch',
        userId: users[1]._id,
      },
    ]);

    // Create test datasets
    const datasets = await Dataset.create([
      {
        name: 'CIFAR-10',
        description: 'Image classification dataset',
        type: 'image',
        format: 'images',
        size: 170498071,
        stats: {
          rowCount: 60000,
          columnCount: 3,
          classes: ['airplane', 'automobile', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck'],
        },
        projectId: projects[0]._id,
        userId: users[0]._id,
        status: 'ready',
      },
      {
        name: 'IMDB Reviews',
        description: 'Movie reviews dataset',
        type: 'text',
        format: 'csv',
        size: 80525764,
        stats: {
          rowCount: 50000,
          columnCount: 2,
          classes: ['positive', 'negative'],
        },
        projectId: projects[1]._id,
        userId: users[1]._id,
        status: 'ready',
      },
    ]);

    // Create test AI models
    await AIModel.create([
      {
        name: 'ResNet50',
        description: 'Pre-trained ResNet50 model for image classification',
        type: 'computer-vision',
        framework: 'tensorflow',
        parameters: {
          layers: 50,
          batchSize: 32,
          learningRate: 0.001,
        },
        metrics: {
          accuracy: 0.89,
          loss: 0.23,
          precision: 0.88,
          recall: 0.87,
          f1Score: 0.875,
        },
        status: 'deployed',
        projectId: projects[0]._id,
        userId: users[0]._id,
      },
      {
        name: 'BERT-Base',
        description: 'Fine-tuned BERT model for sentiment analysis',
        type: 'nlp',
        framework: 'pytorch',
        parameters: {
          layers: 12,
          attention_heads: 12,
          hidden_size: 768,
        },
        metrics: {
          accuracy: 0.92,
          loss: 0.18,
          precision: 0.91,
          recall: 0.93,
          f1Score: 0.92,
        },
        status: 'deployed',
        projectId: projects[1]._id,
        userId: users[1]._id,
      },
    ]);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
