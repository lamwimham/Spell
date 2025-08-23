/**
 * 配额服务单元测试
 * 测试AI使用配额检查、重置和管理功能
 */

import { QuotaService } from '../../services/ai/quotaService';
import { UserQuotaRepository } from '../../database/repositories/UserQuotaRepository';
import { AiUsageRepository } from '../../database/repositories/AiUsageRepository';

// Mock数据库仓库
jest.mock('../../database/repositories/UserQuotaRepository');
jest.mock('../../database/repositories/AiUsageRepository');

const MockUserQuotaRepository = UserQuotaRepository as jest.Mocked<typeof UserQuotaRepository>;
const MockAiUsageRepository = AiUsageRepository as jest.Mocked<typeof AiUsageRepository>;

describe('QuotaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkQuota', () => {
    it('应该允许在配额范围内的使用', async () => {
      const userId = 'user123';
      const quotaType = 'calls';
      const requestAmount = 5;

      // Mock配额数据
      MockUserQuotaRepository.getActiveQuotas.mockResolvedValue([
        {
          id: 'quota1',
          userId,
          quotaType: 'calls',
          limitValue: 100,
          usedValue: 50,
          resetPeriod: 'daily',
          lastResetAt: Date.now(),
          isActive: true,
        } as any,
      ]);

      const result = await QuotaService.checkQuota(userId, quotaType, requestAmount);

      expect(result.allowed).toBe(true);
      expect(result.remainingQuota).toBe(45); // 100 - 50 - 5
      expect(result.reason).toBeUndefined();
    });

    it('应该拒绝超出配额的请求', async () => {
      const userId = 'user123';
      const quotaType = 'calls';
      const requestAmount = 60;

      // Mock配额数据 - 已使用50，限制100，请求60会超出
      MockUserQuotaRepository.getActiveQuotas.mockResolvedValue([
        {
          id: 'quota1',
          userId,
          quotaType: 'calls',
          limitValue: 100,
          usedValue: 50,
          resetPeriod: 'daily',
          lastResetAt: Date.now(),
          isActive: true,
        } as any,
      ]);

      const result = await QuotaService.checkQuota(userId, quotaType, requestAmount);

      expect(result.allowed).toBe(false);
      expect(result.remainingQuota).toBe(50); // 100 - 50
      expect(result.reason).toBe('超出每日调用次数限制');
    });

    it('应该在没有配额限制时允许使用', async () => {
      const userId = 'user123';
      const quotaType = 'calls';
      const requestAmount = 1000;

      // Mock没有配额数据
      MockUserQuotaRepository.getActiveQuotas.mockResolvedValue([]);

      const result = await QuotaService.checkQuota(userId, quotaType, requestAmount);

      expect(result.allowed).toBe(true);
      expect(result.remainingQuota).toBe(null);
      expect(result.reason).toBeUndefined();
    });

    it('应该处理多个配额类型', async () => {
      const userId = 'user123';
      const quotaType = 'tokens';
      const requestAmount = 2000;

      // Mock Token配额
      MockUserQuotaRepository.getActiveQuotas.mockResolvedValue([
        {
          id: 'quota1',
          userId,
          quotaType: 'tokens',
          limitValue: 10000,
          usedValue: 7000,
          resetPeriod: 'daily',
          lastResetAt: Date.now(),
          isActive: true,
        } as any,
      ]);

      const result = await QuotaService.checkQuota(userId, quotaType, requestAmount);

      expect(result.allowed).toBe(true);
      expect(result.remainingQuota).toBe(1000); // 10000 - 7000 - 2000
    });

    it('应该检查需要重置的配额', async () => {
      const userId = 'user123';
      const quotaType = 'calls';
      const requestAmount = 5;

      // Mock过期的配额（昨天重置的每日配额）
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;
      MockUserQuotaRepository.getActiveQuotas.mockResolvedValue([
        {
          id: 'quota1',
          userId,
          quotaType: 'calls',
          limitValue: 100,
          usedValue: 90,
          resetPeriod: 'daily',
          lastResetAt: yesterday,
          isActive: true,
        } as any,
      ]);

      // Mock重置配额
      MockUserQuotaRepository.resetQuota.mockResolvedValue(undefined);

      const result = await QuotaService.checkQuota(userId, quotaType, requestAmount);

      expect(result.allowed).toBe(true);
      expect(MockUserQuotaRepository.resetQuota).toHaveBeenCalledWith('quota1');
    });
  });

  describe('updateUsage', () => {
    it('应该成功更新使用量', async () => {
      const userId = 'user123';
      const quotaType = 'calls';
      const amount = 1;

      MockUserQuotaRepository.getActiveQuotas.mockResolvedValue([
        {
          id: 'quota1',
          userId,
          quotaType: 'calls',
          limitValue: 100,
          usedValue: 50,
          resetPeriod: 'daily',
          lastResetAt: Date.now(),
          isActive: true,
        } as any,
      ]);

      MockUserQuotaRepository.incrementUsage.mockResolvedValue(undefined);

      const result = await QuotaService.updateUsage(userId, quotaType, amount);

      expect(result.success).toBe(true);
      expect(MockUserQuotaRepository.incrementUsage).toHaveBeenCalledWith('quota1', amount);
    });

    it('应该处理没有配额的情况', async () => {
      const userId = 'user123';
      const quotaType = 'calls';
      const amount = 1;

      MockUserQuotaRepository.getActiveQuotas.mockResolvedValue([]);

      const result = await QuotaService.updateUsage(userId, quotaType, amount);

      expect(result.success).toBe(true);
      expect(result.message).toBe('无需更新配额');
      expect(MockUserQuotaRepository.incrementUsage).not.toHaveBeenCalled();
    });

    it('应该处理更新失败', async () => {
      const userId = 'user123';
      const quotaType = 'calls';
      const amount = 1;

      MockUserQuotaRepository.getActiveQuotas.mockResolvedValue([
        {
          id: 'quota1',
          userId,
          quotaType: 'calls',
          limitValue: 100,
          usedValue: 50,
          resetPeriod: 'daily',
          lastResetAt: Date.now(),
          isActive: true,
        } as any,
      ]);

      MockUserQuotaRepository.incrementUsage.mockRejectedValue(new Error('Database error'));

      const result = await QuotaService.updateUsage(userId, quotaType, amount);

      expect(result.success).toBe(false);
      expect(result.message).toContain('更新配额使用量失败');
    });
  });

  describe('getUserQuotaOverview', () => {
    it('应该返回用户配额概览', async () => {
      const userId = 'user123';

      // Mock配额数据
      MockUserQuotaRepository.getAllByUser.mockResolvedValue([
        {
          id: 'quota1',
          userId,
          quotaType: 'calls',
          limitValue: 100,
          usedValue: 30,
          resetPeriod: 'daily',
          lastResetAt: Date.now(),
          isActive: true,
          description: '每日调用次数',
        },
        {
          id: 'quota2',
          userId,
          quotaType: 'tokens',
          limitValue: 10000,
          usedValue: 7500,
          resetPeriod: 'daily',
          lastResetAt: Date.now(),
          isActive: true,
          description: 'Token使用量',
        },
      ] as any);

      // Mock今日使用统计
      MockAiUsageRepository.getTodayUsage.mockResolvedValue({
        totalCalls: 30,
        totalTokens: 7500,
        totalCost: 1250,
      } as any);

      const result = await QuotaService.getUserQuotaOverview(userId);

      expect(result.quotas).toHaveLength(2);
      expect(result.quotas[0].percentage).toBe(30); // 30/100 * 100
      expect(result.quotas[1].percentage).toBe(75); // 7500/10000 * 100
      expect(result.todayUsage.totalCalls).toBe(30);
      expect(result.todayUsage.totalTokens).toBe(7500);
    });

    it('应该处理没有配额的用户', async () => {
      const userId = 'user123';

      MockUserQuotaRepository.getAllByUser.mockResolvedValue([]);
      MockAiUsageRepository.getTodayUsage.mockResolvedValue({
        totalCalls: 0,
        totalTokens: 0,
        totalCost: 0,
      } as any);

      const result = await QuotaService.getUserQuotaOverview(userId);

      expect(result.quotas).toHaveLength(0);
      expect(result.todayUsage.totalCalls).toBe(0);
    });
  });

  describe('createUserQuota', () => {
    it('应该成功创建配额', async () => {
      const quotaData = {
        userId: 'user123',
        quotaType: 'calls' as const,
        limitValue: 200,
        resetPeriod: 'daily' as const,
        description: '自定义每日调用配额',
      };

      MockUserQuotaRepository.create.mockResolvedValue({
        id: 'quota123',
        ...quotaData,
        usedValue: 0,
        lastResetAt: Date.now(),
        isActive: true,
      } as any);

      const result = await QuotaService.createUserQuota(quotaData);

      expect(result.success).toBe(true);
      expect(result.quota).toBeDefined();
      expect(result.quota?.quotaType).toBe('calls');
      expect(MockUserQuotaRepository.create).toHaveBeenCalledWith(
        expect.objectContaining(quotaData),
      );
    });

    it('应该拒绝重复的配额类型', async () => {
      const quotaData = {
        userId: 'user123',
        quotaType: 'calls' as const,
        limitValue: 200,
        resetPeriod: 'daily' as const,
      };

      // Mock已存在的配额
      MockUserQuotaRepository.getByUserAndType.mockResolvedValue({
        id: 'existing_quota',
        ...quotaData,
        isActive: true,
      } as any);

      const result = await QuotaService.createUserQuota(quotaData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('已存在相同类型的配额');
      expect(MockUserQuotaRepository.create).not.toHaveBeenCalled();
    });

    it('应该验证配额参数', async () => {
      const invalidQuotaData = {
        userId: 'user123',
        quotaType: 'calls' as const,
        limitValue: -10, // 无效的负数限制
        resetPeriod: 'daily' as const,
      };

      const result = await QuotaService.createUserQuota(invalidQuotaData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('配额限制必须大于0');
      expect(MockUserQuotaRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('resetQuotas', () => {
    it('应该重置过期的每日配额', async () => {
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;

      // Mock过期的配额
      MockUserQuotaRepository.getExpiredQuotas.mockResolvedValue([
        {
          id: 'quota1',
          userId: 'user1',
          quotaType: 'calls',
          resetPeriod: 'daily',
          lastResetAt: yesterday,
        },
        {
          id: 'quota2',
          userId: 'user2',
          quotaType: 'tokens',
          resetPeriod: 'daily',
          lastResetAt: yesterday,
        },
      ] as any);

      MockUserQuotaRepository.resetQuota.mockResolvedValue(undefined);

      const result = await QuotaService.resetQuotas();

      expect(result.resetCount).toBe(2);
      expect(MockUserQuotaRepository.resetQuota).toHaveBeenCalledTimes(2);
      expect(MockUserQuotaRepository.resetQuota).toHaveBeenCalledWith('quota1');
      expect(MockUserQuotaRepository.resetQuota).toHaveBeenCalledWith('quota2');
    });

    it('应该重置过期的月度配额', async () => {
      const lastMonth = Date.now() - 31 * 24 * 60 * 60 * 1000;

      MockUserQuotaRepository.getExpiredQuotas.mockResolvedValue([
        {
          id: 'quota1',
          userId: 'user1',
          quotaType: 'calls',
          resetPeriod: 'monthly',
          lastResetAt: lastMonth,
        },
      ] as any);

      MockUserQuotaRepository.resetQuota.mockResolvedValue(undefined);

      const result = await QuotaService.resetQuotas();

      expect(result.resetCount).toBe(1);
      expect(MockUserQuotaRepository.resetQuota).toHaveBeenCalledWith('quota1');
    });

    it('应该处理没有过期配额的情况', async () => {
      MockUserQuotaRepository.getExpiredQuotas.mockResolvedValue([]);

      const result = await QuotaService.resetQuotas();

      expect(result.resetCount).toBe(0);
      expect(MockUserQuotaRepository.resetQuota).not.toHaveBeenCalled();
    });

    it('应该处理重置失败的情况', async () => {
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;

      MockUserQuotaRepository.getExpiredQuotas.mockResolvedValue([
        {
          id: 'quota1',
          userId: 'user1',
          quotaType: 'calls',
          resetPeriod: 'daily',
          lastResetAt: yesterday,
        },
      ] as any);

      MockUserQuotaRepository.resetQuota.mockRejectedValue(new Error('Reset failed'));

      const result = await QuotaService.resetQuotas();

      expect(result.resetCount).toBe(0);
      expect(result.errors).toContain('重置配额quota1失败: Reset failed');
    });
  });

  describe('deleteUserQuota', () => {
    it('应该成功删除用户配额', async () => {
      const quotaId = 'quota123';
      const userId = 'user123';

      MockUserQuotaRepository.getById.mockResolvedValue({
        id: quotaId,
        userId,
        quotaType: 'calls',
        isActive: true,
      } as any);

      MockUserQuotaRepository.delete.mockResolvedValue(undefined);

      const result = await QuotaService.deleteUserQuota(quotaId, userId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('配额删除成功');
      expect(MockUserQuotaRepository.delete).toHaveBeenCalledWith(quotaId);
    });

    it('应该拒绝删除不属于用户的配额', async () => {
      const quotaId = 'quota123';
      const userId = 'user123';
      const otherUserId = 'user456';

      MockUserQuotaRepository.getById.mockResolvedValue({
        id: quotaId,
        userId: otherUserId, // 不同的用户ID
        quotaType: 'calls',
        isActive: true,
      } as any);

      const result = await QuotaService.deleteUserQuota(quotaId, userId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('权限不足，无法删除此配额');
      expect(MockUserQuotaRepository.delete).not.toHaveBeenCalled();
    });

    it('应该处理不存在的配额', async () => {
      const quotaId = 'nonexistent';
      const userId = 'user123';

      MockUserQuotaRepository.getById.mockResolvedValue(null);

      const result = await QuotaService.deleteUserQuota(quotaId, userId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('配额不存在');
      expect(MockUserQuotaRepository.delete).not.toHaveBeenCalled();
    });
  });
});
