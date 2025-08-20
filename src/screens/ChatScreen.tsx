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
import { useQwenChatWithDynamicSystemPrompt } from '../services/qwen/hooks';
import { useNavigation } from '@react-navigation/native';
import { TopNavigationBar } from '../components/ui/TopNavigationBar';
import { SystemPromptSelector } from '../components/ui/SystemPromptSelector';

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp?: number;
};

const ChatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
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

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[styles.bubble, item.isUser ? styles.userBubble : styles.aiBubble]}>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  const emptyState = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>和AI开始聊天吧！输入消息并发送。</Text>
      </View>
    ),
    [],
  );

  return (
    <View style={styles.container}>
      <TopNavigationBar
        title="AI 助手"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightIconName="settings-outline"
        onRightIconPress={() => setIsPromptSelectorVisible(true)}
        iconColor="#7572B7"
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={emptyState}
        />

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>错误: {error}</Text>
          </View>
        ) : null}

        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="输入消息..."
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            disabled={loading || input.trim().length === 0}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>发送</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  listContent: {
    padding: 12,
    paddingTop: 16,
    paddingBottom: 8,
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
    marginVertical: 6,
    maxWidth: '78%',
    // 默认背景，具体 colours 会根据 isUser 区分
  },
  userBubble: {
    backgroundColor: '#e1f5fe',
    alignSelf: 'flex-end',
  },
  aiBubble: {
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 8,
    zIndex: 1,
  },
  errorText: {
    color: '#c62828',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sendButton: {
    marginLeft: 8,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1976d2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyStateText: {
    color: '#888',
  },
});

export default ChatScreen;
