// OpenAI Hook 使用示例

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useOpenAIChat, useOpenAIChatWithSystemPrompt } from './useOpenai';

const OpenAIExample = () => {
  const [input, setInput] = useState('');
  
  // 使用通用助手角色的聊天hook
  const {
    loading,
    error,
    messages,
    sendMessage,
    resetConversation,
    lastAssistantMessage,
  } = useOpenAIChatWithSystemPrompt('GENERAL_ASSISTANT');

  const handleSend = async () => {
    if (input.trim() === '') return;
    
    try {
      await sendMessage(input, 0);
      setInput('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleReset = () => {
    resetConversation();
    setInput('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OpenAI Chat Example</Text>
      
      <ScrollView style={styles.messagesContainer}>
        {messages.map((message, index) => (
          <View 
            key={index} 
            style={[
              styles.messageBubble, 
              message.role === 'user' ? styles.userMessage : styles.assistantMessage
            ]}
          >
            <Text style={styles.messageText}>
              <Text style={styles.messageRole}>{message.role}: </Text>
              {message.content}
            </Text>
          </View>
        ))}
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Type your message here..."
          multiline
          numberOfLines={2}
          editable={!loading}
        />
        <Button title="Send" onPress={handleSend} disabled={loading || input.trim() === ''} />
        <Button title="Reset" onPress={handleReset} color="#FF3B30" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 16,
  },
  errorContainer: {
    padding: 12,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    backgroundColor: 'white',
    maxHeight: 100,
  },
});

export default OpenAIExample;