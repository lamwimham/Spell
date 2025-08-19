import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SettingsRow } from './SettingsRow';
import { ToggleSwitch } from './ToggleSwitch';
import { AudioPitchSlider } from './AudioPitchSlider';

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

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    onSettingChange?.(key, value);
  };

  return (
    <View style={[styles.container, style]}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
