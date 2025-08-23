/**
 * 打卡记录模型 - 用户每日打卡与情绪记录
 * 支持打卡时间、备注和情绪评分等功能
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class CheckIn extends Model {
  static table = 'check_ins';

  static associations: Associations = {
    user: { type: 'belongs_to', key: 'user_id' },
  };

  // 关联用户
  @field('user_id') userId!: string;

  // 打卡信息
  @field('date') date!: string; // YYYY-MM-DD 格式
  @field('check_in_time') checkInTime!: number; // Unix 时间戳
  @field('notes') notes?: string;
  @field('mood_score') moodScore?: number; // 1-5 情绪评分

  // 时间戳
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // 关联关系
  @relation('users', 'user_id') user!: any;

  // 工具方法

  /**
   * 获取打卡时间的日期对象
   */
  get checkInDate(): Date {
    return new Date(this.checkInTime);
  }

  /**
   * 获取情绪描述
   */
  get moodDescription(): string {
    if (!this.moodScore) return '未评分';

    const descriptions = {
      1: '很糟糕',
      2: '不太好',
      3: '一般',
      4: '不错',
      5: '很棒',
    };

    return descriptions[this.moodScore as keyof typeof descriptions] || '未知';
  }

  /**
   * 获取打卡时间的友好显示
   */
  get checkInTimeFormatted(): string {
    const date = this.checkInDate;
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * 检查是否为今日打卡
   */
  get isToday(): boolean {
    const today = new Date().toISOString().split('T')[0];
    return this.date === today;
  }

  /**
   * 获取打卡日期的友好显示
   */
  get dateFormatted(): string {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (this.date === today) return '今天';
    if (this.date === yesterday) return '昨天';

    // 格式化为 MM-DD
    const [year, month, day] = this.date.split('-');
    return `${month}-${day}`;
  }
}
