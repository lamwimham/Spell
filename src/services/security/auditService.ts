/**
 * 审计服务 - 操作审计日志记录和管理
 * 记录用户操作、系统事件和安全相关活动，提供审计追踪功能
 */

import { EncryptionService, SensitiveDataType } from './encryptionService';

// 审计事件类型枚举
export enum AuditEventType {
  // 认证相关
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_REGISTER = 'user_register',
  PASSWORD_CHANGE = 'password_change',
  AUTH_FAILED = 'auth_failed',

  // 用户操作
  PROFILE_UPDATE = 'profile_update',
  SETTINGS_CHANGE = 'settings_change',
  DATA_EXPORT = 'data_export',
  DATA_IMPORT = 'data_import',

  // AI使用
  AI_CALL_SUCCESS = 'ai_call_success',
  AI_CALL_FAILED = 'ai_call_failed',
  QUOTA_EXCEEDED = 'quota_exceeded',
  QUOTA_UPDATE = 'quota_update',

  // 打卡相关
  CHECK_IN = 'check_in',
  CHECK_IN_STREAK = 'check_in_streak',

  // 系统事件
  APP_START = 'app_start',
  APP_CRASH = 'app_crash',
  DATA_SYNC = 'data_sync',
  BACKUP_CREATE = 'backup_create',
  BACKUP_RESTORE = 'backup_restore',

  // 安全事件
  SECURITY_VIOLATION = 'security_violation',
  ENCRYPTION_KEY_ROTATE = 'encryption_key_rotate',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
}

// 审计事件严重级别
export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// 审计日志条目接口
export interface AuditLogEntry {
  id: string;
  userId?: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  timestamp: number;
  description: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

// 审计查询条件
export interface AuditQueryOptions {
  userId?: string;
  eventTypes?: AuditEventType[];
  severities?: AuditSeverity[];
  startDate?: number;
  endDate?: number;
  success?: boolean;
  limit?: number;
  offset?: number;
}

// 审计统计信息
export interface AuditStats {
  totalEvents: number;
  eventsByType: Record<AuditEventType, number>;
  eventsBySeverity: Record<AuditSeverity, number>;
  successRate: number;
  recentEvents: AuditLogEntry[];
  timeRange: {
    start: number;
    end: number;
  };
}

export class AuditService {
  private static readonly STORAGE_KEY = 'SPELL_AUDIT_LOGS';
  private static readonly MAX_LOGS = 1000; // 最大日志条目数
  private static readonly LOG_RETENTION_DAYS = 90; // 日志保留天数

  // 内存中的日志缓存
  private static logCache: AuditLogEntry[] = [];
  private static isInitialized = false;

  /**
   * 初始化审计服务
   */
  static async initialize(): Promise<void> {
    try {
      await this.loadLogsFromStorage();
      this.isInitialized = true;

      // 记录应用启动事件
      await this.logEvent({
        eventType: AuditEventType.APP_START,
        severity: AuditSeverity.LOW,
        description: '应用启动',
        success: true,
      });

      // 启动定期清理任务
      this.startCleanupTask();
    } catch (error) {
      console.error('初始化审计服务失败:', error);
    }
  }

  /**
   * 记录审计事件
   */
  static async logEvent(eventData: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const logEntry: AuditLogEntry = {
        id: this.generateLogId(),
        timestamp: Date.now(),
        ...eventData,
      };

      // 添加到缓存
      this.logCache.unshift(logEntry);

      // 限制缓存大小
      if (this.logCache.length > this.MAX_LOGS) {
        this.logCache = this.logCache.slice(0, this.MAX_LOGS);
      }

      // 异步保存到存储
      this.saveLogsToStorage().catch(error => {
        console.error('保存审计日志失败:', error);
      });

      // 检查是否需要立即报告安全事件
      if (this.isSecurityEvent(eventData.eventType, eventData.severity)) {
        await this.handleSecurityEvent(logEntry);
      }
    } catch (error) {
      console.error('记录审计事件失败:', error);
    }
  }

  /**
   * 记录用户登录事件
   */
  static async logUserLogin(
    userId: string,
    success: boolean,
    errorMessage?: string,
  ): Promise<void> {
    await this.logEvent({
      userId,
      eventType: success ? AuditEventType.USER_LOGIN : AuditEventType.AUTH_FAILED,
      severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
      description: success ? '用户登录成功' : '用户登录失败',
      success,
      errorMessage,
      details: {
        loginTime: new Date().toISOString(),
      },
    });
  }

  /**
   * 记录用户注销事件
   */
  static async logUserLogout(userId: string): Promise<void> {
    await this.logEvent({
      userId,
      eventType: AuditEventType.USER_LOGOUT,
      severity: AuditSeverity.LOW,
      description: '用户注销',
      success: true,
      details: {
        logoutTime: new Date().toISOString(),
      },
    });
  }

  /**
   * 记录AI调用事件
   */
  static async logAiCall(
    userId: string,
    serviceType: string,
    success: boolean,
    tokensUsed?: number,
    cost?: number,
    errorMessage?: string,
  ): Promise<void> {
    await this.logEvent({
      userId,
      eventType: success ? AuditEventType.AI_CALL_SUCCESS : AuditEventType.AI_CALL_FAILED,
      severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
      description: `AI调用${success ? '成功' : '失败'} - ${serviceType}`,
      success,
      errorMessage,
      details: {
        serviceType,
        tokensUsed,
        cost,
        callTime: new Date().toISOString(),
      },
    });
  }

  /**
   * 记录配额超限事件
   */
  static async logQuotaExceeded(
    userId: string,
    quotaType: string,
    currentUsage: number,
    limit: number,
  ): Promise<void> {
    await this.logEvent({
      userId,
      eventType: AuditEventType.QUOTA_EXCEEDED,
      severity: AuditSeverity.HIGH,
      description: `配额超限 - ${quotaType}`,
      success: false,
      details: {
        quotaType,
        currentUsage,
        limit,
        exceededTime: new Date().toISOString(),
      },
    });
  }

  /**
   * 记录打卡事件
   */
  static async logCheckIn(userId: string, checkInType: string, streak: number): Promise<void> {
    const isStreakMilestone = streak > 0 && (streak % 7 === 0 || streak % 30 === 0);

    await this.logEvent({
      userId,
      eventType: isStreakMilestone ? AuditEventType.CHECK_IN_STREAK : AuditEventType.CHECK_IN,
      severity: isStreakMilestone ? AuditSeverity.MEDIUM : AuditSeverity.LOW,
      description: isStreakMilestone ? `打卡连续${streak}天里程碑` : `${checkInType}打卡`,
      success: true,
      details: {
        checkInType,
        streak,
        checkInTime: new Date().toISOString(),
      },
    });
  }

  /**
   * 记录安全事件
   */
  static async logSecurityEvent(
    eventType: AuditEventType,
    description: string,
    severity: AuditSeverity = AuditSeverity.HIGH,
    userId?: string,
    details?: Record<string, any>,
  ): Promise<void> {
    await this.logEvent({
      userId,
      eventType,
      severity,
      description,
      success: false,
      details: {
        ...details,
        securityEventTime: new Date().toISOString(),
      },
    });
  }

  /**
   * 查询审计日志
   */
  static async queryLogs(options: AuditQueryOptions = {}): Promise<AuditLogEntry[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      let filteredLogs = [...this.logCache];

      // 按用户ID过滤
      if (options.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === options.userId);
      }

      // 按事件类型过滤
      if (options.eventTypes && options.eventTypes.length > 0) {
        filteredLogs = filteredLogs.filter(log => options.eventTypes!.includes(log.eventType));
      }

      // 按严重级别过滤
      if (options.severities && options.severities.length > 0) {
        filteredLogs = filteredLogs.filter(log => options.severities!.includes(log.severity));
      }

      // 按时间范围过滤
      if (options.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= options.startDate!);
      }
      if (options.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= options.endDate!);
      }

      // 按成功状态过滤
      if (options.success !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.success === options.success);
      }

      // 分页处理
      const offset = options.offset || 0;
      const limit = options.limit || 100;

      return filteredLogs.slice(offset, offset + limit);
    } catch (error) {
      console.error('查询审计日志失败:', error);
      return [];
    }
  }

  /**
   * 获取审计统计信息
   */
  static async getAuditStats(timeRangeDays: number = 7): Promise<AuditStats> {
    try {
      const endTime = Date.now();
      const startTime = endTime - timeRangeDays * 24 * 60 * 60 * 1000;

      const logs = await this.queryLogs({
        startDate: startTime,
        endDate: endTime,
      });

      // 按事件类型统计
      const eventsByType: Record<AuditEventType, number> = {} as any;
      Object.values(AuditEventType).forEach(type => {
        eventsByType[type] = 0;
      });

      // 按严重级别统计
      const eventsBySeverity: Record<AuditSeverity, number> = {
        [AuditSeverity.LOW]: 0,
        [AuditSeverity.MEDIUM]: 0,
        [AuditSeverity.HIGH]: 0,
        [AuditSeverity.CRITICAL]: 0,
      };

      let successCount = 0;

      logs.forEach(log => {
        eventsByType[log.eventType]++;
        eventsBySeverity[log.severity]++;
        if (log.success) {
          successCount++;
        }
      });

      const successRate = logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 0;
      const recentEvents = logs.slice(0, 10); // 最近10条事件

      return {
        totalEvents: logs.length,
        eventsByType,
        eventsBySeverity,
        successRate,
        recentEvents,
        timeRange: {
          start: startTime,
          end: endTime,
        },
      };
    } catch (error) {
      console.error('获取审计统计失败:', error);
      return {
        totalEvents: 0,
        eventsByType: {} as any,
        eventsBySeverity: {
          [AuditSeverity.LOW]: 0,
          [AuditSeverity.MEDIUM]: 0,
          [AuditSeverity.HIGH]: 0,
          [AuditSeverity.CRITICAL]: 0,
        },
        successRate: 0,
        recentEvents: [],
        timeRange: {
          start: Date.now(),
          end: Date.now(),
        },
      };
    }
  }

  /**
   * 导出审计日志
   */
  static async exportLogs(options: AuditQueryOptions = {}): Promise<string> {
    try {
      const logs = await this.queryLogs(options);
      return JSON.stringify(logs, null, 2);
    } catch (error) {
      console.error('导出审计日志失败:', error);
      throw new Error('导出失败');
    }
  }

  /**
   * 清理过期日志
   */
  static async cleanupExpiredLogs(): Promise<number> {
    try {
      const cutoffTime = Date.now() - this.LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;
      const initialCount = this.logCache.length;

      this.logCache = this.logCache.filter(log => log.timestamp >= cutoffTime);

      const removedCount = initialCount - this.logCache.length;

      if (removedCount > 0) {
        await this.saveLogsToStorage();
        console.log(`清理了 ${removedCount} 条过期日志`);
      }

      return removedCount;
    } catch (error) {
      console.error('清理过期日志失败:', error);
      return 0;
    }
  }

  /**
   * 获取安全事件摘要
   */
  static async getSecuritySummary(days: number = 7): Promise<{
    totalSecurityEvents: number;
    criticalEvents: number;
    failedLogins: number;
    quotaViolations: number;
    recentSecurityEvents: AuditLogEntry[];
  }> {
    try {
      const securityEventTypes = [
        AuditEventType.AUTH_FAILED,
        AuditEventType.QUOTA_EXCEEDED,
        AuditEventType.SECURITY_VIOLATION,
        AuditEventType.UNAUTHORIZED_ACCESS,
        AuditEventType.SUSPICIOUS_ACTIVITY,
      ];

      const logs = await this.queryLogs({
        eventTypes: securityEventTypes,
        startDate: Date.now() - days * 24 * 60 * 60 * 1000,
      });

      const criticalEvents = logs.filter(log => log.severity === AuditSeverity.CRITICAL).length;
      const failedLogins = logs.filter(log => log.eventType === AuditEventType.AUTH_FAILED).length;
      const quotaViolations = logs.filter(
        log => log.eventType === AuditEventType.QUOTA_EXCEEDED,
      ).length;
      const recentSecurityEvents = logs.slice(0, 5);

      return {
        totalSecurityEvents: logs.length,
        criticalEvents,
        failedLogins,
        quotaViolations,
        recentSecurityEvents,
      };
    } catch (error) {
      console.error('获取安全摘要失败:', error);
      return {
        totalSecurityEvents: 0,
        criticalEvents: 0,
        failedLogins: 0,
        quotaViolations: 0,
        recentSecurityEvents: [],
      };
    }
  }

  /**
   * 生成日志ID
   */
  private static generateLogId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * 判断是否为安全事件
   */
  private static isSecurityEvent(eventType: AuditEventType, severity: AuditSeverity): boolean {
    const securityEventTypes = [
      AuditEventType.AUTH_FAILED,
      AuditEventType.QUOTA_EXCEEDED,
      AuditEventType.SECURITY_VIOLATION,
      AuditEventType.UNAUTHORIZED_ACCESS,
      AuditEventType.SUSPICIOUS_ACTIVITY,
    ];

    return securityEventTypes.includes(eventType) || severity === AuditSeverity.CRITICAL;
  }

  /**
   * 处理安全事件
   */
  private static async handleSecurityEvent(logEntry: AuditLogEntry): Promise<void> {
    try {
      // 对于严重安全事件，可以执行额外的处理
      if (logEntry.severity === AuditSeverity.CRITICAL) {
        console.warn('检测到严重安全事件:', logEntry.description);
        // 这里可以添加通知、自动响应等逻辑
      }

      // 检查是否需要触发安全响应
      await this.checkSecurityThreshold(logEntry);
    } catch (error) {
      console.error('处理安全事件失败:', error);
    }
  }

  /**
   * 检查安全阈值
   */
  private static async checkSecurityThreshold(logEntry: AuditLogEntry): Promise<void> {
    try {
      // 检查最近1小时内的失败登录次数
      if (logEntry.eventType === AuditEventType.AUTH_FAILED) {
        const recentFailures = await this.queryLogs({
          userId: logEntry.userId,
          eventTypes: [AuditEventType.AUTH_FAILED],
          startDate: Date.now() - 60 * 60 * 1000, // 1小时
        });

        if (recentFailures.length >= 5) {
          await this.logSecurityEvent(
            AuditEventType.SUSPICIOUS_ACTIVITY,
            '检测到频繁登录失败',
            AuditSeverity.HIGH,
            logEntry.userId,
            { failureCount: recentFailures.length },
          );
        }
      }
    } catch (error) {
      console.error('检查安全阈值失败:', error);
    }
  }

  /**
   * 从存储加载日志
   */
  private static async loadLogsFromStorage(): Promise<void> {
    try {
      const encryptedLogs = await EncryptionService.secureRetrieve(this.STORAGE_KEY);
      if (encryptedLogs) {
        this.logCache = JSON.parse(encryptedLogs);
      }
    } catch (error) {
      console.error('加载审计日志失败:', error);
      this.logCache = [];
    }
  }

  /**
   * 保存日志到存储
   */
  private static async saveLogsToStorage(): Promise<void> {
    try {
      const success = await EncryptionService.secureStore(
        this.STORAGE_KEY,
        JSON.stringify(this.logCache),
        SensitiveDataType.SETTINGS,
      );

      if (!success) {
        console.error('保存审计日志失败');
      }
    } catch (error) {
      console.error('保存审计日志失败:', error);
    }
  }

  /**
   * 启动清理任务
   */
  private static startCleanupTask(): void {
    // 每24小时清理一次过期日志
    setInterval(async () => {
      try {
        await this.cleanupExpiredLogs();
      } catch (error) {
        console.error('定期清理任务失败:', error);
      }
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * 清除所有审计日志
   */
  static async clearAllLogs(): Promise<boolean> {
    try {
      this.logCache = [];
      const success = await EncryptionService.secureDelete(this.STORAGE_KEY);

      // 记录日志清除事件
      await this.logEvent({
        eventType: AuditEventType.DATA_EXPORT, // 用作数据操作事件
        severity: AuditSeverity.HIGH,
        description: '清除所有审计日志',
        success: true,
      });

      return success;
    } catch (error) {
      console.error('清除审计日志失败:', error);
      return false;
    }
  }
}
