/**
 * 用户配额模型 - 灵活的配额管理系统
 * 支持日配额、月配额和总配额等多种配额类型
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

// 配额类型枚举
export type QuotaType = 'calls' | 'tokens' | 'cost';

// 重置周期类型枚举
export type ResetPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

// AI服务类型枚举（重用）
export type QuotaServiceType = 'qwen' | 'openai' | 'claude';

export default class UserQuota extends Model {
  static table = 'user_quotas';

  static associations: Associations = {
    user: { type: 'belongs_to', key: 'user_id' },
  };

  // 关联用户
  @field('user_id') userId!: string;

  // 配额信息
  @field('service_type') serviceType!: QuotaServiceType;
  @field('quota_type') quotaType!: QuotaType;
  @field('quota_limit') quotaLimit!: number;
  @field('quota_used') quotaUsed!: number;
  @field('reset_date') resetDate!: number; // Unix 时间戳

  // 时间戳
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // 关联关系
  @relation('users', 'user_id') user!: any;

  // 工具方法

  /**
   * 获取配额剩余量
   */
  get quotaRemaining(): number {
    return Math.max(0, this.quotaLimit - this.quotaUsed);
  }

  /**
   * 获取配额使用百分比
   */
  get usagePercentage(): number {
    if (this.quotaLimit === 0) return 0;
    return Math.min(100, (this.quotaUsed / this.quotaLimit) * 100);
  }

  /**
   * 检查配额是否已用完
   */
  get isExhausted(): boolean {
    return this.quotaUsed >= this.quotaLimit;
  }

  /**
   * 检查配额是否需要重置
   */
  get needsReset(): boolean {
    const now = Date.now();
    return now >= this.resetDate;
  }

  /**
   * 获取服务类型的友好名称
   */
  get serviceDisplayName(): string {
    const names = {
      qwen: '通义千问',
      openai: 'OpenAI',
      claude: 'Claude',
    };
    return names[this.serviceType] || this.serviceType;
  }

  /**
   * 获取配额类型的友好名称
   */
  get quotaTypeDisplayName(): string {
    const names = {
      calls: '调用次数',
      tokens: 'Token数量',
      cost: '费用限制',
    };
    return names[this.quotaType] || this.quotaType;
  }

  /**
   * 获取重置时间的友好显示
   */
  get resetTimeFormatted(): string {
    const resetTime = new Date(this.resetDate);
    const now = new Date();

    if (resetTime.toDateString() === now.toDateString()) {
      return `今天 ${resetTime.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }

    return resetTime.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * 获取配额使用情况的格式化显示
   */
  get usageFormatted(): string {
    return `${this.quotaUsed}/${this.quotaLimit}`;
  }

  /**
   * 检查是否可以使用指定数量的配额
   */
  canUse(amount: number): boolean {
    return this.quotaUsed + amount <= this.quotaLimit;
  }

  /**
   * 获取距离重置的时间（毫秒）
   */
  get timeUntilReset(): number {
    return Math.max(0, this.resetDate - Date.now());
  }

  /**
   * 获取距离重置的友好时间显示
   */
  get timeUntilResetFormatted(): string {
    const ms = this.timeUntilReset;
    if (ms === 0) return '已过期';

    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}天`;
    }

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }

    return `${minutes}分钟`;
  }
}
