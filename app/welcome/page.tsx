import { RootState } from '@/store';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TypedUseSelectorHook, useSelector } from 'react-redux';

const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

type StackParamList = {
  [key: string]: any;
};

// TODO: 壁纸列表(可AI生成（付费）)
const welcomeBgs = [
  require('@/assets/images/welcome/welcome.png'),
  require('@/assets/images/welcome/welcome2.png'),
  require('@/assets/images/welcome/welcome3.png'),
  require('@/assets/images/welcome/welcome4.png')
];
// 动态选择本地壁纸
const welcomeBg = welcomeBgs[Math.floor(Math.random() * welcomeBgs.length)];

export default function WelcomePage() {
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>();
  const spells = useAppSelector((state) => state.spellsReducer.spells);
  
  const [showSkipButton, setShowSkipButton] = useState(true); // 控制是否显示跳过按钮
  const [hasNavigated, setHasNavigated] = useState(false); // 新增状态：是否已导航

  useEffect(() => {
    // 如果已经导航过，不再创建新定时器
    if (hasNavigated) return;

    const timer = setTimeout(() => {
      if (hasNavigated) return; // 冗余检查，确保不会重复导航
      const hasData = spells && spells.length > 0;
      console.log('定时器触发导航');
      // 标记已导航
      setHasNavigated(true);
      navigation.navigate('MainTabs', { screen: hasData ? 'Home' : 'Spell' });
    }, 4000);

    // 清理函数：如果组件卸载且未导航，则清除定时器
    return () => {
      if (!hasNavigated) {
        clearTimeout(timer);
        console.log('定时器在组件卸载时被清除');
      }
    };
  }, [spells, navigation, hasNavigated]); // 添加 hasNavigated 作为依赖

  const handleSkip = () => {
    // 避免重复点击
    if (hasNavigated) return;

    const hasData = spells && spells.length > 0;
    console.log('跳过按钮触发导航');
    // 标记已导航
    setHasNavigated(true);
    if (hasData) {
      navigation.navigate('MainTabs', { screen: 'Home' });
    } else {
      navigation.navigate('MainTabs', { screen: 'Spell' });
    }
  };

  return (
    <ImageBackground 
      source={welcomeBg} 
      style={styles.background}
      resizeMode="cover" 
    >
      {/* 添加半透明遮罩层确保文字可见 */}
      <View style={styles.overlay}>
        {/* 跳过按钮 */}
        {showSkipButton && (
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleSkip}
            hitSlop={{top: 30, bottom: 30, left: 30, right: 30}}
          >
            <View style={styles.skipContent}>
              <Text style={styles.skipText}>跳过</Text>
              <Text style={styles.skipIcon}>×</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // 半透明黑色遮罩
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    position: 'absolute',
    top: 40,
    right: 20, // 稍微靠近边缘
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20, // 圆角更明显
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  skipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 16, // 16px字体
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginRight: 4, // 文字和图标之间的间距
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  skipIcon: {
    fontSize: 20, // 图标稍大一点
    color: '#FFFFFF',
    fontWeight: 'bold',
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  }
});