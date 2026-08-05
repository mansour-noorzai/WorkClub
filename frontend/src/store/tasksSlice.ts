import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, getErrorMessage } from '@/api/client';
import type { ApiResponse, Task } from '@/types';

interface State {
  items: Task[];
  loading: boolean;
  error?: string;
}

const initialState: State = { items: [], loading: false };

export const fetchTasks = createAsyncThunk(
  'tasks/list',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<Task[]>>(`/task?project=${projectId}&limit=100`);
      return response.data.result;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const moveTask = createAsyncThunk(
  'tasks/move',
  async (
    input: { id: string; status: Task['status']; sortOrder: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.patch<ApiResponse<Task>>(`/task/${input.id}/move`, {
        status: input.status,
        sortOrder: input.sortOrder,
      });
      return response.data.result;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const slice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload);
      })
      .addCase(moveTask.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item._id === action.payload._id);
        if (index >= 0) state.items[index] = action.payload;
      });
  },
});

export default slice.reducer;
