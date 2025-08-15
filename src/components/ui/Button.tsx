import Ionicons from 'react-native-vector-icons/Ionicons';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';

/**
 * 按钮组件属性接口
 * @property {string} [label] - 按钮文本
 * @property {() => void} [onPress] - 点击事件处理函数
 * @property {boolean} [disabled] - 是否禁用
 * @property {boolean} [loading] - 是否显示加载状态
 * @property {"primary" | "secondary" | "outline"} [variant] - 按钮变体
 * @property {"small" | "medium" | "large"} [size] - 按钮大小
 * @property {React.ReactNode} [leftIcon] - 左侧图标
 * @property {React.ReactNode} [rightIcon] - 右侧图标
 * @property {string} [iconName] - Ionicons图标名称（如果使用内置图标）
 * @property {any} [style] - 自定义样式
 */
interface ButtonProps extends TouchableOpacityProps {
  label?: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftIconName?: string;
  rightIconName?: string;
  style?: any;
}

/**
 * 按钮组件
 *
 * 基于Figma设计稿实现的按钮组件，支持三种状态：
 * - 默认状态：紫色背景，白色文字
 * - 按下状态：深紫色背景，白色文字
 * - 禁用状态：浅灰色背景，灰色文字
 */
export function Button({
  label = 'Submit',
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'medium',
  leftIcon,
  rightIcon,
  leftIconName,
  rightIconName,
  style,
  ...props
}: ButtonProps) {
  // 根据variant和disabled状态确定样式
  const buttonStyle = [
    styles.button,
    styles[`button_${variant}`],
    disabled && styles.button_disabled,
    styles[`button_${size}`],
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`text_${variant}`],
    disabled && styles.text_disabled,
    styles[`text_${size}`],
  ];

  const iconColor = disabled ? '#C8C5D0' : variant === 'outline' ? '#7572B7' : '#FFFFFF';

  // 渲染左侧图标
  const renderLeftIcon = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={iconColor} style={styles.leftIcon} />;
    }

    if (leftIcon) {
      return <View style={styles.leftIcon}>{leftIcon}</View>;
    }

    if (leftIconName) {
      return (
        <Ionicons name={leftIconName as any} size={16} color={iconColor} style={styles.leftIcon} />
      );
    }

    // 默认显示左箭头
    return <Ionicons name="chevron-back" size={16} color={iconColor} style={styles.leftIcon} />;
  };

  // 渲染右侧图标
  const renderRightIcon = () => {
    if (rightIcon) {
      return <View style={styles.rightIcon}>{rightIcon}</View>;
    }

    if (rightIconName) {
      return (
        <Ionicons
          name={rightIconName as any}
          size={16}
          color={iconColor}
          style={styles.rightIcon}
        />
      );
    }

    // 默认显示右箭头
    // return (
    //   <Ionicons
    //     name="chevron-forward"
    //     size={16}
    //     color={iconColor}
    //     style={styles.rightIcon}
    //   />
    // );
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {renderLeftIcon()}
      <Text style={textStyle}>{label}</Text>
      {renderRightIcon()}
    </TouchableOpacity>
  );
}

/**
 * 组件样式定义
 *
 * 尺寸规格：
 * - 按钮高度：48px
 * - 边框圆角：8px
 * - 文字大小：15px
 *
 * 颜色规格：
 * - 默认背景色：#7572B7（紫色）
 * - 默认文字色：#FFFFFF（白色）
 * - 禁用背景色：#E3E3F1（浅灰色）
 * - 禁用文字色：#C8C5D0（灰色）
 */
const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 16,
  },
  button_primary: {
    backgroundColor: '#7572B7',
  },
  button_secondary: {
    backgroundColor: '#E3E3F1',
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#7572B7',
  },
  button_disabled: {
    backgroundColor: '#E3E3F1',
  },
  button_small: {
    height: 36,
    paddingHorizontal: 12,
  },
  button_medium: {
    height: 48,
    paddingHorizontal: 16,
  },
  button_large: {
    height: 56,
    paddingHorizontal: 20,
  },
  text: {
    fontFamily: 'Rubik',
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
  },
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: '#7572B7',
  },
  text_outline: {
    color: '#7572B7',
  },
  text_disabled: {
    color: '#C8C5D0',
  },
  text_small: {
    fontSize: 13,
  },
  text_medium: {
    fontSize: 15,
  },
  text_large: {
    fontSize: 17,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});
