/**
 * 角色权限守卫组件 - 基于用户角色的访问控制
 * 简化的权限检查组件，专门用于角色级别的权限控制
 */

import React from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { UserRole } from '../../database/models/User';

// 角色守卫属性接口
interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
  requireLogin?: boolean;
  hideWhenDenied?: boolean;
}

/**
 * 角色权限守卫组件
 */
const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback,
  requireLogin = true,
  hideWhenDenied = false,
}) => {
  const { isAuthenticated, userRole } = useAuth();
  const { colors, textStyles, spacing } = useTheme();

  // 检查是否需要登录
  if (requireLogin && !isAuthenticated) {
    if (hideWhenDenied) {
      return null;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <View
        style={{
          padding: spacing.md,
          backgroundColor: colors.backgroundElevated,
          borderRadius: spacing.sm,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            ...textStyles.body2,
            color: colors.textSecondary,
            textAlign: 'center',
          }}
        >
          请登录后查看此内容
        </Text>
      </View>
    );
  }

  // 检查角色权限
  if (userRole && !allowedRoles.includes(userRole)) {
    if (hideWhenDenied) {
      return null;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    const roleNames: Record<UserRole, string> = {
      guest: '访客',
      user: '普通用户',
      premium: '高级用户',
      admin: '管理员',
    };

    const allowedRoleNames = allowedRoles.map(role => roleNames[role]).join('、');

    return (
      <View
        style={{
          padding: spacing.md,
          backgroundColor: colors.backgroundElevated,
          borderRadius: spacing.sm,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            ...textStyles.body2,
            color: colors.textSecondary,
            textAlign: 'center',
          }}
        >
          此功能仅限{allowedRoleNames}使用
        </Text>
      </View>
    );
  }

  // 权限通过，渲染子组件
  return <>{children}</>;
};

export default RoleGuard;
