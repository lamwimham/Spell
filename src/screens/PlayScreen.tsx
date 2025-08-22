import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
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
    // 调试信息
    console.log('音频状态变化:', {
      isPlaying: audioState.isPlaying,
      currentPosition: audioState.currentPosition,
      totalDuration: audioState.totalDuration,
    });

    // 只有在播放完成后才触发完成处理
    if (
      // !audioState.isPlaying &&
      audioState.currentPosition > 0 &&
      audioState.totalDuration > 0 &&
      audioState.currentPosition >= audioState.totalDuration
    ) {
      console.log('播放完成，触发完成处理');
      handlePlaybackCompletion();
    }
  }, [audioState.isPlaying, audioState.currentPosition, audioState.totalDuration]);

  // 播放完成处理
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
      console.log('切换播放状态:', {
        isPlaying: audioState.isPlaying,
        isPaused: audioState.isPaused,
        displayRecording,
      });

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

  return (
    <View style={styles.container}>
      <TopNavigationBar
        title="Player"
        showBackButton={true}
        onBackPress={() => {
          handleStop();
          navigation.goBack();
        }}
        showSettingsButton={true}
        onSettingsPress={() => navigation.navigate('Settings' as never)}
      />

      {/* 音频可视化区域 */}
      <View style={styles.imageContainer}>
        <View style={styles.audioVisualizer}>
          <Icon name={audioState.isPlaying ? 'pulse' : 'mic'} size={100} color="#7572B7" />
        </View>
      </View>

      {/* 音频信息 */}
      <View style={styles.audioInfoContainer}>
        <Text style={styles.audioTitle}>{displayRecording.title}</Text>

        <View style={styles.audioMetaContainer}>
          <View style={styles.metaItem}>
            <Icon name="mic-outline" size={16} color="#535059" />
            <Text style={styles.metaText}>Pitch: 00</Text>
          </View>

          <View style={styles.metaItem}>
            <Icon name="speedometer-outline" size={16} color="#535059" />
            <Text style={styles.metaText}>Speed: Normal</Text>
          </View>
        </View>

        <View style={styles.durationContainer}>
          <Text style={styles.durationText}>{formatDuration(displayRecording.duration || 0)}</Text>
          <Text style={styles.durationSeparator}>-</Text>
          <Text style={styles.durationText}>{displayRecording.playCount || 0}次播放</Text>
        </View>
      </View>

      {/* 进度条 */}
      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          value={progress}
          onValueChange={handleSliderChange}
          minimumTrackTintColor="#7572B7"
          maximumTrackTintColor="#E3E3F1"
          thumbTintColor="#FFFFFF"
          disabled={!audioState.isPlaying && !audioState.isPaused}
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(audioState.currentPosition)}</Text>
          <Text style={styles.timeText}>{formatTime(audioState.totalDuration)}</Text>
        </View>
      </View>

      {/* 控制按钮 */}
      <View style={styles.controlsContainer}>
        {/* 左侧：循环次数设置 */}
        <View style={styles.loopCountContainer}>
          <TouchableOpacity
            style={styles.loopCountButton}
            onPress={() => updateLoopCount(playbackSettings.loopCount - 1)}
            disabled={playbackSettings.playMode === 'single' || playbackSettings.loopCount <= 1}
          >
            <Icon
              name="remove"
              size={20}
              color={
                playbackSettings.playMode === 'single' || playbackSettings.loopCount <= 1
                  ? '#D2CED9'
                  : '#7572B7'
              }
            />
          </TouchableOpacity>

          <Text style={styles.loopCountText}>
            {playbackSettings.playMode === 'single' ? '1' : playbackSettings.loopCount}
          </Text>

          <TouchableOpacity
            style={styles.loopCountButton}
            onPress={() => updateLoopCount(playbackSettings.loopCount + 1)}
            disabled={playbackSettings.playMode === 'single' || playbackSettings.loopCount >= 99}
          >
            <Icon
              name="add"
              size={20}
              color={
                playbackSettings.playMode === 'single' || playbackSettings.loopCount >= 99
                  ? '#D2CED9'
                  : '#7572B7'
              }
            />
          </TouchableOpacity>
        </View>

        {/* 中间：播放/暂停按钮 */}
        <TouchableOpacity style={styles.playPauseButton} onPress={togglePlayPause}>
          <Icon name={audioState.isPlaying ? 'pause' : 'play'} size={32} color="#FFFFFF" />
        </TouchableOpacity>

        {/* 右侧：单次播放/循环播放切换 */}
        <TouchableOpacity style={styles.modeButton} onPress={togglePlayMode}>
          <Icon
            name={playbackSettings.playMode === 'single' ? 'play' : 'repeat'}
            size={24}
            color="#7572B7"
          />
          <Text style={styles.modeButtonText}>
            {playbackSettings.playMode === 'single' ? '单次' : '循环'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 当前循环次数显示 (仅在循环模式下显示) */}
      {playbackSettings.playMode === 'loop' && (
        <View style={styles.loopInfoContainer}>
          <Text style={styles.loopInfoText}>
            {currentLoop}/{playbackSettings.loopCount}
          </Text>
        </View>
      )}

      {/* 底部指示器 */}
      <View style={styles.tabIndicator} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    height: 96,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#393640',
    fontFamily: 'Rubik',
    textAlign: 'center',
    flex: 1,
  },
  settingsButton: {
    padding: 8,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
  },
  audioVisualizer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#E3E3F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioInfoContainer: {
    alignItems: 'center',
    marginTop: 48,
  },
  audioTitle: {
    fontSize: 28,
    fontWeight: '500',
    color: '#393640',
    fontFamily: 'Rubik',
    textAlign: 'center',
  },
  audioMetaContainer: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'center',
    width: '100%',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  metaText: {
    fontSize: 15,
    color: '#535059',
    fontFamily: 'Rubik',
    marginLeft: 4,
  },
  durationContainer: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
  },
  durationText: {
    fontSize: 15,
    color: '#535059',
    fontFamily: 'Rubik',
  },
  durationSeparator: {
    fontSize: 15,
    color: '#D2CED9',
    fontFamily: 'Rubik',
    marginHorizontal: 8,
  },
  progressContainer: {
    marginTop: 40,
    paddingHorizontal: 28,
  },
  slider: {
    width: '100%',
    height: 28,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#535059',
    fontFamily: 'Rubik',
    fontWeight: '500',
  },
  loopCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loopCountButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3E3F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loopCountText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#393640',
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E3E3F1',
  },
  modeButtonText: {
    fontSize: 16,
    color: '#393640',
    marginLeft: 8,
    fontWeight: '500',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 28,
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#7572B7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loopInfoContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  loopInfoText: {
    fontSize: 16,
    color: '#535059',
    fontWeight: '500',
  },
  tabIndicator: {
    width: 139,
    height: 5,
    backgroundColor: 'black',
    borderRadius: 100,
    alignSelf: 'center',
    position: 'absolute',
    bottom: 8,
  },
});
