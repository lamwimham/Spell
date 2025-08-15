import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

/**
 * 声波动画组件属性接口
 * @property {number} [size] - 组件大小，默认为143
 * @property {number} [barCount] - 声波条数量，默认为6
 * @property {string} [activeColor] - 激活状态的颜色，默认为#7572B7
 * @property {string} [inactiveColor] - 非激活状态的颜色，默认为#E3E3F1
 * @property {number} [animationDuration] - 动画持续时间(毫秒)，默认为1500
 * @property {ViewStyle} [style] - 容器自定义样式
 * @property {boolean} [autoPlay] - 是否自动播放动画，默认为true
 * @property {number} [intensity] - 声波强度，范围0-1，默认为0.5
 */
interface OnboardingProps {
  size?: number;
  barCount?: number;
  activeColor?: string;
  inactiveColor?: string;
  animationDuration?: number;
  style?: ViewStyle;
  autoPlay?: boolean;
  intensity?: number;
}

/**
 * 声波动画组件
 *
 * 单行声波动画效果，根据声波强弱参数实现颜色渲染和跳动效果
 * 可用于音频录制、播放界面或应用引导页面
 */
export function Onboarding({
  size = 143,
  barCount = 6,
  activeColor = '#7572B7',
  inactiveColor = '#E3E3F1',
  animationDuration = 1500,
  style,
  autoPlay = true,
  intensity = 0.5,
}: OnboardingProps) {
  // 创建动画值数组，每个声波条对应一个动画值
  const animatedValues = useRef<Animated.Value[]>(
    Array(barCount)
      .fill(0)
      .map(() => new Animated.Value(0)),
  ).current;

  // 生成随机声波强度模式
  const generateWavePattern = () => {
    // 基础强度值，确保有一定高度
    const baseIntensity = 0.2;
    // 根据传入的强度参数调整最大强度
    const maxVariation = 0.8 * intensity;

    return Array(barCount)
      .fill(0)
      .map(() => {
        // 生成随机强度，范围在baseIntensity到baseIntensity+maxVariation之间
        return baseIntensity + Math.random() * maxVariation;
      });
  };

  // 启动动画
  const startAnimation = () => {
    // 生成新的声波模式
    const wavePattern = generateWavePattern();

    // 创建动画序列
    const animations = animatedValues.map((anim, index) => {
      return Animated.sequence([
        // 向上和向下扩展动画（从中间向两端）
        Animated.timing(anim, {
          toValue: wavePattern[index],
          duration: animationDuration / 2,
          useNativeDriver: false,
        }),
        // 恢复到中间位置
        Animated.timing(anim, {
          toValue: 0,
          duration: animationDuration / 2,
          useNativeDriver: false,
        }),
      ]);
    });

    // 执行动画，稍微错开每个声波条的动画开始时间，增加自然感
    animations.forEach((animation, index) => {
      setTimeout(() => {
        animation.start();
      }, index * (animationDuration / barCount / 4));
    });

    // 循环播放
    if (autoPlay) {
      setTimeout(() => {
        startAnimation();
      }, animationDuration);
    }
  };

  // 自动播放动画
  useEffect(() => {
    if (autoPlay) {
      const timer = setTimeout(startAnimation, 100);
      return () => clearTimeout(timer);
    }
  }, [autoPlay]);

  // 计算每个声波条的尺寸和间距
  const barWidth = 8;
  const barGap = 8;
  const containerSize = size;
  const maxBarHeight = size * 0.7; // 使用容器高度的70%作为最大声波高度

  // 计算容器内边距，使声波条居中
  const totalBarWidth = barCount * barWidth + (barCount - 1) * barGap;
  const horizontalPadding = (containerSize - totalBarWidth) / 2;

  return (
    <View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          padding: 0,
        },
        style,
      ]}
    >
      {/* 渲染声波条 */}
      <View
        style={[
          styles.row,
          {
            left: horizontalPadding,
            height: maxBarHeight,
          },
        ]}
      >
        {/* 渲染每一个声波条 */}
        {animatedValues.map((anim, index) => (
          <Animated.View
            key={`bar-${index}`}
            style={[
              styles.bar,
              {
                left: index * (barWidth + barGap),
                width: barWidth,
                backgroundColor: anim.interpolate({
                  inputRange: [0, 0.3, 0.6, 1],
                  outputRange: [inactiveColor, inactiveColor, activeColor, activeColor],
                }),
                // 从中间向两端扩展的动画效果
                height: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [maxBarHeight * 0.2, maxBarHeight],
                }),
                // 垂直居中
                top: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [maxBarHeight * 0.4, 0], // 从中间向上扩展
                }),
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    position: 'absolute',
    flexDirection: 'row',
    width: '100%',
    top: '50%', // 垂直居中
    transform: [{ translateY: -50 }], // 垂直居中的修正
  },
  bar: {
    position: 'absolute',
    borderRadius: 4,
  },
});
