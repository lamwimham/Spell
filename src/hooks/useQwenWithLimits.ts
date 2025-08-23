/**
 * 带配额限制的Qwen Hook - 集成用户权限和配额管理
 * 基于原有useQwen Hook，添加配额检查、使用统计和权限控制
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  WrappedQwenClient,
  WrappedQwenChatRequest,
  WrappedQwenChatResponse,
  QuotaExceededError,
} from '../services/qwen/wrappedClient';
import { QwenMessage } from '../services/qwen/types';
import { DEFAULT_MODEL, DEFAULT_PARAMETERS } from '../services/qwen/config';
import { ENV } from '../services/qwen/env';
import { useAuth } from './useAuth';

// Hook配置选项
interface UseQwenWithLimitsOptions {
  apiKey?: string;
  model?: string;
  systemRole?: QwenMessage;
  parameters?: WrappedQwenChatRequest['parameters'];
  autoCheckQuota?: boolean; // 是否自动检查配额
  onQuotaExceeded?: (error: QuotaExceededError) => void; // 配额超限回调
  onUsageUpdate?: (usage: any) => void; // 使用量更新回调
}

// Hook返回值类型
interface UseQwenWithLimitsReturn {
  // 基础聊天功能
  loading: boolean;
  error: string | null;
  messages: QwenMessage[];
  lastResponse: QwenMessage | null;
  sendMessage: (content: string) => Promise<void>;
  resetConversation: () => void;

  // 配额和使用统计
  quotaInfo: {
    remainingCalls: number;
    remainingTokens: number;
    usedCalls: number;
    usedTokens: number;
    resetTime?: number;
  } | null;
  dailyUsage: any | null;
  canSendMessage: boolean;
  checkQuota: (estimatedTokens?: number) => Promise<boolean>;
  refreshQuotaInfo: () => Promise<void>;

  // 使用统计
  getUsageStats: (days?: number) => Promise<any>;
  getTodayUsage: () => Promise<any>;

  // 客户端实例
  wrappedClient: WrappedQwenClient;
}

/**
 * 带配额限制的Qwen聊天Hook
 */
export const useQwenWithLimits = (
  options: UseQwenWithLimitsOptions = {},
): UseQwenWithLimitsReturn => {
  const {
    apiKey,
    model = DEFAULT_MODEL,
    systemRole,
    parameters = DEFAULT_PARAMETERS,
    autoCheckQuota = true,
    onQuotaExceeded,
    onUsageUpdate,
  } = options;

  // 获取当前用户信息
  const { session, isAuthenticated } = useAuth();
  const userId = session?.userId;

  // 解析API Key
  const resolvedApiKey = apiKey || ENV.QWEN_API_KEY || '';

  // 基础状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<QwenMessage[]>([]);
  const [lastResponse, setLastResponse] = useState<QwenMessage | null>(null);

  // 配额相关状态
  const [quotaInfo, setQuotaInfo] = useState<UseQwenWithLimitsReturn['quotaInfo']>(null);
  const [dailyUsage, setDailyUsage] = useState<any>(null);
  const [canSendMessage, setCanSendMessage] = useState(true);

  // 创建包装后的客户端
  const wrappedClient = useMemo(() => {
    return new WrappedQwenClient(resolvedApiKey);
  }, [resolvedApiKey]);

  // 刷新配额信息
  const refreshQuotaInfo = useCallback(async () => {
    if (!userId || !isAuthenticated) {
      setQuotaInfo(null);
      setDailyUsage(null);
      setCanSendMessage(false);
      return;
    }

    try {
      const [quotaCheck, usage] = await Promise.all([
        wrappedClient.checkQuotaStatus(userId, 100),
        wrappedClient.getTodayUsageOverview(userId),
      ]);

      setQuotaInfo({
        remainingCalls: quotaCheck.remainingCalls,
        remainingTokens: quotaCheck.remainingTokens,
        usedCalls: quotaCheck.currentUsage,
        usedTokens: usage.tokens.used,
        resetTime: quotaCheck.resetTime,
      });

      setDailyUsage(usage);
      setCanSendMessage(quotaCheck.allowed);

      // 调用使用量更新回调
      onUsageUpdate?.(usage);
    } catch (error) {
      console.error('刷新配额信息失败:', error);
      setCanSendMessage(false);
    }
  }, [userId, isAuthenticated, wrappedClient, onUsageUpdate]);

  // 检查配额
  const checkQuota = useCallback(
    async (estimatedTokens: number = 100): Promise<boolean> => {
      if (!userId || !isAuthenticated) {
        return false;
      }

      try {
        const quotaCheck = await wrappedClient.checkQuotaStatus(userId, estimatedTokens);
        return quotaCheck.allowed;
      } catch (error) {
        console.error('检查配额失败:', error);
        return false;
      }
    },
    [userId, isAuthenticated, wrappedClient],
  );

  // 发送消息
  const sendMessage = useCallback(
    async (content: string) => {
      if (!userId || !isAuthenticated) {
        setError('请先登录');
        return;
      }

      if (!content.trim()) {
        setError('消息内容不能为空');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 自动检查配额
        if (autoCheckQuota) {
          const quotaAllowed = await checkQuota();
          if (!quotaAllowed) {
            setError('配额不足，请稍后再试');
            return;
          }
        }

        // 构建消息历史
        const newUserMessage: QwenMessage = { role: 'user', content };
        const allMessages = systemRole
          ? [systemRole, ...messages, newUserMessage]
          : [...messages, newUserMessage];

        // 构建请求
        const request: WrappedQwenChatRequest = {
          userId,
          model,
          input: {
            messages: allMessages,
          },
          parameters,
        };

        // 发送请求
        const response = await wrappedClient.chatCompletion(request);

        // 处理响应
        const assistantMessage: QwenMessage = {
          role: 'assistant',
          content: response.output.text,
        };

        // 更新状态
        setMessages(prev => [...prev, newUserMessage, assistantMessage]);
        setLastResponse(assistantMessage);

        // 更新配额信息
        setQuotaInfo(response.quotaInfo);

        // 刷新使用概览
        await refreshQuotaInfo();
      } catch (error) {
        if (error instanceof QuotaExceededError) {
          setError(`配额超限: ${error.message}`);
          onQuotaExceeded?.(error);
        } else {
          const errorMessage = error instanceof Error ? error.message : '发送消息失败';
          setError(errorMessage);
        }
        console.error('发送消息失败:', error);
      } finally {
        setLoading(false);
      }
    },
    [
      userId,
      isAuthenticated,
      messages,
      systemRole,
      model,
      parameters,
      autoCheckQuota,
      checkQuota,
      wrappedClient,
      onQuotaExceeded,
      refreshQuotaInfo,
    ],
  );

  // 重置对话
  const resetConversation = useCallback(() => {
    setMessages([]);
    setError(null);
    setLastResponse(null);
  }, []);

  // 获取使用统计
  const getUsageStats = useCallback(
    async (days: number = 30) => {
      if (!userId) return null;
      return await wrappedClient.getUserStats(userId, days);
    },
    [userId, wrappedClient],
  );

  // 获取今日使用量
  const getTodayUsage = useCallback(async () => {
    if (!userId) return null;
    return await wrappedClient.getTodayUsageOverview(userId);
  }, [userId, wrappedClient]);

  // 初始化时刷新配额信息
  useEffect(() => {
    if (isAuthenticated && userId) {
      refreshQuotaInfo();
    }
  }, [isAuthenticated, userId, refreshQuotaInfo]);

  // 定期刷新配额信息（可选）
  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    // 每5分钟刷新一次配额信息
    const interval = setInterval(() => {
      refreshQuotaInfo();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, userId, refreshQuotaInfo]);

  return {
    // 基础聊天功能
    loading,
    error,
    messages,
    lastResponse,
    sendMessage,
    resetConversation,

    // 配额和使用统计
    quotaInfo,
    dailyUsage,
    canSendMessage,
    checkQuota,
    refreshQuotaInfo,

    // 使用统计
    getUsageStats,
    getTodayUsage,

    // 客户端实例
    wrappedClient,
  };
};

/**
 * 轻量级配额检查Hook
 * 仅用于检查配额状态，不包含聊天功能
 */
export const useQwenQuota = (userId?: string) => {
  const { session } = useAuth();
  const resolvedUserId = userId || session?.userId;

  const [quotaInfo, setQuotaInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const wrappedClient = useMemo(() => {
    return new WrappedQwenClient(ENV.QWEN_API_KEY || '');
  }, []);

  const refreshQuota = useCallback(async () => {
    if (!resolvedUserId) return;

    setLoading(true);
    try {
      const [quotaCheck, usage] = await Promise.all([
        wrappedClient.checkQuotaStatus(resolvedUserId, 100),
        wrappedClient.getTodayUsageOverview(resolvedUserId),
      ]);

      setQuotaInfo({
        allowed: quotaCheck.allowed,
        reason: quotaCheck.reason,
        remainingCalls: quotaCheck.remainingCalls,
        remainingTokens: quotaCheck.remainingTokens,
        currentUsage: quotaCheck.currentUsage,
        limit: quotaCheck.limit,
        resetTime: quotaCheck.resetTime,
        dailyUsage: usage,
      });
    } catch (error) {
      console.error('获取配额信息失败:', error);
    } finally {
      setLoading(false);
    }
  }, [resolvedUserId, wrappedClient]);

  useEffect(() => {
    if (resolvedUserId) {
      refreshQuota();
    }
  }, [resolvedUserId, refreshQuota]);

  return {
    quotaInfo,
    loading,
    refreshQuota,
    checkQuota: (estimatedTokens?: number) =>
      resolvedUserId
        ? wrappedClient.checkQuotaStatus(resolvedUserId, estimatedTokens)
        : Promise.resolve({ allowed: false }),
  };
};

/**
 * 批量操作Hook
 * 用于处理批量AI请求
 */
export const useQwenBatch = () => {
  const { session } = useAuth();
  const userId = session?.userId;

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<WrappedQwenChatResponse | Error>>([]);

  const wrappedClient = useMemo(() => {
    return new WrappedQwenClient(ENV.QWEN_API_KEY || '');
  }, []);

  const processBatch = useCallback(
    async (requests: Array<Omit<WrappedQwenChatRequest, 'userId'>>) => {
      if (!userId) {
        throw new Error('用户未登录');
      }

      setLoading(true);
      try {
        const requestsWithUserId = requests.map(req => ({ ...req, userId }));
        const batchResults = await wrappedClient.batchChatCompletion(requestsWithUserId);
        setResults(batchResults);
        return batchResults;
      } finally {
        setLoading(false);
      }
    },
    [userId, wrappedClient],
  );

  return {
    loading,
    results,
    processBatch,
    clearResults: () => setResults([]),
  };
};
