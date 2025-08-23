/**
 * 认证状态管理 - Redux Toolkit Slice
 * 管理用户登录状态、会话信息和认证相关的全局状态
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthService, LoginData, RegisterData, SessionInfo } from '../services/auth/authService';

// 认证状态接口
export interface AuthState {
  // 认证状态
  isAuthenticated: boolean;
  isLoading: boolean;

  // 会话信息
  session: SessionInfo | null;

  // 错误信息
  error: string | null;
  errorCode: string | null;

  // 操作状态
  isLoggingIn: boolean;
  isRegistering: boolean;
  isLoggingOut: boolean;

  // 最后登录的用户名（记住我功能）
  lastLoginUsername: string | null;
}

// 初始状态
const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true, // 初始加载时为true，检查会话后设为false
  session: null,
  error: null,
  errorCode: null,
  isLoggingIn: false,
  isRegistering: false,
  isLoggingOut: false,
  lastLoginUsername: null,
};

// 异步操作：初始化认证状态
export const initializeAuth = createAsyncThunk('auth/initialize', async () => {
  const session = await AuthService.getCurrentSession();
  const lastUsername = await AuthService.getLastLoginUsername();

  return {
    session,
    lastUsername,
    isAuthenticated: session !== null,
  };
});

// 异步操作：用户登录
export const loginUser = createAsyncThunk(
  'auth/login',
  async (loginData: LoginData, { rejectWithValue }) => {
    const result = await AuthService.login(loginData);

    if (!result.success) {
      return rejectWithValue({
        message: result.message,
        errorCode: result.errorCode,
      });
    }

    // 获取会话信息
    const session = await AuthService.getCurrentSession();

    return {
      session,
      user: result.user,
      message: result.message,
    };
  },
);

// 异步操作：用户注册
export const registerUser = createAsyncThunk(
  'auth/register',
  async (registerData: RegisterData, { rejectWithValue }) => {
    const result = await AuthService.register(registerData);

    if (!result.success) {
      return rejectWithValue({
        message: result.message,
        errorCode: result.errorCode,
      });
    }

    // 获取会话信息
    const session = await AuthService.getCurrentSession();

    return {
      session,
      user: result.user,
      message: result.message,
    };
  },
);

// 异步操作：用户注销
export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await AuthService.logout();
  return null;
});

// 异步操作：刷新会话
export const refreshSession = createAsyncThunk('auth/refresh', async (_, { rejectWithValue }) => {
  const success = await AuthService.refreshSession();

  if (!success) {
    return rejectWithValue('会话刷新失败');
  }

  const session = await AuthService.getCurrentSession();
  return session;
});

// 异步操作：修改密码
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (
    { currentPassword, newPassword }: { currentPassword: string; newPassword: string },
    { rejectWithValue },
  ) => {
    const result = await AuthService.changePassword(currentPassword, newPassword);

    if (!result.success) {
      return rejectWithValue({
        message: result.message,
        errorCode: result.errorCode,
      });
    }

    return result.message;
  },
);

// 创建认证 slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 清除错误信息
    clearError: state => {
      state.error = null;
      state.errorCode = null;
    },

    // 设置错误信息
    setError: (state, action: PayloadAction<{ message: string; errorCode?: string }>) => {
      state.error = action.payload.message;
      state.errorCode = action.payload.errorCode || null;
    },

    // 清除认证状态（强制注销）
    clearAuth: state => {
      state.isAuthenticated = false;
      state.session = null;
      state.error = null;
      state.errorCode = null;
      state.isLoading = false;
    },

    // 更新会话信息
    updateSession: (state, action: PayloadAction<Partial<SessionInfo>>) => {
      if (state.session) {
        state.session = { ...state.session, ...action.payload };
      }
    },

    // 设置最后登录用户名
    setLastLoginUsername: (state, action: PayloadAction<string | null>) => {
      state.lastLoginUsername = action.payload;
    },
  },
  extraReducers: builder => {
    // 初始化认证状态
    builder
      .addCase(initializeAuth.pending, state => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.session = action.payload.session;
        state.lastLoginUsername = action.payload.lastUsername;
        state.error = null;
        state.errorCode = null;
      })
      .addCase(initializeAuth.rejected, (state, _action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.session = null;
        state.error = '初始化认证状态失败';
      });

    // 用户登录
    builder
      .addCase(loginUser.pending, state => {
        state.isLoggingIn = true;
        state.error = null;
        state.errorCode = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoggingIn = false;
        state.isAuthenticated = true;
        state.session = action.payload.session;
        state.error = null;
        state.errorCode = null;
      })
      .addCase(loginUser.rejected, (state, _action) => {
        state.isLoggingIn = false;
        state.isAuthenticated = false;
        state.session = null;
        state.error = '登录失败';
        state.errorCode = null;
      });

    // 用户注册
    builder
      .addCase(registerUser.pending, state => {
        state.isRegistering = true;
        state.error = null;
        state.errorCode = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isRegistering = false;
        state.isAuthenticated = true;
        state.session = action.payload.session;
        state.error = null;
        state.errorCode = null;
      })
      .addCase(registerUser.rejected, (state, _action) => {
        state.isRegistering = false;
        state.isAuthenticated = false;
        state.session = null;
        state.error = '注册失败';
        state.errorCode = null;
      });

    // 用户注销
    builder
      .addCase(logoutUser.pending, state => {
        state.isLoggingOut = true;
      })
      .addCase(logoutUser.fulfilled, state => {
        state.isLoggingOut = false;
        state.isAuthenticated = false;
        state.session = null;
        state.error = null;
        state.errorCode = null;
      })
      .addCase(logoutUser.rejected, (state, _action) => {
        state.isLoggingOut = false;
        // 即使注销失败，也要清除本地状态
        state.isAuthenticated = false;
        state.session = null;
      });

    // 刷新会话
    builder
      .addCase(refreshSession.fulfilled, (state, action) => {
        state.session = action.payload;
        state.error = null;
        state.errorCode = null;
      })
      .addCase(refreshSession.rejected, (state, _action) => {
        // 会话刷新失败，可能已过期
        state.isAuthenticated = false;
        state.session = null;
        state.error = '会话已过期，请重新登录';
      });

    // 修改密码
    builder
      .addCase(changePassword.pending, state => {
        state.error = null;
        state.errorCode = null;
      })
      .addCase(changePassword.fulfilled, (state, _action) => {
        state.error = null;
        state.errorCode = null;
        // 密码修改成功的提示可以通过其他方式显示
      })
      .addCase(changePassword.rejected, (state, _action) => {
        state.error = '修改密码失败';
        state.errorCode = null;
      });
  },
});

// 导出 actions
export const { clearError, setError, clearAuth, updateSession, setLastLoginUsername } =
  authSlice.actions;

// 选择器
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectAuthErrorCode = (state: { auth: AuthState }) => state.auth.errorCode;
export const selectSession = (state: { auth: AuthState }) => state.auth.session;
export const selectCurrentUser = (state: { auth: AuthState }) => {
  const session = state.auth.session;
  return session
    ? {
        id: session.userId,
        username: session.username,
        role: session.role,
        status: session.status,
      }
    : null;
};
export const selectUserRole = (state: { auth: AuthState }) => state.auth.session?.role || null;
export const selectUserStatus = (state: { auth: AuthState }) => state.auth.session?.status || null;
export const selectIsLoggingIn = (state: { auth: AuthState }) => state.auth.isLoggingIn;
export const selectIsRegistering = (state: { auth: AuthState }) => state.auth.isRegistering;
export const selectIsLoggingOut = (state: { auth: AuthState }) => state.auth.isLoggingOut;
export const selectLastLoginUsername = (state: { auth: AuthState }) => state.auth.lastLoginUsername;

// 导出 reducer
export default authSlice.reducer;
