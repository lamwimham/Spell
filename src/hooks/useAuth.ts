/**
 * 认证相关 Hooks - 整合认证状态管理和业务逻辑
 * 提供简化的认证操作接口，遵循项目主题系统规范
 */

import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  initializeAuth,
  loginUser,
  registerUser,
  logoutUser,
  refreshSession,
  changePassword,
  clearError,
  selectAuth,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectSession,
  selectCurrentUser,
  selectUserRole,
  selectIsLoggingIn,
  selectIsRegistering,
  selectLastLoginUsername,
} from '../store/authSlice';
import {
  loadUserProfile,
  loadUserStats,
  clearUserData,
  selectUserProfile,
} from '../store/userSlice';
import { LoginData, RegisterData } from '../services/auth/authService';
import { UserRole } from '../database/models/User';

/**
 * useAuth Hook - 认证状态管理
 */
export function useAuth() {
  const dispatch = useDispatch();

  // 选择器
  const auth = useSelector(selectAuth);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const session = useSelector(selectSession);
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const isLoggingIn = useSelector(selectIsLoggingIn);
  const isRegistering = useSelector(selectIsRegistering);
  const lastLoginUsername = useSelector(selectLastLoginUsername);
  const userProfile = useSelector(selectUserProfile);

  // 初始化认证状态
  const initialize = useCallback(async () => {
    dispatch(initializeAuth() as any);
  }, [dispatch]);

  // 用户登录
  const login = useCallback(
    async (loginData: LoginData) => {
      const result = await dispatch(loginUser(loginData) as any);

      if (loginUser.fulfilled.match(result)) {
        // 登录成功后加载用户详细信息
        if (result.payload.session) {
          dispatch(loadUserProfile(result.payload.session.userId) as any);
          dispatch(loadUserStats(result.payload.session.userId) as any);
        }
      }

      return result;
    },
    [dispatch],
  );

  // 用户注册
  const register = useCallback(
    async (registerData: RegisterData) => {
      const result = await dispatch(registerUser(registerData) as any);

      if (registerUser.fulfilled.match(result)) {
        // 注册成功后加载用户详细信息
        if (result.payload.session) {
          dispatch(loadUserProfile(result.payload.session.userId) as any);
          dispatch(loadUserStats(result.payload.session.userId) as any);
        }
      }

      return result;
    },
    [dispatch],
  );

  // 用户注销
  const logout = useCallback(async () => {
    await dispatch(logoutUser() as any);
    dispatch(clearUserData());
  }, [dispatch]);

  // 刷新会话
  const refresh = useCallback(async () => {
    return await dispatch(refreshSession() as any);
  }, [dispatch]);

  // 修改密码
  const updatePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      return await dispatch(changePassword({ currentPassword, newPassword }) as any);
    },
    [dispatch],
  );

  // 清除错误
  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // 检查用户权限
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!userProfile) return false;

      // 基于角色的权限检查
      const rolePermissions: Record<UserRole, string[]> = {
        admin: ['*'], // 管理员拥有所有权限
        premium: ['read', 'write', 'ai_enhanced', 'export'],
        user: ['read', 'write', 'ai_basic'],
        guest: ['read'],
      };

      const permissions = rolePermissions[userProfile.role] || [];
      return permissions.includes('*') || permissions.includes(permission);
    },
    [userProfile],
  );

  // 检查用户角色
  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return userRole === role;
    },
    [userRole],
  );

  // 检查是否为管理员
  const isAdmin = useCallback((): boolean => {
    return userRole === 'admin';
  }, [userRole]);

  // 检查是否为高级用户
  const isPremium = useCallback((): boolean => {
    return userRole === 'premium' || userRole === 'admin';
  }, [userRole]);

  // 获取用户显示名称
  const getDisplayName = useCallback((): string => {
    if (!currentUser) return '未登录';
    return currentUser.username || '未知用户';
  }, [currentUser]);

  // 自动初始化
  useEffect(() => {
    initialize();
  }, [initialize]);

  // 自动刷新会话（每30分钟）
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      refresh();
    }, 30 * 60 * 1000); // 30分钟

    return () => clearInterval(interval);
  }, [isAuthenticated, refresh]);

  return {
    // 状态
    isAuthenticated,
    isLoading,
    error,
    session,
    currentUser,
    userRole,
    isLoggingIn,
    isRegistering,
    lastLoginUsername,

    // 操作
    initialize,
    login,
    register,
    logout,
    refresh,
    updatePassword,
    clearAuthError,

    // 权限检查
    hasPermission,
    hasRole,
    isAdmin,
    isPremium,
    getDisplayName,
  };
}

/**
 * useUser Hook - 用户信息管理
 */
export function useUser() {
  const dispatch = useDispatch();
  const { currentUser, isAuthenticated } = useAuth();

  // 选择器
  const userProfile = useSelector(selectUserProfile);

  // 加载用户资料
  const loadProfile = useCallback(
    async (userId?: string) => {
      const targetUserId = userId || currentUser?.id;
      if (targetUserId) {
        return await dispatch(loadUserProfile(targetUserId) as any);
      }
    },
    [dispatch, currentUser],
  );

  // 加载用户统计
  const loadStats = useCallback(
    async (userId?: string) => {
      const targetUserId = userId || currentUser?.id;
      if (targetUserId) {
        return await dispatch(loadUserStats(targetUserId) as any);
      }
    },
    [dispatch, currentUser],
  );

  // 自动加载当前用户信息
  useEffect(() => {
    if (isAuthenticated && currentUser && !userProfile) {
      loadProfile();
      loadStats();
    }
  }, [isAuthenticated, currentUser, userProfile, loadProfile, loadStats]);

  return {
    // 状态
    userProfile,
    currentUser,
    isAuthenticated,

    // 操作
    loadProfile,
    loadStats,
  };
}

/**
 * useUserSettings Hook - 用户设置管理（预留）
 */
export function useUserSettings() {
  // 这里可以实现用户设置相关的逻辑
  // 目前作为预留接口

  const getUserSetting = useCallback((key: string) => {
    // TODO: 实现获取用户设置
    return null;
  }, []);

  const setUserSetting = useCallback((key: string, value: any) => {
    // TODO: 实现设置用户设置
    return Promise.resolve();
  }, []);

  return {
    getUserSetting,
    setUserSetting,
  };
}
