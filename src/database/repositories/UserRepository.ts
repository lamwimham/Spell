/**
 * 用户数据仓库 - 用户管理的数据访问层
 * 遵循项目的Repository模式，提供完整的CRUD操作和响应式查询
 */

import { Q } from '@nozbe/watermelondb';
import database from '../index';
import User, { UserStatus, UserRole } from '../models/User';

// 用户数据类型定义
export interface UserData {
  username: string;
  email?: string;
  passwordHash: string;
  avatarUrl?: string;
  status: UserStatus;
  role: UserRole;
  lastLoginAt?: number;
  syncId?: string;
}

// 用户查询条件类型
export interface UserQuery {
  search?: string;
  status?: UserStatus;
  role?: UserRole;
  sortBy?: 'created_at' | 'username' | 'last_login_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

// 登录凭据类型
export interface LoginCredentials {
  username: string;
  password: string;
}

export class UserRepository {
  /**
   * 创建新用户（注册）
   */
  static async create(data: UserData): Promise<User> {
    const newUser = await database.write(async () => {
      return await database.get<User>('users').create(user => {
        user.username = data.username;
        user.email = data.email;
        user.passwordHash = data.passwordHash;
        user.avatarUrl = data.avatarUrl;
        user.status = data.status;
        user.role = data.role;
        user.lastLoginAt = data.lastLoginAt;
        user.syncId = data.syncId;
        // WatermelonDB会自动处理createdAt和updatedAt字段
      });
    });
    return newUser;
  }

  /**
   * 获取所有用户（静态查询）
   */
  static async getAll(): Promise<User[]> {
    return await database.get<User>('users').query().fetch();
  }

  /**
   * 根据ID获取用户（静态查询）
   */
  static async getById(id: string): Promise<User> {
    return await database.get<User>('users').find(id);
  }

  /**
   * 根据用户名获取用户（静态查询）
   */
  static async getByUsername(username: string): Promise<User | null> {
    const users = await database.get<User>('users').query(Q.where('username', username)).fetch();
    return users.length > 0 ? users[0] : null;
  }

  /**
   * 根据邮箱获取用户（静态查询）
   */
  static async getByEmail(email: string): Promise<User | null> {
    const users = await database.get<User>('users').query(Q.where('email', email)).fetch();
    return users.length > 0 ? users[0] : null;
  }

  /**
   * 检查用户名是否已存在
   */
  static async isUsernameExists(username: string): Promise<boolean> {
    const count = await database
      .get<User>('users')
      .query(Q.where('username', username))
      .fetchCount();
    return count > 0;
  }

  /**
   * 检查邮箱是否已存在
   */
  static async isEmailExists(email: string): Promise<boolean> {
    const count = await database.get<User>('users').query(Q.where('email', email)).fetchCount();
    return count > 0;
  }

  /**
   * 更新用户信息
   */
  static async update(id: string, data: Partial<UserData>): Promise<void> {
    const user = await database.get<User>('users').find(id);
    await database.write(async () => {
      await user.update(record => {
        if (data.username !== undefined) record.username = data.username;
        if (data.email !== undefined) record.email = data.email;
        if (data.passwordHash !== undefined) record.passwordHash = data.passwordHash;
        if (data.avatarUrl !== undefined) record.avatarUrl = data.avatarUrl;
        if (data.status !== undefined) record.status = data.status;
        if (data.role !== undefined) record.role = data.role;
        if (data.lastLoginAt !== undefined) record.lastLoginAt = data.lastLoginAt;
        if (data.syncId !== undefined) record.syncId = data.syncId;
        // WatermelonDB会自动处理updatedAt字段
      });
    });
  }

  /**
   * 更新最后登录时间
   */
  static async updateLastLogin(id: string): Promise<void> {
    const user = await database.get<User>('users').find(id);
    await database.write(async () => {
      await user.update(record => {
        record.lastLoginAt = Date.now();
      });
    });
  }

  /**
   * 删除用户（软删除）
   */
  static async delete(id: string): Promise<void> {
    const user = await database.get<User>('users').find(id);
    await database.write(async () => {
      await user.markAsDeleted();
    });
  }

  /**
   * 禁用用户
   */
  static async suspend(id: string): Promise<void> {
    await this.update(id, { status: 'suspended' });
  }

  /**
   * 激活用户
   */
  static async activate(id: string): Promise<void> {
    await this.update(id, { status: 'active' });
  }

  /**
   * 响应式查询所有用户（按创建时间倒序）
   */
  static observeAll() {
    return database.get<User>('users').query(Q.sortBy('created_at', 'desc')).observe();
  }

  /**
   * 响应式查询单个用户
   */
  static observeById(id: string) {
    return database.get<User>('users').findAndObserve(id);
  }

  /**
   * 响应式查询当前活跃用户
   */
  static observeActiveUsers() {
    return database
      .get<User>('users')
      .query(Q.where('status', 'active'), Q.sortBy('last_login_at', 'desc'))
      .observe();
  }

  /**
   * 响应式查询带条件的用户列表
   */
  static observeWithQuery(query?: UserQuery) {
    const queries = [];

    // 添加搜索条件
    if (query && query.search) {
      queries.push(
        Q.or(
          Q.where('username', Q.like(`%${query.search}%`)),
          Q.where('email', Q.like(`%${query.search}%`)),
        ),
      );
    }

    // 添加状态过滤
    if (query && query.status) {
      queries.push(Q.where('status', query.status));
    }

    // 添加角色过滤
    if (query && query.role) {
      queries.push(Q.where('role', query.role));
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
      .get<User>('users')
      .query(...queries)
      .observe();
  }

  /**
   * 获取用户总数（静态查询）
   */
  static async getCount(): Promise<number> {
    return await database.get<User>('users').query().fetchCount();
  }

  /**
   * 获取活跃用户数量
   */
  static async getActiveCount(): Promise<number> {
    return await database.get<User>('users').query(Q.where('status', 'active')).fetchCount();
  }

  /**
   * 响应式获取用户总数
   */
  static observeCount() {
    return database.get<User>('users').query().observeCount();
  }

  /**
   * 响应式获取活跃用户数量
   */
  static observeActiveCount() {
    return database.get<User>('users').query(Q.where('status', 'active')).observeCount();
  }

  /**
   * 获取各角色用户统计
   */
  static async getRoleStats(): Promise<Record<UserRole, number>> {
    const adminCount = await database
      .get<User>('users')
      .query(Q.where('role', 'admin'))
      .fetchCount();

    const premiumCount = await database
      .get<User>('users')
      .query(Q.where('role', 'premium'))
      .fetchCount();

    const userCount = await database.get<User>('users').query(Q.where('role', 'user')).fetchCount();

    const guestCount = await database
      .get<User>('users')
      .query(Q.where('role', 'guest'))
      .fetchCount();

    return {
      admin: adminCount,
      premium: premiumCount,
      user: userCount,
      guest: guestCount,
    };
  }

  /**
   * 获取最近注册的用户
   */
  static async getRecentUsers(limit: number = 10): Promise<User[]> {
    return await database
      .get<User>('users')
      .query(Q.sortBy('created_at', 'desc'), Q.take(limit))
      .fetch();
  }

  /**
   * 获取最近活跃的用户
   */
  static async getRecentlyActiveUsers(limit: number = 10): Promise<User[]> {
    return await database
      .get<User>('users')
      .query(
        Q.where('last_login_at', Q.notEq(null)),
        Q.sortBy('last_login_at', 'desc'),
        Q.take(limit),
      )
      .fetch();
  }
}
