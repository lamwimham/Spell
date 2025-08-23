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
import { useTheme } from '../hooks/useTheme';

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
const WaveformVisualizer: React.FC<{ isRecording: boolean; amplitude: number; colors: any }> = ({
  isRecording,
  amplitude,
  colors,
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
    <View
      style={{ flexDirection: 'row', alignItems: 'center', height: 50, justifyContent: 'center' }}
    >
      {animatedValues.map((animatedValue, index) => (
        <Animated.View
          key={index}
          style={[
            {
              width: 3,
              marginHorizontal: 1,
              borderRadius: 1.5,
            },
            {
              height: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [4, 40],
              }),
              backgroundColor: isRecording ? colors.primary : colors.border,
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
  colors: any;
  textStyles: any;
  spacing: any;
}> = ({ item, onPlay, onDelete, colors, textStyles, spacing }) => {
  const itemStyles = {
    recordingItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: spacing.borderRadius.sm,
      marginBottom: spacing.sm,
    },
    recordingIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backgroundPrimary,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: spacing.md,
    },
    recordingInfo: {
      flex: 1,
    },
    recordingTitle: {
      ...textStyles.body1,
      color: colors.text,
      fontWeight: '500',
      marginBottom: spacing.xs,
    },
    recordingMeta: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    recordingMetaText: {
      ...textStyles.caption,
      color: colors.textSecondary,
    },
    recordingMetaSeparator: {
      ...textStyles.caption,
      color: colors.border,
      marginHorizontal: spacing.xs,
    },
    recordingActions: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    recordingActionButton: {
      padding: spacing.sm,
      marginLeft: spacing.xs,
    },
  };

  return (
    <View style={itemStyles.recordingItem}>
      <View style={itemStyles.recordingIconContainer}>
        <Icon name="mic" size={24} color={colors.primary} />
      </View>

      <View style={itemStyles.recordingInfo}>
        <Text style={itemStyles.recordingTitle}>{item.title}</Text>
        <View style={itemStyles.recordingMeta}>
          <Text style={itemStyles.recordingMetaText}>{formatDuration(item.duration)}</Text>
          <Text style={itemStyles.recordingMetaSeparator}>-</Text>
          <Text style={itemStyles.recordingMetaText}>{item.playCount}次播放</Text>
          <Text style={itemStyles.recordingMetaSeparator}>-</Text>
          <Text style={itemStyles.recordingMetaText}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '未知日期'}
          </Text>
        </View>
      </View>

      <View style={itemStyles.recordingActions}>
        <TouchableOpacity style={itemStyles.recordingActionButton} onPress={() => onPlay(item)}>
          <Icon name="play" size={20} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={itemStyles.recordingActionButton}
          onPress={() => onDelete(item.id)}
        >
          <Icon name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
  const { colors, textStyles, spacing, shadows, isDark } = useTheme();

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

  // 创建动态样式函数
  const createStyles = ({ colors, textStyles, spacing, shadows }: any) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
      },
      scriptSection: {
        marginTop: spacing.lg,
        marginBottom: spacing.xxl,
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
        width: 48,
        height: 48,
        borderRadius: spacing.borderRadius.sm,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: spacing.sm,
        marginBottom: spacing.xs,
      },
      scriptContainer: {
        marginTop: spacing.lg,
        width: '100%',
      },
      recordingSection: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
        marginBottom: spacing.xxl,
        backgroundColor: colors.surface,
        borderRadius: spacing.borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
      },
      recordingTime: {
        ...textStyles.h1,
        color: colors.text,
        marginBottom: spacing.xl,
      },
      controlsContainer: {
        alignItems: 'center',
        marginBottom: spacing.lg,
      },
      recordButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.heavy,
      },
      recordingButton: {
        backgroundColor: colors.primary,
      },
      pausedButton: {
        backgroundColor: colors.warning,
      },
      recordingControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xl,
      },
      controlButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.backgroundPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.light,
      },
      completedControls: {
        flexDirection: 'row',
        gap: spacing.lg,
      },
      completedButton: {
        minWidth: 120,
      },
      statusText: {
        ...textStyles.body1,
        color: colors.accent,
        textAlign: 'center',
      },
      recordingsSection: {
        marginBottom: spacing.xxl,
      },
      sectionTitle: {
        ...textStyles.h2,
        color: colors.text,
        marginBottom: spacing.lg,
      },
      emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xxl + spacing.lg,
      },
      emptyStateText: {
        ...textStyles.body1,
        color: colors.textSecondary,
        marginTop: spacing.md,
      },
    });

  // 渲染咒语控制按钮
  const renderRecordingControls = () => {
    const dynamicStyles = createStyles({ colors, textStyles, spacing, shadows });

    if (audioState.isRecording && !audioState.isPaused) {
      return (
        <View style={dynamicStyles.recordingControls}>
          <TouchableOpacity style={dynamicStyles.controlButton} onPress={handlePauseRecording}>
            <Icon name="pause" size={24} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[dynamicStyles.recordButton, dynamicStyles.recordingButton]}
            onPress={handleStopRecording}
          >
            <Icon name="stop" size={32} color={colors.buttonText} />
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.controlButton} onPress={cancelRecording}>
            <Icon name="close" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      );
    }

    if (audioState.isRecording && audioState.isPaused) {
      return (
        <View style={dynamicStyles.recordingControls}>
          <TouchableOpacity style={dynamicStyles.controlButton} onPress={handleResumeRecording}>
            <Icon name="play" size={24} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[dynamicStyles.recordButton, dynamicStyles.pausedButton]}
            onPress={handleStopRecording}
          >
            <Icon name="stop" size={32} color={colors.buttonText} />
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.controlButton} onPress={cancelRecording}>
            <Icon name="close" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      );
    }

    if (audioState.isRecording === false && recordingTime > 0) {
      return (
        <View style={dynamicStyles.completedControls}>
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
            style={dynamicStyles.completedButton}
          />

          <Button
            label="保存咒语"
            variant="primary"
            onPress={saveRecording}
            style={dynamicStyles.completedButton}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={dynamicStyles.recordButton}
        onPress={handleStartRecording}
        activeOpacity={0.8}
      >
        <Icon name="mic" size={32} color={colors.buttonText} />
      </TouchableOpacity>
    );
  };

  const dynamicStyles = createStyles({ colors, textStyles, spacing, shadows });

  return (
    <View style={[dynamicStyles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <TopNavigationBar
        title="咒语"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAwareScrollView
        style={dynamicStyles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={20}
      >
        {/* 文稿信息 */}
        <View style={dynamicStyles.scriptSection}>
          <View style={dynamicStyles.titleContainer}>
            <View style={dynamicStyles.titleInputContainer}>
              <InputText
                label="咒语标题"
                placeholder="输入咒语标题"
                value={title}
                onChangeText={setTitle}
                disabled={audioState.isRecording}
                style={dynamicStyles.titleInput}
                testID="input-text-input"
              />
            </View>
            <TouchableOpacity
              style={dynamicStyles.aiButton}
              onPress={generateScriptFromAI}
              disabled={isGeneratingScript || audioState.isRecording}
              testID="ai-generate-button"
            >
              {isGeneratingScript ? (
                <ActivityIndicator size="small" color={colors.buttonText} />
              ) : (
                <Icon name="sparkles" size={20} color={colors.buttonText} />
              )}
            </TouchableOpacity>
          </View>

          <View style={dynamicStyles.scriptContainer}>
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
        <View style={dynamicStyles.recordingSection}>
          {/* 波形可视化 */}
          <WaveformVisualizer
            isRecording={audioState.isRecording && !audioState.isPaused}
            amplitude={amplitude}
            colors={colors}
          />

          {/* 咒语时间 */}
          <Text style={dynamicStyles.recordingTime}>{formatTime(recordingTime)}</Text>

          {/* 咒语控制按钮 */}
          <View style={dynamicStyles.controlsContainer}>{renderRecordingControls()}</View>

          {/* 咒语状态提示 */}
          {(audioState.isRecording || recordingTime > 0) && (
            <Text style={dynamicStyles.statusText}>
              {audioState.isRecording && !audioState.isPaused && '正在咒语...'}
              {audioState.isRecording && audioState.isPaused && '咒语已暂停'}
              {!audioState.isRecording && recordingTime > 0 && '咒语完成'}
            </Text>
          )}
        </View>

        {/* 咒语文件列表 */}
        <View style={dynamicStyles.recordingsSection}>
          <Text style={dynamicStyles.sectionTitle}>咒语文件</Text>

          {recordings.length === 0 ? (
            <View style={dynamicStyles.emptyState}>
              <Icon name="mic-outline" size={48} color={colors.textSecondary} />
              <Text style={dynamicStyles.emptyStateText}>暂无咒语文件</Text>
            </View>
          ) : (
            recordings.map(item => (
              <RecordingItem
                key={item.id}
                item={item}
                onPlay={playRecording}
                onDelete={handleDeleteRecording}
                colors={colors}
                textStyles={textStyles}
                spacing={spacing}
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
