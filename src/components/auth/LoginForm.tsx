/**
 * 登录表单组件 - 用户登录界面
 * 完全集成主题系统，提供优秀的用户体验和错误处理
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { InputText } from '../ui/InputText';
import { Button } from '../ui/Button';
import { ToggleSwitch } from '../ui/ToggleSwitch';

// 登录表单属性接口
interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  showRememberMe?: boolean;
  showForgotPassword?: boolean;
}

/**
 * 登录表单组件
 */
const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
  showRememberMe = true,
  showForgotPassword = true,
}) => {
  const { login, isLoggingIn, error, clearAuthError, lastLoginUsername } = useAuth();
  const { colors, textStyles, spacing } = useTheme();

  // 表单状态
  const [username, setUsername] = useState(lastLoginUsername || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 表单验证状态
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 样式
  const styles = StyleSheet.create({
    container: {
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    title: {
      ...textStyles.h2,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...textStyles.body2,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    form: {
      gap: spacing.md,
    },
    inputContainer: {
      marginBottom: spacing.sm,
    },
    errorText: {
      ...textStyles.caption,
      color: colors.error,
      marginTop: spacing.xs,
    },
    optionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: spacing.md,
    },
    rememberMeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    rememberMeText: {
      ...textStyles.body2,
      color: colors.textSecondary,
    },
    forgotPasswordText: {
      ...textStyles.body2,
      color: colors.primary,
    },
    buttonContainer: {
      marginTop: spacing.lg,
      gap: spacing.md,
    },
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.xl,
      gap: spacing.xs,
    },
    switchText: {
      ...textStyles.body2,
      color: colors.textSecondary,
    },
    switchButton: {
      ...textStyles.body2,
      color: colors.primary,
      fontWeight: '600',
    },
    errorContainer: {
      backgroundColor: colors.error + '15',
      borderRadius: spacing.sm,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
    },
    errorMessage: {
      ...textStyles.body2,
      color: colors.error,
    },
  });

  // 清除错误信息
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearAuthError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearAuthError]);

  // 验证用户名
  const validateUsername = (value: string): string => {
    if (!value.trim()) {
      return '请输入用户名';
    }
    if (value.length < 3) {
      return '用户名至少需要3个字符';
    }
    return '';
  };

  // 验证密码
  const validatePassword = (value: string): string => {
    if (!value) {
      return '请输入密码';
    }
    return '';
  };

  // 处理用户名变化
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (usernameError) {
      setUsernameError(validateUsername(value));
    }
    clearAuthError();
  };

  // 处理密码变化
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (passwordError) {
      setPasswordError(validatePassword(value));
    }
    clearAuthError();
  };

  // 处理表单提交
  const handleSubmit = async () => {
    // 验证表单
    const usernameErr = validateUsername(username);
    const passwordErr = validatePassword(password);

    setUsernameError(usernameErr);
    setPasswordError(passwordErr);

    if (usernameErr || passwordErr) {
      return;
    }

    try {
      const result = await login({
        username: username.trim(),
        password,
        rememberMe,
      });

      if (result.type === 'auth/login/fulfilled') {
        onSuccess?.();
      }
    } catch (err) {
      console.error('登录失败:', err);
    }
  };

  // 处理忘记密码
  const handleForgotPassword = () => {
    Alert.alert('忘记密码', '密码重置功能正在开发中，请联系管理员重置密码。', [
      { text: '确定', style: 'default' },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.title}>欢迎回来</Text>
        <Text style={styles.subtitle}>登录您的Spell账户</Text>
      </View>

      {/* 错误信息 */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      )}

      {/* 表单 */}
      <View style={styles.form}>
        {/* 用户名输入 */}
        <View style={styles.inputContainer}>
          <InputText
            label="用户名"
            value={username}
            onChangeText={handleUsernameChange}
            placeholder="请输入用户名"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoggingIn}
            error={!!usernameError}
          />
          {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
        </View>

        {/* 密码输入 */}
        <View style={styles.inputContainer}>
          <InputText
            label="密码"
            value={password}
            onChangeText={handlePasswordChange}
            placeholder="请输入密码"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoggingIn}
            error={!!passwordError}
            rightIcon={showPassword ? 'eye-off' : 'eye'}
            onRightIconPress={() => setShowPassword(!showPassword)}
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>

        {/* 选项 */}
        <View style={styles.optionsContainer}>
          {showRememberMe && (
            <View style={styles.rememberMeContainer}>
              <ToggleSwitch
                value={rememberMe}
                onValueChange={setRememberMe}
                disabled={isLoggingIn}
              />
              <Text style={styles.rememberMeText}>记住我</Text>
            </View>
          )}

          {showForgotPassword && (
            <TouchableOpacity onPress={handleForgotPassword} disabled={isLoggingIn}>
              <Text style={styles.forgotPasswordText}>忘记密码？</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 登录按钮 */}
        <View style={styles.buttonContainer}>
          <Button
            title="登录"
            onPress={handleSubmit}
            loading={isLoggingIn}
            disabled={isLoggingIn || !username.trim() || !password}
            variant="primary"
          />
        </View>

        {/* 切换到注册 */}
        {onSwitchToRegister && (
          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>还没有账户？</Text>
            <TouchableOpacity onPress={onSwitchToRegister} disabled={isLoggingIn}>
              <Text style={styles.switchButton}>立即注册</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default LoginForm;
