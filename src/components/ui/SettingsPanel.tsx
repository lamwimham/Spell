import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle, Alert, Platform, Linking } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { SettingsRow } from './SettingsRow';
import { ToggleSwitch } from './ToggleSwitch';
import { AudioPitchSlider } from './AudioPitchSlider';
import { versionAPI } from '../../services/version/api';

interface SettingsPanelProps {
  style?: ViewStyle;
  onSettingChange?: (key: string, value: any) => void;
}

/**
 * 设置面板组件
 * 基于Figma设计实现的完整设置面板
 */
export function SettingsPanel({ style, onSettingChange }: SettingsPanelProps) {
  const [settings, setSettings] = useState({
    option1: false,
    option2: true,
    option3: true,
    audioPitch: 0.0,
  });
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    // 获取应用版本信息
    const version = DeviceInfo.getVersion();
    const buildNumber = DeviceInfo.getBuildNumber();
    setAppVersion(`${version} (${buildNumber})`);
  }, []);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    onSettingChange?.(key, value);
  };

  /**
   * 检查版本更新
   */
  const checkForUpdate = async () => {
    try {
      // 获取当前应用版本信息
      const currentVersion = DeviceInfo.getVersion();
      const currentBuildNumber = DeviceInfo.getBuildNumber();
      const platform = Platform.OS as 'ios' | 'android';

      // 调用版本检查API
      const response = await versionAPI.checkForUpdate(
        currentVersion,
        parseInt(currentBuildNumber, 10),
        platform,
      );

      if (response.updateAvailable && response.latestVersion) {
        // 有新版本可用，显示更新提示
        showUpdateAlert(response);
      } else {
        // 没有新版本，显示提示
        Alert.alert('提示', '当前已是最新版本');
      }
    } catch (error) {
      console.error('检查版本更新失败:', error);
      Alert.alert('错误', '检查更新失败，请稍后重试');
    }
  };

  /**
   * 显示更新提示弹窗
   */
  const showUpdateAlert = (response: any) => {
    if (!response.latestVersion) return;

    const { latestVersion, currentVersionInfo } = response;
    const isForceUpdate = latestVersion.forceUpdate;

    const title = isForceUpdate ? '重要更新' : '发现新版本';
    const message = `${
      isForceUpdate ? '检测到重要更新，建议立即升级以获得最佳体验。\\n\\n' : ''
    }当前版本: ${currentVersionInfo?.version || '未知'}\\n最新版本: ${
      latestVersion.version
    }\\n\\n更新内容:\\n${latestVersion.releaseNotes}`;

    const actions = [
      {
        text: '稍后更新',
        onPress: () => {},
        style: 'cancel' as const,
      },
      {
        text: '立即更新',
        onPress: () => {
          // 打开应用商店
          openAppStore(latestVersion.downloadUrl);
        },
      },
    ];

    // 如果是强制更新，移除"稍后更新"选项
    const alertActions = isForceUpdate ? [actions[1]] : actions;

    Alert.alert(title, message, alertActions, {
      cancelable: !isForceUpdate,
    });
  };

  /**
   * 打开应用商店
   */
  const openAppStore = (url: string) => {
    Linking.openURL(url).catch(err => {
      console.error('打开应用商店失败:', err);
      Alert.alert('错误', '无法打开应用商店，请手动搜索应用进行更新');
    });
  };

  return (
    <View style={[styles.container, style]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 版本信息 */}
        <SettingsRow
          iconName="information-circle-outline"
          label="当前版本"
          rightText={appVersion}
          style={styles.settingRow}
        />

        {/* 检查更新 */}
        <SettingsRow
          iconName="refresh-outline"
          label="检查更新"
          rightText="立即检查"
          showArrow
          onPress={checkForUpdate}
          style={styles.settingRow}
        />

        {/* 第一个设置项 - 带箭头 */}
        <SettingsRow
          iconName="settings-outline"
          label="Label Here"
          rightText="Option"
          showArrow
          onPress={() => {
            console.log('Settings option pressed');
          }}
          style={styles.settingRow}
        />

        {/* 第二个设置项 - 带切换开关 */}
        <SettingsRow
          iconName="notifications-outline"
          label="Label Here"
          rightComponent={
            <ToggleSwitch
              value={settings.option2}
              onValueChange={value => handleSettingChange('option2', value)}
            />
          }
          style={styles.settingRow}
        />

        {/* 第三个设置项 - 音频音调滑块 */}
        <View style={styles.sliderSection}>
          <SettingsRow
            iconName="volume-high-outline"
            label="Label Here"
            rightComponent={
              <ToggleSwitch
                value={settings.option3}
                onValueChange={value => handleSettingChange('option3', value)}
              />
            }
            style={styles.sliderHeader}
          />

          {/* 音频音调滑块 */}
          <AudioPitchSlider
            value={settings.audioPitch}
            onValueChange={value => handleSettingChange('audioPitch', value)}
            style={styles.slider}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 367,
    height: 370,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#9747FF',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  settingRow: {
    marginBottom: 16,
  },
  sliderSection: {
    marginBottom: 16,
  },
  sliderHeader: {
    marginBottom: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  slider: {
    marginTop: -12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
});
