import mongoose from 'mongoose';

const aiModelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['classification', 'regression', 'nlp', 'computer-vision', 'other'],
    required: true,
  },
  framework: {
    type: String,
    enum: ['tensorflow', 'pytorch', 'scikit-learn', 'custom'],
    required: true,
  },
  parameters: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  metrics: {
    accuracy: Number,
    loss: Number,
    precision: Number,
    recall: Number,
    f1Score: Number,
  },
  trainedAt: Date,
  deployedAt: Date,
  status: {
    type: String,
    enum: ['training', 'deployed', 'archived', 'failed'],
    default: 'training',
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  files: [{
    name: String,
    path: String,
    type: {
      type: String,
      enum: ['model', 'weights', 'config', 'data'],
    },
    size: Number,
    uploadedAt: Date,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

aiModelSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const AIModel = mongoose.model('AIModel', aiModelSchema);

export default AIModel;
