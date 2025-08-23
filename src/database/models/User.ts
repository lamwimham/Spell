/**
 * 用户模型 - 本地优先的用户管理
 * 支持用户基础信息、权限控制和云端同步预留
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

// 用户状态枚举
export type UserStatus = 'active' | 'suspended' | 'inactive';

// 用户角色枚举
export type UserRole = 'admin' | 'premium' | 'user' | 'guest';

export default class User extends Model {
  static table = 'users';

  static associations: Associations = {
    recordings: { type: 'has_many', foreignKey: 'user_id' },
    user_settings: { type: 'has_many', foreignKey: 'user_id' },
    check_ins: { type: 'has_many', foreignKey: 'user_id' },
    ai_usage_logs: { type: 'has_many', foreignKey: 'user_id' },
    user_quotas: { type: 'has_many', foreignKey: 'user_id' },
  };

  // 基础用户信息
  @field('username') username!: string;
  @field('email') email?: string;
  @field('password_hash') passwordHash!: string;
  @field('avatar_url') avatarUrl?: string;

  // 状态和权限
  @field('status') status!: UserStatus;
  @field('role') role!: UserRole;

  // 登录信息
  @field('last_login_at') lastLoginAt?: number;

  // 云端同步预留字段
  @field('sync_id') syncId?: string;

  // 时间戳
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // 关联关系方法
  @relation('recordings', 'user_id') recordings!: any;
  @relation('user_settings', 'user_id') userSettings!: any;
  @relation('check_ins', 'user_id') checkIns!: any;
  @relation('ai_usage_logs', 'user_id') aiUsageLogs!: any;
  @relation('user_quotas', 'user_id') userQuotas!: any;

  // 工具方法

  /**
   * 检查用户是否为管理员
   */
  get isAdmin(): boolean {
    return this.role === 'admin';
  }

  /**
   * 检查用户是否为高级用户
   */
  get isPremium(): boolean {
    return this.role === 'premium' || this.role === 'admin';
  }

  /**
   * 检查用户是否处于活跃状态
   */
  get isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * 获取用户显示名称
   */
  get displayName(): string {
    return this.username || this.email || '未知用户';
  }

  /**
   * 获取用户头像URL（带默认值）
   */
  get avatarUrlWithDefault(): string {
    return this.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${this.username}`;
  }

  /**
   * 检查用户权限
   */
  hasPermission(permission: string): boolean {
    // 基于角色的权限检查逻辑
    const rolePermissions: Record<UserRole, string[]> = {
      admin: ['*'], // 管理员拥有所有权限
      premium: ['read', 'write', 'ai_enhanced', 'export'],
      user: ['read', 'write', 'ai_basic'],
      guest: ['read'],
    };

    const userPermissions = rolePermissions[this.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  }
}
