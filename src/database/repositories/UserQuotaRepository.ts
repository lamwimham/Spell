/**
 * 用户配额数据仓库 - 配额管理的数据访问层
 * 支持配额检查、使用量更新和自动重置功能
 */

import { Q } from '@nozbe/watermelondb';
import database from '../index';
import UserQuota, { QuotaType, QuotaServiceType } from '../models/UserQuota';

// 配额数据类型定义
export interface UserQuotaData {
  userId: string;
  serviceType: QuotaServiceType;
  quotaType: QuotaType;
  quotaLimit: number;
  quotaUsed: number;
  resetDate: number; // Unix 时间戳
}

// 配额查询条件类型
export interface UserQuotaQuery {
  userId?: string;
  serviceType?: QuotaServiceType;
  quotaType?: QuotaType;
  sortBy?: 'created_at' | 'quota_limit' | 'quota_used' | 'reset_date';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

// 配额摘要数据类型
export interface QuotaSummary {
  serviceType: QuotaServiceType;
  daily: {
    limit: number;
    used: number;
    remaining: number;
    resetTime: number;
  };
  monthly: {
    limit: number;
    used: number;
    remaining: number;
    resetTime: number;
  };
  total: {
    limit: number;
    used: number;
    remaining: number;
  };
}

export class UserQuotaRepository {
  // ====================
  // CRUD 操作
  // ====================

  /**
   * 创建新配额记录
   */
  static async create(data: UserQuotaData): Promise<UserQuota> {
    const newQuota = await database.write(async () => {
      return await database.get<UserQuota>('user_quotas').create(quota => {
        quota.userId = data.userId;
        quota.serviceType = data.serviceType;
        quota.quotaType = data.quotaType;
        quota.quotaLimit = data.quotaLimit;
        quota.quotaUsed = data.quotaUsed;
        quota.resetDate = data.resetDate;
        // WatermelonDB会自动处理createdAt和updatedAt字段
      });
    });
    return newQuota;
  }

  /**
   * 根据ID获取配额记录（静态查询）
   */
  static async getById(id: string): Promise<UserQuota> {
    return await database.get<UserQuota>('user_quotas').find(id);
  }

  /**
   * 更新配额记录
   */
  static async update(id: string, data: Partial<UserQuotaData>): Promise<void> {
    const quota = await database.get<UserQuota>('user_quotas').find(id);
    await database.write(async () => {
      await quota.update(record => {
        if (data.userId !== undefined) record.userId = data.userId;
        if (data.serviceType !== undefined) record.serviceType = data.serviceType;
        if (data.quotaType !== undefined) record.quotaType = data.quotaType;
        if (data.quotaLimit !== undefined) record.quotaLimit = data.quotaLimit;
        if (data.quotaUsed !== undefined) record.quotaUsed = data.quotaUsed;
        if (data.resetDate !== undefined) record.resetDate = data.resetDate;
        // WatermelonDB会自动处理updatedAt字段
      });
    });
  }

  /**
   * 删除配额记录
   */
  static async delete(id: string): Promise<void> {
    const quota = await database.get<UserQuota>('user_quotas').find(id);
    await database.write(async () => {
      await quota.markAsDeleted();
    });
  }

  // ====================
  // 查询操作
  // ====================

  /**
   * 获取用户所有配额记录（静态查询）
   */
  static async getAllByUser(userId: string): Promise<UserQuota[]> {
    return await database
      .get<UserQuota>('user_quotas')
      .query(Q.where('user_id', userId), Q.sortBy('service_type', 'asc'))
      .fetch();
  }

  /**
   * 获取用户特定服务的配额记录
   */
  static async getByUserAndService(
    userId: string,
    serviceType: QuotaServiceType,
  ): Promise<UserQuota[]> {
    return await database
      .get<UserQuota>('user_quotas')
      .query(Q.where('user_id', userId), Q.where('service_type', serviceType))
      .fetch();
  }

  /**
   * 获取用户特定服务和类型的配额记录
   */
  static async getByUserServiceAndType(
    userId: string,
    serviceType: QuotaServiceType,
    quotaType: QuotaType,
  ): Promise<UserQuota | null> {
    const quotas = await database
      .get<UserQuota>('user_quotas')
      .query(
        Q.where('user_id', userId),
        Q.where('service_type', serviceType),
        Q.where('quota_type', quotaType),
      )
      .fetch();
    return quotas.length > 0 ? quotas[0] : null;
  }

  // ====================
  // 配额使用操作
  // ====================

  /**
   * 增加配额使用量
   */
  static async incrementUsage(
    userId: string,
    serviceType: QuotaServiceType,
    quotaType: QuotaType,
    amount: number,
  ): Promise<boolean> {
    const quota = await this.getByUserServiceAndType(userId, serviceType, quotaType);
    if (!quota) return false;

    await database.write(async () => {
      await quota.update(record => {
        record.quotaUsed = Math.min(record.quotaUsed + amount, record.quotaLimit);
      });
    });

    return true;
  }

  /**
   * 重置配额使用量
   */
  static async resetUsage(
    userId: string,
    serviceType: QuotaServiceType,
    quotaType: QuotaType,
  ): Promise<boolean> {
    const quota = await this.getByUserServiceAndType(userId, serviceType, quotaType);
    if (!quota) return false;

    // 计算下次重置时间
    const now = Date.now();
    let nextResetDate = now;

    if (quotaType === 'daily') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      nextResetDate = tomorrow.getTime();
    } else if (quotaType === 'monthly') {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
      nextMonth.setHours(0, 0, 0, 0);
      nextResetDate = nextMonth.getTime();
    }

    await database.write(async () => {
      await quota.update(record => {
        record.quotaUsed = 0;
        if (quotaType !== 'total') {
          record.resetDate = nextResetDate;
        }
      });
    });

    return true;
  }

  /**
   * 检查配额是否可用
   */
  static async checkQuotaAvailable(
    userId: string,
    serviceType: QuotaServiceType,
    quotaType: QuotaType,
    requestAmount: number = 1,
  ): Promise<boolean> {
    const quota = await this.getByUserServiceAndType(userId, serviceType, quotaType);
    if (!quota) return false;

    // 检查是否需要重置配额
    if (quota.needsReset) {
      await this.resetUsage(userId, serviceType, quotaType);
      // 重新获取配额信息
      const updatedQuota = await this.getByUserServiceAndType(userId, serviceType, quotaType);
      return updatedQuota ? updatedQuota.canUse(requestAmount) : false;
    }

    return quota.canUse(requestAmount);
  }

  // ====================
  // 响应式查询
  // ====================

  /**
   * 响应式查询用户配额记录
   */
  static observeByUser(userId: string) {
    return database
      .get<UserQuota>('user_quotas')
      .query(Q.where('user_id', userId), Q.sortBy('service_type', 'asc'))
      .observe();
  }

  /**
   * 响应式查询用户特定服务的配额记录
   */
  static observeByUserAndService(userId: string, serviceType: QuotaServiceType) {
    return database
      .get<UserQuota>('user_quotas')
      .query(Q.where('user_id', userId), Q.where('service_type', serviceType))
      .observe();
  }

  /**
   * 响应式查询单个配额记录
   */
  static observeById(id: string) {
    return database.get<UserQuota>('user_quotas').findAndObserve(id);
  }

  /**
   * 响应式查询带条件的配额记录
   */
  static observeWithQuery(query?: UserQuotaQuery) {
    const queries = [];

    // 添加用户ID条件
    if (query && query.userId) {
      queries.push(Q.where('user_id', query.userId));
    }

    // 添加服务类型条件
    if (query && query.serviceType) {
      queries.push(Q.where('service_type', query.serviceType));
    }

    // 添加配额类型条件
    if (query && query.quotaType) {
      queries.push(Q.where('quota_type', query.quotaType));
    }

    // 添加排序条件
    if (query && query.sortBy) {
      queries.push(Q.sortBy(query.sortBy, query.sortOrder || 'desc'));
    } else {
      queries.push(Q.sortBy('service_type', 'asc'));
    }

    // 添加限制条件
    if (query && query.limit) {
      queries.push(Q.take(query.limit));
    }

    return database
      .get<UserQuota>('user_quotas')
      .query(...queries)
      .observe();
  }

  /**
   * 响应式获取配额记录总数
   */
  static observeCount() {
    return database.get<UserQuota>('user_quotas').query().observeCount();
  }

  /**
   * 响应式获取用户配额记录总数
   */
  static observeCountByUser(userId: string) {
    return database.get<UserQuota>('user_quotas').query(Q.where('user_id', userId)).observeCount();
  }

  // ====================
  // 统计和摘要
  // ====================

  /**
   * 获取用户配额摘要
   */
  static async getUserQuotaSummary(userId: string): Promise<QuotaSummary[]> {
    const quotas = await this.getAllByUser(userId);

    // 按服务类型分组
    const serviceQuotas: Record<QuotaServiceType, Partial<QuotaSummary>> = {};

    quotas.forEach(quota => {
      if (!serviceQuotas[quota.serviceType]) {
        serviceQuotas[quota.serviceType] = {
          serviceType: quota.serviceType,
          daily: { limit: 0, used: 0, remaining: 0, resetTime: 0 },
          monthly: { limit: 0, used: 0, remaining: 0, resetTime: 0 },
          total: { limit: 0, used: 0, remaining: 0 },
        };
      }

      const summary = serviceQuotas[quota.serviceType];

      if (quota.quotaType === 'daily') {
        summary.daily = {
          limit: quota.quotaLimit,
          used: quota.quotaUsed,
          remaining: quota.quotaRemaining,
          resetTime: quota.resetDate,
        };
      } else if (quota.quotaType === 'monthly') {
        summary.monthly = {
          limit: quota.quotaLimit,
          used: quota.quotaUsed,
          remaining: quota.quotaRemaining,
          resetTime: quota.resetDate,
        };
      } else if (quota.quotaType === 'total') {
        summary.total = {
          limit: quota.quotaLimit,
          used: quota.quotaUsed,
          remaining: quota.quotaRemaining,
        };
      }
    });

    return Object.values(serviceQuotas) as QuotaSummary[];
  }

  /**
   * 获取配额记录总数
   */
  static async getCount(): Promise<number> {
    return await database.get<UserQuota>('user_quotas').query().fetchCount();
  }

  /**
   * 获取用户配额记录总数
   */
  static async getCountByUser(userId: string): Promise<number> {
    return await database
      .get<UserQuota>('user_quotas')
      .query(Q.where('user_id', userId))
      .fetchCount();
  }

  // ====================
  // 用户配额管理
  // ====================

  /**
   * 初始化用户默认配额
   */
  static async initializeUserQuotas(userId: string, userRole: string): Promise<void> {
    const defaultQuotas = this.getDefaultQuotasByRole(userRole);

    await database.write(async () => {
      for (const quotaData of defaultQuotas) {
        await database.get<UserQuota>('user_quotas').create(quota => {
          quota.userId = userId;
          quota.serviceType = quotaData.serviceType;
          quota.quotaType = quotaData.quotaType;
          quota.quotaLimit = quotaData.quotaLimit;
          quota.quotaUsed = 0;
          quota.resetDate = quotaData.resetDate;
        });
      }
    });
  }

  /**
   * 根据用户角色获取默认配额配置
   */
  private static getDefaultQuotasByRole(userRole: string): UserQuotaData[] {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const tomorrowTime = tomorrow.getTime();

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
    nextMonth.setHours(0, 0, 0, 0);
    const nextMonthTime = nextMonth.getTime();

    const baseQuotas: Omit<UserQuotaData, 'userId'>[] = [];

    if (userRole === 'admin') {
      // 管理员无限制配额
      baseQuotas.push(
        {
          serviceType: 'qwen',
          quotaType: 'daily',
          quotaLimit: -1,
          quotaUsed: 0,
          resetDate: tomorrowTime,
        },
        {
          serviceType: 'qwen',
          quotaType: 'monthly',
          quotaLimit: -1,
          quotaUsed: 0,
          resetDate: nextMonthTime,
        },
        {
          serviceType: 'openai',
          quotaType: 'daily',
          quotaLimit: -1,
          quotaUsed: 0,
          resetDate: tomorrowTime,
        },
        {
          serviceType: 'openai',
          quotaType: 'monthly',
          quotaLimit: -1,
          quotaUsed: 0,
          resetDate: nextMonthTime,
        },
        {
          serviceType: 'claude',
          quotaType: 'daily',
          quotaLimit: -1,
          quotaUsed: 0,
          resetDate: tomorrowTime,
        },
        {
          serviceType: 'claude',
          quotaType: 'monthly',
          quotaLimit: -1,
          quotaUsed: 0,
          resetDate: nextMonthTime,
        },
      );
    } else if (userRole === 'premium') {
      // 高级用户配额
      baseQuotas.push(
        {
          serviceType: 'qwen',
          quotaType: 'daily',
          quotaLimit: 200,
          quotaUsed: 0,
          resetDate: tomorrowTime,
        },
        {
          serviceType: 'qwen',
          quotaType: 'monthly',
          quotaLimit: 5000,
          quotaUsed: 0,
          resetDate: nextMonthTime,
        },
        {
          serviceType: 'openai',
          quotaType: 'daily',
          quotaLimit: 100,
          quotaUsed: 0,
          resetDate: tomorrowTime,
        },
        {
          serviceType: 'openai',
          quotaType: 'monthly',
          quotaLimit: 2000,
          quotaUsed: 0,
          resetDate: nextMonthTime,
        },
        {
          serviceType: 'claude',
          quotaType: 'daily',
          quotaLimit: 50,
          quotaUsed: 0,
          resetDate: tomorrowTime,
        },
        {
          serviceType: 'claude',
          quotaType: 'monthly',
          quotaLimit: 1000,
          quotaUsed: 0,
          resetDate: nextMonthTime,
        },
      );
    } else {
      // 普通用户配额
      baseQuotas.push(
        {
          serviceType: 'qwen',
          quotaType: 'daily',
          quotaLimit: 50,
          quotaUsed: 0,
          resetDate: tomorrowTime,
        },
        {
          serviceType: 'qwen',
          quotaType: 'monthly',
          quotaLimit: 500,
          quotaUsed: 0,
          resetDate: nextMonthTime,
        },
        {
          serviceType: 'openai',
          quotaType: 'daily',
          quotaLimit: 20,
          quotaUsed: 0,
          resetDate: tomorrowTime,
        },
        {
          serviceType: 'openai',
          quotaType: 'monthly',
          quotaLimit: 200,
          quotaUsed: 0,
          resetDate: nextMonthTime,
        },
        {
          serviceType: 'claude',
          quotaType: 'daily',
          quotaLimit: 10,
          quotaUsed: 0,
          resetDate: tomorrowTime,
        },
        {
          serviceType: 'claude',
          quotaType: 'monthly',
          quotaLimit: 100,
          quotaUsed: 0,
          resetDate: nextMonthTime,
        },
      );
    }

    // 添加总配额（无重置时间）
    baseQuotas.push(
      {
        serviceType: 'qwen',
        quotaType: 'total',
        quotaLimit: userRole === 'admin' ? -1 : userRole === 'premium' ? 10000 : 1000,
        quotaUsed: 0,
        resetDate: 0,
      },
      {
        serviceType: 'openai',
        quotaType: 'total',
        quotaLimit: userRole === 'admin' ? -1 : userRole === 'premium' ? 5000 : 500,
        quotaUsed: 0,
        resetDate: 0,
      },
      {
        serviceType: 'claude',
        quotaType: 'total',
        quotaLimit: userRole === 'admin' ? -1 : userRole === 'premium' ? 2000 : 200,
        quotaUsed: 0,
        resetDate: 0,
      },
    );

    // 添加userId并返回
    return baseQuotas.map(quota => ({
      ...quota,
      userId: 'placeholder', // 在initializeUserQuotas中会被替换
    })) as UserQuotaData[];
  }

  /**
   * 自动重置过期的配额
   */
  static async autoResetExpiredQuotas(): Promise<number> {
    const __now = Date.now();
    const expiredQuotas = await database
      .get<UserQuota>('user_quotas')
      .query(Q.where('reset_date', Q.lte(__now)), Q.where('quota_type', Q.notEq('total')))
      .fetch();

    let resetCount = 0;

    await database.write(async () => {
      for (const quota of expiredQuotas) {
        await quota.update(record => {
          record.quotaUsed = 0;

          // 计算下次重置时间
          if (record.quotaType === 'daily') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            record.resetDate = tomorrow.getTime();
          } else if (record.quotaType === 'monthly') {
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
            nextMonth.setHours(0, 0, 0, 0);
            record.resetDate = nextMonth.getTime();
          }
        });
        resetCount++;
      }
    });

    return resetCount;
  }
}