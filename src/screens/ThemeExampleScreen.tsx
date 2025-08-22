import React from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  View, 
  // Switch, 
  // Text,
  // Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 导入主题组件
import { useTheme } from '../hooks/useTheme';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import ThemedButton from '../components/ThemedButton';

/**
 * 主题示例页面
 * 展示主题系统的各种组件和样式
 */
export default function ThemeExampleScreen() {
  const navigation = useNavigation();
  const theme = useTheme();
  // 注意：一些变量当前未使用，但保留用于未来功能扩展
  // const [isEnabled, setIsEnabled] = useState(false);
  // const screenWidth = Dimensions.get('window').width;
  // const toggleSwitch = () => setIsEnabled(previousState => !previousState);
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar 
        barStyle={theme.isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.colors.background}
      />
      
      {/* 顶部导航栏 - 固定在顶部 */}
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundElevated }]}>
        <ThemedButton
          variant="text"
          label=""
          leftIcon={<Icon name="arrow-back" size={24} color={theme.colors.primary} />}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <ThemedText variant="h3" align="center">主题系统示例</ThemedText>
        <View style={{ width: 40 }} />
      </View>
      
      {/* 内容区域 - 添加paddingTop避免被header遮挡 */}
      <ScrollView 
        style={[styles.container, { marginTop: 0 }]} 
        contentContainerStyle={[styles.content, { paddingTop: 8 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 颜色系统展示 */}
        {/* <ThemedView style={styles.section}>
          <ThemedText variant="h2">颜色系统</ThemedText>
          <ThemedText variant="body2" color={theme.colors.textSecondary} style={styles.sectionDescription}>
            基于产品Logo设计的颜色系统，符合WCAG 2.1可访问性标准
          </ThemedText>
          
          <View style={styles.colorGrid}>
            <ColorSwatch name="主色" color={theme.colors.primary} />
            <ColorSwatch name="次色" color={theme.colors.secondary} />
            <ColorSwatch name="强调色" color={theme.colors.accent} />
            <ColorSwatch name="背景色" color={theme.colors.background} />
            <ColorSwatch name="表面色" color={theme.colors.surface} />
            <ColorSwatch name="文本色" color={theme.colors.text} />
            <ColorSwatch name="次要文本" color={theme.colors.textSecondary} />
            <ColorSwatch name="成功色" color={theme.colors.success} />
            <ColorSwatch name="错误色" color={theme.colors.error} />
          </View>
        </ThemedView> */}
        
        {/* 排版系统展示 */}
        <ThemedView style={styles.section}>
          <ThemedText variant="h2">排版系统</ThemedText>
          <ThemedText variant="body2" color={theme.colors.textSecondary} style={styles.sectionDescription}>
            一致的文本层级和样式系统
          </ThemedText>
          
          <View style={styles.typographyShowcase}>
            <ThemedText variant="h1">标题一 (H1)</ThemedText>
            <ThemedText variant="h2">标题二 (H2)</ThemedText>
            <ThemedText variant="h3">标题三 (H3)</ThemedText>
            <ThemedText variant="body1" style={styles.textSample}>
              正文文本 (Body1) - 这是应用中最常用的文本样式，适合大段内容阅读。
              确保良好的可读性和舒适的阅读体验。
            </ThemedText>
            <ThemedText variant="body2" style={styles.textSample}>
              次要正文 (Body2) - 用于辅助说明、注释等次要信息。字号稍小但仍保持良好可读性。
            </ThemedText>
            <ThemedText variant="caption" style={styles.textSample}>
              说明文本 (Caption) - 最小的文本样式，用于标签、时间戳等辅助信息。
            </ThemedText>
            <ThemedText variant="button">按钮文本 (Button)</ThemedText>
          </View>
        </ThemedView>
        
        {/* 间距系统展示 */}
        {/* <ThemedView style={styles.section}>
          <ThemedText variant="h2">间距系统</ThemedText>
          <ThemedText variant="body2" color={theme.colors.textSecondary} style={styles.sectionDescription}>
            基于4px网格的一致间距系统
          </ThemedText>
          
          <View style={styles.spacingShowcase}>
            <SpacingBlock size="xs" label="超小间距 (4px)" theme={theme} />
            <SpacingBlock size="sm" label="小间距 (8px)" theme={theme} />
            <SpacingBlock size="md" label="中等间距 (16px)" theme={theme} />
            <SpacingBlock size="lg" label="大间距 (24px)" theme={theme} />
            <SpacingBlock size="xl" label="特大间距 (32px)" theme={theme} />
          </View>
        </ThemedView> */}
        
        {/* 组件展示 */}

        
        {/* 响应式设计展示 */}
        {/* <ThemedView style={styles.section}>
          <ThemedText variant="h2">响应式设计</ThemedText>
          <ThemedText variant="body2" color={theme.colors.textSecondary} style={styles.sectionDescription}>
            根据屏幕尺寸自动调整的设计系统
          </ThemedText>
          
          <View style={styles.responsiveShowcase}>
            <ThemedText variant="body1">
              当前屏幕宽度: {screenWidth}px
            </ThemedText>
            <ThemedText variant="body2" style={{marginTop: theme.spacing.sm}}>
              响应式字号示例:
            </ThemedText>
            
            <Text style={{
              fontSize: theme.getResponsiveSize(16),
              color: theme.colors.text,
              marginTop: theme.spacing.sm,
              fontFamily: theme.typography.fontFamily.base,
            }}>
              这是根据屏幕宽度自动调整的16px基础字号
            </Text>
            
            <Text style={{
              fontSize: theme.getResponsiveSize(24),
              color: theme.colors.text,
              marginTop: theme.spacing.md,
              fontFamily: theme.typography.fontFamily.heading,
              fontWeight: '600',
            }}>
              这是根据屏幕宽度自动调整的24px标题字号
            </Text>
          </View>
        </ThemedView>
         */}
        {/* 主题切换 */}
        {/* <ThemedView style={[styles.section, styles.themeToggleSection]}>
          <ThemedText variant="h3">当前主题模式</ThemedText>
          <ThemedText variant="body1" style={{marginTop: theme.spacing.sm}}>
            {theme.isDark ? '深色模式' : '浅色模式'} (跟随系统设置)
          </ThemedText>
          <ThemedText variant="body2" color={theme.colors.textSecondary} style={{marginTop: theme.spacing.xs}}>
            可以在系统设置中切换深色/浅色模式
          </ThemedText>
        </ThemedView> */}
      </ScrollView>
    </SafeAreaView>
  );
}

// 颜色样本组件 - 当前未使用，保留用于未来功能
// const ColorSwatch = ({ name, color }) => {
//   const theme = useTheme();
//   
//   // 计算文本颜色 (深色背景用浅色文本，浅色背景用深色文本)
//   const getTextColor = (bgColor) => {
//     // 简单的亮度计算
//     const r = parseInt(bgColor.slice(1, 3), 16);
//     const g = parseInt(bgColor.slice(3, 5), 16);
//     const b = parseInt(bgColor.slice(5, 7), 16);
//     const brightness = (r * 299 + g * 587 + b * 114) / 1000;
//     return brightness > 128 ? '#000000' : '#FFFFFF';
//   };
//   
//   const textColor = getTextColor(color);
//   
//   return (
//     <View style={styles.colorSwatch}>
//       <View style={[styles.colorBox, { backgroundColor: color }]}>
//         <Text style={[styles.colorHex, { color: textColor }]}>{color}</Text>
//       </View>
//       <ThemedText variant="caption" style={styles.colorName}>{name}</ThemedText>
//     </View>
//   );
// };

// 间距块组件 - 当前未使用，保留用于未来功能
// const SpacingBlock = ({ size, label, theme }) => {
//   const blockSize = theme.spacing[size];
//   
//   return (
//     <View style={styles.spacingBlock}>
//       <View style={styles.spacingVisual}>
//         <View style={[styles.spacingStart, { backgroundColor: theme.colors.primary }]} />
//         <View style={{ width: blockSize, height: 40, backgroundColor: theme.withOpacity(theme.colors.primary, 0.2) }} />
//         <View style={[styles.spacingEnd, { backgroundColor: theme.colors.primary }]} />
//       </View>
//       <ThemedText variant="caption" style={styles.spacingLabel}>{label}</ThemedText>
//     </View>
//   );
// };

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    width: '100%',
    zIndex: 10, // 确保导航栏在最上层
    elevation: 3, // Android阴影
    shadowColor: '#000', // iOS阴影
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionDescription: {
    marginTop: 4,
    marginBottom: 16,
  },
  typographyShowcase: {
    marginTop: 16,
  },
  textSample: {
    marginTop: 8,
    marginBottom: 16,
  },
  // 以下样式暂时保留，用于未来功能扩展
  // colorGrid, colorSwatch, colorBox, colorHex, colorName,
  // spacingShowcase, spacingBlock, spacingVisual, spacingStart, spacingEnd, spacingLabel,
  // componentGroup, componentTitle, buttonRow, buttonSample, card, formRow,
  // responsiveShowcase, themeToggleSection
});