// AudioKit 使用示例

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import useAudioKit from '../hooks/useAudioKit';

const AudioKitExampleScreen = () => {
  const {
    audioState,
    // 咒语方法
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    // 播放方法
    startPlaying,
    pausePlaying,
    resumePlaying,
    stopPlaying,
    // 控制方法
    seekTo,
    setVolume,
    setPlaybackSpeed,
    // 获取 URI
    getRecordingUri,
  } = useAudioKit();

  const [volume, setVolumeState] = useState(1.0);
  const [speed, setSpeedState] = useState(1.0);

  // 咒语相关操作
  const handleStartRecording = async () => {
    try {
      const uri = await startRecording();
      Alert.alert('开始咒语', `咒语文件将保存到: ${uri}`);
    } catch (error: any) {
      Alert.alert('咒语错误', error.message);
    }
  };

  const handleStopRecording = async () => {
    try {
      const uri = await stopRecording();
      Alert.alert('咒语完成', `咒语文件已保存到: ${uri}`);
    } catch (error: any) {
      Alert.alert('停止咒语错误', error.message);
    }
  };

  const handlePauseRecording = async () => {
    try {
      await pauseRecording();
      Alert.alert('咒语已暂停');
    } catch (error: any) {
      Alert.alert('暂停咒语错误', error.message);
    }
  };

  const handleResumeRecording = async () => {
    try {
      await resumeRecording();
      Alert.alert('咒语已恢复');
    } catch (error: any) {
      Alert.alert('恢复咒语错误', error.message);
    }
  };

  const handleResetRecording = async () => {
    try {
      await resetRecording();
      Alert.alert('咒语已重置');
    } catch (error: any) {
      Alert.alert('重置咒语错误', error.message);
    }
  };

  // 播放相关操作
  const handleStartPlaying = async () => {
    const uri = getRecordingUri();
    if (!uri) {
      Alert.alert('错误', '没有咒语文件可播放');
      return;
    }

    try {
      await startPlaying(uri);
      Alert.alert('开始播放', `正在播放: ${uri}`);
    } catch (error: any) {
      Alert.alert('播放错误', error.message);
    }
  };

  const handleStartLoopPlaying = async () => {
    const uri = getRecordingUri();
    if (!uri) {
      Alert.alert('错误', '没有咒语文件可播放');
      return;
    }

    try {
      await startPlaying(uri, true);
      Alert.alert('开始循环播放', `正在循环播放: ${uri}`);
    } catch (error: any) {
      Alert.alert('循环播放错误', error.message);
    }
  };

  const handlePausePlaying = async () => {
    try {
      await pausePlaying();
      Alert.alert('播放已暂停');
    } catch (error: any) {
      Alert.alert('暂停播放错误', error.message);
    }
  };

  const handleResumePlaying = async () => {
    try {
      await resumePlaying();
      Alert.alert('播放已恢复');
    } catch (error: any) {
      Alert.alert('恢复播放错误', error.message);
    }
  };

  const handleStopPlaying = async () => {
    try {
      await stopPlaying();
      Alert.alert('播放已停止');
    } catch (error: any) {
      Alert.alert('停止播放错误', error.message);
    }
  };

  // 控制操作
  const handleSeekTo = async (position: number) => {
    try {
      await seekTo(position * 1000); // 转换为毫秒
      Alert.alert('跳转成功', `已跳转到 ${position} 秒`);
    } catch (error: any) {
      Alert.alert('跳转错误', error.message);
    }
  };

  const handleSetVolume = async (newVolume: number) => {
    try {
      await setVolume(newVolume);
      setVolumeState(newVolume);
      Alert.alert('音量设置', `音量已设置为 ${newVolume}`);
    } catch (error: any) {
      Alert.alert('音量设置错误', error.message);
    }
  };

  const handleSetSpeed = async (newSpeed: number) => {
    try {
      await setPlaybackSpeed(newSpeed);
      setSpeedState(newSpeed);
      Alert.alert('速度设置', `播放速度已设置为 ${newSpeed}x`);
    } catch (error: any) {
      Alert.alert('速度设置错误', error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>AudioKit 使用示例</Text>

      {/* 咒语部分 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>咒语控制</Text>

        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            状态: {audioState.isRecording ? (audioState.isPaused ? '已暂停' : '咒语中') : '未咒语'}
          </Text>
          <Text style={styles.timeText}>时间: {audioState.recordTime}</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, audioState.isRecording && styles.buttonDisabled]}
            onPress={handleStartRecording}
            disabled={audioState.isRecording}
          >
            <Text style={styles.buttonText}>开始咒语</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, !audioState.isRecording && styles.buttonDisabled]}
            onPress={handleStopRecording}
            disabled={!audioState.isRecording}
          >
            <Text style={styles.buttonText}>停止咒语</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.button,
              (!audioState.isRecording || audioState.isPaused) && styles.buttonDisabled,
            ]}
            onPress={handlePauseRecording}
            disabled={!audioState.isRecording || audioState.isPaused}
          >
            <Text style={styles.buttonText}>暂停咒语</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              (!audioState.isRecording || !audioState.isPaused) && styles.buttonDisabled,
            ]}
            onPress={handleResumeRecording}
            disabled={!audioState.isRecording || !audioState.isPaused}
          >
            <Text style={styles.buttonText}>恢复咒语</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, !audioState.isRecording && styles.buttonDisabled]}
          onPress={handleResetRecording}
          disabled={!audioState.isRecording}
        >
          <Text style={styles.buttonText}>重置咒语</Text>
        </TouchableOpacity>

        {getRecordingUri() && (
          <View style={styles.uriContainer}>
            <Text style={styles.uriLabel}>咒语文件:</Text>
            <Text style={styles.uriText} numberOfLines={3}>
              {getRecordingUri()}
            </Text>
          </View>
        )}
      </View>

      {/* 播放部分 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>播放控制</Text>

        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            状态: {audioState.isPlaying ? (audioState.isPaused ? '已暂停' : '播放中') : '未播放'}
          </Text>
          <Text style={styles.timeText}>
            时间: {audioState.playTime} / {audioState.duration}
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.button,
              (audioState.isPlaying || !getRecordingUri()) && styles.buttonDisabled,
            ]}
            onPress={handleStartPlaying}
            disabled={audioState.isPlaying || !getRecordingUri()}
          >
            <Text style={styles.buttonText}>开始播放</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              (!audioState.isPlaying || audioState.isPaused) && styles.buttonDisabled,
            ]}
            onPress={handleStartLoopPlaying}
            disabled={!audioState.isPlaying || audioState.isPaused}
          >
            <Text style={styles.buttonText}>循环播放</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.button,
              (!audioState.isPlaying || audioState.isPaused) && styles.buttonDisabled,
            ]}
            onPress={handlePausePlaying}
            disabled={!audioState.isPlaying || audioState.isPaused}
          >
            <Text style={styles.buttonText}>暂停播放</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              (!audioState.isPlaying || !audioState.isPaused) && styles.buttonDisabled,
            ]}
            onPress={handleResumePlaying}
            disabled={!audioState.isPlaying || !audioState.isPaused}
          >
            <Text style={styles.buttonText}>恢复播放</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, !audioState.isPlaying && styles.buttonDisabled]}
          onPress={handleStopPlaying}
          disabled={!audioState.isPlaying}
        >
          <Text style={styles.buttonText}>停止播放</Text>
        </TouchableOpacity>

        {/* 跳转控制 */}
        <View style={styles.controlSection}>
          <Text style={styles.controlLabel}>跳转到:</Text>
          <View style={styles.buttonRow}>
            {[1, 5, 10, 30].map(sec => (
              <TouchableOpacity
                key={sec}
                style={[styles.smallButton, !audioState.isPlaying && styles.buttonDisabled]}
                onPress={() => handleSeekTo(sec)}
                disabled={!audioState.isPlaying}
              >
                <Text style={styles.buttonText}>{sec}s</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 音量控制 */}
        <View style={styles.controlSection}>
          <Text style={styles.controlLabel}>音量: {volume.toFixed(1)}</Text>
          <View style={styles.sliderContainer}>
            <TouchableOpacity
              style={[styles.smallButton, !audioState.isPlaying && styles.buttonDisabled]}
              onPress={() => handleSetVolume(Math.max(0, volume - 0.1))}
              disabled={!audioState.isPlaying}
            >
              <Text style={styles.buttonText}>-</Text>
            </TouchableOpacity>
            <View style={styles.volumeBarContainer}>
              <View style={[styles.volumeBar, { width: `${volume * 100}%` }]} />
            </View>
            <TouchableOpacity
              style={[styles.smallButton, !audioState.isPlaying && styles.buttonDisabled]}
              onPress={() => handleSetVolume(Math.min(1, volume + 0.1))}
              disabled={!audioState.isPlaying}
            >
              <Text style={styles.buttonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 速度控制 */}
        <View style={styles.controlSection}>
          <Text style={styles.controlLabel}>速度: {speed.toFixed(1)}x</Text>
          <View style={styles.buttonRow}>
            {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(spd => (
              <TouchableOpacity
                key={spd}
                style={[
                  styles.smallButton,
                  (speed === spd || !audioState.isPlaying) && styles.buttonDisabled,
                  speed === spd && styles.activeButton,
                ]}
                onPress={() => handleSetSpeed(spd)}
                disabled={!audioState.isPlaying || speed === spd}
              >
                <Text style={[styles.buttonText, speed === spd && styles.activeButtonText]}>
                  {spd}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#393640',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: '#E3E3F1',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#393640',
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    color: '#535059',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#7572B7',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#7572B7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#E3E3F1',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  activeButton: {
    backgroundColor: '#FF6B6B',
  },
  activeButtonText: {
    color: '#FFFFFF',
  },
  smallButton: {
    backgroundColor: '#7572B7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  uriContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  uriLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#393640',
    marginBottom: 4,
  },
  uriText: {
    fontSize: 12,
    color: '#535059',
  },
  controlSection: {
    marginTop: 16,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#393640',
    marginBottom: 8,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  volumeBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E3E3F1',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  volumeBar: {
    height: '100%',
    backgroundColor: '#7572B7',
    borderRadius: 4,
  },
});

export default AudioKitExampleScreen;
