import User from '../models/User';
import Project from '../models/Project';
import { Types } from 'mongoose';

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface CreateProjectInput {
  name: string;
  description: string;
  language: string;
  framework: string;
  userId: string;
}

export const DatabaseService = {
  // User operations
  async createUser(userData: CreateUserInput) {
    try {
      const user = new User(userData);
      await user.save();
      return user;
    } catch (error) {
      throw error;
    }
  },

  async getUserById(id: string) {
    try {
      return await User.findById(id).populate('projects');
    } catch (error) {
      throw error;
    }
  },

  async updateUser(id: string, updateData: Partial<CreateUserInput>) {
    try {
      return await User.findByIdAndUpdate(id, updateData, { new: true });
    } catch (error) {
      throw error;
    }
  },

  // Project operations
  async createProject(projectData: CreateProjectInput) {
    try {
      const project = new Project(projectData);
      await project.save();
      
      // Add project to user's projects array
      await User.findByIdAndUpdate(
        projectData.userId,
        { $push: { projects: project._id } }
      );
      
      return project;
    } catch (error) {
      throw error;
    }
  },

  async getProjectById(id: string) {
    try {
      return await Project.findById(id);
    } catch (error) {
      throw error;
    }
  },

  async getUserProjects(userId: string) {
    try {
      return await Project.find({ userId: new Types.ObjectId(userId) });
    } catch (error) {
      throw error;
    }
  },

  async updateProject(id: string, updateData: Partial<CreateProjectInput>) {
    try {
      return await Project.findByIdAndUpdate(id, updateData, { new: true });
    } catch (error) {
      throw error;
    }
  },

  async deleteProject(id: string) {
    try {
      const project = await Project.findById(id);
      if (!project) {
        throw new Error('Project not found');
      }

      // Remove project from user's projects array
      await User.findByIdAndUpdate(
        project.userId,
        { $pull: { projects: id } }
      );

      await project.deleteOne();
      return true;
    } catch (error) {
      throw error;
    }
  },
};
