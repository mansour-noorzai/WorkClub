import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, getErrorMessage } from '@/api/client';
import type { ApiResponse, Project } from '@/types';

interface State {
  items: Project[];
  loading: boolean;
  error?: string;
}

const initialState: State = { items: [], loading: false };

export const fetchProjects = createAsyncThunk('projects/list', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<ApiResponse<Project[]>>('/project?limit=100');
    return response.data.result;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const slice = createSlice({
  name: 'projects',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload);
      });
  },
});

export default slice.reducer;
