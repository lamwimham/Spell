/**
 * 配额服务 - 配额管理、检查和重置的核心功能
 * 提供配额设置、检查、重置和统计的完整解决方案
 */

import { UserQuotaRepository } from '../../database/repositories/UserQuotaRepository';
import { UsageTrackingService, QuotaCheckResult } from './usageTrackingService';
import { AiServiceType } from '../../database/models/AiUsageLog';
import { QuotaType, ResetPeriod } from '../../database/models/UserQuota';
import { UserRole } from '../../database/models/User';

// 配额设置数据类型
export interface QuotaSettings {
  userId: string;
  quotaType: QuotaType;
  quotaLimit: number;
  serviceType?: AiServiceType;
  resetPeriod: ResetPeriod;
  description?: string;
}

// 配额重置结果
export interface QuotaResetResult {
  success: boolean;
  quotasReset: number;
  errors: string[];
}

// 用户配额概览
export interface UserQuotaOverview {
  userId: string;
  userRole: UserRole;
  quotas: Array<{
    id: string;
    type: QuotaType;
    limit: number;
    used: number;
    remaining: number;
    percentage: number;
    resetPeriod: ResetPeriod;
    nextResetTime: number;
    serviceType?: AiServiceType;
    description?: string;
  }>;
  defaultLimits: {
    dailyCalls: number;
    dailyTokens: number;
    monthlyCalls: number;
    monthlyTokens: number;
  };
}

// 配额使用趋势
export interface QuotaUsageTrend {
  date: string; // YYYY-MM-DD
  calls: number;
  tokens: number;
  cost: number;
}

export class QuotaService {
  /**
   * 创建或更新用户配额
   */
  static async setUserQuota(settings: QuotaSettings): Promise<void> {
    try {
      await UserQuotaRepository.create({
        userId: settings.userId,
        quotaType: settings.quotaType,
        quotaLimit: settings.quotaLimit,
        serviceType: settings.serviceType,
        resetPeriod: settings.resetPeriod,
        description: settings.description,
      });
    } catch (error) {
      console.error('设置用户配额失败:', error);
      throw new Error('配额设置失败');
    }
  }

  /**
   * 删除用户配额
   */
  static async removeUserQuota(quotaId: string): Promise<void> {
    try {
      await UserQuotaRepository.delete(quotaId);
    } catch (error) {
      console.error('删除用户配额失败:', error);
      throw new Error('配额删除失败');
    }
  }

  /**
   * 检查用户是否可以进行AI调用
   */
  static async checkQuota(
    userId: string,
    serviceType: AiServiceType,
    estimatedTokens: number = 100,
  ): Promise<QuotaCheckResult> {
    return await UsageTrackingService.checkQuota(userId, serviceType, estimatedTokens);
  }

  /**
   * 获取用户配额概览
   */
  static async getUserQuotaOverview(userId: string): Promise<UserQuotaOverview> {
    try {
      // 获取用户信息
      const user = await import('../../database/repositories/UserRepository').then(module =>
        module.UserRepository.getById(userId),
      );

      if (!user) {
        throw new Error('用户不存在');
      }

      // 获取用户自定义配额
      const userQuotas = await UserQuotaRepository.getActiveQuotas(userId);

      // 获取当前使用情况
      const todayUsage = await UsageTrackingService.getTodayUsageOverview(userId);

      // 处理自定义配额
      const quotas = await Promise.all(
        userQuotas.map(async quota => {
          let used = 0;

          // 根据配额类型获取使用量
          if (quota.resetPeriod === 'daily') {
            if (quota.quotaType === 'calls') {
              used = todayUsage.calls.used;
            } else if (quota.quotaType === 'tokens') {
              used = todayUsage.tokens.used;
            }
          } else if (quota.resetPeriod === 'monthly') {
            const stats = await UsageTrackingService.getUserUsageStats(userId, 30);
            if (quota.quotaType === 'calls') {
              used = stats.thisMonthCalls;
            } else if (quota.quotaType === 'tokens') {
              used = stats.totalTokens;
            }
          }

          const remaining = Math.max(0, quota.quotaLimit - used);
          const percentage = quota.quotaLimit > 0 ? Math.round((used / quota.quotaLimit) * 100) : 0;
          const nextResetTime = this.getNextResetTime(quota.resetPeriod);

          return {
            id: quota.id,
            type: quota.quotaType,
            limit: quota.quotaLimit,
            used,
            remaining,
            percentage,
            resetPeriod: quota.resetPeriod,
            nextResetTime,
            serviceType: quota.serviceType,
            description: quota.description,
          };
        }),
      );

      // 获取默认限制
      const defaultLimits = this.getDefaultLimits(user.role);

      return {
        userId,
        userRole: user.role,
        quotas,
        defaultLimits: {
          dailyCalls: defaultLimits.dailyCalls,
          dailyTokens: defaultLimits.dailyTokens,
          monthlyCalls: defaultLimits.monthlyCalls,
          monthlyTokens: defaultLimits.monthlyTokens,
        },
      };
    } catch (error) {
      console.error('获取用户配额概览失败:', error);
      throw new Error('获取配额信息失败');
    }
  }

  /**
   * 重置过期的配额
   */
  static async resetExpiredQuotas(): Promise<QuotaResetResult> {
    const result: QuotaResetResult = {
      success: true,
      quotasReset: 0,
      errors: [],
    };

    try {
      // 获取所有活跃配额
      const allQuotas = await UserQuotaRepository.getAllActive();
      const now = new Date();

      for (const quota of allQuotas) {
        try {
          let shouldReset = false;

          // 检查是否需要重置
          if (quota.resetPeriod === 'daily') {
            const lastReset = new Date(quota.lastResetAt || quota.createdAt);
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            shouldReset = lastReset < todayStart;
          } else if (quota.resetPeriod === 'weekly') {
            const lastReset = new Date(quota.lastResetAt || quota.createdAt);
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);
            shouldReset = lastReset < weekStart;
          } else if (quota.resetPeriod === 'monthly') {
            const lastReset = new Date(quota.lastResetAt || quota.createdAt);
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            shouldReset = lastReset < monthStart;
          }

          if (shouldReset) {
            await UserQuotaRepository.resetQuota(quota.id);
            result.quotasReset++;
          }
        } catch (error) {
          result.errors.push(`重置配额 ${quota.id} 失败: ${error}`);
          result.success = false;
        }
      }
    } catch (error) {
      result.errors.push(`获取配额列表失败: ${error}`);
      result.success = false;
    }

    return result;
  }

  /**
   * 获取用户配额使用趋势
   */
  static async getUsageTrend(userId: string, days: number = 30): Promise<QuotaUsageTrend[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trend: QuotaUsageTrend[] = [];

      // 生成每日数据
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];

        // 这里可以从数据库获取具体日期的使用量
        // 目前简化实现，使用平均值估算
        const stats = await UsageTrackingService.getUserUsageStats(userId, days);
        const avgDailyCalls = Math.round(stats.totalCalls / days);
        const avgDailyTokens = Math.round(stats.totalTokens / days);
        const avgDailyCost = Math.round(stats.totalCost / days);

        trend.push({
          date: dateStr,
          calls: avgDailyCalls,
          tokens: avgDailyTokens,
          cost: avgDailyCost,
        });
      }

      return trend;
    } catch (error) {
      console.error('获取使用趋势失败:', error);
      return [];
    }
  }

  /**
   * 批量设置用户配额
   */
  static async batchSetQuotas(
    quotasList: QuotaSettings[],
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const result = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const quota of quotasList) {
      try {
        await this.setUserQuota(quota);
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push(`设置用户 ${quota.userId} 配额失败: ${error}`);
      }
    }

    return result;
  }

  /**
   * 获取系统配额统计
   */
  static async getSystemQuotaStats(): Promise<{
    totalUsers: number;
    activeQuotas: number;
    quotasByType: Record<QuotaType, number>;
    quotasByPeriod: Record<ResetPeriod, number>;
  }> {
    try {
      const allQuotas = await UserQuotaRepository.getAllActive();

      const quotasByType: Record<QuotaType, number> = {
        calls: 0,
        tokens: 0,
        cost: 0,
      };

      const quotasByPeriod: Record<ResetPeriod, number> = {
        daily: 0,
        weekly: 0,
        monthly: 0,
        yearly: 0,
      };

      allQuotas.forEach(quota => {
        quotasByType[quota.quotaType]++;
        quotasByPeriod[quota.resetPeriod]++;
      });

      // 获取用户总数
      const totalUsers = await import('../../database/repositories/UserRepository').then(module =>
        module.UserRepository.getCount(),
      );

      return {
        totalUsers,
        activeQuotas: allQuotas.length,
        quotasByType,
        quotasByPeriod,
      };
    } catch (error) {
      console.error('获取系统配额统计失败:', error);
      return {
        totalUsers: 0,
        activeQuotas: 0,
        quotasByType: { calls: 0, tokens: 0, cost: 0 },
        quotasByPeriod: { daily: 0, weekly: 0, monthly: 0, yearly: 0 },
      };
    }
  }

  /**
   * 获取用户角色的默认限制
   */
  private static getDefaultLimits(role: UserRole) {
    const defaultLimits = {
      guest: { dailyCalls: 5, dailyTokens: 1000, monthlyCalls: 50, monthlyTokens: 10000 },
      user: { dailyCalls: 50, dailyTokens: 10000, monthlyCalls: 1000, monthlyTokens: 200000 },
      premium: { dailyCalls: 200, dailyTokens: 50000, monthlyCalls: 5000, monthlyTokens: 1000000 },
      admin: { dailyCalls: -1, dailyTokens: -1, monthlyCalls: -1, monthlyTokens: -1 },
    };

    return defaultLimits[role] || defaultLimits.user;
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
    } else if (resetPeriod === 'yearly') {
      const nextYear = new Date(now);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      nextYear.setMonth(0);
      nextYear.setDate(1);
      nextYear.setHours(0, 0, 0, 0);
      return nextYear.getTime();
    }

    return now.getTime();
  }

  /**
   * 验证配额设置的合理性
   */
  static validateQuotaSettings(settings: QuotaSettings): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查配额限制值
    if (settings.quotaLimit <= 0) {
      errors.push('配额限制必须大于0');
    }

    // 检查调用次数限制范围
    if (settings.quotaType === 'calls' && settings.quotaLimit > 10000) {
      errors.push('每日调用次数限制不能超过10000次');
    }

    // 检查token限制范围
    if (settings.quotaType === 'tokens' && settings.quotaLimit > 1000000) {
      errors.push('Token限制不能超过1000000个');
    }

    // 检查成本限制范围
    if (settings.quotaType === 'cost' && settings.quotaLimit > 100000) {
      errors.push('成本限制不能超过1000元');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 预估配额成本
   */
  static estimateQuotaCost(
    quotaType: QuotaType,
    limit: number,
    serviceType?: AiServiceType,
  ): number {
    if (quotaType === 'cost') {
      return limit; // 直接返回成本限制
    }

    if (quotaType === 'tokens') {
      const defaultServiceType = serviceType || 'qwen';
      return UsageTrackingService.calculateCost(defaultServiceType, limit);
    }

    if (quotaType === 'calls') {
      // 假设每次调用平均使用100个token
      const avgTokensPerCall = 100;
      const totalTokens = limit * avgTokensPerCall;
      const defaultServiceType = serviceType || 'qwen';
      return UsageTrackingService.calculateCost(defaultServiceType, totalTokens);
    }

    return 0;
  }
}
