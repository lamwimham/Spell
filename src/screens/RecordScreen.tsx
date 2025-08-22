import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InputText } from '../components/ui/InputText';
import { InputTextarea } from '../components/ui/InputTextarea';
import { Button } from '../components/ui/Button';
import { TopNavigationBar } from '../components/ui/TopNavigationBar';
import useAudioKit from '../hooks/useAudioKit';
// import { useOpenAIChatWithCustomSystemPrompt } from '../hooks/useQwen';
import { useOpenAIChatWithCustomSystemPrompt } from '../hooks/useOpenai';
import { VerticalScriptCarousel } from '../components/ui/VerticalScriptCarousel';
import { useRecordings, useRecordingActions } from '../hooks/useRecordings';
import Recording from '../database/models/Recording';

const prompt = `**身份设定**：

您是一名专业心理学家，结合身份声明理论（identity statement）、神经可塑性研究成果，以及相关实践细节，帮助用户通过潜意识重塑来养成好习惯或戒除坏习惯。

**任务说明**：

用户会给出一个目标（例如想要养成某个好习惯，或戒除某个坏习惯）。基于该目标，请您生成 **10 句独立、简洁、目标一致的句子**。这些句子将作为用户的“潜意识锚点”，通过反复朗读来强化新习惯或消除坏习惯。

**句子结构要求**：

- 每句长度：5 - 10 秒内可读完。
- 每句保持简单、口语化。
- 遵循“熟悉优先”原则，让句子更易被潜意识接受。
- 每句分为两部分：
    - **A 部分** = 身份声明（Identity Statement），必须是具体的行动聚焦身份。
    - **B 部分** = 情绪与价值触发，带有强烈的情绪标签（喜悦、自由、厌恶、自豪等），并能引发普遍共鸣。
- 句子统一格式：
    - **养成习惯目标**：\`我是XXXXX（A部分），因为XXXXXX（B部分）\`
    - **戒除坏习惯目标**：也可改为 \`我从不XXXXX（A部分），因为XXXXXX（B部分）\`

**数量与分层**：

- 10 句总共，其中：
    - **5 句基础要求**：A 部分为身份声明 + B 部分为情绪标签
    - **5 句进阶要求**：
        - 戒除目标可采用“我从不…”形式
        - B 部分包含价值取向共鸣（自由、健康、尊严、家庭、成长、独立、幸福等）

**输出限制**：

- 只输出最终的 10 句句子，不要解释，不要额外说明。

**参考示例**：

输入示例: 
我希望戒烟

输出JSON示例:
{
"input": "我希望戒烟",
"output":["我从来不抽烟，因为烟很臭","我从来不抽烟，因为我讨厌被剥削的感觉"]
}`;
// 定义路由参数类型
type RootStackParamList = {
  Record: {
    title?: string;
    script?: string;
    category?: string;
  };
};

type RecordScreenRouteProp = RouteProp<RootStackParamList, 'Record'>;

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

// 咒语文件列表项组件
const RecordingItem: React.FC<{
  item: Recording;
  onPlay: (item: Recording) => void;
  onDelete: (id: string) => void;
}> = ({ item, onPlay, onDelete }) => (
  <View style={styles.recordingItem}>
    <View style={styles.recordingIconContainer}>
      <Icon name="mic" size={24} color="#75r72B7" />
    </View>

    <View style={styles.recordingInfo}>
      <Text style={styles.recordingTitle}>{item.title}</Text>
      <View style={styles.recordingMeta}>
        <Text style={styles.recordingMetaText}>{formatDuration(item.duration)}</Text>
        <Text style={styles.recordingMetaSeparator}>-</Text>
        <Text style={styles.recordingMetaText}>{item.playCount}次播放</Text>
        <Text style={styles.recordingMetaSeparator}>-</Text>
        <Text style={styles.recordingMetaText}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '未知日期'}
        </Text>
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

// 格式化时间显示
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
};

/**
 * 咒语页面
 * 基于现有UI风格设计的咒语功能页面
 */
export function RecordScreen() {
  const navigation = useNavigation();
  const route = useRoute<RecordScreenRouteProp>();
  const params = route.params || {};
  const insets = useSafeAreaInsets();

  // 使用音频Hook
  const {
    audioState,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    startPlaying,
    getRecordingUri,
  } = useAudioKit();

  // 使用Qwen AI Hook
  const {
    loading: isGeneratingScript,
    error: scriptGenerationError,
    sendMessage: generateScriptWithAI,
  } = useOpenAIChatWithCustomSystemPrompt(prompt);

  // 使用咒语Hook
  const recordings = useRecordings();
  const { createRecording, deleteRecording } = useRecordingActions();

  // 状态管理
  const [recordingTime, setRecordingTime] = useState(0);
  const [amplitude, setAmplitude] = useState(0.5);
  const [title, setTitle] = useState(params.title || '');
  const [script, setScript] = useState(params.script || '');

  // 轮播选择模态框状态
  const [isSelectorModalVisible, setIsSelectorModalVisible] = useState(false);
  const [scriptOptions, setScriptOptions] = useState<{ id: string; content: string }[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // 计时器引用
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 同步audioState.recordSecs到recordingTime状态
  useEffect(() => {
    if (audioState.isRecording && !audioState.isPaused) {
      // recordSecs是以毫秒为单位的，需要转换为秒
      setRecordingTime(Math.floor(audioState.recordSecs / 1000));
    }
  }, [audioState.recordSecs, audioState.isRecording, audioState.isPaused]);

  // 格式化咒语时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 开始咒语
  const handleStartRecording = async () => {
    try {
      await startRecording();
      setRecordingTime(0);

      // 清理可能存在的旧计时器
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '无法开始咒语，请检查麦克风权限');
    }
  };

  // 暂停咒语
  const handlePauseRecording = async () => {
    try {
      await pauseRecording();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '暂停咒语失败');
    }
  };

  // 继续咒语
  const handleResumeRecording = async () => {
    try {
      await resumeRecording();

      // 清理可能存在的旧计时器
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '继续咒语失败');
    }
  };

  // 停止咒语
  const handleStopRecording = async () => {
    try {
      await stopRecording();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setAmplitude(0);
    } catch (error: any) {
      Alert.alert('错误', error.message || '停止咒语失败');
    }
  };

  // 保存咒语
  const saveRecording = async () => {
    if (!title.trim()) {
      Alert.alert('提示', '请输入咒语标题');
      return;
    }

    try {
      const recordingUri = getRecordingUri();
      if (!recordingUri) {
        throw new Error('无法获取咒语文件路径');
      }

      // 创建咒语记录
      const result = await createRecording({
        title: title.trim(),
        script: script.trim(),
        url: recordingUri,
        duration: recordingTime,
      });

      if (result.success) {
        // 重置状态
        setRecordingTime(0);
        setTitle('');
        setScript('');

        Alert.alert('成功', '咒语已保存');
      } else {
        throw new Error(result.error || '保存咒语失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '保存咒语失败');
    }
  };

  // 取消咒语
  const cancelRecording = () => {
    Alert.alert('确认取消', '确定要取消当前咒语吗？咒语内容将丢失。', [
      { text: '继续咒语', style: 'cancel' },
      {
        text: '确定取消',
        style: 'destructive',
        onPress: async () => {
          try {
            await resetRecording();
            setRecordingTime(0);
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
          } catch (error: any) {
            Alert.alert('错误', error.message || '取消咒语失败');
          }
        },
      },
    ]);
  };

  // 播放咒语
  const playRecording = async (item: Recording) => {
    try {
      await startPlaying(item.url);
      Alert.alert('播放', `正在播放: ${item.title}`);
    } catch (error: any) {
      Alert.alert('错误', error.message || '播放失败');
    }
  };

  // 删除咒语
  const handleDeleteRecording = async (id: string) => {
    Alert.alert('确认删除', '确定要删除这个咒语吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await deleteRecording(id);
            if (!result.success) {
              throw new Error(result.error || '删除咒语失败');
            }
            Alert.alert('成功', '咒语已删除');
          } catch (error: any) {
            Alert.alert('错误', error.message || '删除咒语失败');
          }
        },
      },
    ]);
  };

  // 清理计时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // AI生成脚本文案的函数
  const generateScriptFromAI = async () => {
    if (!title.trim()) {
      Alert.alert('提示', '请输入咒语标题');
      return;
    }

    try {
      // 收起软键盘
      Keyboard.dismiss();

      // 设置重新生成状态
      setIsRegenerating(true);

      // 发送请求到Qwen API生成脚本
      const response = await generateScriptWithAI(title, 0);

      // 解析AI返回的脚本选项
      let scripts: string[] = [];

      try {
        // 尝试解析JSON格式的响应
        const trimmedResponse = response.response.trim();

        // 检查是否为JSON格式
        if (
          (trimmedResponse.startsWith('{') && trimmedResponse.endsWith('}')) ||
          (trimmedResponse.startsWith('[') && trimmedResponse.endsWith(']'))
        ) {
          const jsonResponse = JSON.parse(trimmedResponse);

          // 处理您提供的格式: { "input": "...", "output": [...] }
          if (jsonResponse.output && Array.isArray(jsonResponse.output)) {
            scripts = jsonResponse.output.filter(
              (item: any) => typeof item === 'string' && item.trim() !== '',
            );
          }
          // 处理数组格式
          else if (Array.isArray(jsonResponse)) {
            scripts = jsonResponse.filter(
              (item: any) => typeof item === 'string' && item.trim() !== '',
            );
          }
          // 处理其他对象格式
          else if (typeof jsonResponse === 'object' && jsonResponse.content) {
            scripts = [jsonResponse.content];
          }
        }
      } catch (jsonError) {
        // JSON解析失败，使用备用解析方法
        console.log('JSON parsing failed, using fallback parsing');
      }

      // 如果JSON解析没有得到结果，使用备用方法
      if (scripts.length === 0) {
        // 尝试按行分割
        const lines = response.response.split('\n').filter(line => line.trim() !== '');
        if (lines.length > 1) {
          scripts = lines;
        } else {
          // 尝试按句号分割
          const sentences = response.response
            .split(/(?<=[.。!！?？])\s+/)
            .filter(s => s.trim() !== '');
          if (sentences.length > 1) {
            scripts = sentences.slice(0, Math.min(10, sentences.length)); // 最多取10个选项
          } else {
            // 最后回退到完整响应
            scripts = [response.response];
          }
        }
      }

      // 过滤掉空的脚本
      scripts = scripts.filter(script => script.trim() !== '');

      // 如果有多个脚本选项，显示轮播选择模态框
      if (scripts.length > 1) {
        const options = scripts.map((script, index) => ({
          id: `script-${index}`,
          content: script.trim(),
        }));

        setScriptOptions(options);
        setIsSelectorModalVisible(true);
      } else {
        // 如果只有一个脚本选项，直接使用
        setScript(scripts[0] ? scripts[0].trim() : '');
        Alert.alert('成功', 'AI已为您生成脚本文案');
      }
    } catch (error: any) {
      console.error('AI生成脚本失败:', error);
      Alert.alert('错误', scriptGenerationError || '生成脚本失败，请稍后重试');
    } finally {
      // 重置重新生成状态
      setIsRegenerating(false);
    }
  };

  // 处理轮盘选择的脚本
  const handleScriptSelection = (selectedScript: string) => {
    setScript(selectedScript);
    // Alert.alert('成功', '已选择咒语');
  };

  // 渲染咒语控制按钮
  const renderRecordingControls = () => {
    if (audioState.isRecording && !audioState.isPaused) {
      return (
        <View style={styles.recordingControls}>
          <TouchableOpacity style={styles.controlButton} onPress={handlePauseRecording}>
            <Icon name="pause" size={24} color="#7572B7" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.recordButton, styles.recordingButton]}
            onPress={handleStopRecording}
          >
            <Icon name="stop" size={32} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={cancelRecording}>
            <Icon name="close" size={24} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      );
    }

    if (audioState.isRecording && audioState.isPaused) {
      return (
        <View style={styles.recordingControls}>
          <TouchableOpacity style={styles.controlButton} onPress={handleResumeRecording}>
            <Icon name="play" size={24} color="#7572B7" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.recordButton, styles.pausedButton]}
            onPress={handleStopRecording}
          >
            <Icon name="stop" size={32} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={cancelRecording}>
            <Icon name="close" size={24} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      );
    }

    if (audioState.isRecording === false && recordingTime > 0) {
      return (
        <View style={styles.completedControls}>
          <Button
            label="重新录制"
            variant="outline"
            onPress={async () => {
              try {
                await resetRecording();
                setRecordingTime(0);
                if (timerRef.current) {
                  clearInterval(timerRef.current);
                  timerRef.current = null;
                }
              } catch (error: any) {
                Alert.alert('错误', error.message || '重置咒语失败');
              }
            }}
            style={styles.completedButton}
          />

          <Button
            label="保存咒语"
            variant="primary"
            onPress={saveRecording}
            style={styles.completedButton}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.recordButton}
        onPress={handleStartRecording}
        activeOpacity={0.8}
      >
        <Icon name="mic" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <TopNavigationBar
        title="咒语"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAwareScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={20}
      >
        {/* 文稿信息 */}
        <View style={styles.scriptSection}>
          <View style={styles.titleContainer}>
            <View style={styles.titleInputContainer}>
              <InputText
                label="咒语标题"
                placeholder="输入咒语标题"
                value={title}
                onChangeText={setTitle}
                disabled={audioState.isRecording}
                style={styles.titleInput}
                testID="input-text-input"
              />
            </View>
            <TouchableOpacity
              style={styles.aiButton}
              onPress={generateScriptFromAI}
              disabled={isGeneratingScript || audioState.isRecording}
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
              disabled={audioState.isRecording || isGeneratingScript}
              helperText="可以根据文稿内容进行录制，也可以自由发挥"
              testID="input-textarea-input"
            />
          </View>
        </View>

        {/* 咒语控制区域 */}
        <View style={styles.recordingSection}>
          {/* 波形可视化 */}
          <WaveformVisualizer
            isRecording={audioState.isRecording && !audioState.isPaused}
            amplitude={amplitude}
          />

          {/* 咒语时间 */}
          <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>

          {/* 咒语控制按钮 */}
          <View style={styles.controlsContainer}>{renderRecordingControls()}</View>

          {/* 咒语状态提示 */}
          {(audioState.isRecording || recordingTime > 0) && (
            <Text style={styles.statusText}>
              {audioState.isRecording && !audioState.isPaused && '正在咒语...'}
              {audioState.isRecording && audioState.isPaused && '咒语已暂停'}
              {!audioState.isRecording && recordingTime > 0 && '咒语完成'}
            </Text>
          )}
        </View>

        {/* 咒语文件列表 */}
        <View style={styles.recordingsSection}>
          <Text style={styles.sectionTitle}>咒语文件</Text>

          {recordings.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="mic-outline" size={48} color="#C8C5D0" />
              <Text style={styles.emptyStateText}>暂无咒语文件</Text>
            </View>
          ) : (
            recordings.map(item => (
              <RecordingItem
                key={item.id}
                item={item}
                onPlay={playRecording}
                onDelete={handleDeleteRecording}
              />
            ))
          )}
        </View>
      </KeyboardAwareScrollView>

      {/* 脚本选择垂直轮播模态框 */}
      <VerticalScriptCarousel
        visible={isSelectorModalVisible}
        onClose={() => setIsSelectorModalVisible(false)}
        onSelect={handleScriptSelection}
        onRegenerate={generateScriptFromAI}
        options={scriptOptions}
        isRegenerating={isRegenerating}
      />
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
