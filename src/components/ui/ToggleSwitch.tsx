import React from 'react';
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  // View,
  ViewStyle,
} from 'react-native';

interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
}

/**
 * 切换开关组件
 * 基于Figma设计实现的Toggle Switch组件
 */
export function ToggleSwitch({
  value,
  onValueChange,
  disabled = false,
  style,
  size = 'medium',
}: ToggleSwitchProps) {
  const animatedValue = React.useRef(new Animated.Value(value ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, animatedValue]);

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  const sizeStyles = styles[`switch_${size}`];
  const thumbSizeStyles = styles[`thumb_${size}`];

  const trackColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: disabled ? ['#D2CED9', '#D2CED9'] : ['#D2CED9', '#7572B7'],
  });

  const thumbTranslateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, size === 'large' ? 26 : size === 'medium' ? 22 : 18],
  });

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.track,
          sizeStyles,
          {
            backgroundColor: trackColor,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            thumbSizeStyles,
            {
              transform: [{ translateX: thumbTranslateX }],
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  track: {
    borderRadius: 15,
    justifyContent: 'center',
  },
  switch_small: {
    width: 40,
    height: 24,
  },
  switch_medium: {
    width: 48,
    height: 28,
  },
  switch_large: {
    width: 56,
    height: 32,
  },
  thumb: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  thumb_small: {
    width: 20,
    height: 20,
  },
  thumb_medium: {
    width: 24,
    height: 24,
  },
  thumb_large: {
    width: 28,
    height: 28,
  },
});
