/**
 * 打卡按钮组件 - 简洁的每日打卡操作界面
 * 集成主题系统，支持不同打卡类型和状态显示
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { CheckInService, CheckInType } from '../../services/checkin/checkinService';

// 打卡按钮属性接口
interface CheckinButtonProps {
  type?: CheckInType;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  onCheckInSuccess?: (result: any) => void;
  onCheckInError?: (error: string) => void;
  showStreak?: boolean;
  customNote?: string;
}

/**
 * 打卡按钮组件
 */
const CheckinButton: React.FC<CheckinButtonProps> = ({
  type = 'daily',
  size = 'medium',
  variant = 'primary',
  disabled = false,
  onCheckInSuccess,
  onCheckInError,
  showStreak = true,
  customNote,
}) => {
  const { colors, textStyles, spacing } = useTheme();
  const { session, isAuthenticated } = useAuth();

  // 状态管理
  const [loading, setLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // 样式配置
  const sizeConfig = {
    small: { padding: spacing.sm, minWidth: 80, minHeight: 40 },
    medium: { padding: spacing.md, minWidth: 120, minHeight: 50 },
    large: { padding: spacing.lg, minWidth: 160, minHeight: 60 },
  };

  const variantConfig = {
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      textColor: colors.background,
    },
    secondary: {
      backgroundColor: colors.backgroundElevated,
      borderColor: colors.border,
      textColor: colors.text,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: colors.primary,
      textColor: colors.primary,
    },
  };

  // 获取按钮样式
  const getButtonStyle = () => {
    const config = variantConfig[variant];
    const sizeStyle = sizeConfig[size];

    return {
      ...sizeStyle,
      backgroundColor: isCheckedIn
        ? colors.success
        : disabled
        ? colors.border
        : config.backgroundColor,
      borderColor: isCheckedIn ? colors.success : disabled ? colors.border : config.borderColor,
      borderWidth: variant === 'outline' ? 1 : 0,
    };
  };

  const getTextColor = () => {
    if (disabled) return colors.textSecondary;
    if (isCheckedIn) return colors.background;
    return variantConfig[variant].textColor;
  };

  // 样式
  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      gap: spacing.sm,
    },
    button: {
      borderRadius: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      ...getButtonStyle(),
    },
    buttonText: {
      ...textStyles.button,
      color: getTextColor(),
      fontSize: size === 'large' ? 18 : size === 'medium' ? 16 : 14,
    },
    streakContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    streakText: {
      ...textStyles.caption,
      color: colors.textSecondary,
    },
    streakNumber: {
      ...textStyles.caption,
      color: colors.primary,
      fontWeight: '600',
    },
    statusIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.xs,
    },
    statusText: {
      fontSize: 12,
      color: colors.background,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    disabledText: {
      ...textStyles.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
  });

  // 检查今日打卡状态
  const checkTodayStatus = useCallback(async () => {
    if (!session?.userId || !isAuthenticated) {
      setCheckingStatus(false);
      return;
    }

    try {
      setCheckingStatus(true);
      const [checkedIn, stats] = await Promise.all([
        CheckInService.isTodayCheckedIn(session.userId, type),
        CheckInService.getUserStats(session.userId, type),
      ]);

      setIsCheckedIn(checkedIn);
      setCurrentStreak(stats.currentStreak);
    } catch (error) {
      console.error('检查打卡状态失败:', error);
    } finally {
      setCheckingStatus(false);
    }
  }, [session?.userId, isAuthenticated, type]);

  // 处理打卡操作
  const handleCheckIn = async () => {
    if (!session?.userId || !isAuthenticated) {
      Alert.alert('提示', '请先登录');
      return;
    }

    if (isCheckedIn) {
      Alert.alert('提示', '今日已完成打卡');
      return;
    }

    Alert.alert('确认打卡', `确定要进行${getTypeDisplayName(type)}打卡吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '确定', onPress: performCheckIn },
    ]);
  };

  // 执行打卡
  const performCheckIn = async () => {
    if (!session?.userId) return;

    setLoading(true);
    try {
      const result = await CheckInService.checkIn({
        userId: session.userId,
        type,
        note: customNote,
      });

      if (result.success) {
        setIsCheckedIn(true);
        setCurrentStreak(prev => prev + 1);

        Alert.alert('恭喜', result.message, [
          { text: '好的', onPress: () => onCheckInSuccess?.(result.checkIn) },
        ]);
      } else {
        Alert.alert('打卡失败', result.message);
        onCheckInError?.(result.message);
      }
    } catch (error) {
      const errorMessage = '打卡失败，请稍后重试';
      Alert.alert('错误', errorMessage);
      onCheckInError?.(errorMessage);
      console.error('打卡操作失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取打卡类型显示名称
  const getTypeDisplayName = (checkInType: CheckInType): string => {
    const names = {
      daily: '每日',
      study: '学习',
      exercise: '运动',
      work: '工作',
      custom: '自定义',
    };
    return names[checkInType] || checkInType;
  };

  // 获取按钮文字
  const getButtonText = (): string => {
    if (loading) return '处理中...';
    if (isCheckedIn) return '已打卡';
    return `${getTypeDisplayName(type)}打卡`;
  };

  // 获取状态图标
  const renderStatusIcon = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={getTextColor()} />;
    }

    if (isCheckedIn) {
      return (
        <View style={[styles.statusIcon, { backgroundColor: colors.success }]}>
          <Text style={styles.statusText}>✓</Text>
        </View>
      );
    }

    return null;
  };

  // 组件挂载时检查状态
  useEffect(() => {
    checkTodayStatus();
  }, [checkTodayStatus]);

  // 如果正在检查状态，显示加载状态
  if (checkingStatus) {
    return (
      <View style={styles.container}>
        <View style={[styles.button, { backgroundColor: colors.backgroundElevated }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.buttonText, { color: colors.textSecondary }]}>检查状态...</Text>
          </View>
        </View>
      </View>
    );
  }

  // 未登录状态
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={[styles.button, { backgroundColor: colors.border }]}>
          <Text style={[styles.buttonText, { color: colors.textSecondary }]}>请先登录</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handleCheckIn}
        disabled={disabled || loading || isCheckedIn}
        activeOpacity={0.7}
      >
        <View style={styles.loadingContainer}>
          {renderStatusIcon()}
          <Text style={styles.buttonText}>{getButtonText()}</Text>
        </View>
      </TouchableOpacity>

      {/* 连续天数显示 */}
      {showStreak && currentStreak > 0 && (
        <View style={styles.streakContainer}>
          <Text style={styles.streakText}>连续</Text>
          <Text style={styles.streakNumber}>{currentStreak}</Text>
          <Text style={styles.streakText}>天</Text>
        </View>
      )}

      {/* 禁用状态说明 */}
      {disabled && <Text style={styles.disabledText}>暂时无法打卡</Text>}
    </View>
  );
};

export default CheckinButton;
