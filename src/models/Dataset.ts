import mongoose from 'mongoose';

const datasetSchema = new mongoose.Schema({
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
    enum: ['tabular', 'image', 'text', 'audio', 'video', 'other'],
    required: true,
  },
  format: {
    type: String,
    enum: ['csv', 'json', 'parquet', 'images', 'audio', 'custom'],
    required: true,
  },
  size: {
    type: Number, // in bytes
    required: true,
  },
  stats: {
    rowCount: Number,
    columnCount: Number,
    classes: [String],
    features: [{
      name: String,
      type: String,
      nullCount: Number,
      uniqueCount: Number,
    }],
  },
  splits: {
    train: {
      path: String,
      size: Number,
      rowCount: Number,
    },
    validation: {
      path: String,
      size: Number,
      rowCount: Number,
    },
    test: {
      path: String,
      size: Number,
      rowCount: Number,
    },
  },
  versions: [{
    version: String,
    path: String,
    createdAt: Date,
    changes: String,
  }],
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
  status: {
    type: String,
    enum: ['processing', 'ready', 'archived', 'error'],
    default: 'processing',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

datasetSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Dataset = mongoose.model('Dataset', datasetSchema);

export default Dataset;
