import React from 'react';
import { View, ViewStyle, ViewProps } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface ThemedViewProps extends ViewProps {
  variant?: 'default' | 'card' | 'elevated' | 'primary';
  useShadow?: 'none' | 'light' | 'medium' | 'heavy';
  borderRadius?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'circle';
}

/**
 * 主题化视图组件
 * 自动应用主题样式的视图组件，支持不同变体和阴影
 */
export const ThemedView: React.FC<ThemedViewProps> = ({
  variant = 'default',
  useShadow = 'none',
  borderRadius = 'none',
  style,
  children,
  ...props
}) => {
  const theme = useTheme();
  
  // 根据变体确定背景色
  let backgroundColor;
  switch (variant) {
    case 'card':
      backgroundColor = theme.colors.surface;
      break;
    case 'elevated':
      backgroundColor = theme.colors.backgroundElevated;
      break;
    case 'primary':
      backgroundColor = theme.colors.backgroundPrimary;
      break;
    default:
      backgroundColor = theme.colors.background;
  }
  
  // 确定边框圆角
  let borderRadiusValue = 0;
  if (borderRadius !== 'none') {
    borderRadiusValue = theme.spacing.borderRadius[borderRadius];
  }
  
  // 确定阴影样式
  let shadowStyle = {};
  if (useShadow !== 'none') {
    shadowStyle = theme.shadows[useShadow];
  }
  
  return (
    <View
      style={[
        { 
          backgroundColor,
          borderRadius: borderRadiusValue,
        },
        shadowStyle,
        style,
      ] as ViewStyle[]}
      {...props}
    >
      {children}
    </View>
  );
};

export default ThemedView;