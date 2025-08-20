// 通义千问 Hooks 扩展

import { useState, useCallback } from 'react';
import { useQwenChat } from '../../hooks/useLLM';
import { SYSTEM_PROMPTS } from './example';
import { QwenMessage } from './types';

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
