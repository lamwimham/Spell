/**
 * 主题钩子 - 提供整个主题系统的访问
 * 包括颜色、排版、间距、阴影和动画等
 */

import { useColorScheme } from './useColorScheme';
import {
  Colors,
  Typography,
  TextStyles,
  Spacing,
  Shadows,
  Animation,
  withOpacity,
  getResponsiveSize,
  // getScaledFontSize
} from '../constants/Theme';
import { Dimensions, PixelRatio } from 'react-native';

/**
 * 使用主题钩子
 * 提供对整个主题系统的访问，包括颜色、排版、间距等
 */
export function useTheme() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  // 获取当前屏幕宽度，用于响应式计算
  const screenWidth = Dimensions.get('window').width;

  // 获取系统字体缩放比例
  const fontScale = PixelRatio.getFontScale();

  return {
    // 颜色系统
    colors: Colors[isDark ? 'dark' : 'light'],

    // 排版系统
    typography: Typography,
    textStyles: TextStyles,

    // 间距系统
    spacing: Spacing,

    // 阴影系统
    shadows: isDark
      ? {
          // 暗色模式阴影调整
          light: { ...Shadows.light, shadowOpacity: 0.2 },
          medium: { ...Shadows.medium, shadowOpacity: 0.25 },
          heavy: { ...Shadows.heavy, shadowOpacity: 0.3 },
        }
      : Shadows,

    // 动画系统
    animation: Animation,

    // 辅助函数
    withOpacity: withOpacity,

    // 响应式计算函数
    getResponsiveSize: (size: number) => getResponsiveSize(size, screenWidth),
    getScaledFontSize: (size: number) => {
      // 限制最大缩放比例，防止布局破坏
      const maxScale = 1.5;
      const actualScale = Math.min(fontScale, maxScale);
      return Math.round(size * actualScale);
    },

    // 主题状态
    isDark,
    colorScheme,
  };
}
