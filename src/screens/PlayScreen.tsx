import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { TopNavigationBar } from '../components/ui/TopNavigationBar';
import { useRecording } from '../hooks/useRecordings';
import Recording from '../database/models/Recording';

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

// 格式化文件大小显示
// const formatFileSize = (bytes: number): string => {
//   if (bytes < 1024) return `${bytes}b`;
//   if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}kb`;
//   return `${(bytes / (1024 * 1024)).toFixed(1)}mb`;
// };

export default function PlayScreen() {
  const navigation = useNavigation();
  const route = useRoute<PlayScreenRouteProp>();
  const { recording: recordingParam } = route.params || { recording: null };

  // 使用响应式咒语数据
  const recording = useRecording(recordingParam?.id || null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0.52); // 初始进度值，根据设计图约为52%

  // 切换播放/暂停状态
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // 如果咒语不存在，显示默认信息
  const displayRecording = recording ||
    recordingParam || {
      title: '未知音频',
      duration: 0,
      playCount: 0,
    };

  return (
    <View style={styles.container}>
      <TopNavigationBar
        title="Player"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        showSettingsButton={true}
        onSettingsPress={() => navigation.navigate('Settings' as never)}
      />

      {/* 音频可视化区域 */}
      <View style={styles.imageContainer}>
        <View style={styles.audioVisualizer}>
          <Icon name="pulse" size={100} color="#7572B7" />
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
          <Text style={styles.durationText}>{formatDuration(displayRecording.duration)}</Text>
          <Text style={styles.durationSeparator}>-</Text>
          <Text style={styles.durationText}>{displayRecording.playCount}次播放</Text>
        </View>
      </View>

      {/* 进度条 */}
      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          value={progress}
          onValueChange={setProgress}
          minimumTrackTintColor="#7572B7"
          maximumTrackTintColor="#E3E3F1"
          thumbTintColor="#FFFFFF"
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>00:05</Text>
          <Text style={styles.timeText}>23:45</Text>
        </View>
      </View>

      {/* 控制按钮 */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton}>
          <Icon name="thumbs-down-outline" size={28} color="#7572B7" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.playPauseButton} onPress={togglePlayPause}>
          <Icon name={isPlaying ? 'pause' : 'play'} size={32} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton}>
          <Icon name="thumbs-up-outline" size={28} color="#7572B7" />
        </TouchableOpacity>
      </View>

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
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  controlButton: {
    padding: 12,
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#7572B7',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 32,
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
