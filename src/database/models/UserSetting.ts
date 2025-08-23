/**
 * 用户设置模型 - 灵活的键值对设置存储
 * 支持字符串、数字、布尔值和JSON对象等多种数据类型
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

// 设置值类型枚举
export type SettingType = 'string' | 'number' | 'boolean' | 'json';

export default class UserSetting extends Model {
  static table = 'user_settings';

  static associations: Associations = {
    user: { type: 'belongs_to', key: 'user_id' },
  };

  // 关联用户
  @field('user_id') userId!: string;

  // 设置键值对
  @field('key') key!: string;
  @field('value') value!: string;
  @field('type') type!: SettingType;

  // 时间戳
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // 关联关系
  @relation('users', 'user_id') user!: any;

  // 工具方法

  /**
   * 获取类型化的值
   */
  getTypedValue(): any {
    switch (this.type) {
      case 'number':
        return parseFloat(this.value);
      case 'boolean':
        return this.value === 'true';
      case 'json':
        try {
          return JSON.parse(this.value);
        } catch {
          return null;
        }
      case 'string':
      default:
        return this.value;
    }
  }

  /**
   * 设置类型化的值
   */
  static formatValue(value: any, type: SettingType): string {
    switch (type) {
      case 'number':
        return String(Number(value) || 0);
      case 'boolean':
        return String(Boolean(value));
      case 'json':
        return JSON.stringify(value);
      case 'string':
      default:
        return String(value || '');
    }
  }
}
