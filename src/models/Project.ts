import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  framework: {
    type: String,
    required: true,
  },
  dependencies: {
    type: Map,
    of: String,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  files: [{
    name: String,
    path: String,
    size: Number,
    lastModified: Date,
  }],
});

projectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Project = mongoose.model('Project', projectSchema);

export default Project;
