/**
 * 用户信息状态管理 - Redux Toolkit Slice
 * 管理用户详细信息、设置、统计数据等用户相关状态
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserRepository, UserData } from '../database/repositories/UserRepository';
import { CheckInRepository, CheckInStats } from '../database/repositories/CheckInRepository';
import { AiUsageRepository, AiUsageStats } from '../database/repositories/AiUsageRepository';
import { UserQuotaRepository, QuotaSummary } from '../database/repositories/UserQuotaRepository';
import { UserRole, UserStatus } from '../database/models/User';

// 用户详细信息接口
export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  status: UserStatus;
  role: UserRole;
  lastLoginAt?: number;
  createdAt: Date;
  updatedAt: Date;
}

// 用户统计数据接口
export interface UserStatsData {
  checkInStats: CheckInStats;
  aiUsageStats: AiUsageStats;
  quotaSummary: QuotaSummary[];
}

// 用户状态接口
export interface UserState {
  // 用户信息
  profile: UserProfile | null;
  isLoading: boolean;

  // 用户统计
  stats: UserStatsData | null;
  isLoadingStats: boolean;

  // 错误信息
  error: string | null;

  // 操作状态
  isUpdatingProfile: boolean;
  isChangingPassword: boolean;

  // 缓存标志
  lastUpdated: number | null;
}

// 初始状态
const initialState: UserState = {
  profile: null,
  isLoading: false,
  stats: null,
  isLoadingStats: false,
  error: null,
  isUpdatingProfile: false,
  isChangingPassword: false,
  lastUpdated: null,
};

// 异步操作：加载用户资料
export const loadUserProfile = createAsyncThunk(
  'user/loadProfile',
  async (userId: string, { rejectWithValue }) => {
    try {
      const user = await UserRepository.getById(userId);

      const profile: UserProfile = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        status: user.status,
        role: user.role,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return profile;
    } catch (error) {
      return rejectWithValue('加载用户资料失败');
    }
  },
);

// 异步操作：更新用户资料
export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (
    { userId, updates }: { userId: string; updates: Partial<UserData> },
    { rejectWithValue },
  ) => {
    try {
      await UserRepository.update(userId, updates);
      const updatedUser = await UserRepository.getById(userId);

      const profile: UserProfile = {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatarUrl: updatedUser.avatarUrl,
        status: updatedUser.status,
        role: updatedUser.role,
        lastLoginAt: updatedUser.lastLoginAt,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };

      return profile;
    } catch (error) {
      return rejectWithValue('更新用户资料失败');
    }
  },
);

// 异步操作：加载用户统计数据
export const loadUserStats = createAsyncThunk(
  'user/loadStats',
  async (userId: string, { rejectWithValue }) => {
    try {
      const [checkInStats, aiUsageStats, quotaSummary] = await Promise.all([
        CheckInRepository.getUserStats(userId),
        AiUsageRepository.getUserStats(userId),
        UserQuotaRepository.getUserQuotaSummary(userId),
      ]);

      const stats: UserStatsData = {
        checkInStats,
        aiUsageStats,
        quotaSummary,
      };

      return stats;
    } catch (error) {
      return rejectWithValue('加载用户统计数据失败');
    }
  },
);

// 异步操作：刷新配额数据
export const refreshUserQuotas = createAsyncThunk(
  'user/refreshQuotas',
  async (userId: string, { rejectWithValue }) => {
    try {
      // 自动重置过期配额
      await UserQuotaRepository.autoResetExpiredQuotas();

      // 获取最新配额摘要
      const quotaSummary = await UserQuotaRepository.getUserQuotaSummary(userId);

      return quotaSummary;
    } catch (error) {
      return rejectWithValue('刷新配额数据失败');
    }
  },
);

// 异步操作：上传头像
export const uploadAvatar = createAsyncThunk(
  'user/uploadAvatar',
  async ({ userId, avatarUri }: { userId: string; avatarUri: string }, { rejectWithValue }) => {
    try {
      // 这里应该实现头像上传逻辑
      // 目前只是更新数据库中的头像URL
      await UserRepository.update(userId, { avatarUrl: avatarUri });

      return avatarUri;
    } catch (error) {
      return rejectWithValue('头像上传失败');
    }
  },
);

// 创建用户 slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // 清除错误信息
    clearError: state => {
      state.error = null;
    },

    // 设置错误信息
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },

    // 清除用户数据
    clearUserData: state => {
      state.profile = null;
      state.stats = null;
      state.error = null;
      state.lastUpdated = null;
    },

    // 更新用户资料的部分字段
    updateProfileField: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },

    // 更新统计数据的部分字段
    updateStatsField: (state, action: PayloadAction<Partial<UserStatsData>>) => {
      if (state.stats) {
        state.stats = { ...state.stats, ...action.payload };
      }
    },

    // 设置最后更新时间
    setLastUpdated: state => {
      state.lastUpdated = Date.now();
    },
  },
  extraReducers: builder => {
    // 加载用户资料
    builder
      .addCase(loadUserProfile.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(loadUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // 更新用户资料
    builder
      .addCase(updateUserProfile.pending, state => {
        state.isUpdatingProfile = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isUpdatingProfile = false;
        state.profile = action.payload;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isUpdatingProfile = false;
        state.error = action.payload as string;
      });

    // 加载用户统计数据
    builder
      .addCase(loadUserStats.pending, state => {
        state.isLoadingStats = true;
        state.error = null;
      })
      .addCase(loadUserStats.fulfilled, (state, action) => {
        state.isLoadingStats = false;
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(loadUserStats.rejected, (state, action) => {
        state.isLoadingStats = false;
        state.error = action.payload as string;
      });

    // 刷新用户配额
    builder
      .addCase(refreshUserQuotas.fulfilled, (state, action) => {
        if (state.stats) {
          state.stats.quotaSummary = action.payload;
        }
        state.error = null;
      })
      .addCase(refreshUserQuotas.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // 上传头像
    builder
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.avatarUrl = action.payload;
          state.lastUpdated = Date.now();
        }
        state.error = null;
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

// 导出 actions
export const {
  clearError,
  setError,
  clearUserData,
  updateProfileField,
  updateStatsField,
  setLastUpdated,
} = userSlice.actions;

// 选择器
export const selectUser = (state: { user: UserState }) => state.user;
export const selectUserProfile = (state: { user: UserState }) => state.user.profile;
export const selectUserStats = (state: { user: UserState }) => state.user.stats;
export const selectUserLoading = (state: { user: UserState }) => state.user.isLoading;
export const selectUserStatsLoading = (state: { user: UserState }) => state.user.isLoadingStats;
export const selectUserError = (state: { user: UserState }) => state.user.error;
export const selectIsUpdatingProfile = (state: { user: UserState }) => state.user.isUpdatingProfile;
export const selectUserLastUpdated = (state: { user: UserState }) => state.user.lastUpdated;

// 复合选择器
export const selectUserDisplayName = (state: { user: UserState }) => {
  const profile = state.user.profile;
  return profile ? profile.username || profile.email || '未知用户' : '未登录';
};

export const selectUserAvatarUrl = (state: { user: UserState }) => {
  const profile = state.user.profile;
  return (
    profile?.avatarUrl ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.username || 'user'}`
  );
};

export const selectUserRole = (state: { user: UserState }) => {
  return state.user.profile?.role || null;
};

export const selectUserStatus = (state: { user: UserState }) => {
  return state.user.profile?.status || null;
};

export const selectIsUserActive = (state: { user: UserState }) => {
  return state.user.profile?.status === 'active';
};

export const selectIsUserAdmin = (state: { user: UserState }) => {
  return state.user.profile?.role === 'admin';
};

export const selectIsUserPremium = (state: { user: UserState }) => {
  const role = state.user.profile?.role;
  return role === 'premium' || role === 'admin';
};

// 导出 reducer
export default userSlice.reducer;
