import React from 'react';
import { Text, TextStyle, TextProps } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface ThemedTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body1' | 'body2' | 'caption' | 'button';
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

/**
 * 主题化文本组件
 * 自动应用主题样式的文本组件，支持不同变体和颜色
 */
export const ThemedText: React.FC<ThemedTextProps> = ({
  variant = 'body1',
  color,
  align = 'left',
  style,
  children,
  ...props
}) => {
  const theme = useTheme();
  
  // 获取变体样式
  const variantStyle = theme.textStyles[variant];
  
  // 确定文本颜色
  const textColor = color || theme.colors.text;
  
  return (
    <Text
      style={[
        variantStyle,
        { color: textColor, textAlign: align },
        style,
      ] as TextStyle[]}
      {...props}
    >
      {children}
    </Text>
  );
};

export default ThemedText;