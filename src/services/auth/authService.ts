/**
 * 认证服务 - 用户注册、登录、注销的核心业务逻辑
 * 集成密码安全、会话管理和用户状态控制
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRepository, UserData } from '../../database/repositories/UserRepository';
import { UserQuotaRepository } from '../../database/repositories/UserQuotaRepository';
import { PasswordService } from './passwordService';
import User, { UserStatus, UserRole } from '../../database/models/User';

// 认证结果接口
export interface AuthResult {
  success: boolean;
  user?: User;
  message: string;
  errorCode?: string;
}

// 注册数据接口
export interface RegisterData {
  username: string;
  email?: string;
  password: string;
  confirmPassword: string;
  role?: UserRole;
}

// 登录数据接口
export interface LoginData {
  username: string;
  password: string;
  rememberMe?: boolean;
}

// 会话信息接口
export interface SessionInfo {
  userId: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  loginTime: number;
  expiresAt: number;
}

// 错误代码枚举
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_SUSPENDED = 'USER_SUSPENDED',
  USERNAME_EXISTS = 'USERNAME_EXISTS',
  EMAIL_EXISTS = 'EMAIL_EXISTS',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  PASSWORD_MISMATCH = 'PASSWORD_MISMATCH',
  INVALID_INPUT = 'INVALID_INPUT',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

export class AuthService {
  // 存储键常量
  private static readonly SESSION_KEY = 'user_session';
  private static readonly REMEMBER_TOKEN_KEY = 'remember_token';
  private static readonly LAST_LOGIN_KEY = 'last_login_user';

  // 会话过期时间（7天）
  private static readonly SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

  /**
   * 用户注册
   */
  static async register(data: RegisterData): Promise<AuthResult> {
    try {
      // 验证输入数据
      const validation = this.validateRegisterData(data);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message,
          errorCode: validation.errorCode,
        };
      }

      // 检查用户名是否已存在
      const usernameExists = await UserRepository.isUsernameExists(data.username);
      if (usernameExists) {
        return {
          success: false,
          message: '用户名已存在，请选择其他用户名',
          errorCode: AuthErrorCode.USERNAME_EXISTS,
        };
      }

      // 检查邮箱是否已存在（如果提供了邮箱）
      if (data.email) {
        const emailExists = await UserRepository.isEmailExists(data.email);
        if (emailExists) {
          return {
            success: false,
            message: '邮箱已被注册，请使用其他邮箱',
            errorCode: AuthErrorCode.EMAIL_EXISTS,
          };
        }
      }

      // 加密密码
      const { hash } = PasswordService.hashPassword(data.password);

      // 创建用户数据
      const userData: UserData = {
        username: data.username,
        email: data.email,
        passwordHash: hash,
        status: 'active',
        role: data.role || 'user',
      };

      // 创建用户
      const user = await UserRepository.create(userData);

      // 初始化用户配额
      await UserQuotaRepository.initializeUserQuotas(user.id, user.role);

      // 自动登录
      const sessionInfo = await this.createSession(user);
      await this.saveSession(sessionInfo);

      return {
        success: true,
        user,
        message: '注册成功，欢迎使用Spell！',
      };
    } catch (error) {
      console.error('注册失败:', error);
      return {
        success: false,
        message: '注册失败，请稍后重试',
        errorCode: 'REGISTRATION_ERROR',
      };
    }
  }

  /**
   * 用户登录
   */
  static async login(data: LoginData): Promise<AuthResult> {
    try {
      // 验证输入数据
      if (!data.username || !data.password) {
        return {
          success: false,
          message: '请输入用户名和密码',
          errorCode: AuthErrorCode.INVALID_INPUT,
        };
      }

      // 查找用户
      const user = await UserRepository.getByUsername(data.username);
      if (!user) {
        return {
          success: false,
          message: '用户名或密码错误',
          errorCode: AuthErrorCode.INVALID_CREDENTIALS,
        };
      }

      // 检查用户状态
      if (user.status === 'suspended') {
        return {
          success: false,
          message: '账户已被暂停，请联系管理员',
          errorCode: AuthErrorCode.USER_SUSPENDED,
        };
      }

      // 验证密码
      const isPasswordValid = PasswordService.verifyPassword(data.password, user.passwordHash);
      if (!isPasswordValid) {
        return {
          success: false,
          message: '用户名或密码错误',
          errorCode: AuthErrorCode.INVALID_CREDENTIALS,
        };
      }

      // 更新最后登录时间
      await UserRepository.updateLastLogin(user.id);

      // 创建会话
      const sessionInfo = await this.createSession(user);
      await this.saveSession(sessionInfo);

      // 保存记住我选项
      if (data.rememberMe) {
        await this.saveRememberToken(user.id);
      }

      // 保存最后登录用户
      await AsyncStorage.setItem(this.LAST_LOGIN_KEY, data.username);

      return {
        success: true,
        user,
        message: '登录成功！',
      };
    } catch (error) {
      console.error('登录失败:', error);
      return {
        success: false,
        message: '登录失败，请稍后重试',
        errorCode: 'LOGIN_ERROR',
      };
    }
  }

  /**
   * 用户注销
   */
  static async logout(): Promise<void> {
    try {
      // 清除会话信息
      await AsyncStorage.multiRemove([this.SESSION_KEY, this.REMEMBER_TOKEN_KEY]);

      console.log('用户已成功注销');
    } catch (error) {
      console.error('注销失败:', error);
    }
  }

  /**
   * 检查当前会话是否有效
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const session = await this.getCurrentSession();
      return session !== null;
    } catch (error) {
      console.error('检查认证状态失败:', error);
      return false;
    }
  }

  /**
   * 获取当前会话信息
   */
  static async getCurrentSession(): Promise<SessionInfo | null> {
    try {
      const sessionData = await AsyncStorage.getItem(this.SESSION_KEY);
      if (!sessionData) {
        return null;
      }

      const session: SessionInfo = JSON.parse(sessionData);

      // 检查会话是否过期
      if (Date.now() > session.expiresAt) {
        await this.logout();
        return null;
      }

      return session;
    } catch (error) {
      console.error('获取会话信息失败:', error);
      return null;
    }
  }

  /**
   * 获取当前用户
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const session = await this.getCurrentSession();
      if (!session) {
        return null;
      }

      return await UserRepository.getById(session.userId);
    } catch (error) {
      console.error('获取当前用户失败:', error);
      return null;
    }
  }

  /**
   * 刷新会话（延长过期时间）
   */
  static async refreshSession(): Promise<boolean> {
    try {
      const session = await this.getCurrentSession();
      if (!session) {
        return false;
      }

      // 延长会话时间
      session.expiresAt = Date.now() + this.SESSION_DURATION;
      await this.saveSession(session);

      return true;
    } catch (error) {
      console.error('刷新会话失败:', error);
      return false;
    }
  }

  /**
   * 检查用户权限
   */
  static async hasPermission(permission: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return false;
      }

      return user.hasPermission(permission);
    } catch (error) {
      console.error('权限检查失败:', error);
      return false;
    }
  }

  /**
   * 获取最后登录的用户名
   */
  static async getLastLoginUsername(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.LAST_LOGIN_KEY);
    } catch (error) {
      console.error('获取最后登录用户失败:', error);
      return null;
    }
  }

  /**
   * 修改密码
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<AuthResult> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return {
          success: false,
          message: '用户未登录',
          errorCode: AuthErrorCode.UNAUTHORIZED,
        };
      }

      // 验证当前密码
      const isCurrentPasswordValid = PasswordService.verifyPassword(
        currentPassword,
        user.passwordHash,
      );

      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: '当前密码错误',
          errorCode: AuthErrorCode.INVALID_CREDENTIALS,
        };
      }

      // 验证新密码强度
      const passwordValidation = PasswordService.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.feedback.join('；'),
          errorCode: AuthErrorCode.WEAK_PASSWORD,
        };
      }

      // 加密新密码
      const { hash } = PasswordService.hashPassword(newPassword);

      // 更新密码
      await UserRepository.update(user.id, { passwordHash: hash });

      return {
        success: true,
        message: '密码修改成功',
      };
    } catch (error) {
      console.error('修改密码失败:', error);
      return {
        success: false,
        message: '修改密码失败，请稍后重试',
      };
    }
  }

  /**
   * 创建会话信息
   */
  private static async createSession(user: User): Promise<SessionInfo> {
    return {
      userId: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
      loginTime: Date.now(),
      expiresAt: Date.now() + this.SESSION_DURATION,
    };
  }

  /**
   * 保存会话信息
   */
  private static async saveSession(session: SessionInfo): Promise<void> {
    await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
  }

  /**
   * 保存记住我令牌
   */
  private static async saveRememberToken(userId: string): Promise<void> {
    const token = {
      userId,
      createdAt: Date.now(),
    };
    await AsyncStorage.setItem(this.REMEMBER_TOKEN_KEY, JSON.stringify(token));
  }

  /**
   * 验证注册数据
   */
  private static validateRegisterData(data: RegisterData): {
    isValid: boolean;
    message: string;
    errorCode?: string;
  } {
    // 检查必填字段
    if (!data.username || !data.password || !data.confirmPassword) {
      return {
        isValid: false,
        message: '请填写所有必填字段',
        errorCode: AuthErrorCode.INVALID_INPUT,
      };
    }

    // 检查用户名格式
    if (data.username.length < 3 || data.username.length > 20) {
      return {
        isValid: false,
        message: '用户名长度应为3-20个字符',
        errorCode: AuthErrorCode.INVALID_INPUT,
      };
    }

    // 检查用户名格式（只允许字母、数字、下划线）
    if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
      return {
        isValid: false,
        message: '用户名只能包含字母、数字和下划线',
        errorCode: AuthErrorCode.INVALID_INPUT,
      };
    }

    // 检查邮箱格式（如果提供）
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return {
        isValid: false,
        message: '邮箱格式不正确',
        errorCode: AuthErrorCode.INVALID_INPUT,
      };
    }

    // 检查密码强度
    const passwordValidation = PasswordService.validatePassword(data.password);
    if (!passwordValidation.isValid) {
      return {
        isValid: false,
        message: passwordValidation.feedback.join('；'),
        errorCode: AuthErrorCode.WEAK_PASSWORD,
      };
    }

    // 检查密码确认
    if (data.password !== data.confirmPassword) {
      return {
        isValid: false,
        message: '两次输入的密码不一致',
        errorCode: AuthErrorCode.PASSWORD_MISMATCH,
      };
    }

    return {
      isValid: true,
      message: '验证通过',
    };
  }
}
