import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface Project {
  id: string;
  name: string;
  description: string;
  lastModified: string;
  language: string;
  framework: string;
  dependencies: Record<string, string>;
}

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  recentProjects: Project[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ProjectState = {
  projects: [],
  activeProject: null,
  recentProjects: [],
  status: 'idle',
  error: null,
};

export const fetchProjects = createAsyncThunk(
  'project/fetchProjects',
  async () => {
    // TODO: Implement actual API call
    return [] as Project[];
  }
);

export const createProject = createAsyncThunk(
  'project/createProject',
  async (project: Omit<Project, 'id'>) => {
    // TODO: Implement actual API call
    return {
      ...project,
      id: Date.now().toString(),
    } as Project;
  }
);

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setActiveProject: (state, action) => {
      state.activeProject = action.payload;
      if (action.payload) {
        state.recentProjects = [
          action.payload,
          ...state.recentProjects.filter(p => p.id !== action.payload.id)
        ].slice(0, 5);
      }
    },
    clearActiveProject: (state) => {
      state.activeProject = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch projects';
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.push(action.payload);
      });
  },
});

export const { setActiveProject, clearActiveProject } = projectSlice.actions;
export default projectSlice.reducer;
