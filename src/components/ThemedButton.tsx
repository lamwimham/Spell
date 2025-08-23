import React from 'react';
import {
  TouchableOpacity,
  Text,
  // StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface ThemedButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  textStyle?: TextStyle;
}

/**
 * 主题化按钮组件
 * 自动应用主题样式的按钮组件，支持不同变体和尺寸
 */
export const ThemedButton: React.FC<ThemedButtonProps> = ({
  label,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  disabled,
  ...props
}) => {
  const theme = useTheme();

  // 根据变体确定按钮样式
  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.spacing.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    };

    // 根据尺寸设置内边距
    switch (size) {
      case 'small':
        baseStyle.paddingVertical = theme.spacing.xs;
        baseStyle.paddingHorizontal = theme.spacing.md;
        break;
      case 'large':
        baseStyle.paddingVertical = theme.spacing.md;
        baseStyle.paddingHorizontal = theme.spacing.lg;
        break;
      default: // medium
        baseStyle.paddingVertical = theme.spacing.sm;
        baseStyle.paddingHorizontal = theme.spacing.md;
    }

    // 根据变体设置颜色和边框
    switch (variant) {
      case 'secondary':
        baseStyle.backgroundColor = theme.colors.buttonSecondary;
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = theme.colors.primary;
        break;
      case 'text':
        baseStyle.backgroundColor = 'transparent';
        break;
      default: // primary
        baseStyle.backgroundColor = theme.colors.buttonPrimary;
        // 添加阴影
        Object.assign(baseStyle, theme.shadows.light);
    }

    // 如果禁用，应用禁用样式
    if (disabled) {
      baseStyle.opacity = 0.5;
    }

    // 如果是全宽按钮
    if (fullWidth) {
      baseStyle.width = '100%';
    }

    return baseStyle;
  };

  // 根据变体确定文本样式
  const getTextStyles = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontFamily: theme.typography.fontFamily.primary,
      fontSize: theme.typography.sizes.base,
      fontWeight: theme.typography.weights.medium as TextStyle['fontWeight'],
      textAlign: 'center',
    };

    // 根据尺寸调整字体大小
    switch (size) {
      case 'small':
        baseTextStyle.fontSize = theme.typography.sizes.sm;
        break;
      case 'large':
        baseTextStyle.fontSize = theme.typography.sizes.md;
        break;
    }

    // 根据变体设置文本颜色
    switch (variant) {
      case 'secondary':
        baseTextStyle.color = theme.colors.buttonSecondaryText;
        break;
      case 'outline':
      case 'text':
        baseTextStyle.color = theme.colors.primary;
        break;
      default: // primary
        baseTextStyle.color = theme.colors.buttonText;
    }

    return baseTextStyle;
  };

  // 计算图标与文本之间的间距
  const iconSpacing = size === 'small' ? theme.spacing.xs : theme.spacing.sm;

  return (
    <TouchableOpacity
      style={[getButtonStyles(), style]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size={size === 'small' ? 'small' : 'small'}
          color={variant === 'primary' ? theme.colors.buttonText : theme.colors.primary}
        />
      ) : (
        <>
          {leftIcon && (
            <React.Fragment>
              {leftIcon}
              <RNView style={{ width: iconSpacing }} />
            </React.Fragment>
          )}
          <Text style={[getTextStyles(), textStyle]}>{label}</Text>
          {rightIcon && (
            <React.Fragment>
              <RNView style={{ width: iconSpacing }} />
              {rightIcon}
            </React.Fragment>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

// 添加间距组件
import { View as RNView } from 'react-native';

export default ThemedButton;
