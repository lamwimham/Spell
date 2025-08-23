/**
 * 权限保护路由组件 - 基于权限的访问控制
 * 集成主题系统，提供统一的权限检查和错误显示
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import {
  PermissionService,
  Permission,
  PermissionContext,
} from '../../services/permissions/permissionService';
import { UserRole } from '../../database/models/User';
import Button from '../ui/Button';

// 权限保护属性接口
interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: Permission;
  requiredRole?: UserRole;
  context?: PermissionContext;
  fallback?: React.ReactNode;
  redirectTo?: string;
  showMessage?: boolean;
}

// 权限错误显示组件
interface PermissionDeniedProps {
  message: string;
  suggestions?: string[];
  onRetry?: () => void;
  onUpgrade?: () => void;
}

const PermissionDenied: React.FC<PermissionDeniedProps> = ({
  message,
  suggestions = [],
  onRetry,
  onUpgrade,
}) => {
  const { colors, textStyles, spacing } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.error + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    iconText: {
      fontSize: 32,
      color: colors.error,
    },
    title: {
      ...textStyles.h3,
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    message: {
      ...textStyles.body1,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    suggestionContainer: {
      backgroundColor: colors.backgroundElevated,
      borderRadius: spacing.sm,
      padding: spacing.md,
      marginBottom: spacing.lg,
      width: '100%',
    },
    suggestionTitle: {
      ...textStyles.button,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    suggestion: {
      ...textStyles.body2,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: spacing.md,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>🔒</Text>
      </View>

      <Text style={styles.title}>权限不足</Text>
      <Text style={styles.message}>{message}</Text>

      {suggestions.length > 0 && (
        <View style={styles.suggestionContainer}>
          <Text style={styles.suggestionTitle}>建议：</Text>
          {suggestions.map((suggestion, index) => (
            <Text key={index} style={styles.suggestion}>
              • {suggestion}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.buttonContainer}>
        {onRetry && <Button title="重试" onPress={onRetry} variant="secondary" />}
        {onUpgrade && <Button title="升级账户" onPress={onUpgrade} variant="primary" />}
      </View>
    </View>
  );
};

/**
 * 权限保护路由组件
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
  requiredRole,
  context,
  fallback,
  showMessage = true,
}) => {
  const { isAuthenticated, currentUser, userRole } = useAuth();
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [permissionMessage, setPermissionMessage] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // 检查权限
  useEffect(() => {
    const checkPermission = async () => {
      // 如果未登录
      if (!isAuthenticated || !currentUser) {
        setPermissionGranted(false);
        setPermissionMessage('请先登录账户');
        setSuggestions(['登录后即可访问此功能']);
        return;
      }

      // 如果指定了必需角色
      if (requiredRole && userRole !== requiredRole) {
        const roleNames = {
          guest: '访客',
          user: '普通用户',
          premium: '高级用户',
          admin: '管理员',
        };

        setPermissionGranted(false);
        setPermissionMessage(`此功能需要${roleNames[requiredRole]}权限`);
        setSuggestions(['请联系管理员升级您的账户权限']);
        return;
      }

      // 如果指定了具体权限
      if (permission) {
        const result = await PermissionService.hasPermission(permission, context);
        setPermissionGranted(result.granted);

        if (!result.granted) {
          setPermissionMessage(result.reason || '权限不足');
          setSuggestions(result.suggestions || []);
        }
        return;
      }

      // 默认允许访问
      setPermissionGranted(true);
    };

    checkPermission();
  }, [isAuthenticated, currentUser, userRole, permission, requiredRole, context]);

  // 重试检查权限
  const handleRetry = () => {
    setPermissionGranted(null);
  };

  // 升级账户（跳转到升级页面）
  const handleUpgrade = () => {
    // TODO: 实现跳转到升级页面的逻辑
    console.log('跳转到账户升级页面');
  };

  // 加载中状态
  if (permissionGranted === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>检查权限中...</Text>
      </View>
    );
  }

  // 权限被拒绝
  if (!permissionGranted) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showMessage) {
      return (
        <PermissionDenied
          message={permissionMessage}
          suggestions={suggestions}
          onRetry={handleRetry}
          onUpgrade={userRole !== 'admin' ? handleUpgrade : undefined}
        />
      );
    }

    return null;
  }

  // 权限通过，渲染子组件
  return <>{children}</>;
};

export default ProtectedRoute;
