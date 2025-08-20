// 通义千问 Hooks

import { useState, useCallback, useMemo } from 'react';
import { DEFAULT_MODEL, DEFAULT_PARAMETERS } from '../services/qwen/config';
import { QwenAPI } from '../services/qwen/client';
import { QwenChatRequest, QwenChatResponse, QwenMessage } from '../services/qwen/types';
import { ENV } from '../services/qwen/env';
import { SYSTEM_PROMPTS } from '../services/qwen/example';

interface UseQwenChatOptions {
  apiKey?: string; // 可选参数，如果未提供则从环境变量获取
  model?: string;
  systemRole?: QwenMessage; // 可选的系统角色
  parameters?: QwenChatRequest['parameters'];
}

/**
 * 基础聊天钩子
 * @param options 聊天选项
 * @returns 聊天钩子对象
 */
export const useQwenChat = ({
  apiKey,
  model = DEFAULT_MODEL,
  systemRole,
  parameters = DEFAULT_PARAMETERS,
}: UseQwenChatOptions) => {
  // 从环境变量获取 API Key，如果未提供则使用传入的值
  // 注意：在React Native中，我们不能直接访问Node.js的process对象
  const resolvedApiKey = apiKey || ENV.QWEN_API_KEY || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<QwenMessage[]>([]);
  const [lastResponse, setLastResponse] = useState<QwenMessage | null>(null);

  const qwenAPI = useMemo(() => new QwenAPI(resolvedApiKey), [resolvedApiKey]);

  const sendMessage = useCallback(
    async (content: string) => {
      // 检查 API Key 是否存在
      if (!resolvedApiKey) {
        const errorMsg = 'API Key 未提供。请在 .env 文件中设置 QWEN_API_KEY 或作为参数传递';
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      setLoading(true);
      setError(null);
      setLastResponse(null);

      try {
        // 添加用户消息到历史记录
        const userMessage: QwenMessage = { role: 'user', content };

        // 构造消息历史，包含系统角色（如果提供）
        let conversationMessages: QwenMessage[] = [];

        // 如果提供了系统角色，将其添加到消息历史的开头
        if (systemRole) {
          conversationMessages = [systemRole, ...messages, userMessage];
        } else {
          conversationMessages = [...messages, userMessage];
        }
        setMessages(prev => [...prev, userMessage]);

        // 构造请求
        const request: QwenChatRequest = {
          model,
          input: {
            messages: conversationMessages,
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
        setLastResponse(assistantMessage);

        return {
          response: response.output.text,
          userMessage,
          assistantMessage,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [messages, resolvedApiKey, model, systemRole, parameters, qwenAPI],
  );

  const resetConversation = useCallback(() => {
    setMessages([]);
    setError(null);
    setLastResponse(null);
  }, []);

  // 获取完整的对话历史（包括系统角色）
  const getFullConversation = useCallback((): QwenMessage[] => {
    if (systemRole) {
      return [systemRole, ...messages];
    }
    return [...messages];
  }, [systemRole, messages]);

  // 分别获取用户消息和助手消息
  const getUserMessages = useCallback((): QwenMessage[] => {
    return messages.filter(message => message.role === 'user');
  }, [messages]);

  const getAssistantMessages = useCallback((): QwenMessage[] => {
    return messages.filter(message => message.role === 'assistant');
  }, [messages]);

  // 获取最后一条助手消息
  const getLastAssistantMessage = useCallback((): QwenMessage | null => {
    const assistantMessages = getAssistantMessages();
    return assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1] : null;
  }, [getAssistantMessages]);

  return {
    loading,
    error,
    qwenAPI,
    messages,
    lastResponse,
    userMessages: getUserMessages(),
    assistantMessages: getAssistantMessages(),
    lastAssistantMessage: getLastAssistantMessage(),
    sendMessage,
    resetConversation,
    getFullConversation,
  };
};

/**
 * 创建一个预设系统角色的聊天钩子
 * @param systemPromptKey 系统提示词的键名
 * @returns 聊天钩子
 */
export const useQwenChatWithSystemPrompt = (systemPromptKey: keyof typeof SYSTEM_PROMPTS) => {
  const systemPrompt = SYSTEM_PROMPTS[systemPromptKey] as QwenMessage;
  return useQwenChat({ systemRole: systemPrompt });
};

/**
 * 创建一个自定义系统角色的聊天钩子
 * @param content 自定义系统提示词内容
 * @returns 聊天钩子
 */
export const useQwenChatWithCustomSystemPrompt = (content: string) => {
  const customSystemPrompt: QwenMessage = {
    role: 'system',
    content,
  };
  return useQwenChat({ systemRole: customSystemPrompt });
};

/**
 * 创建一个可以动态切换系统角色的聊天钩子
 */
export const useQwenChatWithDynamicSystemPrompt = () => {
  const [systemPrompt, setSystemPrompt] = useState<QwenMessage | undefined>(undefined);
  const { sendMessage, resetConversation, ...rest } = useQwenChat({ systemRole: systemPrompt });

  // 设置预定义的系统角色
  const setSystemPromptByKey = useCallback(
    (key: keyof typeof SYSTEM_PROMPTS) => {
      const newSystemPrompt = SYSTEM_PROMPTS[key] as QwenMessage;
      setSystemPrompt(newSystemPrompt);
      resetConversation(); // 切换角色时重置对话
    },
    [resetConversation],
  );

  // 设置自定义系统角色
  const setCustomSystemPrompt = useCallback(
    (content: string) => {
      const newSystemPrompt: QwenMessage = {
        role: 'system',
        content,
      };
      setSystemPrompt(newSystemPrompt);
      resetConversation(); // 切换角色时重置对话
    },
    [resetConversation],
  );

  // 清除系统角色
  const clearSystemPrompt = useCallback(() => {
    setSystemPrompt(undefined);
    resetConversation();
  }, [resetConversation]);

  return {
    ...rest,
    sendMessage,
    resetConversation,
    setSystemPromptByKey,
    setCustomSystemPrompt,
    clearSystemPrompt,
    currentSystemPrompt: systemPrompt,
  };
};
