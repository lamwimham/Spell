import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { TopNavigationBar } from '../components/ui/TopNavigationBar';
import { useRecording } from '../hooks/useRecordings';
import { useRecordingActions } from '../hooks/useRecordings';
import Recording from '../database/models/Recording';
import useAudioKit from '../hooks/useAudioKit';
import {
  getPlaybackSettings,
  savePlaybackSettings,
  PlaybackSettings,
} from '../services/storage/playbackSettingsService';
import { useTheme } from '../hooks/useTheme';

// 滚动项高度常量
const SCROLL_ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 3; // 显示3个数字（上一个、当前、下一个）

// 定义路由参数类型
type RootStackParamList = {
  Play: { recording: Recording };
};

type PlayScreenRouteProp = RouteProp<RootStackParamList, 'Play'>;

// 格式化时间显示
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
};

// 格式化毫秒为 mm:ss
const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function PlayScreen() {
  const navigation = useNavigation();
  const route = useRoute<PlayScreenRouteProp>();
  const { recording: recordingParam } = route.params || { recording: null };
  const { colors, textStyles, spacing, shadows } = useTheme();

  // 使用响应式咒语数据
  const recording = useRecording(recordingParam?.id || null);
  const { incrementPlayCount } = useRecordingActions();

  // 使用音频播放 Hook
  const { audioState, startPlaying, pausePlaying, resumePlaying, stopPlaying, seekTo } =
    useAudioKit();

  // 播放设置状态
  const [playbackSettings, setPlaybackSettings] = useState<PlaybackSettings>({
    playMode: 'single' as 'single' | 'loop',
    loopCount: 1,
  });

  // 当前循环次数
  const [currentLoop, setCurrentLoop] = useState(1);
  // 滚动引用
  const loopScrollRef = useRef<ScrollView>(null);

  // 加载播放设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getPlaybackSettings();
        setPlaybackSettings(settings);
      } catch (error: any) {
        console.warn('加载播放设置失败:', error);
      }
    };

    loadSettings();
  }, []);

  // 处理播放完成事件
  useEffect(() => {
    // 只有在播放完成后才触发完成处理，并且只执行一次
    // 注意：播放完成后，audioState.isPlaying 仍然是 true，直到我们调用 stopPlaying()
    // 所以我们只检查 currentPosition 和 totalDuration 来判断播放完成
    if (
      audioState.currentPosition > 0 &&
      audioState.totalDuration > 0 &&
      audioState.currentPosition >= audioState.totalDuration
    ) {
      console.log('播放完成，触发完成处理');
      handlePlaybackCompletion();
    }
  }, [audioState.currentPosition, audioState.totalDuration]);

  // 播放完成一次录音的处理
  const handlePlaybackCompletion = async () => {
    // 增加播放次数
    // 确保我们有有效的ID来增加播放次数
    const recordingId = recording?.id || recordingParam?.id;
    if (recordingId) {
      await incrementPlayCount(recordingId);
    }

    // 根据播放模式处理
    if (playbackSettings.playMode === 'loop') {
      if (currentLoop < playbackSettings.loopCount) {
        // 继续循环
        setCurrentLoop(prev => prev + 1);
        // 重置播放完成状态以允许下一次循环检测
        if (displayRecording.url) {
          try {
            await startPlaying(displayRecording.url, true);
          } catch (error: any) {
            console.error('循环播放失败:', error);
            Alert.alert('播放错误', '无法继续播放音频文件');
          }
        }
      } else {
        // 循环完成，停止播放以确保按钮状态正确更新
        console.log('循环播放完成，停止播放');
        setCurrentLoop(1);
        await stopPlaying();
      }
    } else {
      // 单次播放完成
      setCurrentLoop(1);
      // 停止播放以确保按钮状态正确更新
      await stopPlaying();
    }
  };

  // 切换播放/暂停状态
  const togglePlayPause = async () => {
    try {
      if (audioState.isPlaying) {
        console.log('暂停播放');
        await pausePlaying();
      } else if (audioState.isPaused) {
        console.log('恢复播放');
        await resumePlaying();
      } else {
        // 开始播放
        console.log('准备播放音频:', displayRecording);
        if (displayRecording.url) {
          console.log('播放URL:', displayRecording.url);
          await startPlaying(displayRecording.url, playbackSettings.playMode === 'loop');
          setCurrentLoop(1);
          // 重置播放完成状态
        } else {
          console.warn('音频URL为空');
          Alert.alert('播放错误', '音频文件路径无效');
        }
      }
    } catch (error: any) {
      console.error('播放控制失败:', error);
      Alert.alert('播放错误', `无法播放音频文件: ${error.message}`);
    }
  };

  // 停止播放
  const handleStop = async () => {
    try {
      await stopPlaying();
      setCurrentLoop(1);
      // 重置播放完成状态
    } catch (error: any) {
      console.error('停止播放失败:', error);
    }
  };

  // 切换播放模式
  const togglePlayMode = async () => {
    const newMode: 'single' | 'loop' = playbackSettings.playMode === 'single' ? 'loop' : 'single';
    const newSettings: PlaybackSettings = {
      ...playbackSettings,
      playMode: newMode,
    };

    setPlaybackSettings(newSettings);
    try {
      await savePlaybackSettings(newSettings);
    } catch (error: any) {
      console.warn('保存播放设置失败:', error);
    }
  };

  // 更新循环次数
  const updateLoopCount = async (count: number) => {
    // 在单次播放模式下不允许更新循环次数
    if (playbackSettings.playMode === 'single') {
      return;
    }

    if (count < 1) count = 1;
    if (count > 99) count = 99; // 限制最大循环次数

    const newSettings: PlaybackSettings = {
      ...playbackSettings,
      loopCount: count,
    };

    setPlaybackSettings(newSettings);
    try {
      await savePlaybackSettings(newSettings);
    } catch (error: any) {
      console.warn('保存播放设置失败:', error);
    }
  };

  // 处理滚动选择循环次数
  const handleLoopScrollEnd = (event: any) => {
    if (playbackSettings.playMode === 'single') return;

    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / SCROLL_ITEM_HEIGHT);
    const newCount = index + 1;

    if (newCount !== playbackSettings.loopCount) {
      updateLoopCount(newCount);
    }
  };

  // 当循环次数改变时，自动滚动到对应位置
  useEffect(() => {
    if (loopScrollRef.current && playbackSettings.playMode === 'loop') {
      const targetOffset = (playbackSettings.loopCount - 1) * SCROLL_ITEM_HEIGHT;
      loopScrollRef.current.scrollTo({ y: targetOffset, animated: true });
    }
  }, [playbackSettings.loopCount, playbackSettings.playMode]);

  // 生成数字选项数组（1-99）
  const generateNumberOptions = () => {
    return Array.from({ length: 99 }, (_, i) => i + 1);
  };

  // 处理进度条变化
  const handleSliderChange = async (value: number) => {
    if (audioState.totalDuration > 0) {
      const newPosition = value * audioState.totalDuration;
      try {
        await seekTo(newPosition);
      } catch (error: any) {
        console.error('跳转位置失败:', error);
      }
    }
  };

  // 如果咒语不存在，显示默认信息
  // 确保我们正确处理WatermelonDB模型对象，提取所需属性
  const displayRecording = recording
    ? {
        id: recording.id,
        title: recording.title,
        duration: recording.duration,
        playCount: recording.playCount,
        url: recording.url,
      }
    : recordingParam
    ? {
        id: recordingParam.id,
        title: recordingParam.title,
        duration: recordingParam.duration,
        playCount: recordingParam.playCount,
        url: recordingParam.url,
      }
    : {
        title: '未知音频',
        duration: 0,
        playCount: 0,
        url: '',
      };

  // 计算进度条值
  const progress =
    audioState.totalDuration > 0 ? audioState.currentPosition / audioState.totalDuration : 0;

  const dynamicStyles = createStyles({ colors, textStyles, spacing, shadows });

  return (
    <View style={dynamicStyles.container}>
      <TopNavigationBar
        title="Player"
        showBackButton={true}
        onBackPress={() => {
          handleStop();
          navigation.goBack();
        }}
        showSettingsButton={false}
      />

      {/* 文稿显示区域 */}
      <View style={dynamicStyles.scriptContainer}>
        <Text style={dynamicStyles.scriptTitle}>文稿</Text>
        <View style={dynamicStyles.scriptContent}>
          <Text style={dynamicStyles.scriptText}>
            {recording?.script || recordingParam?.script || '暂无文稿'}
          </Text>
        </View>
      </View>

      {/* 音频可视化区域 */}
      <View style={dynamicStyles.imageContainer}>
        <View style={dynamicStyles.audioVisualizer}>
          <Icon name={audioState.isPlaying ? 'pulse' : 'mic'} size={100} color={colors.primary} />
        </View>
      </View>

      {/* 音频信息 */}
      <View style={dynamicStyles.audioInfoContainer}>
        <Text style={dynamicStyles.audioTitle}>{displayRecording.title}</Text>

        <View style={dynamicStyles.audioMetaContainer}>
          <View style={dynamicStyles.metaItem}>
            <Icon name="mic-outline" size={16} color={colors.textSecondary} />
            <Text style={dynamicStyles.metaText}>Pitch: 00</Text>
          </View>

          <View style={dynamicStyles.metaItem}>
            <Icon name="speedometer-outline" size={16} color={colors.textSecondary} />
            <Text style={dynamicStyles.metaText}>Speed: Normal</Text>
          </View>
        </View>

        <View style={dynamicStyles.durationContainer}>
          <Text style={dynamicStyles.durationText}>
            {formatDuration(displayRecording.duration || 0)}
          </Text>
          <Text style={dynamicStyles.durationSeparator}>-</Text>
          <Text style={dynamicStyles.durationText}>{displayRecording.playCount || 0}次播放</Text>
          {playbackSettings.playMode === 'loop' && (
            <>
              <Text style={dynamicStyles.durationSeparator}>-</Text>
              <Text style={dynamicStyles.durationText}>
                {currentLoop}/{playbackSettings.loopCount}次循环
              </Text>
            </>
          )}
        </View>
      </View>

      {/* 进度条 */}
      <View style={dynamicStyles.progressContainer}>
        <Slider
          style={dynamicStyles.slider}
          minimumValue={0}
          maximumValue={1}
          value={progress}
          onValueChange={handleSliderChange}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.buttonText}
          disabled={!audioState.isPlaying && !audioState.isPaused}
        />
        <View style={dynamicStyles.timeContainer}>
          <Text style={dynamicStyles.timeText}>{formatTime(audioState.currentPosition)}</Text>
          <Text style={dynamicStyles.timeText}>{formatTime(audioState.totalDuration)}</Text>
        </View>
      </View>

      {/* 控制按钮 */}
      <View style={dynamicStyles.controlsContainer}>
        {/* 左侧：循环次数设置 */}
        <View style={dynamicStyles.loopCountContainer}>
          {playbackSettings.playMode === 'single' ? (
            <Text style={dynamicStyles.loopCountText}>1</Text>
          ) : (
            <View style={dynamicStyles.scrollPickerWrapper}>
              <ScrollView
                ref={loopScrollRef}
                style={dynamicStyles.scrollPicker}
                contentContainerStyle={dynamicStyles.scrollPickerContent}
                showsVerticalScrollIndicator={false}
                snapToInterval={SCROLL_ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleLoopScrollEnd}
                scrollEventThrottle={16}
              >
                {generateNumberOptions().map((number, _index) => {
                  const isSelected = number === playbackSettings.loopCount;
                  return (
                    <View key={number} style={dynamicStyles.scrollItem}>
                      <Text
                        style={[
                          dynamicStyles.scrollItemText,
                          isSelected && dynamicStyles.selectedScrollItemText,
                        ]}
                      >
                        {number}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
              {/* 顶部渐变遮罩 */}
              <LinearGradient
                colors={[colors.background, 'transparent']}
                style={dynamicStyles.topGradient}
                pointerEvents="none"
              />
              {/* 底部渐变遮罩 */}
              <LinearGradient
                colors={['transparent', colors.background]}
                style={dynamicStyles.bottomGradient}
                pointerEvents="none"
              />
            </View>
          )}
        </View>

        {/* 中间：播放/暂停按钮 */}
        <TouchableOpacity style={dynamicStyles.playPauseButton} onPress={togglePlayPause}>
          <Icon
            name={audioState.isPlaying ? 'pause' : 'play'}
            size={32}
            color={colors.buttonText}
          />
        </TouchableOpacity>

        {/* 右侧：单次播放/循环播放文字说明 */}
        <TouchableOpacity style={dynamicStyles.modeButton} onPress={togglePlayMode}>
          <Text style={dynamicStyles.modeButtonText}>
            {playbackSettings.playMode === 'single' ? '单次' : '循环'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 底部指示器 */}
      <View style={dynamicStyles.tabIndicator} />
    </View>
  );
}

/**
 * 创建动态样式的函数
 */
const createStyles = ({ colors, textStyles, spacing, shadows }: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scriptContainer: {
      marginTop: spacing.md,
      marginHorizontal: spacing.lg,
      padding: spacing.md,
      backgroundColor: colors.backgroundPrimary,
      borderRadius: spacing.borderRadius.md,
      maxHeight: 150,
      ...shadows.light,
    },
    scriptTitle: {
      ...textStyles.body1,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    scriptContent: {
      maxHeight: 100,
    },
    scriptText: {
      ...textStyles.body2,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    imageContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xxl,
    },
    audioVisualizer: {
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: colors.backgroundPrimary,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.medium,
    },
    audioInfoContainer: {
      alignItems: 'center',
      marginTop: spacing.xxl,
    },
    audioTitle: {
      ...textStyles.h2,
      color: colors.text,
      textAlign: 'center',
    },
    audioMetaContainer: {
      flexDirection: 'row',
      marginTop: spacing.md,
      justifyContent: 'center',
      width: '100%',
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: spacing.sm,
    },
    metaText: {
      ...textStyles.body2,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    durationContainer: {
      flexDirection: 'row',
      marginTop: spacing.md,
      alignItems: 'center',
    },
    durationText: {
      ...textStyles.body2,
      color: colors.textSecondary,
    },
    durationSeparator: {
      ...textStyles.body2,
      color: colors.border,
      marginHorizontal: spacing.sm,
    },
    progressContainer: {
      marginTop: spacing.xl,
      paddingHorizontal: spacing.lg + spacing.md,
    },
    slider: {
      width: '100%',
      height: 28,
    },
    timeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    timeText: {
      ...textStyles.body2,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    controlsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.xl,
      paddingHorizontal: spacing.lg,
      position: 'relative',
    },
    loopCountContainer: {
      position: 'absolute',
      left: spacing.xl,
      alignItems: 'center',
      width: 80,
    },
    simpleScrollPickerContainer: {
      width: 80,
      height: SCROLL_ITEM_HEIGHT * VISIBLE_ITEMS,
      overflow: 'hidden',
      borderRadius: spacing.borderRadius.md,
      backgroundColor: colors.backgroundPrimary,
      ...shadows.medium,
      paddingHorizontal: spacing.sm,
    },
    simpleScrollPicker: {
      flex: 1,
    },
    simpleScrollPickerContent: {
      paddingVertical: SCROLL_ITEM_HEIGHT, // 添加上下padding确保第一个和最后一个选项能居中
    },
    simpleScrollItem: {
      height: SCROLL_ITEM_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
    },
    simpleScrollItemText: {
      ...textStyles.h3,
      color: colors.primary,
      fontWeight: '600',
    },
    scrollPickerWrapper: {
      width: 80,
      height: SCROLL_ITEM_HEIGHT * VISIBLE_ITEMS,
      position: 'relative',
      backgroundColor: colors.backgroundPrimary,
      borderRadius: spacing.borderRadius.md,
      ...shadows.medium,
    },
    scrollPicker: {
      flex: 1,
    },
    scrollPickerContent: {
      paddingVertical: SCROLL_ITEM_HEIGHT, // 添加上下padding确保第一个和最后一个选项能居中
    },
    scrollItem: {
      height: SCROLL_ITEM_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollItemText: {
      ...textStyles.body1,
      color: colors.textSecondary,
      fontWeight: '400',
    },
    selectedScrollItemText: {
      ...textStyles.h3,
      color: colors.primary,
      fontWeight: '600',
    },
    topGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: SCROLL_ITEM_HEIGHT,
      zIndex: 1,
    },
    bottomGradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: SCROLL_ITEM_HEIGHT,
      zIndex: 1,
    },
    loopCountText: {
      ...textStyles.h3,
      color: colors.text,
      textAlign: 'center',
      width: 80,
      height: SCROLL_ITEM_HEIGHT * VISIBLE_ITEMS,
      lineHeight: SCROLL_ITEM_HEIGHT * VISIBLE_ITEMS,
      borderRadius: spacing.borderRadius.md,
      backgroundColor: colors.backgroundPrimary,
      ...shadows.medium,
      paddingHorizontal: spacing.sm,
    },
    playPauseButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.heavy,
    },
    modeButton: {
      position: 'absolute',
      right: spacing.xl,
      alignItems: 'center',
      width: 80,
      height: SCROLL_ITEM_HEIGHT * 1,
      borderRadius: spacing.borderRadius.md,
      backgroundColor: colors.backgroundPrimary,
      ...shadows.medium,
      justifyContent: 'center',
      paddingHorizontal: spacing.sm,
    },
    modeButtonText: {
      ...textStyles.h3,
      color: colors.primary,
      fontWeight: '600',
    },

    tabIndicator: {
      width: 139,
      height: 5,
      backgroundColor: colors.primary,
      borderRadius: spacing.borderRadius.circle,
      alignSelf: 'center',
      position: 'absolute',
      bottom: spacing.sm,
    },
  });
