import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQwenChatWithDynamicSystemPrompt } from '../hooks/useQwen';
import { useNavigation } from '@react-navigation/native';
import { TopNavigationBar } from '../components/ui/TopNavigationBar';
import { SystemPromptSelector } from '../components/ui/SystemPromptSelector';
import { useTheme } from '../hooks/useTheme';

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp?: number;
};

const ChatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, textStyles, spacing, shadows } = useTheme();
  const {
    sendMessage,
    lastResponse,
    loading,
    error,
    setSystemPromptByKey,
    setCustomSystemPrompt,
    currentSystemPrompt,
  } = useQwenChatWithDynamicSystemPrompt();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList<any>>(null);
  const [isPromptSelectorVisible, setIsPromptSelectorVisible] = useState(false);

  // 处理 AI 响应的接收并追加到消息列表
  useEffect(() => {
    if (lastResponse) {
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        text: lastResponse.content,
        isUser: false,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);
      // 滚动到底部
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [lastResponse]);

  // 处理硬件返回键（Android）
  useEffect(() => {
    const onBackPress = () => {
      if (navigation && navigation.goBack) {
        navigation.goBack();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [navigation]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    sendMessage(text);
    // 滚动到最新
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderItem = ({ item }: { item: Message }) => {
    const dynamicStyles = createStyles({ colors, textStyles, spacing, shadows });

    return (
      <View
        style={[
          dynamicStyles.bubble,
          item.isUser ? dynamicStyles.userBubble : dynamicStyles.aiBubble,
        ]}
      >
        <Text style={dynamicStyles.messageText}>{item.text}</Text>
      </View>
    );
  };

  const emptyState = useMemo(() => {
    const dynamicStyles = createStyles({ colors, textStyles, spacing, shadows });

    return (
      <View style={dynamicStyles.emptyState}>
        <Text style={dynamicStyles.emptyStateText}>和AI开始聊天吧！输入消息并发送。</Text>
      </View>
    );
  }, [colors, textStyles, spacing, shadows]);

  const dynamicStyles = createStyles({ colors, textStyles, spacing, shadows });

  return (
    <View style={dynamicStyles.container}>
      <TopNavigationBar
        title="AI 助手"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightIconName="settings-outline"
        onRightIconPress={() => setIsPromptSelectorVisible(true)}
        iconColor={colors.primary}
      />

      <KeyboardAvoidingView
        style={dynamicStyles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={dynamicStyles.listContent}
          ListEmptyComponent={emptyState}
        />

        {error ? (
          <View style={dynamicStyles.errorContainer}>
            <Text style={dynamicStyles.errorText}>错误: {error}</Text>
          </View>
        ) : null}

        <View style={dynamicStyles.inputArea}>
          <TextInput
            style={dynamicStyles.input}
            value={input}
            onChangeText={setInput}
            placeholder="输入消息..."
            placeholderTextColor={colors.textTertiary}
            multiline
          />
          <TouchableOpacity
            style={[
              dynamicStyles.sendButton,
              (loading || input.trim().length === 0) && dynamicStyles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={loading || input.trim().length === 0}
          >
            {loading ? (
              <ActivityIndicator color={colors.buttonText} />
            ) : (
              <Text style={dynamicStyles.sendButtonText}>发送</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* 系统提示词选择器模态框 */}
      <Modal
        visible={isPromptSelectorVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsPromptSelectorVisible(false)}
      >
        <SystemPromptSelector
          onSelectPrompt={prompt => {
            if ('id' in prompt) {
              setSystemPromptByKey(prompt.id as any);
            }
          }}
          onCustomPrompt={content => {
            console.log('system prompt: ', content);
            setCustomSystemPrompt(content);
          }}
          currentPrompt={currentSystemPrompt}
          onClose={() => setIsPromptSelectorVisible(false)}
        />
      </Modal>
    </View>
  );
};

/**
 * 创建动态样式的函数
 */
const createStyles = ({ colors, textStyles, spacing, shadows }: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    listContent: {
      padding: spacing.padding.card,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    bubble: {
      padding: spacing.padding.card,
      borderRadius: spacing.borderRadius.md,
      marginVertical: spacing.xs,
      maxWidth: '78%',
    },
    userBubble: {
      backgroundColor: colors.primary,
      alignSelf: 'flex-end',
      ...shadows.light,
    },
    aiBubble: {
      backgroundColor: colors.surface,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.light,
    },
    messageText: {
      ...textStyles.body1,
      color: colors.text,
    },
    errorContainer: {
      position: 'absolute',
      top: spacing.sm,
      left: spacing.padding.card,
      right: spacing.padding.card,
      backgroundColor: colors.error + '20', // 20% opacity
      padding: spacing.padding.input,
      borderRadius: spacing.borderRadius.sm,
      zIndex: 1,
      ...shadows.medium,
    },
    errorText: {
      ...textStyles.body2,
      color: colors.error,
    },
    inputArea: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 120,
      ...textStyles.body1,
      backgroundColor: colors.backgroundElevated,
      borderRadius: spacing.borderRadius.lg,
      paddingHorizontal: spacing.padding.input,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
    },
    sendButton: {
      marginLeft: spacing.sm,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.medium,
    },
    sendButtonDisabled: {
      backgroundColor: colors.textTertiary,
    },
    sendButtonText: {
      ...textStyles.button,
      color: colors.buttonText,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
    emptyStateText: {
      ...textStyles.body1,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

export default ChatScreen;
