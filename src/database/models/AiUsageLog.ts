/**
 * AI使用记录模型 - 详细的API调用统计与成本追踪
 * 支持多种AI服务的使用统计和错误追踪
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

// AI服务类型枚举
export type AiServiceType = 'qwen' | 'openai' | 'claude';

// 调用状态枚举
export type CallStatus = 'success' | 'error' | 'timeout' | 'quota_exceeded';

export default class AiUsageLog extends Model {
  static table = 'ai_usage_logs';

  static associations: Associations = {
    user: { type: 'belongs_to', key: 'user_id' },
  };

  // 关联用户
  @field('user_id') userId!: string;

  // 服务信息
  @field('service_type') serviceType!: AiServiceType;
  @field('endpoint') endpoint!: string;

  // 使用统计
  @field('tokens_used') tokensUsed!: number;
  @field('cost_estimate') costEstimate!: number; // 成本估算（分）

  // 调用状态
  @field('status') status!: CallStatus;
  @field('error_message') errorMessage?: string;

  // 时间戳
  @readonly @date('created_at') createdAt!: Date;

  // 关联关系
  @relation('users', 'user_id') user!: any;

  // 工具方法

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
   * 获取成本的友好显示（元）
   */
  get costInYuan(): number {
    return this.costEstimate / 100;
  }

  /**
   * 获取成本的格式化显示
   */
  get costFormatted(): string {
    return `¥${this.costInYuan.toFixed(3)}`;
  }

  /**
   * 检查调用是否成功
   */
  get isSuccessful(): boolean {
    return this.status === 'success';
  }

  /**
   * 获取状态的友好显示
   */
  get statusDisplayName(): string {
    const names = {
      success: '成功',
      error: '错误',
      timeout: '超时',
      quota_exceeded: '配额超限',
    };
    return names[this.status] || this.status;
  }

  /**
   * 获取调用时间的友好显示
   */
  get timeFormatted(): string {
    return this.createdAt.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * 获取Token使用量的友好显示
   */
  get tokensFormatted(): string {
    if (this.tokensUsed >= 1000) {
      return `${(this.tokensUsed / 1000).toFixed(1)}K`;
    }
    return String(this.tokensUsed);
  }
}
