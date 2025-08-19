import React from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsPanel } from '../components/ui/SettingsPanel';
import { TopNavigationBar } from '../components/ui/TopNavigationBar';

/**
 * 设置页面
 * 展示基于Figma设计实现的设置面板组件
 */
export function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleSettingChange = (key: string, value: any) => {
    console.log(`Setting ${key} changed to:`, value);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <TopNavigationBar
        title="Settings"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <SettingsPanel onSettingChange={handleSettingChange} style={styles.panel} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E3F1',
  },
  backButton: {
    padding: 8,
    marginTop: 4,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Rubik',
    fontWeight: '600',
    color: '#535059',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#7572B7',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  panel: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
