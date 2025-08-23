/**
 * 注册表单组件 - 用户注册界面
 * 集成密码强度检查、表单验证和主题系统
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { PasswordService, PasswordStrength } from '../../services/auth/passwordService';
import InputText from '../ui/InputText';
import Button from '../ui/Button';

// 注册表单属性接口
interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  allowRoleSelection?: boolean;
}

/**
 * 注册表单组件
 */
const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
  allowRoleSelection: _allowRoleSelection = false,
}) => {
  const { register, isRegistering, error, clearAuthError } = useAuth();
  const { colors, textStyles, spacing } = useTheme();

  // 表单状态
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 验证状态
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // 密码强度检查
  const passwordValidation = useMemo(() => {
    if (!password) return null;
    return PasswordService.validatePassword(password);
  }, [password]);

  // 样式
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: spacing.lg,
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
    passwordStrengthContainer: {
      marginTop: spacing.sm,
      padding: spacing.md,
      backgroundColor: colors.backgroundElevated,
      borderRadius: spacing.sm,
    },
    strengthHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    strengthLabel: {
      ...textStyles.body2,
      color: colors.text,
    },
    strengthValue: {
      ...textStyles.caption,
      fontWeight: '600',
    },
    strengthBar: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      marginBottom: spacing.sm,
    },
    strengthProgress: {
      height: '100%',
      borderRadius: 2,
    },
    requirementsList: {
      gap: spacing.xs,
    },
    requirement: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    requirementIcon: {
      width: 16,
      height: 16,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    requirementText: {
      ...textStyles.caption,
      flex: 1,
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
    if (value.length < 3 || value.length > 20) {
      return '用户名长度应为3-20个字符';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return '用户名只能包含字母、数字和下划线';
    }
    return '';
  };

  // 验证邮箱
  const validateEmail = (value: string): string => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return '邮箱格式不正确';
    }
    return '';
  };

  // 验证确认密码
  const validateConfirmPassword = (value: string): string => {
    if (!value) {
      return '请确认密码';
    }
    if (value !== password) {
      return '两次输入的密码不一致';
    }
    return '';
  };

  // 处理表单字段变化
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (usernameError) {
      setUsernameError(validateUsername(value));
    }
    clearAuthError();
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) {
      setEmailError(validateEmail(value));
    }
    clearAuthError();
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (passwordError) {
      const validation = PasswordService.validatePassword(value);
      setPasswordError(validation.isValid ? '' : validation.feedback.join('；'));
    }
    // 重新验证确认密码
    if (confirmPassword) {
      setConfirmPasswordError(validateConfirmPassword(confirmPassword));
    }
    clearAuthError();
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (confirmPasswordError) {
      setConfirmPasswordError(validateConfirmPassword(value));
    }
    clearAuthError();
  };

  // 处理表单提交
  const handleSubmit = async () => {
    // 验证所有字段
    const usernameErr = validateUsername(username);
    const emailErr = validateEmail(email);
    const passwordValidation = PasswordService.validatePassword(password);
    const passwordErr = passwordValidation.isValid ? '' : passwordValidation.feedback.join('；');
    const confirmPasswordErr = validateConfirmPassword(confirmPassword);

    setUsernameError(usernameErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmPasswordErr);

    if (usernameErr || emailErr || passwordErr || confirmPasswordErr) {
      return;
    }

    try {
      const result = await register({
        username: username.trim(),
        email: email.trim() || undefined,
        password,
        confirmPassword,
      });

      if (result.type === 'auth/register/fulfilled') {
        onSuccess?.();
      }
    } catch (err) {
      console.error('注册失败:', err);
    }
  };

  // 获取密码强度颜色
  const getStrengthColor = (strength: PasswordStrength): string => {
    return PasswordService.getPasswordStrengthColor(strength);
  };

  // 获取密码强度进度
  const getStrengthProgress = (score: number): number => {
    return Math.max(0, Math.min(100, score));
  };

  // 密码要求检查
  const renderPasswordRequirements = () => {
    if (!passwordValidation) return null;

    const requirements = [
      { key: 'minLength', label: '至少8个字符', met: passwordValidation.requirements.minLength },
      {
        key: 'hasUppercase',
        label: '包含大写字母',
        met: passwordValidation.requirements.hasUppercase,
      },
      {
        key: 'hasLowercase',
        label: '包含小写字母',
        met: passwordValidation.requirements.hasLowercase,
      },
      { key: 'hasNumber', label: '包含数字', met: passwordValidation.requirements.hasNumber },
      {
        key: 'hasSpecialChar',
        label: '包含特殊字符',
        met: passwordValidation.requirements.hasSpecialChar,
      },
    ];

    return (
      <View style={styles.passwordStrengthContainer}>
        <View style={styles.strengthHeader}>
          <Text style={styles.strengthLabel}>密码强度</Text>
          <Text
            style={[styles.strengthValue, { color: getStrengthColor(passwordValidation.strength) }]}
          >
            {PasswordService.getPasswordStrengthDescription(passwordValidation.strength)}
          </Text>
        </View>

        <View style={styles.strengthBar}>
          <View
            style={[
              styles.strengthProgress,
              {
                backgroundColor: getStrengthColor(passwordValidation.strength),
                width: `${getStrengthProgress(passwordValidation.score)}%`,
              },
            ]}
          />
        </View>

        <View style={styles.requirementsList}>
          {requirements.map(req => (
            <View key={req.key} style={styles.requirement}>
              <View
                style={[
                  styles.requirementIcon,
                  {
                    backgroundColor: req.met ? colors.success : colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: req.met ? colors.background : colors.textSecondary,
                    fontSize: 10,
                  }}
                >
                  {req.met ? '✓' : '○'}
                </Text>
              </View>
              <Text
                style={[
                  styles.requirementText,
                  { color: req.met ? colors.success : colors.textSecondary },
                ]}
              >
                {req.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.scrollContent}>
        {/* 头部 */}
        <View style={styles.header}>
          <Text style={styles.title}>创建账户</Text>
          <Text style={styles.subtitle}>注册新的Spell账户</Text>
        </View>

        {/* 错误信息 */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorMessage}>{error}</Text>
          </View>
        )}

        {/* 表单 */}
        <View style={styles.form}>
          {/* 用户名 */}
          <View style={styles.inputContainer}>
            <InputText
              label="用户名 *"
              value={username}
              onChangeText={handleUsernameChange}
              placeholder="请输入用户名"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isRegistering}
              error={!!usernameError}
            />
            {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
          </View>

          {/* 邮箱 */}
          <View style={styles.inputContainer}>
            <InputText
              label="邮箱（可选）"
              value={email}
              onChangeText={handleEmailChange}
              placeholder="请输入邮箱地址"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isRegistering}
              error={!!emailError}
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          {/* 密码 */}
          <View style={styles.inputContainer}>
            <InputText
              label="密码 *"
              value={password}
              onChangeText={handlePasswordChange}
              placeholder="请输入密码"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isRegistering}
              error={!!passwordError}
              rightIcon={showPassword ? 'eye-off' : 'eye'}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            {renderPasswordRequirements()}
          </View>

          {/* 确认密码 */}
          <View style={styles.inputContainer}>
            <InputText
              label="确认密码 *"
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              placeholder="请再次输入密码"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isRegistering}
              error={!!confirmPasswordError}
              rightIcon={showConfirmPassword ? 'eye-off' : 'eye'}
              onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
            />
            {confirmPasswordError ? (
              <Text style={styles.errorText}>{confirmPasswordError}</Text>
            ) : null}
          </View>

          {/* 注册按钮 */}
          <View style={styles.buttonContainer}>
            <Button
              title="注册"
              onPress={handleSubmit}
              loading={isRegistering}
              disabled={
                isRegistering ||
                !username.trim() ||
                !password ||
                !confirmPassword ||
                !passwordValidation?.isValid
              }
              variant="primary"
            />
          </View>

          {/* 切换到登录 */}
          {onSwitchToLogin && (
            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>已有账户？</Text>
              <TouchableOpacity onPress={onSwitchToLogin} disabled={isRegistering}>
                <Text style={styles.switchButton}>立即登录</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default RegisterForm;
