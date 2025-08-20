import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InputText } from '../components/ui/InputText';
import { InputTextarea } from '../components/ui/InputTextarea';
import { Button } from '../components/ui/Button';
import { TopNavigationBar } from '../components/ui/TopNavigationBar';

// 定义路由参数类型
type RootStackParamList = {
  Record: {
    title?: string;
    script?: string;
    category?: string;
  };
};

type RecordScreenRouteProp = RouteProp<RootStackParamList, 'Record'>;

// 录音状态枚举
enum RecordingState {
  IDLE = 'idle',
  RECORDING = 'recording',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

// 录音文件接口
interface RecordingFile {
  id: string;
  title: string;
  duration: string;
  size: string;
  date: string;
  filePath: string;
}

// 波形可视化组件
const WaveformVisualizer: React.FC<{ isRecording: boolean; amplitude: number }> = ({
  isRecording,
  amplitude,
}) => {
  const animatedValues = useRef(Array.from({ length: 20 }, () => new Animated.Value(0.1))).current;

  useEffect(() => {
    if (isRecording) {
      const animations = animatedValues.map(animatedValue =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(animatedValue, {
              toValue: Math.random() * amplitude + 0.1,
              duration: 100 + Math.random() * 200,
              useNativeDriver: false,
            }),
            Animated.timing(animatedValue, {
              toValue: 0.1,
              duration: 100 + Math.random() * 200,
              useNativeDriver: false,
            }),
          ]),
        ),
      );

      Animated.stagger(50, animations).start();
    } else {
      animatedValues.forEach(animatedValue => {
        animatedValue.setValue(0.1);
      });
    }
  }, [isRecording, amplitude, animatedValues]);

  return (
    <View style={styles.waveformContainer}>
      {animatedValues.map((animatedValue, index) => (
        <Animated.View
          key={index}
          style={[
            styles.waveformBar,
            {
              height: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [4, 40],
              }),
              backgroundColor: isRecording ? '#7572B7' : '#E3E3F1',
            },
          ]}
        />
      ))}
    </View>
  );
};

// 录音文件列表项组件
const RecordingItem: React.FC<{
  item: RecordingFile;
  onPlay: (item: RecordingFile) => void;
  onDelete: (id: string) => void;
}> = ({ item, onPlay, onDelete }) => (
  <View style={styles.recordingItem}>
    <View style={styles.recordingIconContainer}>
      <Icon name="mic" size={24} color="#7572B7" />
    </View>

    <View style={styles.recordingInfo}>
      <Text style={styles.recordingTitle}>{item.title}</Text>
      <View style={styles.recordingMeta}>
        <Text style={styles.recordingMetaText}>{item.duration}</Text>
        <Text style={styles.recordingMetaSeparator}>-</Text>
        <Text style={styles.recordingMetaText}>{item.size}</Text>
        <Text style={styles.recordingMetaSeparator}>-</Text>
        <Text style={styles.recordingMetaText}>{item.date}</Text>
      </View>
    </View>

    <View style={styles.recordingActions}>
      <TouchableOpacity style={styles.recordingActionButton} onPress={() => onPlay(item)}>
        <Icon name="play" size={20} color="#7572B7" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.recordingActionButton} onPress={() => onDelete(item.id)}>
        <Icon name="trash-outline" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  </View>
);

/**
 * 录音页面
 * 基于现有UI风格设计的录音功能页面
 */
export function RecordScreen() {
  const navigation = useNavigation();
  const route = useRoute<RecordScreenRouteProp>();
  const params = route.params || {};
  const insets = useSafeAreaInsets();

  // 状态管理
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.IDLE);
  const [recordingTime, setRecordingTime] = useState(0);
  const [amplitude, setAmplitude] = useState(0.5);
  const [title, setTitle] = useState(params.title || '');
  const [script, setScript] = useState(params.script || '');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false); // AI生成脚本状态
  const [recordings, setRecordings] = useState<RecordingFile[]>([
    {
      id: '1',
      title: 'Morning Affirmation',
      duration: '2m 30s',
      size: '1.2MB',
      date: '今天',
      filePath: '/path/to/file1.m4a',
    },
    {
      id: '2',
      title: 'Evening Meditation',
      duration: '5m 15s',
      size: '2.8MB',
      date: '昨天',
      filePath: '/path/to/file2.m4a',
    },
  ]);

  // 计时器引用
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 格式化录音时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 开始录音
  const startRecording = async () => {
    try {
      // 这里应该调用实际的录音API
      console.log('开始录音');
      setRecordingState(RecordingState.RECORDING);
      setRecordingTime(0);

      // 启动计时器
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
        setAmplitude(Math.random() * 0.8 + 0.2); // 模拟音频振幅
      }, 1000);
    } catch (error) {
      Alert.alert('错误', '无法开始录音，请检查麦克风权限');
    }
  };

  // 暂停录音
  const pauseRecording = () => {
    console.log('暂停录音');
    setRecordingState(RecordingState.PAUSED);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // 继续录音
  const resumeRecording = () => {
    console.log('继续录音');
    setRecordingState(RecordingState.RECORDING);

    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
      setAmplitude(Math.random() * 0.8 + 0.2);
    }, 1000);
  };

  // 停止录音
  const stopRecording = () => {
    console.log('停止录音');
    setRecordingState(RecordingState.COMPLETED);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setAmplitude(0);
  };

  // 保存录音
  const saveRecording = () => {
    if (!title.trim()) {
      Alert.alert('提示', '请输入录音标题');
      return;
    }

    const newRecording: RecordingFile = {
      id: Date.now().toString(),
      title: title.trim(),
      duration: formatTime(recordingTime),
      size: `${(recordingTime * 0.05).toFixed(1)}MB`, // 模拟文件大小
      date: '刚刚',
      filePath: `/path/to/${Date.now()}.m4a`,
    };

    setRecordings(prev => [newRecording, ...prev]);

    // 重置状态
    setRecordingState(RecordingState.IDLE);
    setRecordingTime(0);
    setTitle('');
    setScript('');

    Alert.alert('成功', '录音已保存');
  };

  // 取消录音
  const cancelRecording = () => {
    Alert.alert('确认取消', '确定要取消当前录音吗？录音内容将丢失。', [
      { text: '继续录音', style: 'cancel' },
      {
        text: '确定取消',
        style: 'destructive',
        onPress: () => {
          setRecordingState(RecordingState.IDLE);
          setRecordingTime(0);
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        },
      },
    ]);
  };

  // 播放录音
  const playRecording = (item: RecordingFile) => {
    console.log('播放录音:', item.title);
    // 这里应该调用实际的播放API
    Alert.alert('播放', `正在播放: ${item.title}`);
  };

  // 删除录音
  const deleteRecording = (id: string) => {
    Alert.alert('确认删除', '确定要删除这个录音吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          setRecordings(prev => prev.filter(item => item.id !== id));
        },
      },
    ]);
  };

  // 清理计时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // AI生成脚本文案的函数（模拟实现）
  const generateScriptFromAI = async () => {
    if (!title.trim()) {
      Alert.alert('提示', '请输入录音标题');
      return;
    }

    // 设置生成状态
    setIsGeneratingScript(true);

    try {
      // 模拟API调用延迟
      await new Promise((resolve: any) => setTimeout(resolve, 2000));

      // 模拟生成的脚本文案
      const generatedScript = `欢迎收听关于"${title}"的内容。\n\n在这里，我们将深入探讨这个主题的各个方面。\n\n首先，让我们了解一下基本概念...\n\n接下来，我们会分享一些实用的建议和技巧...\n\n最后，总结一下今天的内容...`;

      // 更新脚本文案
      setScript(generatedScript);

      Alert.alert('成功', 'AI已为您生成脚本文案');
    } catch (error) {
      console.error('AI生成脚本失败:', error);
      Alert.alert('错误', '生成脚本失败，请稍后重试');
    } finally {
      // 重置生成状态
      setIsGeneratingScript(false);
    }
  };

  // 渲染录音控制按钮
  const renderRecordingControls = () => {
    switch (recordingState) {
      case RecordingState.IDLE:
        return (
          <TouchableOpacity
            style={styles.recordButton}
            onPress={startRecording}
            activeOpacity={0.8}
          >
            <Icon name="mic" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        );

      case RecordingState.RECORDING:
        return (
          <View style={styles.recordingControls}>
            <TouchableOpacity style={styles.controlButton} onPress={pauseRecording}>
              <Icon name="pause" size={24} color="#7572B7" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.recordButton, styles.recordingButton]}
              onPress={stopRecording}
            >
              <Icon name="stop" size={32} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={cancelRecording}>
              <Icon name="close" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        );

      case RecordingState.PAUSED:
        return (
          <View style={styles.recordingControls}>
            <TouchableOpacity style={styles.controlButton} onPress={resumeRecording}>
              <Icon name="play" size={24} color="#7572B7" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.recordButton, styles.pausedButton]}
              onPress={stopRecording}
            >
              <Icon name="stop" size={32} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={cancelRecording}>
              <Icon name="close" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        );

      case RecordingState.COMPLETED:
        return (
          <View style={styles.completedControls}>
            <Button
              label="重新录制"
              variant="outline"
              onPress={() => {
                setRecordingState(RecordingState.IDLE);
                setRecordingTime(0);
              }}
              style={styles.completedButton}
            />

            <Button
              label="保存录音"
              variant="primary"
              onPress={saveRecording}
              style={styles.completedButton}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <TopNavigationBar
        title="录音"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 文稿信息 */}
        <View style={styles.scriptSection}>
          <View style={styles.titleContainer}>
            <View style={styles.titleInputContainer}>
              <InputText
                label="录音标题"
                placeholder="输入录音标题"
                value={title}
                onChangeText={setTitle}
                disabled={recordingState === RecordingState.RECORDING}
                style={styles.titleInput}
                testID="input-text-input"
              />
            </View>
            <TouchableOpacity
              style={styles.aiButton}
              onPress={generateScriptFromAI}
              disabled={isGeneratingScript || recordingState === RecordingState.RECORDING}
              testID="ai-generate-button"
            >
              {isGeneratingScript ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Icon name="sparkles" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.scriptContainer}>
            <InputTextarea
              label="文稿内容"
              placeholder="输入要录制的文稿内容（可选）"
              value={script}
              onChangeText={setScript}
              height={100}
              disabled={recordingState === RecordingState.RECORDING || isGeneratingScript}
              helperText="可以根据文稿内容进行录制，也可以自由发挥"
              testID="input-textarea-input"
            />
          </View>
        </View>

        {/* 录音控制区域 */}
        <View style={styles.recordingSection}>
          {/* 波形可视化 */}
          <WaveformVisualizer
            isRecording={recordingState === RecordingState.RECORDING}
            amplitude={amplitude}
          />

          {/* 录音时间 */}
          <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>

          {/* 录音控制按钮 */}
          <View style={styles.controlsContainer}>{renderRecordingControls()}</View>

          {/* 录音状态提示 */}
          {recordingState !== RecordingState.IDLE && (
            <Text style={styles.statusText}>
              {recordingState === RecordingState.RECORDING && '正在录音...'}
              {recordingState === RecordingState.PAUSED && '录音已暂停'}
              {recordingState === RecordingState.COMPLETED && '录音完成'}
            </Text>
          )}
        </View>

        {/* 录音文件列表 */}
        <View style={styles.recordingsSection}>
          <Text style={styles.sectionTitle}>录音文件</Text>

          {recordings.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="mic-outline" size={48} color="#C8C5D0" />
              <Text style={styles.emptyStateText}>暂无录音文件</Text>
            </View>
          ) : (
            recordings.map(item => (
              <RecordingItem
                key={item.id}
                item={item}
                onPlay={playRecording}
                onDelete={deleteRecording}
              />
            ))
          )}
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E3F1',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Rubik',
    fontWeight: '600',
    color: '#393640',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scriptSection: {
    marginTop: 16,
    marginBottom: 32,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
  },
  titleInputContainer: {
    flex: 1,
  },
  titleInput: {
    width: '100%',
  },
  aiButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#7572B7',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 8,
  },
  scriptContainer: {
    marginTop: 16,
    width: '100%',
  },
  recordingSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3E3F1',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  waveformBar: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  recordingTime: {
    fontSize: 32,
    fontFamily: 'Rubik',
    fontWeight: '600',
    color: '#393640',
    marginBottom: 24,
  },
  controlsContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
  },
  pausedButton: {
    backgroundColor: '#FF9500',
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E3E3F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedControls: {
    flexDirection: 'row',
    gap: 16,
  },
  completedButton: {
    minWidth: 120,
  },
  statusText: {
    fontSize: 15,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#7572B7',
    textAlign: 'center',
  },
  recordingsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Rubik',
    fontWeight: '600',
    color: '#393640',
    marginBottom: 16,
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E3E3F1',
  },
  recordingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E3E3F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingTitle: {
    fontSize: 16,
    fontFamily: 'Rubik',
    fontWeight: '500',
    color: '#393640',
    marginBottom: 4,
  },
  recordingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingMetaText: {
    fontSize: 13,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#535059',
  },
  recordingMetaSeparator: {
    fontSize: 13,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#D2CED9',
    marginHorizontal: 6,
  },
  recordingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  recordingActionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#C8C5D0',
    marginTop: 12,
  },
});
