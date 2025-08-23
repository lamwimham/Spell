/**
 * 认证服务单元测试
 * 测试用户注册、登录、密码验证等核心功能
 */

import { AuthService } from '../../services/auth/authService';
import { PasswordService } from '../../services/auth/passwordService';
import { UserRepository } from '../../database/repositories/UserRepository';

// Mock数据库仓库
jest.mock('../../database/repositories/UserRepository');
const MockUserRepository = UserRepository as jest.Mocked<typeof UserRepository>;

describe('AuthService', () => {
  beforeEach(() => {
    // 清除所有mock调用记录
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('应该成功注册新用户', async () => {
      // 准备测试数据
      const userData = {
        username: 'testuser',
        password: 'TestPassword123!',
        email: 'test@example.com',
      };

      // Mock仓库方法
      MockUserRepository.getByUsername.mockResolvedValue(null);
      MockUserRepository.getByEmail.mockResolvedValue(null);
      MockUserRepository.create.mockResolvedValue({
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
      } as any);

      // 执行测试
      const result = await AuthService.register(userData);

      // 验证结果
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.username).toBe('testuser');
      expect(MockUserRepository.create).toHaveBeenCalledTimes(1);
    });

    it('应该拒绝重复的用户名', async () => {
      // 准备测试数据
      const userData = {
        username: 'existinguser',
        password: 'TestPassword123!',
        email: 'test@example.com',
      };

      // Mock现有用户
      MockUserRepository.getByUsername.mockResolvedValue({
        id: 'existing123',
        username: 'existinguser',
      } as any);

      // 执行测试
      const result = await AuthService.register(userData);

      // 验证结果
      expect(result.success).toBe(false);
      expect(result.message).toContain('用户名已存在');
      expect(MockUserRepository.create).not.toHaveBeenCalled();
    });

    it('应该拒绝弱密码', async () => {
      // 准备测试数据
      const userData = {
        username: 'testuser',
        password: '123', // 弱密码
        email: 'test@example.com',
      };

      // 执行测试
      const result = await AuthService.register(userData);

      // 验证结果
      expect(result.success).toBe(false);
      expect(result.message).toContain('密码强度不足');
      expect(MockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('应该成功登录有效用户', async () => {
      // 准备测试数据
      const credentials = {
        username: 'testuser',
        password: 'TestPassword123!',
      };

      const mockUser = {
        id: 'user123',
        username: 'testuser',
        passwordHash: 'hashedpassword',
        salt: 'salt123',
        role: 'user',
        status: 'active',
      };

      // Mock仓库方法
      MockUserRepository.getByUsername.mockResolvedValue(mockUser as any);
      MockUserRepository.updateLastLogin.mockResolvedValue(undefined);

      // Mock密码验证
      jest.spyOn(PasswordService, 'verifyPassword').mockResolvedValue({
        isValid: true,
        needsRehash: false,
      });

      // 执行测试
      const result = await AuthService.login(credentials);

      // 验证结果
      expect(result.success).toBe(true);
      expect(result.session).toBeDefined();
      expect(result.session?.userId).toBe('user123');
      expect(MockUserRepository.updateLastLogin).toHaveBeenCalledWith('user123');
    });

    it('应该拒绝无效密码', async () => {
      // 准备测试数据
      const credentials = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      const mockUser = {
        id: 'user123',
        username: 'testuser',
        passwordHash: 'hashedpassword',
        salt: 'salt123',
        status: 'active',
      };

      // Mock仓库方法
      MockUserRepository.getByUsername.mockResolvedValue(mockUser as any);

      // Mock密码验证失败
      jest.spyOn(PasswordService, 'verifyPassword').mockResolvedValue({
        isValid: false,
        needsRehash: false,
      });

      // 执行测试
      const result = await AuthService.login(credentials);

      // 验证结果
      expect(result.success).toBe(false);
      expect(result.message).toBe('用户名或密码错误');
      expect(result.session).toBeUndefined();
    });

    it('应该拒绝暂停的用户', async () => {
      // 准备测试数据
      const credentials = {
        username: 'suspendeduser',
        password: 'TestPassword123!',
      };

      const mockUser = {
        id: 'user123',
        username: 'suspendeduser',
        passwordHash: 'hashedpassword',
        salt: 'salt123',
        status: 'suspended',
      };

      // Mock仓库方法
      MockUserRepository.getByUsername.mockResolvedValue(mockUser as any);

      // 执行测试
      const result = await AuthService.login(credentials);

      // 验证结果
      expect(result.success).toBe(false);
      expect(result.message).toBe('账户已被暂停');
      expect(result.session).toBeUndefined();
    });

    it('应该拒绝不存在的用户', async () => {
      // 准备测试数据
      const credentials = {
        username: 'nonexistentuser',
        password: 'TestPassword123!',
      };

      // Mock仓库方法返回null
      MockUserRepository.getByUsername.mockResolvedValue(null);

      // 执行测试
      const result = await AuthService.login(credentials);

      // 验证结果
      expect(result.success).toBe(false);
      expect(result.message).toBe('用户名或密码错误');
      expect(result.session).toBeUndefined();
    });
  });

  describe('changePassword', () => {
    it('应该成功修改密码', async () => {
      // 准备测试数据
      const currentPassword = 'OldPassword123!';
      const newPassword = 'NewPassword123!';

      const mockUser = {
        id: 'user123',
        username: 'testuser',
        passwordHash: 'oldhashedpassword',
        salt: 'salt123',
      };

      // Mock当前会话
      jest.spyOn(AuthService, 'getCurrentSession').mockReturnValue({
        userId: 'user123',
        username: 'testuser',
        role: 'user',
        loginAt: Date.now(),
      });

      // Mock仓库方法
      MockUserRepository.getById.mockResolvedValue(mockUser as any);
      MockUserRepository.updatePassword.mockResolvedValue(undefined);

      // Mock密码验证
      jest.spyOn(PasswordService, 'verifyPassword').mockResolvedValue({
        isValid: true,
        needsRehash: false,
      });

      // Mock密码哈希
      jest.spyOn(PasswordService, 'hashPassword').mockResolvedValue({
        hash: 'newhashedpassword',
        salt: 'newsalt123',
      });

      // 执行测试
      const result = await AuthService.changePassword(currentPassword, newPassword);

      // 验证结果
      expect(result.success).toBe(true);
      expect(result.message).toBe('密码修改成功');
      expect(MockUserRepository.updatePassword).toHaveBeenCalledWith(
        'user123',
        'newhashedpassword',
        'newsalt123',
      );
    });

    it('应该拒绝错误的当前密码', async () => {
      // 准备测试数据
      const currentPassword = 'WrongPassword123!';
      const newPassword = 'NewPassword123!';

      const mockUser = {
        id: 'user123',
        username: 'testuser',
        passwordHash: 'hashedpassword',
        salt: 'salt123',
      };

      // Mock当前会话
      jest.spyOn(AuthService, 'getCurrentSession').mockReturnValue({
        userId: 'user123',
        username: 'testuser',
        role: 'user',
        loginAt: Date.now(),
      });

      // Mock仓库方法
      MockUserRepository.getById.mockResolvedValue(mockUser as any);

      // Mock密码验证失败
      jest.spyOn(PasswordService, 'verifyPassword').mockResolvedValue({
        isValid: false,
        needsRehash: false,
      });

      // 执行测试
      const result = await AuthService.changePassword(currentPassword, newPassword);

      // 验证结果
      expect(result.success).toBe(false);
      expect(result.message).toBe('当前密码错误');
      expect(MockUserRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('应该拒绝未登录用户', async () => {
      // Mock未登录状态
      jest.spyOn(AuthService, 'getCurrentSession').mockReturnValue(null);

      // 执行测试
      const result = await AuthService.changePassword('old', 'new');

      // 验证结果
      expect(result.success).toBe(false);
      expect(result.message).toBe('用户未登录');
      expect(MockUserRepository.updatePassword).not.toHaveBeenCalled();
    });
  });

  describe('validateSession', () => {
    it('应该验证有效会话', () => {
      // 准备测试数据
      const validSession = {
        userId: 'user123',
        username: 'testuser',
        role: 'user',
        loginAt: Date.now() - 1000 * 60 * 30, // 30分钟前
      };

      // 执行测试
      const result = AuthService.validateSession(validSession);

      // 验证结果
      expect(result.isValid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('应该拒绝过期会话', () => {
      // 准备测试数据
      const expiredSession = {
        userId: 'user123',
        username: 'testuser',
        role: 'user',
        loginAt: Date.now() - 1000 * 60 * 60 * 25, // 25小时前
      };

      // 执行测试
      const result = AuthService.validateSession(expiredSession);

      // 验证结果
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('会话已过期');
    });

    it('应该拒绝无效会话数据', () => {
      // 准备测试数据
      const invalidSession = {
        userId: '',
        username: 'testuser',
        role: 'user',
        loginAt: Date.now(),
      };

      // 执行测试
      const result = AuthService.validateSession(invalidSession);

      // 验证结果
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('会话数据无效');
    });
  });
});
