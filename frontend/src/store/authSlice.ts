import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  api,
  getErrorMessage,
  publicPost,
  refreshAccessToken,
  setAccessToken,
} from '@/api/client';
import type { ApiResponse, User, Workspace } from '@/types';

interface SessionPayload {
  user: User;
  workspace?: Workspace;
  accessToken?: string;
}

interface AuthState {
  user: User | null;
  workspace: Workspace | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;
}

const persisted = readIdentity();
const initialState: AuthState = {
  user: persisted?.user ?? null,
  workspace: persisted?.workspace ?? null,
  initialized: false,
  loading: false,
  error: null,
};

export const bootstrapSession = createAsyncThunk(
  'auth/bootstrap',
  async (_, { rejectWithValue }) => {
    try {
      await refreshAccessToken();
      const response = await api.get<ApiResponse<{ user: User; workspace: Workspace }>>('/auth/me');
      return response.data.result;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (values: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await publicPost<ApiResponse<SessionPayload>>('/auth/login', values);
      const token = response.result.accessToken;
      if (!token) throw new Error('The server did not return an access token.');
      setAccessToken(token);
      const me = await api.get<ApiResponse<{ user: User; workspace: Workspace }>>('/auth/me');
      return me.data.result;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const refreshSession = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<{ user: User; workspace: Workspace }>>('/auth/me');
      return response.data.result;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout', {});
  } finally {
    setAccessToken(null);
    localStorage.removeItem('workclub_identity');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.initialized = true;
        setIdentity(state, action.payload);
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.initialized = true;
        state.user = null;
        state.workspace = null;
        localStorage.removeItem('workclub_identity');
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        setIdentity(state, action.payload);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload ?? 'Unable to sign in.');
      })
      .addCase(refreshSession.fulfilled, (state, action) => {
        setIdentity(state, action.payload);
      })
      .addCase(refreshSession.rejected, (state) => {
        state.user = null;
        state.workspace = null;
        localStorage.removeItem('workclub_identity');
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.workspace = null;
      });
  },
});

function setIdentity(
  state: AuthState,
  identity: { user: User; workspace?: Workspace }
) {
  state.user = identity.user;
  state.workspace = identity.workspace ?? null;
  localStorage.setItem(
    'workclub_identity',
    JSON.stringify({ user: state.user, workspace: state.workspace })
  );
}

function readIdentity(): { user: User; workspace?: Workspace } | null {
  try {
    const raw = localStorage.getItem('workclub_identity');
    return raw ? (JSON.parse(raw) as { user: User; workspace?: Workspace }) : null;
  } catch {
    return null;
  }
}

export default authSlice.reducer;
