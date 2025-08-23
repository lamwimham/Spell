import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

/**
 * 文稿滚动走马灯组件属性接口
 * @property {string[]} texts - 要显示的文本数组
 * @property {number} [speed=1] - 滚动速度，值越大速度越快
 * @property {number} [pauseDuration=2000] - 每条文本停留时间(毫秒)
 * @property {boolean} [transparentBackground=false] - 背景是否透明
 * @property {ViewStyle} [style] - 容器自定义样式
 * @property {TextStyle} [textStyle] - 文本自定义样式
 * @property {number} [height=120] - 组件高度
 */
interface TextMarqueeProps {
  texts: string[];
  speed?: number;
  pauseDuration?: number;
  transparentBackground?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  height?: number;
}

/**
 * 垂直方向文稿滚动走马灯组件
 *
 * 用于展示多条文本，以垂直滚动的方式自动切换显示
 */
export function TextMarquee({
  texts,
  speed = 1,
  pauseDuration = 2000,
  transparentBackground = false,
  style,
  textStyle,
  height = 120,
}: TextMarqueeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // 计算动画持续时间，基于速度参数
  const animationDuration = 1000 / speed;

  useEffect(() => {
    // 如果没有文本或只有一条文本，不需要滚动
    if (!texts || texts.length <= 1) return;

    // 如果只有一条文本，不需要滚动
    if (texts.length <= 1) return;

    // 创建动画序列
    const animate = () => {
      // 淡出当前文本
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: animationDuration / 2,
        useNativeDriver: true,
      }).start(() => {
        // 更新索引到下一条文本
        setCurrentIndex(prevIndex => (prevIndex + 1) % texts.length);

        // 重置位置并淡入新文本
        translateY.setValue(20);
        fadeAnim.setValue(0);

        Animated.parallel([
          // 向上滚动动画
          Animated.timing(translateY, {
            toValue: 0,
            duration: animationDuration / 2,
            useNativeDriver: true,
          }),
          // 淡入动画
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: animationDuration / 2,
            useNativeDriver: true,
          }),
        ]).start();
      });
    };

    // 设置定时器，定期切换文本
    const timer = setTimeout(() => {
      animate();

      // 创建循环间隔
      const interval = setInterval(animate, animationDuration + pauseDuration);
      return () => clearInterval(interval);
    }, pauseDuration);

    return () => clearTimeout(timer);
  }, [texts.length, animationDuration, pauseDuration, fadeAnim, translateY]);

  // 根据transparentBackground属性决定背景样式
  const containerStyle = [
    styles.container,
    { height },
    transparentBackground ? styles.transparentBackground : styles.solidBackground,
    style,
  ];

  return (
    <View style={containerStyle}>
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
          },
        ]}
      >
        <Text style={[styles.text, textStyle]} numberOfLines={0}>
          {texts[currentIndex]}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    borderRadius: 8,
    width: '100%',
  },
  solidBackground: {
    backgroundColor: '#F5F3FA',
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  textContainer: {
    padding: 16,
  },
  text: {
    fontFamily: 'Rubik',
    fontSize: 17,
    color: '#393640',
    lineHeight: 24,
  },
});
