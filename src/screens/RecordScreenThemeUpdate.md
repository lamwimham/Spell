# RecordScreen主题更新计划

## 需要更新的元素

1. **导入主题钩子**
   - 添加 `import { useTheme } from '../hooks/useTheme';`
   - 添加 `import { useColorScheme } from 'react-native';`

2. **应用主题**
   - 添加 `const colorScheme = useColorScheme();`
   - 添加 `const theme = useTheme();`

3. **更新颜色引用**
   - 背景色: `#FDFCFF` → `theme.background`
   - 主按钮色: `#7572B7` → `theme.primary`
   - 波形颜色: `#7572B7` → `theme.primary`
   - 边框色: `#E3E3F1` → `theme.border`
   - 文本色: `#393640` → `theme.text`
   - 次要文本: `#535059` → `theme.textSecondary`
   - 错误色: `#FF6B6B` → `theme.error`

4. **动态样式应用**
   - 使用内联样式覆盖静态样式中的颜色
   - 例如: `<View style={[styles.container, { backgroundColor: theme.background }]}>`

5. **组件更新**
   - WaveformVisualizer组件
   - RecordingItem组件
   - 按钮和控制元素

## 实施步骤

1. 添加导入和主题钩子
2. 更新主容器和状态栏
3. 更新WaveformVisualizer组件
4. 更新RecordingItem组件
5. 更新按钮和控制元素
6. 更新文本和其他UI元素