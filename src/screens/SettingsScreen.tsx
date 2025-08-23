import React from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsPanel } from '../components/ui/SettingsPanel';
import { TopNavigationBar } from '../components/ui/TopNavigationBar';
import { useTheme } from '../hooks/useTheme';

/**
 * 设置页面
 * 展示基于Figma设计实现的设置面板组件
 */
export function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, textStyles, spacing, shadows, isDark } = useTheme();

  const handleSettingChange = (key: string, value: any) => {
    console.log(`Setting ${key} changed to:`, value);
  };

  const dynamicStyles = createStyles({ colors, textStyles, spacing, shadows });

  return (
    <View style={[dynamicStyles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <TopNavigationBar
        title="Settings"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <View style={dynamicStyles.content}>
        <SettingsPanel onSettingChange={handleSettingChange} style={dynamicStyles.panel} />
      </View>
    </View>
  );
}

/**
 * 创建动态样式的函数
 */
const createStyles = ({ colors, spacing, shadows }: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },
    panel: {
      ...shadows.medium,
    },
  });
