import { BlurView } from '@react-native-community/blur';
import Slider from '@react-native-community/slider';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Appearance,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const HIGPlayerBottomSheet: React.FC<{ isVisible: boolean; onClose: () => void }> = ({
  isVisible,
  onClose
}) => {
  const { height } = useWindowDimensions();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0.3);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const isDarkMode = Appearance.getColorScheme() === 'dark';

  // 动画控制
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isVisible ? height * 0.7 : height,
      damping: 40,
      mass: 1,
      stiffness: 350,
      useNativeDriver: true,
    }).start();
  }, [isVisible, height]);

  // 播放/暂停切换
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    ReactNativeHapticFeedback.trigger('impactLight');
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          height: height * 0.3,
        }
      ]}
      accessibilityViewIsModal={true}
      accessibilityLabel="音乐播放控制面板"
    >
      <BlurView
        style={styles.blurView}
        blurType={isDarkMode ? 'dark' : 'light'}
        blurAmount={20}
        reducedTransparencyFallbackColor="rgba(0,0,0,0.7)"
      >
        {/* 关闭手柄 */}
        <View style={styles.handleContainer}>
          <View 
            style={[styles.handle, { backgroundColor: isDarkMode ? '#636366' : '#C7C7CC' }]} 
            accessibilityRole="button"
            accessibilityLabel="关闭播放器"
          />
        </View>

        {/* 内容区域 */}
        <View style={styles.content}>
          {/* 专辑封面 */}
          <Image
            source={require('./placeholder-album.jpg')} // 替换实际资源
            style={styles.albumArt}
            accessibilityLabel="专辑封面"
          />
          
          {/* 播放控制区 */}
          <View style={styles.controlsContainer}>
            {/* 歌曲信息 */}
            <View style={styles.trackInfo}>
              <Text 
                style={[
                  styles.trackTitle, 
                  { color: isDarkMode ? '#FFFFFF' : '#000000' }
                ]}
                accessibilityLabel="歌曲名称"
                numberOfLines={1}
              >
                Song Title
              </Text>
              <Text 
                style={[
                  styles.artistName, 
                  { color: isDarkMode ? '#8E8E93' : '#686870' }
                ]}
                accessibilityLabel="歌手名称"
                numberOfLines={1}
              >
                Artist Name
              </Text>
            </View>
            
            {/* 进度条 */}
            <Slider
              style={styles.progressBar}
              minimumValue={0}
              maximumValue={1}
              value={progress}
              onValueChange={setProgress}
              minimumTrackTintColor="#007AFF" // systemBlue
              maximumTrackTintColor={isDarkMode ? '#48484A' : '#D1D1D6'} // systemGray4
              thumbTintColor="#007AFF" // systemBlue
              accessibilityLabel="播放进度"
            />
            
            {/* 播放控制 */}
            <View style={styles.playbackControls}>
              <TouchableOpacity
                onPress={togglePlayback}
                style={styles.playButton}
                accessibilityLabel={isPlaying ? "暂停" : "播放"}
                accessibilityRole="button"
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <View style={styles.playIcon}>
                  {isPlaying ? (
                    // 暂停图标
                    <View style={styles.pauseIcon}>
                      <View style={[styles.pauseBar, { marginRight: 4 }]} />
                      <View style={styles.pauseBar} />
                    </View>
                  ) : (
                    // 播放图标
                    <View style={styles.triangle} />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    zIndex: 100,
  },
  blurView: {
    flex: 1,
    paddingTop: 12,
  },
  handleContainer: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  albumArt: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 16,
  },
  controlsContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  trackInfo: {
    marginBottom: 16,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'SFProText-Semibold', android: 'sans-serif-medium' }),
    letterSpacing: -0.4,
  },
  artistName: {
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'SFProText-Regular', android: 'sans-serif' }),
    letterSpacing: -0.3,
    marginTop: 4,
  },
  progressBar: {
    width: '100%',
    height: 44, // 满足最小触控区域
  },
  playbackControls: {
    alignItems: 'center',
    marginTop: 8,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 0,
    borderBottomWidth: 7,
    borderTopWidth: 7,
    borderLeftColor: '#000',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
    transform: [{ translateX: 2 }],
  },
  pauseIcon: {
    flexDirection: 'row',
  },
  pauseBar: {
    width: 4,
    height: 20,
    backgroundColor: '#000',
    borderRadius: 2,
  },
});

export default HIGPlayerBottomSheet;