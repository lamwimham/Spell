// 通义千问 Hooks

import { useState, useCallback } from 'react';
import { QwenAPI } from './client';
import { QwenMessage, QwenChatRequest, QwenChatResponse } from './types';
import { DEFAULT_MODEL, DEFAULT_PARAMETERS } from './config';

interface UseQwenChatOptions {
  apiKey: string;
  model?: string;
  parameters?: QwenChatRequest['parameters'];
}

export const useQwenChat = ({
  apiKey,
  model = DEFAULT_MODEL,
  parameters = DEFAULT_PARAMETERS,
}: UseQwenChatOptions) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<QwenMessage[]>([]);

  const qwenAPI = new QwenAPI(apiKey);

  const sendMessage = useCallback(
    async (content: string) => {
      setLoading(true);
      setError(null);

      try {
        // 添加用户消息到历史记录
        const userMessage: QwenMessage = { role: 'user', content };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);

        // 构造请求
        const request: QwenChatRequest = {
          model,
          input: {
            messages: updatedMessages,
          },
          parameters,
        };

        // 发送请求
        const response: QwenChatResponse = await qwenAPI.chatCompletion(request);

        // 添加助手回复到历史记录
        const assistantMessage: QwenMessage = {
          role: 'assistant',
          content: response.output.text,
        };
        setMessages(prev => [...prev, assistantMessage]);

        return response.output.text;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [messages, apiKey, model, parameters],
  );

  const resetConversation = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    loading,
    error,
    messages,
    sendMessage,
    resetConversation,
  };
};
