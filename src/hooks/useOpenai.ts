// OpenAI Hooks

import { useState, useCallback, useMemo } from 'react';
import {
  OPENAPI_API_KEY,
  OPENAPI_DEFAULT_BASE_URL,
  OPENAPI_DEFAULT_MODEL,
  OPENAPI_DEFAULT_PARAMETERS,
} from '../services/openapi/config';
import { OpenAPIClient } from '../services/openapi/client';
import { OpenAIChatRequest, OpenAIChatResponse, OpenAIMessage } from '../services/openapi/types';

// 环境变量配置
// 由于React Native不能直接访问Node.js的process对象，
// 我们需要通过其他方式获取环境变量
export const OPENAI_ENV = {
  OPENAI_API_KEY: OPENAPI_API_KEY, // 需要在使用时通过参数传递或从其他配置中获取
  OPENAI_API_BASE_URL: OPENAPI_DEFAULT_BASE_URL,
};

interface UseOpenAIChatOptions {
  apiKey?: string; // 可选参数，如果未提供则从环境变量获取
  baseUrl?: string; // 可选参数，如果未提供则从环境变量获取
  model?: string;
  systemRole?: OpenAIMessage; // 可选的系统角色
  parameters?: Partial<Omit<OpenAIChatRequest, 'messages' | 'model'>>;
}

/**
 * 基础聊天钩子
 * @param options 聊天选项
 * @returns 聊天钩子对象
 */
export const useOpenAIChat = ({
  apiKey,
  baseUrl,
  model = OPENAPI_DEFAULT_MODEL,
  systemRole,
  parameters = {},
}: UseOpenAIChatOptions) => {
  // 从环境变量获取 API Key，如果未提供则使用传入的值

  const resolvedApiKey = apiKey || OPENAI_ENV.OPENAI_API_KEY || '';
  const resolvedBaseUrl = baseUrl || OPENAI_ENV.OPENAI_API_BASE_URL || OPENAPI_DEFAULT_BASE_URL;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<OpenAIMessage[]>([]);
  const [lastResponse, setLastResponse] = useState<OpenAIMessage | null>(null);

  const openaiAPI = useMemo(
    () => new OpenAPIClient(resolvedApiKey, resolvedBaseUrl, model),
    [resolvedApiKey, resolvedBaseUrl, model],
  );

  const sendMessage = useCallback(
    async (content: string, contextCount: number) => {
      // 检查 API Key 是否存在

      if (!resolvedApiKey) {
        const errorMsg = 'API Key 未提供。请在 .env 文件中设置 OPENAI_API_KEY 或作为参数传递';
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      setLoading(true);
      setError(null);
      setLastResponse(null);

      try {
        // 添加用户消息到历史记录
        const userMessage: OpenAIMessage = { role: 'user', content };

        // 构造消息历史，包含系统角色（如果提供）
        let conversationMessages: OpenAIMessage[] = [];

        // 如果提供了系统角色，将其添加到消息历史的开头
        if (systemRole) {
          conversationMessages = contextCount
            ? [systemRole, ...messages, userMessage]
            : [systemRole, userMessage];
        } else {
          conversationMessages = contextCount ? [...messages, userMessage] : [userMessage];
        }
        setMessages(prev => [...prev, userMessage]);

        // 构造请求参数
        const requestParameters = {
          ...OPENAPI_DEFAULT_PARAMETERS,
          ...parameters,
        };

        // 发送请求
        const response: OpenAIChatResponse = await openaiAPI.chatCompletion(
          conversationMessages,
          model,
          requestParameters,
        );

        // 添加助手回复到历史记录
        const assistantMessage: OpenAIMessage = {
          role: 'assistant',
          content: response.choices[0]?.message?.content || '',
        };
        setMessages(prev => [...prev, assistantMessage]);
        setLastResponse(assistantMessage);

        return {
          response: response.choices[0]?.message?.content || '',
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
    [messages, resolvedApiKey, resolvedBaseUrl, model, systemRole, parameters, openaiAPI],
  );

  const resetConversation = useCallback(() => {
    setMessages([]);
    setError(null);
    setLastResponse(null);
  }, []);

  // 获取完整的对话历史（包括系统角色）
  const getFullConversation = useCallback((): OpenAIMessage[] => {
    if (systemRole) {
      return [systemRole, ...messages];
    }
    return [...messages];
  }, [systemRole, messages]);

  // 分别获取用户消息和助手消息
  const getUserMessages = useCallback((): OpenAIMessage[] => {
    return messages.filter(message => message.role === 'user');
  }, [messages]);

  const getAssistantMessages = useCallback((): OpenAIMessage[] => {
    return messages.filter(message => message.role === 'assistant');
  }, [messages]);

  // 获取最后一条助手消息
  const getLastAssistantMessage = useCallback((): OpenAIMessage | null => {
    const assistantMessages = getAssistantMessages();
    return assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1] : null;
  }, [getAssistantMessages]);

  return {
    loading,
    error,
    openaiAPI,
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

// 系统提示词示例
export const OPENAI_SYSTEM_PROMPTS = {
  // 通用助手
  GENERAL_ASSISTANT: {
    role: 'system',
    content: '你是一个有用的助手，请用简洁明了的语言回答用户的问题。',
  },

  // 英语教师
  ENGLISH_TEACHER: {
    role: 'system',
    content:
      '你是一位专业的英语教师，擅长语法讲解、词汇教学和口语表达指导。请用简单易懂的方式解释英语知识，并在回答中提供例句。',
  },

  // 健康顾问
  HEALTH_ADVISOR: {
    role: 'system',
    content:
      '你是一位健康生活顾问，可以提供关于饮食、运动、睡眠等方面的建议。请注意，你不是医生，不能提供医疗诊断或治疗建议。如果用户询问医疗问题，请建议他们咨询专业医生。',
  },

  // 旅行规划师
  TRAVEL_PLANNER: {
    role: 'system',
    content:
      '你是一位旅行规划专家，熟悉全球各地的旅游景点、文化习俗和旅行技巧。请根据用户的需求和偏好，提供个性化的旅行建议和行程规划。',
  },

  // 编程助手
  CODING_ASSISTANT: {
    role: 'system',
    content:
      '你是一位编程助手，精通多种编程语言和框架。请提供清晰、简洁的代码示例和解释，帮助用户解决编程问题。代码应当遵循最佳实践，并附有必要的注释。',
  },

  // 创意写作助手
  CREATIVE_WRITER: {
    role: 'system',
    content:
      '你是一位创意写作助手，擅长故事创作、诗歌写作和文案撰写。请根据用户的要求，提供有创意、引人入胜的文字内容。',
  },
};

/**
 * 创建一个预设系统角色的聊天钩子
 * @param systemPromptKey 系统提示词的键名
 * @returns 聊天钩子
 */
export const useOpenAIChatWithSystemPrompt = (
  systemPromptKey: keyof typeof OPENAI_SYSTEM_PROMPTS,
) => {
  const systemPrompt = OPENAI_SYSTEM_PROMPTS[systemPromptKey] as OpenAIMessage;
  return useOpenAIChat({ systemRole: systemPrompt });
};

/**
 * 创建一个自定义系统角色的聊天钩子
 * @param content 自定义系统提示词内容
 * @returns 聊天钩子
 */
export const useOpenAIChatWithCustomSystemPrompt = (content: string) => {
  const customSystemPrompt: OpenAIMessage = {
    role: 'system',
    content,
  };
  return useOpenAIChat({
    systemRole: customSystemPrompt,
    apiKey: 'sk-2cdf6abd8b384b0ca16907b58a4d0eec',
    baseUrl: 'https://api.deepseek.com',
  });
};

/**
 * 创建一个可以动态切换系统角色的聊天钩子
 */
export const useOpenAIChatWithDynamicSystemPrompt = () => {
  const [systemPrompt, setSystemPrompt] = useState<OpenAIMessage | undefined>(undefined);
  const { sendMessage, resetConversation, ...rest } = useOpenAIChat({ systemRole: systemPrompt });

  // 设置预定义的系统角色
  const setSystemPromptByKey = useCallback(
    (key: keyof typeof OPENAI_SYSTEM_PROMPTS) => {
      const newSystemPrompt = OPENAI_SYSTEM_PROMPTS[key] as OpenAIMessage;
      setSystemPrompt(newSystemPrompt);
      resetConversation(); // 切换角色时重置对话
    },
    [resetConversation],
  );

  // 设置自定义系统角色
  const setCustomSystemPrompt = useCallback(
    (content: string) => {
      const newSystemPrompt: OpenAIMessage = {
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
