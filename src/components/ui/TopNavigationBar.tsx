import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface TopNavigationBarProps {
  title: string;
  showBackButton?: boolean;
  showSettingsButton?: boolean;
  onBackPress?: () => void;
  onSettingsPress?: () => void;
  rightIconName?: string;
  onRightIconPress?: () => void;
  backgroundColor?: string;
  titleColor?: string;
  iconColor?: string;
}

/**
 * 顶部导航栏组件
 * 提供统一的导航栏样式和功能
 */
export function TopNavigationBar({
  title,
  showBackButton = true,
  showSettingsButton = false,
  onBackPress,
  onSettingsPress,
  rightIconName,
  onRightIconPress,
  backgroundColor = '#FDFCFF',
  titleColor = '#393640',
  iconColor = '#000',
}: TopNavigationBarProps) {
  return (
    <View style={[styles.header, { backgroundColor }]}>
      {showBackButton ? (
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <Icon name="chevron-back" size={24} color={iconColor} />
        </TouchableOpacity>
      ) : (
        <View style={styles.backButton} />
      )}

      <Text style={[styles.headerTitle, { color: titleColor }]} numberOfLines={1}>
        {title}
      </Text>

      {showSettingsButton ? (
        <TouchableOpacity style={styles.settingsButton} onPress={onSettingsPress}>
          <Icon name="settings-outline" size={24} color={iconColor} />
        </TouchableOpacity>
      ) : rightIconName ? (
        <TouchableOpacity style={styles.settingsButton} onPress={onRightIconPress}>
          <Icon name={rightIconName} size={24} color={iconColor} />
        </TouchableOpacity>
      ) : (
        <View style={styles.settingsButton} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    height: 96,
    borderBottomWidth: 0,
  },
  backButton: {
    padding: 8,
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Rubik',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  settingsButton: {
    padding: 8,
    width: 40,
    alignItems: 'flex-end',
  },
});
