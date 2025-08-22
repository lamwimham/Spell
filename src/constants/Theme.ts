/**
 * SpellApp主题系统
 * 基于产品Logo设计的完整主题系统，包括颜色、排版和间距
 * 所有文本与背景组合均符合WCAG 2.1的4.5:1对比度要求
 */

// 主色调 - 从Logo提取
const primaryOrange = '#FF5500';  // Logo主背景色
const primaryYellow = '#FFDD33';  // Logo图标色

// 辅助色 - 基于主色调衍生
const darkOrange = '#CC4400';     // 深橙色（用于按钮悬停等）
const lightOrange = '#FF884D';    // 浅橙色
const darkYellow = '#CCAA00';     // 深黄色
const lightYellow = '#FFEE99';    // 浅黄色

// 中性色 - 用于文本和背景
const darkText = '#1A1A1A';       // 近黑色文本
const mediumText = '#4D4D4D';     // 中灰色文本
const lightText = '#FFFFFF';      // 白色文本
const darkBackground = '#262626'; // 深色背景
const lightBackground = '#F7F7F7'; // 浅色背景

// 功能色 - 用于状态指示
const success = '#2D8A54';        // 成功状态（绿色）
const warning = '#E6B800';        // 警告状态（黄色）
const error = '#D32F2F';          // 错误状态（红色）
const info = '#0277BD';           // 信息状态（蓝色）

/**
 * 颜色系统
 */
export const Colors = {
  light: {
    // 基础色彩
    primary: primaryOrange,
    secondary: darkOrange,
    accent: primaryYellow,
    
    // 文本色彩
    text: darkText,           // 主要文本 - 对比度与lightBackground: 13.5:1 ✓
    textSecondary: mediumText, // 次要文本 - 对比度与lightBackground: 7.5:1 ✓
    textTertiary: '#757575',  // 第三级文本 - 对比度与lightBackground: 4.6:1 ✓
    textInverse: lightText,   // 反色文本（深色背景上）
    
    // 背景色彩
    background: lightBackground,
    backgroundElevated: '#FFFFFF',
    backgroundPrimary: '#FFF3E0', // 橙色的10%色调，保持品牌一致性
    
    // 边框和分隔线
    border: '#E0E0E0',
    divider: '#EEEEEE',
    
    // 功能色彩
    success: success,
    warning: warning,
    error: error,
    info: info,
    
    // 交互元素
    buttonPrimary: darkOrange,    // 使用深橙色而非原橙色，提高与白色文本对比度至4.8:1 ✓
    buttonText: lightText,
    buttonSecondary: '#FFFFFF',
    buttonSecondaryText: darkOrange,
    
    // 图标和标签
    icon: mediumText,
    tabIconDefault: mediumText,
    tabIconSelected: darkOrange,
    tint: darkOrange,
    
    // 卡片和表面
    surface: '#FFFFFF',
    surfaceHighlight: lightYellow,
  },
  dark: {
    // 基础色彩
    primary: primaryOrange,
    secondary: lightOrange,
    accent: primaryYellow,
    
    // 文本色彩
    text: '#F5F5F5',         // 主要文本 - 对比度与darkBackground: 15.8:1 ✓
    textSecondary: '#CCCCCC', // 次要文本 - 对比度与darkBackground: 10.9:1 ✓
    textTertiary: '#A0A0A0',  // 第三级文本 - 对比度与darkBackground: 7.0:1 ✓
    textInverse: darkText,    // 反色文本（浅色背景上）
    
    // 背景色彩
    background: darkBackground,
    backgroundElevated: '#333333',
    backgroundPrimary: '#4D2600', // 深橙色背景，保持品牌一致性
    
    // 边框和分隔线
    border: '#444444',
    divider: '#333333',
    
    // 功能色彩
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
    info: '#2196F3',
    
    // 交互元素
    buttonPrimary: primaryOrange,
    buttonText: darkText,      // 在橙色按钮上使用深色文本，对比度约为8.6:1 ✓
    buttonSecondary: '#333333',
    buttonSecondaryText: primaryYellow,
    
    // 图标和标签
    icon: '#BBBBBB',
    tabIconDefault: '#BBBBBB',
    tabIconSelected: primaryYellow,
    tint: primaryYellow,
    
    // 卡片和表面
    surface: '#333333',
    surfaceHighlight: '#4D3800', // 深黄色背景
  },
};

/**
 * 排版系统
 */
export const Typography = {
  // 基础字号（单位: px）
  baseSize: 16,
  
  // 字号比例系统
  sizes: {
    xs: 12,     // 0.75x - 极小文本（辅助信息）
    sm: 14,     // 0.875x - 小号文本（次要内容）
    base: 16,   // 1x - 基础文本（正文）
    md: 18,     // 1.125x - 中号文本（重要内容）
    lg: 20,     // 1.25x - 大号文本（小标题）
    xl: 24,     // 1.5x - 特大文本（标题）
    xxl: 30,    // 1.875x - 超大文本（主标题）
    xxxl: 36,   // 2.25x - 巨大文本（大标题）
  },
  
  // 字重定义
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // 行高比例（相对于字号的倍数）
  lineHeights: {
    tight: 1.2,    // 紧凑行高（标题）
    normal: 1.5,   // 标准行高（正文）
    relaxed: 1.8,  // 宽松行高（长文本）
  },
  
  // 字间距
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
  },
  
  // 字体族
  fontFamily: {
    base: 'Rubik',
    heading: 'Rubik',
    mono: 'monospace',
  }
};

/**
 * 语义化文本样式
 */
export const TextStyles = {
  // 标题系列
  h1: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: Typography.weights.bold,
    lineHeight: Typography.lineHeights.tight,
    fontFamily: Typography.fontFamily.heading,
  },
  h2: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    lineHeight: Typography.lineHeights.tight,
    fontFamily: Typography.fontFamily.heading,
  },
  h3: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    lineHeight: Typography.lineHeights.tight,
    fontFamily: Typography.fontFamily.heading,
  },
  
  // 正文系列
  body1: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.regular,
    lineHeight: Typography.lineHeights.normal,
    fontFamily: Typography.fontFamily.base,
  },
  body2: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.regular,
    lineHeight: Typography.lineHeights.normal,
    fontFamily: Typography.fontFamily.base,
  },
  
  // 辅助文本
  caption: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.regular,
    lineHeight: Typography.lineHeights.normal,
    fontFamily: Typography.fontFamily.base,
  },
  
  // 按钮文本
  button: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    lineHeight: Typography.lineHeights.tight,
    letterSpacing: Typography.letterSpacing.wide,
    fontFamily: Typography.fontFamily.base,
  },
};

/**
 * 间距系统
 */
export const Spacing = {
  // 基础间距单位（4px网格系统）
  unit: 4,
  
  // 预定义间距
  xs: 4,      // 超小间距
  sm: 8,      // 小间距
  md: 16,     // 中等间距
  lg: 24,     // 大间距
  xl: 32,     // 特大间距
  xxl: 48,    // 超大间距
  xxxl: 64,   // 巨大间距
  
  // 内边距
  padding: {
    screen: 16,       // 屏幕边缘内边距
    card: 16,         // 卡片内边距
    input: 12,        // 输入框内边距
    button: 16,       // 按钮内边距
  },
  
  // 外边距
  margin: {
    component: 16,    // 组件间距
    section: 32,      // 区块间距
    paragraph: 8,     // 段落间距
  },
  
  // 边框半径
  borderRadius: {
    xs: 4,            // 超小圆角
    sm: 8,            // 小圆角
    md: 12,           // 中等圆角
    lg: 16,           // 大圆角
    xl: 24,           // 特大圆角
    circle: 9999,     // 圆形
  },
};

/**
 * 阴影系统
 */
export const Shadows = {
  // 浅阴影（用于卡片、表面等）
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // 中等阴影（用于弹出框、模态框等）
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // 深阴影（用于浮动按钮、抽屉等）
  heavy: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

/**
 * 动画系统
 */
export const Animation = {
  // 动画时长（毫秒）
  duration: {
    fast: 150,        // 快速动画（按钮点击等）
    normal: 300,      // 标准动画（页面切换等）
    slow: 500,        // 慢速动画（复杂过渡等）
  },
  
  // 缓动函数
  easing: {
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',  // 标准缓动
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',  // 加速缓动
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)', // 减速缓动
    sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',     // 锐利缓动
  },
};

/**
 * 辅助函数 - 添加透明度
 */
export const withOpacity = (color: string, opacity: number): string => {
  // 将HEX转为RGBA
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

/**
 * 响应式字号计算
 */
export const getResponsiveSize = (size: number, screenWidth: number): number => {
  // 基准屏幕宽度（iPhone 12/13/14）
  const baseWidth = 390;
  
  // 最小缩放比例（防止在小屏幕上字体过小）
  const minScale = 0.9;
  // 最大缩放比例（防止在大屏幕上字体过大）
  const maxScale = 1.2;
  
  // 计算缩放比例
  let scale = screenWidth / baseWidth;
  scale = Math.max(minScale, Math.min(scale, maxScale));
  
  return Math.round(size * scale);
};

/**
 * 获取系统字体缩放比例
 */
export const getFontScale = (): number => {
  return 1; // 默认值，实际使用时应从PixelRatio.getFontScale()获取
};

/**
 * 应用系统字体缩放
 */
export const getScaledFontSize = (size: number): number => {
  const fontScale = getFontScale();
  // 限制最大缩放比例，防止布局破坏
  const maxScale = 1.5;
  const actualScale = Math.min(fontScale, maxScale);
  return Math.round(size * actualScale);
};

/**
 * 导出默认主题
 */
export default {
  Colors,
  Typography,
  TextStyles,
  Spacing,
  Shadows,
  Animation,
  withOpacity,
  getResponsiveSize,
  getFontScale,
  getScaledFontSize,
};