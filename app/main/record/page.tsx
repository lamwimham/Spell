import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AppDispatch, RootState } from '@/store';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRoute } from '@react-navigation/native';
// ... 其他导入
import {
  AudioModule,
  RecordingPresets,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder
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
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import { addSpell, deleteSpell } from '@/store/spellSlice';
import moment from 'moment';
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch: () => AppDispatch = useDispatch;

export default function RecordPage() {
  // 使用 useRoute Hook 来获取路由信息
  let { params } = useRoute<any>(); // 👈 获取 params
  if (!params) {
    params = {};
  }
    // 定义参数类型
  type RecordPageParams = {
    spellId?: string;
    content?: string;
    title?: string;
  };
  const { spellId, content, title } = params as RecordPageParams;

  const [description, setDescription] = useState(content || '');
  const [goal, setGoal] = useState(title || '');
  // 从 params 中解构出你需要的数据
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingURI, setRecordingURI] = useState<string | undefined>(
    undefined
  );
  const [expandedMode, setExpandedMode] = useState<
    'none' | 'recording' | 'playing' | 'saving' | 'deleting' // 添加删除模式
  >('none');
  const theme = useTheme();
  const dispatch = useAppDispatch();

  // 动画值
  const scaleAnimation = useState(new Animated.Value(1))[0];
  const opacityAnimation = useState(new Animated.Value(1))[0];

  const targetSpell = useSelector((state: RootState) =>
    state.spellsReducer.spells.find((spell) => spell.id === spellId)
  );

  let existedSpellUri = targetSpell?.uri;
  const audioPlayer = useAudioPlayer({
    uri: recordingURI,
  });
  const audioPlayerState = useAudioPlayerStatus(audioPlayer);

  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    extension: '.m4a',
  });

  useEffect(() => {
    if (targetSpell?.uri) {
      // console.log('路由进来的，加载录音资源', targetSpell?.uri);
      // audioPlayer.replace({uri: targetSpell?.uri});
      setRecordingURI(targetSpell?.uri); // 设置录音URI
    } 
  }, [audioPlayer, targetSpell?.uri]);

  useEffect(() => {
    if (recordingURI) {
      console.log('录音资源更改了，加载资源：', recordingURI);
      audioPlayer.replace({ uri: recordingURI });
    }
  }, [audioPlayer, recordingURI]);



  const record = async () => {
    if (isRecording) return;
    console.log('录音开始');
    setIsRecording(true);
    await audioRecorder.prepareToRecordAsync({
      ...RecordingPresets.HIGH_QUALITY,
      extension: '.m4a',
    });
    audioRecorder.record();
  };

  useEffect(() => {
    if (audioPlayerState.didJustFinish && recordingURI) {
      console.log('播放完成, 重置', recordingURI);
      audioPlayer.replace({uri: recordingURI})
      setIsPlaying(false);
      setExpandedMode('none');
    }
  }, [audioPlayerState, audioPlayer, recordingURI]);

  const stopRecording = async () => {
    console.log('录音结束', audioRecorder.uri);
    try {
      await audioRecorder.stop();
      setIsRecording(false);

      if (audioRecorder.uri) {
        setRecordingURI(audioRecorder.uri);
      }

      collapseActionArea();
    } catch (error) {
      Alert.alert('录音错误', '录音停止失败，请重试');
      console.error('录音停止失败:', error);
    }
  };

  const handleSave = () => {
    if (!recordingURI) return;
    
    Alert.alert('保存成功', '录音已保存到本地');
    console.log('保存录音:', recordingURI);
    dispatch(
      addSpell({
        id: 'r' + Date.now(),
        name: goal,
        description: description,
        uri: recordingURI,
        createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
        shareCount: undefined,
        playCount: undefined,
        image: 'https://images.pexels.com/photos/32026822/pexels-photo-32026822.jpeg'
      })
    );
    
    // 清空当前录音
    // setRecordingURI(undefined);
    
    // 恢复底部操作区
    collapseActionArea();
  };

  // 处理删除操作
  const handleDelete = () => {
    if (!recordingURI) return;
    
    // 停止播放（如果正在播放）
    if (isPlaying) {
      audioPlayer.pause();
      setIsPlaying(false);
    }
    
    // 清空录音
    setRecordingURI(undefined);
    if (targetSpell) {
      console.log('删除', targetSpell.id);
      dispatch(deleteSpell(targetSpell.id));
    }
    
    // 恢复底部操作区
    collapseActionArea();
    
    Alert.alert('删除成功', '当前录音已删除');
  };

  // 展开底部操作区为指定模式
  const expandActionArea = (mode: 'recording' | 'playing' | 'saving' | 'deleting') => {
    setExpandedMode(mode);

    // 展开动画
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

  // 处理删除确认
  const handleDeleteConfirm = (confirm: boolean) => {
    if (confirm) {
      handleDelete();
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
    })();
  }, []);

  const togglePlayPause = () => {
    const newIsPlay = !isPlaying;
    console.log('togglePlayPause', newIsPlay);

    if (newIsPlay && recordingURI) {
      // 展开播放视图
      console.log('播放');
      setIsPlaying(newIsPlay);
      expandActionArea('playing');
      audioPlayer.play();
    } else if (newIsPlay && !recordingURI) {
      console.log('请先录制');
      Alert.alert('请先录制');
      collapseActionArea()
    } else if (!newIsPlay) {
      console.log('暂停播放');
      // 恢复视图
      setIsPlaying(newIsPlay);
      collapseActionArea();
      audioPlayer.pause();
    }
  };

  // 处理录音长按
  const handleRecordPressIn = () => {
    expandActionArea('recording');
    record();
  };

  // 处理保存点击
  const handleSavePress = () => {
    if (!recordingURI) return;
    if (existedSpellUri === recordingURI) {
      console.log('音源一样不需要保存');
      Alert.alert('提示', '已保存');
      return;
    }
    expandActionArea('saving');
  };
  
  // 处理删除点击
  const handleDeletePress = () => {
    if (!recordingURI) return;
    expandActionArea('deleting');
  };

  return (
    <ThemedView style={styles.container}>
      {/* 文本容器 */}
      <ThemedView style={styles.spellContainer}>
        <ThemedText style={styles.spellText}>
           {description}
        </ThemedText>
      </ThemedView>

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
                
                {/* 新增删除按钮 */}
                <TouchableOpacity
                  onPress={handleDeletePress}
                  activeOpacity={0.7}
                  style={styles.iconButton}
                  disabled={!recordingURI}
                >
                  <MaterialCommunityIcons
                    name='delete'
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
          
          {/* 删除模式下的确认对话框 */}
          {expandedMode === 'deleting' && (
            <View style={styles.expandedContent}>
              <View style={styles.confirmContainer}>
                <ThemedText style={styles.confirmText}>
                  是否确定删除？
                </ThemedText>
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={[styles.confirmButton, styles.confirmButtonNo]}
                    onPress={() => handleDeleteConfirm(true)}
                  >
                    <ThemedText style={styles.confirmButtonText}>是</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmButton, styles.confirmButtonYes]}
                    onPress={() => handleDeleteConfirm(false)}
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
  },
  spellContainer: {
    flex: 1,
    width: '95%',
    alignSelf: 'center',
    justifyContent: 'center',
    padding: 24,
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
    height: ACTION_AREA_HEIGHT,
    alignSelf: 'center',
    elevation: 2,
  },
  expandedIconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  iconButton: {
    padding: 8,
  },
  expandedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedIcon: {
    marginBottom: 20,
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
    backgroundColor: '#11f054ff',
  },
  confirmButtonNo: {
    backgroundColor: '#f1b00cff',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});