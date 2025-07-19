import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder
} from 'expo-audio';
import { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, TouchableOpacity } from 'react-native'; // 新增 TouchableOpacity
export default function RecordPage() {
  const [currentTime, setCurrentTime] = useState(0); // 示例：60秒
  const [isPlaying, setIsPlaying] = useState(false); // 播放状态控制

  const [isRecording, setIsRecording] = useState(false);
  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    extension: '.m4a',
  });
  // const recorderState = useAudioRecorderState(audioRecorder);
  const [recordingURI, setRecordingURI] = useState<string | undefined>(undefined);

  const audioPlayer = useAudioPlayer({
    uri: recordingURI,
  });

  useEffect(() => {
  if (audioPlayer.isLoaded) {
    console.log('音频已加载');
  } else {
    console.log('音频未加载');
  }
}, [audioPlayer]);


  const record = async () => {
    if (isRecording) return;
    console.log('录音开始');
    setIsRecording(true)
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
  };

  const stopRecording = async () => {
    // The recording will be available on `audioRecorder.uri`.
    await audioRecorder.stop();
    setIsRecording(false);
    console.log('录音结束');
    if (audioRecorder.uri) {
      console.log(audioRecorder.uri)
      setRecordingURI(audioRecorder.uri);
    }
  };

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('权限未授权',
          '请前往系统设置中打开录音权限。',
          [
            {
              text: '取消',
              style: 'cancel',
            },
            {
              text: '设置',
              onPress: () => {
                Linking.openSettings();
              },
            },
          ]
        );
        // 跳转到系统应用设置
      }

      setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  const togglePlayPause = () => {
    const newIsPlay = !isPlaying;
    setIsPlaying(newIsPlay);

    if (newIsPlay) {
      console.log('播放', audioPlayer.isLoaded, audioPlayer.seekTo(0));
      // 开始计时器
      audioPlayer.play();
    } else {
      console.log('暂停播放');
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* 文本容器 */}
      <ThemedView style={styles.spellContainer}>
        <ThemedText style={styles.spellText}>
          My body is strong, and my will is unwavering. Every day, I become
          healthier, lighter, and more energized. I love the way movement fuels
          me, and I honor every healthy choice I make. Losing weight isn’t a
          battle — it’s a journey of self-care and growth. I believe in myself.
          I am on my way to success — and I will get there.
        </ThemedText>
      </ThemedView>

      {/* 底部操作区 */}
      <ThemedView style={styles.actionArea}>
        {/* 滑动条区域 */}
        <ThemedView style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            value={currentTime}
            minimumValue={0}
            maximumValue={1000}
            onValueChange={(value) => setCurrentTime(Math.floor(value))}
            minimumTrackTintColor='#1DB954'
            maximumTrackTintColor='#999'
            thumbTintColor='#fff'
          />
          <ThemedText style={styles.currentTimeText}>
            {formatTime(currentTime)}
          </ThemedText>
        </ThemedView>

        {/* 按钮组 */}
        <ThemedView style={styles.actionButtons}>
          {/* 播放/暂停按钮互斥显示 */}
          <TouchableOpacity onPress={togglePlayPause} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name={isPlaying ? 'pause' : 'play-circle'} // 根据状态切换图标
              size={36}
              color={isPlaying ? '#999' : '#1DB954'} // 可选不同颜色区分状态
            />
          </TouchableOpacity>

          {/* 其他按钮保持不变 */}
          <TouchableOpacity 
            onLongPress={record} 
            onPressOut={stopRecording}
            activeOpacity={0.7}>
            <MaterialCommunityIcons name='microphone' size={40} color='#999' />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7}>
            <MaterialCommunityIcons
              name='share-variant'
              size={36}
              color='#999'
            />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingBottom: 20,
  },
  spellContainer: {
    flex: 1,
    width: '95%',
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    // borderRadius: 10,
    // marginBottom: 20,
  },
  spellText: {
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: 'bold',
  },
  actionArea: {
    width: '90%',
    alignSelf: 'center',
    paddingVertical: 10,
  },
  sliderContainer: {
    width: '100%',
    height: 40,
    marginBottom: 20,
    justifyContent: 'center',
    position: 'relative',
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 20,
  },
  currentTimeText: {
    position: 'absolute',
    top: -15,
    right: 0,
    fontSize: 12,
    color: '#BBBBBB',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});
