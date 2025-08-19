import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface SettingsRowProps {
  icon?: React.ReactNode;
  iconName?: string;
  label: string;
  rightComponent?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  showArrow?: boolean;
  rightText?: string;
}

/**
 * 设置行组件
 * 基于Figma设计实现的设置项行组件
 */
export function SettingsRow({
  icon,
  iconName,
  label,
  rightComponent,
  onPress,
  style,
  showArrow = false,
  rightText,
}: SettingsRowProps) {
  const content = (
    <View style={[styles.container, style]}>
      {/* 左侧内容 */}
      <View style={styles.leftContent}>
        {/* 图标容器 */}
        <View style={styles.iconContainer}>
          {icon || <Ionicons name={iconName || 'settings-outline'} size={20} color="#7572B7" />}
        </View>

        {/* 标签文本 */}
        <Text style={styles.label}>{label}</Text>
      </View>

      {/* 右侧内容 */}
      <View style={styles.rightContent}>
        {rightText && <Text style={styles.rightText}>{rightText}</Text>}
        {rightComponent}
        {showArrow && (
          <Ionicons name="chevron-forward" size={16} color="#535059" style={styles.arrow} />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E3E3F1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 56,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#FDFCFF',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  label: {
    fontSize: 17,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#535059',
    flex: 1,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightText: {
    fontSize: 17,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#535059',
    marginRight: 8,
  },
  arrow: {
    marginLeft: 4,
  },
});
