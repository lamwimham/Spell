import React from 'react';
import {
  AccessibilityProps,
  GestureResponderEvent,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

// TypeScript 类型定义
interface KeyboardButtonProps extends AccessibilityProps {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  depth?: number; // 3D效果的深度（单位：像素）
  animationDuration?: number;
  buttonHeight?: number;
  buttonWidth?: number;
}

const KeyboardButton: React.FC<KeyboardButtonProps> = ({
  label,
  onPress,
  disabled = false,
  style,
  textStyle,
  depth = 4, // 默认3D深度
  animationDuration = 80,
  buttonHeight = 60,
  buttonWidth = 60,
  ...accessibilityProps
}) => {
  // 动画值 - 控制前景按钮的位置
  const topPosition = useSharedValue(0);

const gesture = Gesture.Tap()
  .onBegin(() => {
    console.log('DEBUG: KeyboardButton onBegin'); // 🔍 添加
    topPosition.value = withTiming(depth, {
      duration: animationDuration,
      easing: Easing.inOut(Easing.ease),
    });
  })
  .onEnd(() => {
    console.log('DEBUG: KeyboardButton onEnd'); // 🔍 添加
    topPosition.value = withTiming(0, {
      duration: animationDuration,
      easing: Easing.inOut(Easing.ease),
    });
    if (!disabled) {
      console.log('DEBUG: Calling runOnJS(onPress)'); // 🔍 添加
      runOnJS(() => onPress)();
    } else {
      console.log('DEBUG: Button is disabled'); // 🔍 添加
    }
  });

  // 前景按钮的动画样式
  const topButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: topPosition.value }],
    };
  }, []);

  return (
    <View style={[
      styles.container, 
      style,
      { width: buttonWidth, height: buttonHeight + depth } // 容器高度包含3D深度
    ]}>
      {/* 底部阴影层（深色） */}
      <View style={[
        styles.baseButton,
        styles.bottomButton,
        { 
          width: buttonWidth,
          height: buttonHeight,
          borderRadius: buttonHeight / 4 // 根据高度设置圆角
        }
      ]} />
      
      {/* 高光层 */}
      <View style={[
        styles.highlight,
        { 
          width: buttonWidth,
          height: buttonHeight,
          borderRadius: buttonHeight / 4,
          transform: [{ translateY: topPosition.value }],
        }
      ]} />

      {/* 顶部按钮层（浅色，可点击） */}
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            styles.baseButton,
            styles.topButton,
            topButtonStyle,
            { 
              width: buttonWidth,
              height: buttonHeight,
              borderRadius: buttonHeight / 4
            },
            disabled && styles.disabledState
          ]}
        >
          <Text 
            style={[styles.text, textStyle]}
            accessible
            accessibilityRole="text"
            {...accessibilityProps}
          >
            {label}
          </Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
    margin: 4,
    backgroundColor: '#444444',
  },
  baseButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomButton: {
    backgroundColor: '#ccc', // 深色阴影
    bottom: 0, // 固定在容器底部
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2, // Android 阴影
  },
  topButton: {
    backgroundColor: '#F0F0F0', // 浅色按钮
    borderWidth: 1,
    borderColor: '#E0E0E0',
    bottom: 5, // 初始位置与底部按钮重叠（通过transform移动）
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2, // Android 阴影
  },
  highlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1, // 确保高光在按钮上方
  },
  disabledState: {
    opacity: 0.5,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
});

export default KeyboardButton;