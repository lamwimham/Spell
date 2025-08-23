/**
 * AI使用记录数据仓库 - AI调用统计的数据访问层
 * 支持使用统计、成本分析和性能监控功能
 */

import { Q } from '@nozbe/watermelondb';
import database from '../index';
import AiUsageLog, { AiServiceType, CallStatus } from '../models/AiUsageLog';

// AI使用记录数据类型定义
export interface AiUsageData {
  userId: string;
  serviceType: AiServiceType;
  endpoint: string;
  tokensUsed: number;
  costEstimate: number; // 成本估算（分）
  status: CallStatus;
  errorMessage?: string;
}

// AI使用查询条件类型
export interface AiUsageQuery {
  userId?: string;
  serviceType?: AiServiceType;
  status?: CallStatus;
  dateRange?: {
    start: number; // Unix 时间戳
    end: number; // Unix 时间戳
  };
  sortBy?: 'created_at' | 'tokens_used' | 'cost_estimate';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

// AI使用统计数据类型
export interface AiUsageStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalTokens: number;
  totalCost: number; // 总成本（分）
  averageTokensPerCall: number;
  successRate: number; // 成功率（百分比）
  todayCalls: number;
  thisWeekCalls: number;
  thisMonthCalls: number;
}

// 服务使用统计
export interface ServiceUsageStats {
  serviceType: AiServiceType;
  calls: number;
  tokens: number;
  cost: number;
  successRate: number;
}

export class AiUsageRepository {
  /**
   * 创建新的AI使用记录
   */
  static async create(data: AiUsageData): Promise<AiUsageLog> {
    const newUsageLog = await database.write(async () => {
      return await database.get<AiUsageLog>('ai_usage_logs').create(log => {
        log.userId = data.userId;
        log.serviceType = data.serviceType;
        log.endpoint = data.endpoint;
        log.tokensUsed = data.tokensUsed;
        log.costEstimate = data.costEstimate;
        log.status = data.status;
        log.errorMessage = data.errorMessage;
        // WatermelonDB会自动处理createdAt字段
      });
    });
    return newUsageLog;
  }

  /**
   * 获取用户所有AI使用记录（静态查询）
   */
  static async getAllByUser(userId: string): Promise<AiUsageLog[]> {
    return await database
      .get<AiUsageLog>('ai_usage_logs')
      .query(Q.where('user_id', userId), Q.sortBy('created_at', 'desc'))
      .fetch();
  }

  /**
   * 根据ID获取AI使用记录（静态查询）
   */
  static async getById(id: string): Promise<AiUsageLog> {
    return await database.get<AiUsageLog>('ai_usage_logs').find(id);
  }

  /**
   * 删除AI使用记录
   */
  static async delete(id: string): Promise<void> {
    const usageLog = await database.get<AiUsageLog>('ai_usage_logs').find(id);
    await database.write(async () => {
      await usageLog.markAsDeleted();
    });
  }

  /**
   * 响应式查询用户AI使用记录（按时间倒序）
   */
  static observeByUser(userId: string) {
    return database
      .get<AiUsageLog>('ai_usage_logs')
      .query(Q.where('user_id', userId), Q.sortBy('created_at', 'desc'))
      .observe();
  }

  /**
   * 响应式查询单个AI使用记录
   */
  static observeById(id: string) {
    return database.get<AiUsageLog>('ai_usage_logs').findAndObserve(id);
  }

  /**
   * 响应式查询带条件的AI使用记录
   */
  static observeWithQuery(query?: AiUsageQuery) {
    const queries = [];

    // 添加用户ID条件
    if (query && query.userId) {
      queries.push(Q.where('user_id', query.userId));
    }

    // 添加服务类型条件
    if (query && query.serviceType) {
      queries.push(Q.where('service_type', query.serviceType));
    }

    // 添加状态条件
    if (query && query.status) {
      queries.push(Q.where('status', query.status));
    }

    // 添加时间范围条件
    if (query && query.dateRange) {
      queries.push(
        Q.where('created_at', Q.gte(query.dateRange.start)),
        Q.where('created_at', Q.lte(query.dateRange.end)),
      );
    }

    // 添加排序条件
    if (query && query.sortBy) {
      queries.push(Q.sortBy(query.sortBy, query.sortOrder || 'desc'));
    } else {
      queries.push(Q.sortBy('created_at', 'desc'));
    }

    // 添加限制条件
    if (query && query.limit) {
      queries.push(Q.take(query.limit));
    }

    return database
      .get<AiUsageLog>('ai_usage_logs')
      .query(...queries)
      .observe();
  }

  /**
   * 获取用户AI使用统计数据
   */
  static async getUserStats(userId: string, days: number = 30): Promise<AiUsageStats> {
    const endTime = Date.now();
    const startTime = endTime - days * 24 * 60 * 60 * 1000;

    const logs = await database
      .get<AiUsageLog>('ai_usage_logs')
      .query(Q.where('user_id', userId), Q.where('created_at', Q.gte(startTime)))
      .fetch();

    if (logs.length === 0) {
      return {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        totalTokens: 0,
        totalCost: 0,
        averageTokensPerCall: 0,
        successRate: 0,
        todayCalls: 0,
        thisWeekCalls: 0,
        thisMonthCalls: 0,
      };
    }

    const totalCalls = logs.length;
    const successfulCalls = logs.filter(log => log.status === 'success').length;
    const failedCalls = totalCalls - successfulCalls;
    const totalTokens = logs.reduce((sum, log) => sum + log.tokensUsed, 0);
    const totalCost = logs.reduce((sum, log) => sum + log.costEstimate, 0);
    const averageTokensPerCall = totalCalls > 0 ? Math.round(totalTokens / totalCalls) : 0;
    const successRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0;

    // 计算今日、本周、本月调用次数
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - now.getDay() * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const todayCalls = logs.filter(log => log.createdAt.getTime() >= todayStart).length;
    const thisWeekCalls = logs.filter(log => log.createdAt.getTime() >= weekStart).length;
    const thisMonthCalls = logs.filter(log => log.createdAt.getTime() >= monthStart).length;

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      totalTokens,
      totalCost,
      averageTokensPerCall,
      successRate,
      todayCalls,
      thisWeekCalls,
      thisMonthCalls,
    };
  }

  /**
   * 获取用户各服务使用统计
   */
  static async getUserServiceStats(
    userId: string,
    days: number = 30,
  ): Promise<ServiceUsageStats[]> {
    const endTime = Date.now();
    const startTime = endTime - days * 24 * 60 * 60 * 1000;

    const logs = await database
      .get<AiUsageLog>('ai_usage_logs')
      .query(Q.where('user_id', userId), Q.where('created_at', Q.gte(startTime)))
      .fetch();

    // 按服务类型分组统计
    const serviceStats: Record<AiServiceType, ServiceUsageStats> = {
      qwen: { serviceType: 'qwen', calls: 0, tokens: 0, cost: 0, successRate: 0 },
      openai: { serviceType: 'openai', calls: 0, tokens: 0, cost: 0, successRate: 0 },
      claude: { serviceType: 'claude', calls: 0, tokens: 0, cost: 0, successRate: 0 },
    };

    logs.forEach(log => {
      const stats = serviceStats[log.serviceType];
      stats.calls++;
      stats.tokens += log.tokensUsed;
      stats.cost += log.costEstimate;
    });

    // 计算成功率
    Object.keys(serviceStats).forEach(serviceType => {
      const serviceLogs = logs.filter(log => log.serviceType === serviceType);
      const successfulCalls = serviceLogs.filter(log => log.status === 'success').length;
      serviceStats[serviceType as AiServiceType].successRate =
        serviceLogs.length > 0 ? Math.round((successfulCalls / serviceLogs.length) * 100) : 0;
    });

    return Object.values(serviceStats).filter(stats => stats.calls > 0);
  }

  /**
   * 获取用户今日使用量
   */
  static async getTodayUsage(
    userId: string,
  ): Promise<{ calls: number; tokens: number; cost: number }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const logs = await database
      .get<AiUsageLog>('ai_usage_logs')
      .query(Q.where('user_id', userId), Q.where('created_at', Q.gte(todayStart)))
      .fetch();

    const calls = logs.length;
    const tokens = logs.reduce((sum, log) => sum + log.tokensUsed, 0);
    const cost = logs.reduce((sum, log) => sum + log.costEstimate, 0);

    return { calls, tokens, cost };
  }

  /**
   * 获取用户特定服务今日使用量
   */
  static async getTodayUsageByService(
    userId: string,
    serviceType: AiServiceType,
  ): Promise<{ calls: number; tokens: number; cost: number }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const logs = await database
      .get<AiUsageLog>('ai_usage_logs')
      .query(
        Q.where('user_id', userId),
        Q.where('service_type', serviceType),
        Q.where('created_at', Q.gte(todayStart)),
      )
      .fetch();

    const calls = logs.length;
    const tokens = logs.reduce((sum, log) => sum + log.tokensUsed, 0);
    const cost = logs.reduce((sum, log) => sum + log.costEstimate, 0);

    return { calls, tokens, cost };
  }

  /**
   * 获取错误记录
   */
  static async getErrorLogs(userId: string, limit: number = 10): Promise<AiUsageLog[]> {
    return await database
      .get<AiUsageLog>('ai_usage_logs')
      .query(
        Q.where('user_id', userId),
        Q.where('status', Q.notEq('success')),
        Q.sortBy('created_at', 'desc'),
        Q.take(limit),
      )
      .fetch();
  }

  /**
   * 清理旧的使用记录（保留指定天数）
   */
  static async cleanupOldLogs(days: number = 90): Promise<number> {
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    const oldLogs = await database
      .get<AiUsageLog>('ai_usage_logs')
      .query(Q.where('created_at', Q.lt(cutoffTime)))
      .fetch();

    await database.write(async () => {
      await Promise.all(oldLogs.map(log => log.markAsDeleted()));
    });

    return oldLogs.length;
  }

  /**
   * 获取AI使用记录总数
   */
  static async getCount(): Promise<number> {
    return await database.get<AiUsageLog>('ai_usage_logs').query().fetchCount();
  }

  /**
   * 获取用户AI使用记录总数
   */
  static async getCountByUser(userId: string): Promise<number> {
    return await database
      .get<AiUsageLog>('ai_usage_logs')
      .query(Q.where('user_id', userId))
      .fetchCount();
  }

  /**
   * 响应式获取AI使用记录总数
   */
  static observeCount() {
    return database.get<AiUsageLog>('ai_usage_logs').query().observeCount();
  }

  /**
   * 响应式获取用户AI使用记录总数
   */
  static observeCountByUser(userId: string) {
    return database
      .get<AiUsageLog>('ai_usage_logs')
      .query(Q.where('user_id', userId))
      .observeCount();
  }
}
