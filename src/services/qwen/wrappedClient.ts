/**
 * 包装后的Qwen客户端 - 集成配额检查和使用统计
 * 在原有QwenAPI基础上添加用户权限控制和配额管理
 */

import { QwenAPI } from './client';
import { QwenChatRequest, QwenChatResponse } from './types';
import { UsageTrackingService } from '../ai/usageTrackingService';
import { AiServiceType, CallStatus } from '../../database/models/AiUsageLog';

// 包装后的聊天请求，包含用户ID
export interface WrappedQwenChatRequest extends QwenChatRequest {
  userId: string; // 必须提供用户ID用于配额检查
}

// 包装后的响应，包含配额信息
export interface WrappedQwenChatResponse extends QwenChatResponse {
  quotaInfo: {
    remainingCalls: number;
    remainingTokens: number;
    usedCalls: number;
    usedTokens: number;
    resetTime?: number;
  };
}

// 配额检查失败错误
export class QuotaExceededError extends Error {
  public readonly quotaInfo: {
    currentUsage: number;
    limit: number;
    resetTime?: number;
  };

  constructor(
    message: string,
    quotaInfo: { currentUsage: number; limit: number; resetTime?: number },
  ) {
    super(message);
    this.name = 'QuotaExceededError';
    this.quotaInfo = quotaInfo;
  }
}

/**
 * 包装后的Qwen API客户端
 * 提供配额检查、使用统计和权限控制功能
 */
export class WrappedQwenClient {
  private qwenAPI: QwenAPI;
  private serviceType: AiServiceType = 'qwen';

  constructor(apiKey: string, baseUrl?: string) {
    this.qwenAPI = new QwenAPI(apiKey, baseUrl);
  }

  /**
   * 发送聊天完成请求（带配额检查）
   */
  async chatCompletion(request: WrappedQwenChatRequest): Promise<WrappedQwenChatResponse> {
    let callStatus: CallStatus = 'error';
    let errorMessage: string | undefined;
    let actualTokensUsed = 0;
    let actualCost = 0;

    try {
      // 估算将要使用的token数量
      const estimatedTokens = this.estimateTokenUsage(request);

      // 检查配额
      const quotaCheck = await UsageTrackingService.checkQuota(
        request.userId,
        this.serviceType,
        estimatedTokens,
      );

      if (!quotaCheck.allowed) {
        throw new QuotaExceededError(quotaCheck.reason || '配额不足', quotaCheck);
      }

      // 执行实际的API调用
      const response = await this.qwenAPI.chatCompletion(request);

      // 记录成功调用
      callStatus = 'success';
      actualTokensUsed = response.usage.total_tokens;
      actualCost = UsageTrackingService.calculateCost(this.serviceType, actualTokensUsed);

      // 记录使用情况
      await this.recordUsage(request, response, callStatus, actualTokensUsed, actualCost);

      // 获取更新后的配额信息
      const updatedQuotaInfo = await this.getQuotaInfo(request.userId);

      return {
        ...response,
        quotaInfo: updatedQuotaInfo,
      };
    } catch (error) {
      // 记录失败的调用
      if (error instanceof QuotaExceededError) {
        callStatus = 'quota_exceeded';
        errorMessage = error.message;
      } else {
        callStatus = 'error';
        errorMessage = error instanceof Error ? error.message : '未知错误';
      }

      // 记录使用情况（即使失败也要记录）
      await this.recordUsage(request, null, callStatus, actualTokensUsed, actualCost, errorMessage);

      // 重新抛出错误
      throw error;
    }
  }

  /**
   * 检查用户配额状态
   */
  async checkQuotaStatus(userId: string, estimatedTokens: number = 100) {
    return await UsageTrackingService.checkQuota(userId, this.serviceType, estimatedTokens);
  }

  /**
   * 获取用户今日使用概览
   */
  async getTodayUsageOverview(userId: string) {
    return await UsageTrackingService.getTodayUsageOverview(userId);
  }

  /**
   * 获取用户使用统计
   */
  async getUserStats(userId: string, days: number = 30) {
    return await UsageTrackingService.getUserUsageStats(userId, days);
  }

  /**
   * 记录API使用情况
   */
  private async recordUsage(
    request: WrappedQwenChatRequest,
    response: QwenChatResponse | null,
    status: CallStatus,
    tokensUsed: number,
    cost: number,
    errorMessage?: string,
  ): Promise<void> {
    try {
      await UsageTrackingService.recordUsage({
        userId: request.userId,
        serviceType: this.serviceType,
        endpoint: 'chat/completions',
        tokensUsed,
        costEstimate: cost,
        status,
        errorMessage,
        requestData: {
          model: request.model,
          messagesCount: request.input.messages.length,
          parameters: request.parameters,
        },
        responseData: response
          ? {
              finishReason: response.output.finish_reason,
              requestId: response.request_id,
            }
          : undefined,
      });
    } catch (error) {
      console.error('记录使用情况失败:', error);
      // 不抛出错误，避免影响主要业务流程
    }
  }

  /**
   * 估算token使用量
   */
  private estimateTokenUsage(request: QwenChatRequest): number {
    // 简单的token估算逻辑
    let totalChars = 0;

    request.input.messages.forEach(message => {
      totalChars += message.content.length;
    });

    // 中文字符大约1个字符=1个token，英文大约4个字符=1个token
    // 这里使用保守估算：每2个字符=1个token
    const estimatedInputTokens = Math.ceil(totalChars / 2);

    // 加上预期的输出token数量
    const maxOutputTokens = request.parameters?.max_tokens || 1500;

    return estimatedInputTokens + Math.ceil(maxOutputTokens * 0.7); // 估算实际输出为最大值的70%
  }

  /**
   * 获取用户配额信息
   */
  private async getQuotaInfo(userId: string) {
    try {
      const overview = await UsageTrackingService.getTodayUsageOverview(userId);

      return {
        remainingCalls:
          overview.calls.limit > 0 ? Math.max(0, overview.calls.limit - overview.calls.used) : -1,
        remainingTokens:
          overview.tokens.limit > 0
            ? Math.max(0, overview.tokens.limit - overview.tokens.used)
            : -1,
        usedCalls: overview.calls.used,
        usedTokens: overview.tokens.used,
        resetTime: overview.resetTime,
      };
    } catch (error) {
      console.error('获取配额信息失败:', error);
      return {
        remainingCalls: -1,
        remainingTokens: -1,
        usedCalls: 0,
        usedTokens: 0,
      };
    }
  }

  /**
   * 批量发送消息（自动分批处理）
   */
  async batchChatCompletion(
    requests: WrappedQwenChatRequest[],
  ): Promise<Array<WrappedQwenChatResponse | Error>> {
    const results: Array<WrappedQwenChatResponse | Error> = [];

    // 依次处理每个请求（避免并发导致配额检查不准确）
    for (const request of requests) {
      try {
        const response = await this.chatCompletion(request);
        results.push(response);
      } catch (error) {
        results.push(error instanceof Error ? error : new Error('未知错误'));
      }
    }

    return results;
  }

  /**
   * 流式聊天（如果API支持）
   * 注意：当前Qwen API可能不支持流式响应，这里提供接口预留
   */
  async streamChatCompletion(
    request: WrappedQwenChatRequest,
    _onChunk?: (chunk: string) => void,
  ): Promise<WrappedQwenChatResponse> {
    // TODO: 实现流式响应处理
    // 目前使用普通聊天完成作为后备
    return await this.chatCompletion(request);
  }

  /**
   * 获取模型信息和定价
   */
  getModelInfo(model: string = 'qwen-max') {
    const modelInfo = {
      'qwen-max': {
        name: '通义千问-Max',
        inputPrice: 0.02, // 每1K token价格（元）
        outputPrice: 0.06,
        maxTokens: 6000,
        description: '适用于复杂推理任务',
      },
      'qwen-plus': {
        name: '通义千问-Plus',
        inputPrice: 0.004,
        outputPrice: 0.012,
        maxTokens: 30000,
        description: '适用于日常对话和文本生成',
      },
      'qwen-turbo': {
        name: '通义千问-Turbo',
        inputPrice: 0.003,
        outputPrice: 0.006,
        maxTokens: 6000,
        description: '响应速度快，适用于高并发场景',
      },
    };

    return modelInfo[model as keyof typeof modelInfo] || modelInfo['qwen-max'];
  }

  /**
   * 预估调用成本
   */
  estimateCost(request: QwenChatRequest): number {
    const estimatedTokens = this.estimateTokenUsage(request);
    return UsageTrackingService.calculateCost(this.serviceType, estimatedTokens);
  }

  /**
   * 验证请求格式
   */
  validateRequest(request: WrappedQwenChatRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.userId) {
      errors.push('用户ID不能为空');
    }

    if (!request.model) {
      errors.push('模型名称不能为空');
    }

    if (!request.input?.messages?.length) {
      errors.push('消息列表不能为空');
    }

    if (request.input?.messages) {
      request.input.messages.forEach((message, index) => {
        if (!message.content.trim()) {
          errors.push(`第${index + 1}条消息内容不能为空`);
        }
        if (!['system', 'user', 'assistant'].includes(message.role)) {
          errors.push(`第${index + 1}条消息角色无效`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 获取底层QwenAPI实例（用于特殊需求）
   */
  getUnderlyingAPI(): QwenAPI {
    return this.qwenAPI;
  }
}
