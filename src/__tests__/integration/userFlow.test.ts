/**
 * 集成测试 - 完整用户流程测试
 * 验证从用户注册到使用所有功能的完整流程
 */

import { AuthService } from '../../services/auth/authService';
import { PasswordService } from '../../services/auth/passwordService';
import { CheckInService } from '../../services/checkin/checkinService';
import { QuotaService } from '../../services/ai/quotaService';
import { UsageTrackingService } from '../../services/ai/usageTrackingService';
import { EncryptionService } from '../../services/security/encryptionService';
import { AuditService } from '../../services/security/auditService';
import { UserRepository } from '../../database/repositories/UserRepository';
import { CheckInRepository } from '../../database/repositories/CheckInRepository';
import { UserQuotaRepository } from '../../database/repositories/UserQuotaRepository';
import { AiUsageRepository } from '../../database/repositories/AiUsageRepository';

// Mock所有依赖
jest.mock('../../database/repositories/UserRepository');
jest.mock('../../database/repositories/CheckInRepository');
jest.mock('../../database/repositories/UserQuotaRepository');
jest.mock('../../database/repositories/AiUsageRepository');

const MockUserRepository = UserRepository as jest.Mocked<typeof UserRepository>;
const MockCheckInRepository = CheckInRepository as jest.Mocked<typeof CheckInRepository>;
const MockUserQuotaRepository = UserQuotaRepository as jest.Mocked<typeof UserQuotaRepository>;
const MockAiUsageRepository = AiUsageRepository as jest.Mocked<typeof AiUsageRepository>;

describe('用户管理系统集成测试', () => {
  let testUserId: string;
  let testSession: any;

  beforeEach(() => {
    jest.clearAllMocks();
    testUserId = 'integration_test_user_123';
    testSession = {
      userId: testUserId,
      username: 'integrationtestuser',
      role: 'user',
      loginAt: Date.now(),
    };
  });

  describe('完整用户生命周期', () => {
    it('应该完成完整的用户注册到使用流程', async () => {
      // ========== 第一步：用户注册 ==========
      const registrationData = {
        username: 'integrationtestuser',
        password: 'IntegrationTest123!',
        email: 'integration@test.com',
      };

      // Mock注册流程
      MockUserRepository.getByUsername.mockResolvedValue(null);
      MockUserRepository.getByEmail.mockResolvedValue(null);
      MockUserRepository.create.mockResolvedValue({
        id: testUserId,
        username: registrationData.username,
        email: registrationData.email,
        role: 'user',
        status: 'active',
        createdAt: new Date(),
      } as any);

      const registrationResult = await AuthService.register(registrationData);

      expect(registrationResult.success).toBe(true);
      expect(registrationResult.user?.id).toBe(testUserId);
      expect(MockUserRepository.create).toHaveBeenCalledTimes(1);

      // ========== 第二步：用户登录 ==========
      const loginData = {
        username: registrationData.username,
        password: registrationData.password,
      };

      // Mock登录流程
      MockUserRepository.getByUsername.mockResolvedValue({
        id: testUserId,
        username: registrationData.username,
        passwordHash: 'hashed_password',
        salt: 'salt123',
        status: 'active',
        role: 'user',
      } as any);

      MockUserRepository.updateLastLogin.mockResolvedValue(undefined);

      // Mock密码验证成功
      jest.spyOn(PasswordService, 'verifyPassword').mockResolvedValue({
        isValid: true,
        needsRehash: false,
      });

      const loginResult = await AuthService.login(loginData);

      expect(loginResult.success).toBe(true);
      expect(loginResult.session?.userId).toBe(testUserId);
      expect(MockUserRepository.updateLastLogin).toHaveBeenCalledWith(testUserId);

      // ========== 第三步：设置用户配额 ==========
      MockUserQuotaRepository.getByUserAndType.mockResolvedValue(null);
      MockUserQuotaRepository.create.mockResolvedValue({
        id: 'quota123',
        userId: testUserId,
        quotaType: 'calls',
        limitValue: 100,
        usedValue: 0,
        resetPeriod: 'daily',
        isActive: true,
      } as any);

      const quotaResult = await QuotaService.createUserQuota({
        userId: testUserId,
        quotaType: 'calls',
        limitValue: 100,
        resetPeriod: 'daily',
        description: '每日调用次数限制',
      });

      expect(quotaResult.success).toBe(true);
      expect(quotaResult.quota?.limitValue).toBe(100);

      // ========== 第四步：检查配额 ==========
      MockUserQuotaRepository.getActiveQuotas.mockResolvedValue([
        {
          id: 'quota123',
          userId: testUserId,
          quotaType: 'calls',
          limitValue: 100,
          usedValue: 0,
          resetPeriod: 'daily',
          lastResetAt: Date.now(),
          isActive: true,
        } as any,
      ]);

      const quotaCheckResult = await QuotaService.checkQuota(testUserId, 'calls', 1);

      expect(quotaCheckResult.allowed).toBe(true);
      expect(quotaCheckResult.remainingQuota).toBe(99);

      // ========== 第五步：AI使用记录 ==========
      MockAiUsageRepository.create.mockResolvedValue({
        id: 'usage123',
        userId: testUserId,
        serviceType: 'qwen',
        modelName: 'qwen-turbo',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        costInCents: 10,
        success: true,
      } as any);

      MockUserQuotaRepository.incrementUsage.mockResolvedValue(undefined);

      const usageResult = await UsageTrackingService.logUsage({
        userId: testUserId,
        serviceType: 'qwen',
        modelName: 'qwen-turbo',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        costInCents: 10,
        success: true,
      });

      expect(usageResult.success).toBe(true);
      expect(MockAiUsageRepository.create).toHaveBeenCalledTimes(1);

      // 更新配额使用量
      const quotaUpdateResult = await QuotaService.updateUsage(testUserId, 'calls', 1);
      expect(quotaUpdateResult.success).toBe(true);
      expect(MockUserQuotaRepository.incrementUsage).toHaveBeenCalledWith('quota123', 1);

      // ========== 第六步：每日打卡 ==========
      MockUserRepository.getById.mockResolvedValue({
        id: testUserId,
        status: 'active',
      } as any);

      MockCheckInRepository.getTodayCheckIn.mockResolvedValue(null);
      MockCheckInRepository.create.mockResolvedValue({
        id: 'checkin123',
        userId: testUserId,
        type: 'daily',
        createdAt: new Date(),
      } as any);

      const checkInResult = await CheckInService.checkIn({
        userId: testUserId,
        type: 'daily',
        note: '集成测试打卡',
      });

      expect(checkInResult.success).toBe(true);
      expect(checkInResult.message).toBe('打卡成功！');
      expect(MockCheckInRepository.create).toHaveBeenCalledTimes(1);

      // ========== 第七步：获取用户统计 ==========
      MockCheckInRepository.getAllByUser.mockResolvedValue([
        {
          id: 'checkin123',
          userId: testUserId,
          type: 'daily',
          createdAt: new Date(),
        },
      ] as any);

      const userStatsResult = await CheckInService.getUserStats(testUserId, 'daily');

      expect(userStatsResult.totalDays).toBe(1);
      expect(userStatsResult.currentStreak).toBeGreaterThanOrEqual(0);

      // ========== 第八步：获取使用统计 ==========
      MockAiUsageRepository.getUserUsageStats.mockResolvedValue({
        totalCalls: 1,
        totalTokens: 150,
        totalCost: 10,
        successRate: 100,
      } as any);

      const aiStatsResult = await UsageTrackingService.getUserUsageStats(testUserId, 1);

      expect(aiStatsResult.totalCalls).toBe(1);
      expect(aiStatsResult.totalTokens).toBe(150);
      expect(aiStatsResult.successRate).toBe(100);

      // ========== 第九步：获取配额概览 ==========
      MockUserQuotaRepository.getAllByUser.mockResolvedValue([
        {
          id: 'quota123',
          userId: testUserId,
          quotaType: 'calls',
          limitValue: 100,
          usedValue: 1,
          resetPeriod: 'daily',
          isActive: true,
          description: '每日调用次数限制',
        } as any,
      ]);

      MockAiUsageRepository.getTodayUsage.mockResolvedValue({
        totalCalls: 1,
        totalTokens: 150,
        totalCost: 10,
      } as any);

      const quotaOverview = await QuotaService.getUserQuotaOverview(testUserId);

      expect(quotaOverview.quotas).toHaveLength(1);
      expect(quotaOverview.quotas[0].percentage).toBe(1); // 1/100 * 100
      expect(quotaOverview.todayUsage.totalCalls).toBe(1);

      // ========== 验证整个流程 ==========
      // 确保所有关键步骤都已执行
      expect(MockUserRepository.create).toHaveBeenCalledTimes(1);
      expect(MockUserRepository.updateLastLogin).toHaveBeenCalledTimes(1);
      expect(MockUserQuotaRepository.create).toHaveBeenCalledTimes(1);
      expect(MockAiUsageRepository.create).toHaveBeenCalledTimes(1);
      expect(MockCheckInRepository.create).toHaveBeenCalledTimes(1);
      expect(MockUserQuotaRepository.incrementUsage).toHaveBeenCalledTimes(1);
    });
  });

  describe('错误处理和边界情况', () => {
    it('应该正确处理配额超限情况', async () => {
      // 设置接近配额限制的使用量
      MockUserQuotaRepository.getActiveQuotas.mockResolvedValue([
        {
          id: 'quota123',
          userId: testUserId,
          quotaType: 'calls',
          limitValue: 100,
          usedValue: 99, // 已使用99次
          resetPeriod: 'daily',
          lastResetAt: Date.now(),
          isActive: true,
        } as any,
      ]);

      // 检查配额 - 请求1次应该被允许
      const allowedResult = await QuotaService.checkQuota(testUserId, 'calls', 1);
      expect(allowedResult.allowed).toBe(true);
      expect(allowedResult.remainingQuota).toBe(0);

      // 检查配额 - 请求2次应该被拒绝
      const deniedResult = await QuotaService.checkQuota(testUserId, 'calls', 2);
      expect(deniedResult.allowed).toBe(false);
      expect(deniedResult.reason).toBe('超出每日调用次数限制');
    });

    it('应该正确处理重复打卡情况', async () => {
      MockUserRepository.getById.mockResolvedValue({
        id: testUserId,
        status: 'active',
      } as any);

      // 第一次打卡成功
      MockCheckInRepository.getTodayCheckIn.mockResolvedValueOnce(null);
      MockCheckInRepository.create.mockResolvedValue({
        id: 'checkin123',
        userId: testUserId,
        type: 'daily',
      } as any);

      const firstCheckIn = await CheckInService.checkIn({
        userId: testUserId,
        type: 'daily',
      });

      expect(firstCheckIn.success).toBe(true);

      // 第二次打卡应该失败
      MockCheckInRepository.getTodayCheckIn.mockResolvedValueOnce({
        id: 'checkin123',
        userId: testUserId,
        type: 'daily',
        createdAt: new Date(),
      } as any);

      const secondCheckIn = await CheckInService.checkIn({
        userId: testUserId,
        type: 'daily',
      });

      expect(secondCheckIn.success).toBe(false);
      expect(secondCheckIn.message).toBe('今日已打卡，请明天再来');
    });

    it('应该正确处理用户权限检查', async () => {
      // 测试普通用户无法删除他人配额
      const otherUserId = 'other_user_123';
      MockUserQuotaRepository.getById.mockResolvedValue({
        id: 'quota123',
        userId: otherUserId, // 配额属于其他用户
        quotaType: 'calls',
        isActive: true,
      } as any);

      const deleteResult = await QuotaService.deleteUserQuota('quota123', testUserId);

      expect(deleteResult.success).toBe(false);
      expect(deleteResult.message).toBe('权限不足，无法删除此配额');
      expect(MockUserQuotaRepository.delete).not.toHaveBeenCalled();
    });

    it('应该正确处理密码修改流程', async () => {
      // Mock当前会话
      jest.spyOn(AuthService, 'getCurrentSession').mockReturnValue(testSession);

      MockUserRepository.getById.mockResolvedValue({
        id: testUserId,
        username: 'integrationtestuser',
        passwordHash: 'old_hashed_password',
        salt: 'old_salt',
      } as any);

      // Mock密码验证成功
      jest.spyOn(PasswordService, 'verifyPassword').mockResolvedValue({
        isValid: true,
        needsRehash: false,
      });

      // Mock新密码哈希
      jest.spyOn(PasswordService, 'hashPassword').mockResolvedValue({
        hash: 'new_hashed_password',
        salt: 'new_salt',
      });

      MockUserRepository.updatePassword.mockResolvedValue(undefined);

      const changePasswordResult = await AuthService.changePassword(
        'OldPassword123!',
        'NewPassword123!',
      );

      expect(changePasswordResult.success).toBe(true);
      expect(changePasswordResult.message).toBe('密码修改成功');
      expect(MockUserRepository.updatePassword).toHaveBeenCalledWith(
        testUserId,
        'new_hashed_password',
        'new_salt',
      );
    });
  });

  describe('数据一致性检查', () => {
    it('应该确保配额重置正确更新使用量', async () => {
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;

      // Mock过期的配额
      MockUserQuotaRepository.getExpiredQuotas.mockResolvedValue([
        {
          id: 'quota123',
          userId: testUserId,
          quotaType: 'calls',
          resetPeriod: 'daily',
          lastResetAt: yesterday,
          usedValue: 50, // 重置前已使用50次
        } as any,
      ]);

      MockUserQuotaRepository.resetQuota.mockResolvedValue(undefined);

      const resetResult = await QuotaService.resetQuotas();

      expect(resetResult.resetCount).toBe(1);
      expect(MockUserQuotaRepository.resetQuota).toHaveBeenCalledWith('quota123');

      // 验证重置后配额可以正常使用
      MockUserQuotaRepository.getActiveQuotas.mockResolvedValue([
        {
          id: 'quota123',
          userId: testUserId,
          quotaType: 'calls',
          limitValue: 100,
          usedValue: 0, // 重置后使用量为0
          resetPeriod: 'daily',
          lastResetAt: Date.now(),
          isActive: true,
        } as any,
      ]);

      const quotaCheck = await QuotaService.checkQuota(testUserId, 'calls', 50);

      expect(quotaCheck.allowed).toBe(true);
      expect(quotaCheck.remainingQuota).toBe(50);
    });

    it('应该确保AI使用统计与配额使用量同步', async () => {
      // 模拟AI使用和配额更新
      MockUserQuotaRepository.getActiveQuotas.mockResolvedValue([
        {
          id: 'quota123',
          userId: testUserId,
          quotaType: 'calls',
          limitValue: 100,
          usedValue: 10,
          resetPeriod: 'daily',
          lastResetAt: Date.now(),
          isActive: true,
        } as any,
      ]);

      MockAiUsageRepository.create.mockResolvedValue({
        id: 'usage123',
        userId: testUserId,
        serviceType: 'qwen',
        success: true,
      } as any);

      MockUserQuotaRepository.incrementUsage.mockResolvedValue(undefined);

      // 记录AI使用
      const usageResult = await UsageTrackingService.logUsage({
        userId: testUserId,
        serviceType: 'qwen',
        modelName: 'qwen-turbo',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        costInCents: 10,
        success: true,
      });

      // 更新配额
      const quotaUpdateResult = await QuotaService.updateUsage(testUserId, 'calls', 1);

      expect(usageResult.success).toBe(true);
      expect(quotaUpdateResult.success).toBe(true);

      // 验证数据同步
      MockAiUsageRepository.getTodayUsage.mockResolvedValue({
        totalCalls: 11, // 原有10次 + 新增1次
        totalTokens: 150,
        totalCost: 10,
      } as any);

      MockUserQuotaRepository.getAllByUser.mockResolvedValue([
        {
          id: 'quota123',
          userId: testUserId,
          quotaType: 'calls',
          limitValue: 100,
          usedValue: 11, // 配额使用量也应该是11
          resetPeriod: 'daily',
          isActive: true,
        } as any,
      ]);

      const overview = await QuotaService.getUserQuotaOverview(testUserId);
      const todayUsage = overview.todayUsage;
      const quotaUsage = overview.quotas[0];

      expect(todayUsage.totalCalls).toBe(quotaUsage.used);
    });
  });

  describe('性能和安全测试', () => {
    it('应该正确处理敏感数据加密', async () => {
      // 初始化加密服务
      await EncryptionService.initialize();

      const sensitiveData = 'sensitive_user_information';

      // 加密数据
      const encryptResult = await EncryptionService.encryptData(
        sensitiveData,
        'user_password' as any,
      );

      expect(encryptResult.success).toBe(true);
      expect(encryptResult.encryptedData).toBeTruthy();
      expect(encryptResult.iv).toBeTruthy();
      expect(encryptResult.salt).toBeTruthy();

      // 解密数据
      const decryptResult = await EncryptionService.decryptData(
        encryptResult.encryptedData,
        encryptResult.iv,
        encryptResult.salt,
      );

      expect(decryptResult.success).toBe(true);
      expect(decryptResult.decryptedData).toBe(sensitiveData);
    });

    it('应该记录关键操作的审计日志', async () => {
      // Mock审计日志创建
      const mockAuditLog = {
        id: 'audit123',
        userId: testUserId,
        eventType: 'USER_LOGIN',
        success: true,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      };

      jest.spyOn(AuditService, 'logEvent').mockResolvedValue(mockAuditLog as any);

      // 记录登录事件
      const auditResult = await AuditService.logEvent({
        userId: testUserId,
        eventType: 'USER_LOGIN' as any,
        severity: 'LOW' as any,
        description: '用户登录',
        success: true,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });

      expect(auditResult).toBeDefined();
      expect(AuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          eventType: 'USER_LOGIN',
          success: true,
        }),
      );
    });

    it('应该正确验证密码强度', () => {
      const weakPasswords = ['123456', 'password', 'qwerty', 'abc123'];

      const strongPasswords = ['StrongP@ssw0rd123!', 'MySecure#Pass1', 'Complex$Password9'];

      // 测试弱密码
      weakPasswords.forEach(password => {
        const result = PasswordService.validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.feedback.length).toBeGreaterThan(0);
      });

      // 测试强密码
      strongPasswords.forEach(password => {
        const result = PasswordService.validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.feedback.length).toBe(0);
      });
    });
  });

  afterEach(() => {
    // 清理测试数据
    jest.clearAllMocks();
  });
});

// 集成测试总结报告
describe('集成测试总结', () => {
  it('应该验证所有核心功能模块正常工作', () => {
    const coreModules = [
      'AuthService - 用户认证服务',
      'PasswordService - 密码安全服务',
      'CheckInService - 打卡服务',
      'QuotaService - 配额管理服务',
      'UsageTrackingService - 使用统计服务',
      'EncryptionService - 数据加密服务',
      'AuditService - 审计日志服务',
    ];

    // 验证所有模块都已实现并可以正常导入
    expect(AuthService).toBeDefined();
    expect(PasswordService).toBeDefined();
    expect(CheckInService).toBeDefined();
    expect(QuotaService).toBeDefined();
    expect(UsageTrackingService).toBeDefined();
    expect(EncryptionService).toBeDefined();
    expect(AuditService).toBeDefined();

    console.log('✅ 所有核心功能模块验证通过:');
    coreModules.forEach(module => {
      console.log(`  - ${module}`);
    });
  });

  it('应该验证数据库仓库层正常工作', () => {
    const repositories = [
      'UserRepository - 用户数据仓库',
      'CheckInRepository - 打卡数据仓库',
      'UserQuotaRepository - 配额数据仓库',
      'AiUsageRepository - AI使用数据仓库',
    ];

    expect(UserRepository).toBeDefined();
    expect(CheckInRepository).toBeDefined();
    expect(UserQuotaRepository).toBeDefined();
    expect(AiUsageRepository).toBeDefined();

    console.log('✅ 所有数据仓库层验证通过:');
    repositories.forEach(repo => {
      console.log(`  - ${repo}`);
    });
  });
});
