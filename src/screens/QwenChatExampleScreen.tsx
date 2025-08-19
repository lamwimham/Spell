// 示例组件：展示如何在 SpellApp 中使用通义千问 API
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useQwenChat } from '../services/qwen';

const QwenChatExampleScreen = () => {
  const [inputText, setInputText] = useState('');

  // 在实际应用中，应该从安全存储中获取 API Key
  const API_KEY = process.env.QWEN_API_KEY || 'your-api-key-here';

  const { loading, error, messages, sendMessage, resetConversation } = useQwenChat({
    apiKey: API_KEY,
    model: 'qwen-max',
    parameters: {
      temperature: 0.8,
      max_tokens: 1500,
    },
  });

  const handleSend = async () => {
    if (!inputText.trim()) {
      Alert.alert('提示', '请输入消息内容');
      return;
    }

    try {
      await sendMessage(inputText);
      setInputText('');
    } catch (err) {
      Alert.alert('错误', '发送消息失败，请重试');
    }
  };

  const handleReset = () => {
    resetConversation();
    setInputText('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>通义千问对话示例</Text>

      <ScrollView style={styles.messagesContainer}>
        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              message.role === 'user' ? styles.userMessage : styles.assistantMessage,
            ]}
          >
            <Text style={styles.messageText}>
              <Text style={styles.messageRole}>
                {message.role === 'user' ? '我: ' : '通义千问: '}
              </Text>
              {message.content}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>通义千问正在思考中...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>错误: {error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="输入消息..."
          multiline
          editable={!loading}
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={handleReset}
            disabled={loading}
          >
            <Text style={styles.buttonText}>重置</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.sendButton]}
            onPress={handleSend}
            disabled={loading}
          >
            <Text style={styles.buttonText}>发送</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#333',
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 16,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  userMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
  },
  messageRole: {
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginVertical: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    padding: 12,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    marginVertical: 4,
  },
  errorText: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 60,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  resetButton: {
    backgroundColor: '#FF9500',
  },
  sendButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QwenChatExampleScreen;
