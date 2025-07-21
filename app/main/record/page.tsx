import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
} from 'expo-audio';
import { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from 'react-native-paper';

export default function RecordPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingURI, setRecordingURI] = useState<string | undefined>(
    undefined
  );
  const [expandedMode, setExpandedMode] = useState<
    'none' | 'recording' | 'playing' | 'saving'
  >('none');
  const theme = useTheme();

  // 动画值
  const scaleAnimation = useState(new Animated.Value(1))[0];
  const opacityAnimation = useState(new Animated.Value(1))[0];

  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    extension: '.m4a',
  });

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
    setIsRecording(true);
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
  };

const stopRecording = async () => {
  console.log('录音结束')
  try {
    await audioRecorder.stop();
    setIsRecording(false);
    if (audioRecorder.uri) setRecordingURI(audioRecorder.uri);
    collapseActionArea();
  } catch (error) {
    Alert.alert('录音错误', '录音停止失败，请重试');
    console.error('录音停止失败:', error);
  }
};

  const handleSave = () => {
    // 实际保存逻辑需要根据您的存储方案实现
    Alert.alert('保存成功', '录音已保存到本地');
    console.log('保存录音:', recordingURI);

    // 恢复底部操作区
    collapseActionArea();
  };

  // 展开底部操作区为指定模式
  const expandActionArea = (mode: 'recording' | 'playing' | 'saving') => {
    setExpandedMode(mode);

    // 展开动画 - 只改变缩放和透明度，不改变高度
    Animated.parallel([
      Animated.timing(scaleAnimation, {
        toValue: 1.05,
        duration: 160,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnimation, {
        toValue: 0.9,
        duration: 160,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 修改 collapseActionArea
  const collapseActionArea = () => {
    Animated.parallel([
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnimation, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setExpandedMode('none');
    });
  };

  // 处理保存确认
  const handleSaveConfirm = (confirm: boolean) => {
    if (confirm) {
      handleSave();
    } else {
      collapseActionArea();
    }
  };

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('权限未授权', '请前往系统设置中打开录音权限。', [
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
        ]);
      }

      setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  const togglePlayPause = () => {
    const newIsPlay = !isPlaying;
    console.log('togglePlayPause');
    setIsPlaying(newIsPlay);

    if (newIsPlay) {
      // 展开播放视图
      console.log('播放');
      expandActionArea('playing');
      audioPlayer.play();
    } else {  
      console.log('暂停播放');
      // 恢复视图
      collapseActionArea();
      audioPlayer.pause();
    }
  };

  // 处理录音长按
  const handleRecordPressIn = () => {
    expandActionArea('recording');
    record();
  };
  useEffect(() => {
  console.log('isRecording:', isRecording);
  console.log('isPlaying:', isPlaying);
  console.log('expandedMode:', expandedMode);
}, [isRecording, isPlaying, expandedMode]);

  // 处理保存点击
  const handleSavePress = () => {
    if (!recordingURI) return;
    expandActionArea('saving');
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
      {/* <LyricsDisplay 
        styles={{
          container: {
            backgroundColor: 'transparent',
          },
          line: {
            color: 'red',
          },
          highlighted: {
            color: 'white',
          }
        }}
      lyrics={[
        {time:0, text:'My body is strong'},
        {time:2, text:' my will is unwavering'},
        {time:4, text:'My body is strong, and'},
        {time:6, text:'My body is strong, and'},
        {time:8, text:'My body is strong, and'}, 
        {time:10, text:'My body is strong, and'},
        {time:14, text:'My body is strong, and'},
        {time:19, text:'My body is strong, and'},
        {time:21, text:'My body is strong, and'},
        {time:24, text:'My body is strong, and'},
        {time:26, text:'My body is strong, and'},
        {time:28, text:'My body is strong, and'},
        {time:30, text:'My body is strong, and'},
        {time:32, text:'My body is strong, and'},
        {time:34, text:'My body is strong, and'},
        {time:36, text:'My body is strong, and'},
        {time:40, text:'My body is strong, and'},
        {time:42, text:'My body is strong, and'},
        {time:44, text:'My body is strong, and'},
        {time:47, text:'My body is strong, and'},
        {time:50, text:'My body is strong, and'},
        
        ] } currentTime={32}>

        </LyricsDisplay> */}

      {/* 底部操作区 - 统一高度 */}
      <Animated.View
        style={[
          styles.actionArea,
          {
            transform: [{ scale: scaleAnimation }],
            opacity: opacityAnimation,
          },
        ]}
        onTouchEnd={() => {
          if (isRecording && expandedMode === 'recording') {
            stopRecording();
          }
        }}
      >
        {/* 所有模式都使用相同的布局容器 */}
        <View style={styles.contentContainer}>
          {/* 正常模式下的操作区 */}
          {expandedMode === 'none' && (
            <>
              {/* 按钮组 - 垂直居中 */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={togglePlayPause}
                  activeOpacity={0.7}
                  style={styles.iconButton}
                >
                  <MaterialCommunityIcons
                    name={isPlaying ? 'pause' : 'play-circle'}
                    size={36}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleRecordPressIn}
                  // onPressOut={stopRecording} // 直接绑定 onPressOut
                  activeOpacity={0.7}
                  style={styles.iconButton}
                >
                  <MaterialCommunityIcons
                    name='microphone'
                    size={40}
                    color={isRecording ? '#FF0000' : theme.colors.primary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSavePress}
                  activeOpacity={0.7}
                  style={styles.iconButton}
                  disabled={!recordingURI}
                >
                  <MaterialCommunityIcons
                    name='content-save'
                    size={36}
                    color={recordingURI ? theme.colors.primary : '#9E9E9E'}
                  />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* 录音模式下的放大图标 */}
          {expandedMode === 'recording' && (
            <View style={styles.expandedContent}>
              <MaterialCommunityIcons
                name='microphone'
                size={80}
                color='#FF0000'
                style={styles.expandedIcon}
              />
            </View>
          )}

          {/* 播放模式下的放大图标 */}
          {expandedMode === 'playing' && (
            <TouchableOpacity
              onPress={togglePlayPause}
              style={styles.expandedIconContainer}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name='pause'
                size={80}
                color={theme.colors.primary}
                style={styles.expandedIcon}
              />
            </TouchableOpacity>
          )}

          {/* 保存模式下的确认对话框 */}
          {expandedMode === 'saving' && (
            <View style={styles.expandedContent}>
              <View style={styles.confirmContainer}>
                <ThemedText style={styles.confirmText}>
                  是否确定保存？
                </ThemedText>
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={[styles.confirmButton, styles.confirmButtonYes]}
                    onPress={() => handleSaveConfirm(true)}
                  >
                    <ThemedText style={styles.confirmButtonText}>是</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmButton, styles.confirmButtonNo]}
                    onPress={() => handleSaveConfirm(false)}
                  >
                    <ThemedText style={styles.confirmButtonText}>否</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Animated.View>
    </ThemedView>
  );
}

const ACTION_AREA_HEIGHT = 160; // 统一高度

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    // paddingBottom: 20,
    backgroundColor: 'transparent'
  },
  spellContainer: {
    flex: 1,
    width: '95%',
    alignSelf: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 3,
    marginVertical: 16,
  },
  spellText: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
    color: '#1C1B1F',
  },
  actionArea: {
    width: '90%',
    height: ACTION_AREA_HEIGHT, // 固定高度
    alignSelf: 'center',
    backgroundColor: 'transparent',
    // borderBlockColor: '#FFFFFF',
    // borderWidth: 1,
    // borderRadius: 16,
    elevation: 2,
  },
  expandedIconContainer: {
    flex: 1, // 填充父容器
    justifyContent: 'center', // 垂直居中
    alignItems: 'center', // 水平居中
    paddingHorizontal: 24, // 内边距防止内容贴边
    backgroundColor: 'transparent',
  },
  contentContainer: {
    flex: 1,
      backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  currentTimeText: {
    position: 'absolute',
    top: -15,
    right: 16,
    fontSize: 12,
    color: '#6750A4',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16, // 底部内边距，确保垂直居中
  },
  iconButton: {
    padding: 8,
  },
  recordingLabel: {
    position: 'absolute',
    bottom: ACTION_AREA_HEIGHT + 20, // 固定在操作区上方
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingLabelText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
  },
  expandedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedIcon: {
    marginBottom: 20,
  },
  expandedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  confirmContainer: {
    width: '80%',
    padding: 24,
    backgroundColor: '#FFF',
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  confirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    elevation: 2,
  },
  confirmButtonYes: {
    backgroundColor: '#6750A4',
  },
  confirmButtonNo: {
    backgroundColor: '#E5E5E5',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});