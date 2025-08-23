/**
 * AI使用统计服务 - 配额管理与使用跟踪的核心业务逻辑
 * 实现AI服务调用的统计、限制检查和配额管理
 */

import { AiUsageRepository } from '../../database/repositories/AiUsageRepository';
import { UserQuotaRepository } from '../../database/repositories/UserQuotaRepository';
import { AiServiceType, CallStatus } from '../../database/models/AiUsageLog';
import { ResetPeriod } from '../../database/models/UserQuota';

// AI调用记录数据类型
export interface AiCallRecord {
  userId: string;
  serviceType: AiServiceType;
  endpoint: string;
  tokensUsed: number;
  costEstimate: number;
  status: CallStatus;
  errorMessage?: string;
  requestData?: any;
  responseData?: any;
}

// 配额检查结果
export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage: number;
  limit: number;
  remainingCalls: number;
  remainingTokens: number;
  resetTime?: number; // Unix时间戳
}

// 使用限制配置
export interface UsageLimits {
  dailyCalls: number;
  dailyTokens: number;
  monthlyCalls: number;
  monthlyTokens: number;
  maxCostPerDay: number; // 每日最大成本（分）
  maxCostPerMonth: number; // 每月最大成本（分）
}

// 默认配额限制（基于用户角色）
const DEFAULT_LIMITS: Record<string, UsageLimits> = {
  guest: {
    dailyCalls: 5,
    dailyTokens: 1000,
    monthlyCalls: 50,
    monthlyTokens: 10000,
    maxCostPerDay: 100, // 1元
    maxCostPerMonth: 1000, // 10元
  },
  user: {
    dailyCalls: 50,
    dailyTokens: 10000,
    monthlyCalls: 1000,
    monthlyTokens: 200000,
    maxCostPerDay: 500, // 5元
    maxCostPerMonth: 10000, // 100元
  },
  premium: {
    dailyCalls: 200,
    dailyTokens: 50000,
    monthlyCalls: 5000,
    monthlyTokens: 1000000,
    maxCostPerDay: 2000, // 20元
    maxCostPerMonth: 50000, // 500元
  },
  admin: {
    dailyCalls: -1, // 无限制
    dailyTokens: -1,
    monthlyCalls: -1,
    monthlyTokens: -1,
    maxCostPerDay: -1,
    maxCostPerMonth: -1,
  },
};

// 服务定价配置（每1000个token的成本，单位：分）
const SERVICE_PRICING: Record<AiServiceType, number> = {
  qwen: 15, // 0.15元/1000token
  openai: 200, // 2元/1000token
  claude: 300, // 3元/1000token
};

export class UsageTrackingService {
  /**
   * 检查用户是否可以进行AI调用
   */
  static async checkQuota(
    userId: string,
    serviceType: AiServiceType,
    estimatedTokens: number = 100,
  ): Promise<QuotaCheckResult> {
    try {
      // 获取用户当前角色的默认限制
      const user = await import('../../database/repositories/UserRepository').then(module =>
        module.UserRepository.getById(userId),
      );

      if (!user) {
        return {
          allowed: false,
          reason: '用户不存在',
          currentUsage: 0,
          limit: 0,
          remainingCalls: 0,
          remainingTokens: 0,
        };
      }

      if (user.status !== 'active') {
        return {
          allowed: false,
          reason: '用户账户未激活',
          currentUsage: 0,
          limit: 0,
          remainingCalls: 0,
          remainingTokens: 0,
        };
      }

      const limits = DEFAULT_LIMITS[user.role] || DEFAULT_LIMITS.user;

      // 管理员不受限制
      if (user.role === 'admin') {
        return {
          allowed: true,
          currentUsage: 0,
          limit: -1,
          remainingCalls: -1,
          remainingTokens: -1,
        };
      }

      // 检查今日使用量
      const todayUsage = await AiUsageRepository.getTodayUsage(userId);
      const estimatedCost = this.calculateCost(serviceType, estimatedTokens);

      // 检查每日调用次数限制
      if (limits.dailyCalls > 0 && todayUsage.calls >= limits.dailyCalls) {
        return {
          allowed: false,
          reason: `已达到每日调用次数限制（${limits.dailyCalls}次）`,
          currentUsage: todayUsage.calls,
          limit: limits.dailyCalls,
          remainingCalls: 0,
          remainingTokens: Math.max(0, limits.dailyTokens - todayUsage.tokens),
          resetTime: this.getTomorrowMidnight(),
        };
      }

      // 检查每日token限制
      if (limits.dailyTokens > 0 && todayUsage.tokens + estimatedTokens > limits.dailyTokens) {
        return {
          allowed: false,
          reason: `已达到每日token使用限制（${limits.dailyTokens}个）`,
          currentUsage: todayUsage.tokens,
          limit: limits.dailyTokens,
          remainingCalls: Math.max(0, limits.dailyCalls - todayUsage.calls),
          remainingTokens: Math.max(0, limits.dailyTokens - todayUsage.tokens),
          resetTime: this.getTomorrowMidnight(),
        };
      }

      // 检查每日成本限制
      if (limits.maxCostPerDay > 0 && todayUsage.cost + estimatedCost > limits.maxCostPerDay) {
        return {
          allowed: false,
          reason: `已达到每日费用限制（${(limits.maxCostPerDay / 100).toFixed(2)}元）`,
          currentUsage: todayUsage.cost,
          limit: limits.maxCostPerDay,
          remainingCalls: Math.max(0, limits.dailyCalls - todayUsage.calls),
          remainingTokens: Math.max(0, limits.dailyTokens - todayUsage.tokens),
          resetTime: this.getTomorrowMidnight(),
        };
      }

      // 检查自定义配额（如果存在）
      const customQuotaCheck = await this.checkCustomQuota(userId, serviceType, estimatedTokens);
      if (!customQuotaCheck.allowed) {
        return customQuotaCheck;
      }

      // 通过所有检查
      return {
        allowed: true,
        currentUsage: todayUsage.calls,
        limit: limits.dailyCalls,
        remainingCalls:
          limits.dailyCalls > 0 ? Math.max(0, limits.dailyCalls - todayUsage.calls) : -1,
        remainingTokens:
          limits.dailyTokens > 0 ? Math.max(0, limits.dailyTokens - todayUsage.tokens) : -1,
        resetTime: this.getTomorrowMidnight(),
      };
    } catch (error) {
      console.error('配额检查失败:', error);
      return {
        allowed: false,
        reason: '配额检查服务异常',
        currentUsage: 0,
        limit: 0,
        remainingCalls: 0,
        remainingTokens: 0,
      };
    }
  }

  /**
   * 记录AI调用使用情况
   */
  static async recordUsage(record: AiCallRecord): Promise<void> {
    try {
      await AiUsageRepository.create({
        userId: record.userId,
        serviceType: record.serviceType,
        endpoint: record.endpoint,
        tokensUsed: record.tokensUsed,
        costEstimate: record.costEstimate,
        status: record.status,
        errorMessage: record.errorMessage,
      });

      // 如果调用成功，更新用户配额使用量
      if (record.status === 'success') {
        await this.updateQuotaUsage(
          record.userId,
          record.serviceType,
          record.tokensUsed,
          record.costEstimate,
        );
      }
    } catch (_error) {
      console.error('记录使用情况失败:');
      // 不抛出错误，避免影响主要业务流程
    }
  }

  /**
   * 获取用户使用统计
   */
  static async getUserUsageStats(userId: string, _days: number = 30) {
    return await AiUsageRepository.getUserStats(userId, _days);
  }

  /**
   * 获取用户各服务使用统计
   */
  static async getUserServiceStats(userId: string, _days: number = 30) {
    return await AiUsageRepository.getUserServiceStats(userId, _days);
  }

  /**
   * 获取用户今日使用概览
   */
  static async getTodayUsageOverview(_userId: string) {
    const user = await import('../../database/repositories/UserRepository').then(module =>
      module.UserRepository.getById(_userId),
    );

    if (!user) {
      throw new Error('用户不存在');
    }

    const todayUsage = await AiUsageRepository.getTodayUsage(_userId);
    const limits = DEFAULT_LIMITS[user.role] || DEFAULT_LIMITS.user;

    return {
      calls: {
        used: todayUsage.calls,
        limit: limits.dailyCalls,
        percentage:
          limits.dailyCalls > 0 ? Math.round((todayUsage.calls / limits.dailyCalls) * 100) : 0,
      },
      tokens: {
        used: todayUsage.tokens,
        limit: limits.dailyTokens,
        percentage:
          limits.dailyTokens > 0 ? Math.round((todayUsage.tokens / limits.dailyTokens) * 100) : 0,
      },
      cost: {
        used: todayUsage.cost,
        limit: limits.maxCostPerDay,
        percentage:
          limits.maxCostPerDay > 0 ? Math.round((todayUsage.cost / limits.maxCostPerDay) * 100) : 0,
        usedInYuan: (todayUsage.cost / 100).toFixed(2),
        limitInYuan: limits.maxCostPerDay > 0 ? (limits.maxCostPerDay / 100).toFixed(2) : '无限制',
      },
      resetTime: this.getTomorrowMidnight(),
    };
  }

  /**
   * 计算AI服务调用成本
   */
  static calculateCost(_serviceType: AiServiceType, tokens: number): number {
    const pricePerThousand = SERVICE_PRICING[_serviceType] || SERVICE_PRICING.qwen;
    return Math.ceil((tokens / 1000) * pricePerThousand);
  }

  /**
   * 获取明天午夜的时间戳
   */
  private static getTomorrowMidnight(): number {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  /**
   * 检查自定义配额限制
   */
  private static async checkCustomQuota(
    userId: string,
    serviceType: AiServiceType,
    estimatedTokens: number,
  ): Promise<QuotaCheckResult> {
    try {
      // 获取用户的自定义配额设置
      const quotas = await UserQuotaRepository.getActiveQuotas(userId);

      for (const quota of quotas) {
        // 检查服务类型匹配
        if (quota.serviceType && quota.serviceType !== serviceType) {
          continue;
        }

        // 获取当前使用量
        let currentUsage = 0;

        if (quota.resetPeriod === 'daily') {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);

          if (quota.quotaType === 'calls') {
            const usage = await AiUsageRepository.getTodayUsage(userId);
            currentUsage = usage.calls;
          } else if (quota.quotaType === 'tokens') {
            const usage = await AiUsageRepository.getTodayUsage(userId);
            currentUsage = usage.tokens;
          }
        } else if (quota.resetPeriod === 'monthly') {
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);

          const stats = await AiUsageRepository.getUserStats(userId, 30);
          if (quota.quotaType === 'calls') {
            currentUsage = stats.thisMonthCalls;
          } else if (quota.quotaType === 'tokens') {
            currentUsage = stats.totalTokens;
          }
        }

        // 检查是否超出限制
        const projectedUsage = currentUsage + (quota.quotaType === 'tokens' ? estimatedTokens : 1);

        if (projectedUsage > quota.quotaLimit) {
          const resetTime = this.getNextResetTime(quota.resetPeriod);

          return {
            allowed: false,
            reason: `已达到${quota.quotaType === 'calls' ? '调用次数' : 'Token'}自定义限制（${
              quota.quotaLimit
            }${quota.quotaType === 'calls' ? '次' : '个'}）`,
            currentUsage,
            limit: quota.quotaLimit,
            remainingCalls:
              quota.quotaType === 'calls' ? Math.max(0, quota.quotaLimit - currentUsage) : -1,
            remainingTokens:
              quota.quotaType === 'tokens' ? Math.max(0, quota.quotaLimit - currentUsage) : -1,
            resetTime,
          };
        }
      }

      return {
        allowed: true,
        currentUsage: 0,
        limit: -1,
        remainingCalls: -1,
        remainingTokens: -1,
      };
    } catch (error) {
      console.error('检查自定义配额失败:', error);
      return {
        allowed: true,
        currentUsage: 0,
        limit: -1,
        remainingCalls: -1,
        remainingTokens: -1,
      };
    }
  }

  /**
   * 更新配额使用量
   */
  private static async updateQuotaUsage(
    _userId: string,
    _serviceType: AiServiceType,
    _tokens: number,
    _cost: number,
  ): Promise<void> {
    try {
      // 这里可以实现配额使用量的更新逻辑
      // 目前通过AiUsageRepository已经记录了使用情况
      // 可以考虑在UserQuota表中维护实时使用量缓存以提高性能
    } catch (_error) {
      console.error('更新配额使用量失败:');
    }
  }

  /**
   * 获取下次重置时间
   */
  private static getNextResetTime(resetPeriod: ResetPeriod): number {
    const now = new Date();

    if (resetPeriod === 'daily') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow.getTime();
    } else if (resetPeriod === 'weekly') {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + (7 - nextWeek.getDay()));
      nextWeek.setHours(0, 0, 0, 0);
      return nextWeek.getTime();
    } else if (resetPeriod === 'monthly') {
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setHours(0, 0, 0, 0);
      return nextMonth.getTime();
    }

    return now.getTime();
  }

  /**
   * 重置过期的配额
   */
  static async resetExpiredQuotas(): Promise<void> {
    try {
      // 这个方法可以由定时任务调用，重置过期的配额
      // 实现逻辑根据具体需求可以进一步完善
      console.log('重置过期配额...');
    } catch (_error) {
      console.error('重置过期配额失败:');
    }
  }

  /**
   * 清理旧的使用记录
   */
  static async cleanupOldRecords(_days: number = 90): Promise<number> {
    return await AiUsageRepository.cleanupOldLogs(_days);
  }
}
