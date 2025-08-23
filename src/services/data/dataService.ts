/**
 * 数据服务 - 数据导入导出功能
 * 提供完整的数据备份、恢复和迁移功能，支持加密和压缩
 */

import { Q } from '@nozbe/watermelondb';
import database from '../../database/index';
import { UserRepository } from '../../database/repositories/UserRepository';
import { CheckInRepository } from '../../database/repositories/CheckInRepository';
import { AiUsageRepository } from '../../database/repositories/AiUsageRepository';
import { UserQuotaRepository } from '../../database/repositories/UserQuotaRepository';
import { EncryptionService, SensitiveDataType } from '../security/encryptionService';
import { AuditService, AuditEventType, AuditSeverity } from '../security/auditService';

// 导出格式枚举
export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  ENCRYPTED = 'encrypted',
}

// 导入/导出数据类型
export enum DataType {
  ALL = 'all',
  USERS = 'users',
  CHECK_INS = 'check_ins',
  AI_USAGE = 'ai_usage',
  USER_QUOTAS = 'user_quotas',
  USER_SETTINGS = 'user_settings',
  RECORDINGS = 'recordings',
}

// 导出配置
export interface ExportConfig {
  userId?: string; // 如果指定，只导出该用户的数据
  dataTypes: DataType[];
  format: ExportFormat;
  includeMetadata: boolean;
  includeSystemData: boolean;
  encryptSensitiveData: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  maxRecords?: number;
}

// 导入配置
export interface ImportConfig {
  overwriteExisting: boolean;
  validateData: boolean;
  createBackup: boolean;
  mergeStrategy: 'skip' | 'overwrite' | 'merge';
  onProgress?: (progress: number, status: string) => void;
}

// 导出结果
export interface ExportResult {
  success: boolean;
  data?: string;
  metadata: {
    exportTime: number;
    recordCount: number;
    dataTypes: DataType[];
    format: ExportFormat;
    fileSize: number;
    checksum?: string;
  };
  errors: string[];
}

// 导入结果
export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  metadata: {
    importTime: number;
    dataSource: string;
    backupCreated?: string;
  };
}

// 数据统计
export interface DataStats {
  totalRecords: number;
  recordsByType: Record<DataType, number>;
  dataSize: number;
  oldestRecord?: Date;
  newestRecord?: Date;
  userCount: number;
}

export class DataService {
  /**
   * 导出数据
   */
  static async exportData(config: ExportConfig): Promise<ExportResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let totalRecords = 0;

    try {
      const exportData: any = {
        metadata: {
          exportTime: startTime,
          version: '1.0',
          format: config.format,
          includeMetadata: config.includeMetadata,
          userId: config.userId,
          dataTypes: config.dataTypes,
        },
        data: {},
      };

      // 导出各类型数据
      for (const dataType of config.dataTypes) {
        try {
          const typeData = await this.exportDataType(dataType, config);
          exportData.data[dataType] = typeData;
          totalRecords += Array.isArray(typeData) ? typeData.length : 0;
        } catch (error) {
          errors.push(`导出${dataType}失败: ${error}`);
        }
      }

      // 序列化数据
      let result = '';
      let fileSize = 0;

      switch (config.format) {
        case ExportFormat.JSON:
          result = JSON.stringify(exportData, null, 2);
          fileSize = Buffer.byteLength(result, 'utf8');
          break;

        case ExportFormat.CSV:
          result = await this.convertToCSV(exportData);
          fileSize = Buffer.byteLength(result, 'utf8');
          break;

        case ExportFormat.ENCRYPTED:
          const jsonData = JSON.stringify(exportData);
          const encryptResult = await EncryptionService.encryptData(
            jsonData,
            SensitiveDataType.PERSONAL_INFO,
          );

          if (!encryptResult.success) {
            throw new Error('数据加密失败');
          }

          result = JSON.stringify({
            encryptedData: encryptResult.encryptedData,
            iv: encryptResult.iv,
            salt: encryptResult.salt,
            metadata: exportData.metadata,
          });
          fileSize = Buffer.byteLength(result, 'utf8');
          break;
      }

      // 计算校验和
      const checksum = await this.calculateChecksum(result);

      // 记录导出事件
      await AuditService.logEvent({
        userId: config.userId,
        eventType: AuditEventType.DATA_EXPORT,
        severity: AuditSeverity.MEDIUM,
        description: '数据导出',
        success: true,
        details: {
          dataTypes: config.dataTypes,
          format: config.format,
          recordCount: totalRecords,
          fileSize,
        },
      });

      return {
        success: true,
        data: result,
        metadata: {
          exportTime: startTime,
          recordCount: totalRecords,
          dataTypes: config.dataTypes,
          format: config.format,
          fileSize,
          checksum,
        },
        errors,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '导出失败';

      await AuditService.logEvent({
        userId: config.userId,
        eventType: AuditEventType.DATA_EXPORT,
        severity: AuditSeverity.HIGH,
        description: '数据导出失败',
        success: false,
        errorMessage,
      });

      return {
        success: false,
        metadata: {
          exportTime: startTime,
          recordCount: 0,
          dataTypes: config.dataTypes,
          format: config.format,
          fileSize: 0,
        },
        errors: [errorMessage, ...errors],
      };
    }
  }

  /**
   * 导入数据
   */
  static async importData(data: string, config: ImportConfig): Promise<ImportResult> {
    const startTime = Date.now();
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    let backupPath: string | undefined;

    try {
      // 创建备份
      if (config.createBackup) {
        const backupResult = await this.createBackup();
        if (backupResult.success) {
          backupPath = `backup_${Date.now()}`;
        } else {
          errors.push('创建备份失败');
        }
      }

      // 解析导入数据
      const importData = await this.parseImportData(data);

      if (config.validateData) {
        const validation = await this.validateImportData(importData);
        if (!validation.valid) {
          throw new Error(`数据验证失败: ${validation.errors.join(', ')}`);
        }
      }

      // 开始导入
      await database.write(async () => {
        for (const [dataType, records] of Object.entries(importData.data)) {
          if (!Array.isArray(records)) continue;

          config.onProgress?.(
            (imported / Object.keys(importData.data).length) * 100,
            `导入${dataType}数据...`,
          );

          for (const record of records) {
            try {
              const result = await this.importRecord(dataType as DataType, record, config);
              if (result === 'imported') {
                imported++;
              } else if (result === 'skipped') {
                skipped++;
              }
            } catch (error) {
              errors.push(`导入记录失败: ${error}`);
            }
          }
        }
      });

      // 记录导入事件
      await AuditService.logEvent({
        eventType: AuditEventType.DATA_IMPORT,
        severity: AuditSeverity.MEDIUM,
        description: '数据导入',
        success: true,
        details: {
          imported,
          skipped,
          errors: errors.length,
          backupCreated: !!backupPath,
        },
      });

      return {
        success: true,
        imported,
        skipped,
        errors,
        metadata: {
          importTime: startTime,
          dataSource: 'manual_import',
          backupCreated: backupPath,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '导入失败';

      await AuditService.logEvent({
        eventType: AuditEventType.DATA_IMPORT,
        severity: AuditSeverity.HIGH,
        description: '数据导入失败',
        success: false,
        errorMessage,
      });

      return {
        success: false,
        imported,
        skipped,
        errors: [errorMessage, ...errors],
        metadata: {
          importTime: startTime,
          dataSource: 'manual_import',
          backupCreated: backupPath,
        },
      };
    }
  }

  /**
   * 创建完整备份
   */
  static async createBackup(): Promise<ExportResult> {
    const config: ExportConfig = {
      dataTypes: [DataType.ALL],
      format: ExportFormat.ENCRYPTED,
      includeMetadata: true,
      includeSystemData: true,
      encryptSensitiveData: true,
    };

    const result = await this.exportData(config);

    if (result.success && result.data) {
      // 保存备份到本地存储
      const backupKey = `backup_${Date.now()}`;
      const saved = await EncryptionService.secureStore(
        backupKey,
        result.data,
        SensitiveDataType.PERSONAL_INFO,
      );

      if (saved) {
        await AuditService.logEvent({
          eventType: AuditEventType.BACKUP_CREATE,
          severity: AuditSeverity.LOW,
          description: '创建数据备份',
          success: true,
          details: {
            backupKey,
            fileSize: result.metadata.fileSize,
            recordCount: result.metadata.recordCount,
          },
        });
      }
    }

    return result;
  }

  /**
   * 恢复备份
   */
  static async restoreBackup(backupKey: string, config: ImportConfig): Promise<ImportResult> {
    try {
      const backupData = await EncryptionService.secureRetrieve(backupKey);
      if (!backupData) {
        throw new Error('备份数据不存在');
      }

      const result = await this.importData(backupData, config);

      if (result.success) {
        await AuditService.logEvent({
          eventType: AuditEventType.BACKUP_RESTORE,
          severity: AuditSeverity.MEDIUM,
          description: '恢复数据备份',
          success: true,
          details: {
            backupKey,
            imported: result.imported,
            skipped: result.skipped,
          },
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '恢复备份失败';

      await AuditService.logEvent({
        eventType: AuditEventType.BACKUP_RESTORE,
        severity: AuditSeverity.HIGH,
        description: '恢复数据备份失败',
        success: false,
        errorMessage,
      });

      throw error;
    }
  }

  /**
   * 获取数据统计
   */
  static async getDataStats(userId?: string): Promise<DataStats> {
    try {
      const stats: DataStats = {
        totalRecords: 0,
        recordsByType: {} as Record<DataType, number>,
        dataSize: 0,
        userCount: 0,
      };

      // 统计用户数据
      const userCount = await UserRepository.getCount();
      stats.userCount = userCount;
      stats.recordsByType[DataType.USERS] = userCount;

      // 统计打卡数据
      if (userId) {
        const checkinCount = await CheckInRepository.getCountByUser(userId);
        stats.recordsByType[DataType.CHECK_INS] = checkinCount;
      }

      // 统计AI使用数据
      if (userId) {
        const aiUsageCount = await AiUsageRepository.getCountByUser(userId);
        stats.recordsByType[DataType.AI_USAGE] = aiUsageCount;
      }

      // 统计配额数据
      if (userId) {
        const quotaCount = await UserQuotaRepository.getCountByUser(userId);
        stats.recordsByType[DataType.USER_QUOTAS] = quotaCount;
      }

      // 计算总记录数
      stats.totalRecords = Object.values(stats.recordsByType).reduce(
        (sum, count) => sum + count,
        0,
      );

      // 估算数据大小
      stats.dataSize = stats.totalRecords * 1024; // 简单估算

      return stats;
    } catch (error) {
      console.error('获取数据统计失败:', error);
      return {
        totalRecords: 0,
        recordsByType: {} as Record<DataType, number>,
        dataSize: 0,
        userCount: 0,
      };
    }
  }

  /**
   * 清理用户数据
   */
  static async clearUserData(userId: string): Promise<boolean> {
    try {
      await database.write(async () => {
        // 删除用户相关的所有数据
        const user = await UserRepository.getById(userId);
        if (user) {
          // 删除用户记录会级联删除相关数据
          await user.markAsDeleted();
        }
      });

      await AuditService.logEvent({
        userId,
        eventType: AuditEventType.DATA_EXPORT, // 用作数据操作事件
        severity: AuditSeverity.HIGH,
        description: '清理用户数据',
        success: true,
      });

      return true;
    } catch (error) {
      console.error('清理用户数据失败:', error);
      return false;
    }
  }

  // 私有方法

  /**
   * 导出特定类型数据
   */
  private static async exportDataType(dataType: DataType, config: ExportConfig): Promise<any[]> {
    switch (dataType) {
      case DataType.ALL:
        return await this.exportAllData(config);

      case DataType.USERS:
        if (config.userId) {
          const user = await UserRepository.getById(config.userId);
          return user ? [this.sanitizeUserData(user)] : [];
        }
        const users = await UserRepository.getAll();
        return users.map(user => this.sanitizeUserData(user));

      case DataType.CHECK_INS:
        if (config.userId) {
          return await CheckInRepository.getAllByUser(config.userId);
        }
        return []; // 不导出所有用户的打卡数据

      case DataType.AI_USAGE:
        if (config.userId) {
          return await AiUsageRepository.getAllByUser(config.userId);
        }
        return [];

      case DataType.USER_QUOTAS:
        if (config.userId) {
          return await UserQuotaRepository.getAllByUser(config.userId);
        }
        return [];

      default:
        return [];
    }
  }

  /**
   * 导出所有数据
   */
  private static async exportAllData(config: ExportConfig): Promise<any> {
    const allData: any = {};

    const dataTypes = [DataType.USERS, DataType.CHECK_INS, DataType.AI_USAGE, DataType.USER_QUOTAS];

    for (const type of dataTypes) {
      allData[type] = await this.exportDataType(type, config);
    }

    return allData;
  }

  /**
   * 净化用户数据（移除敏感信息）
   */
  private static sanitizeUserData(user: any): any {
    const sanitized = { ...user };

    // 移除密码哈希
    delete sanitized.passwordHash;

    // 根据配置决定是否包含敏感信息
    return sanitized;
  }

  /**
   * 转换为CSV格式
   */
  private static async convertToCSV(data: any): Promise<string> {
    // 简单的CSV转换实现
    const csvLines: string[] = [];

    for (const [tableName, records] of Object.entries(data.data)) {
      if (!Array.isArray(records) || records.length === 0) continue;

      // 添加表名作为分隔
      csvLines.push(`\n# ${tableName.toUpperCase()}`);

      // 添加表头
      const headers = Object.keys(records[0]);
      csvLines.push(headers.join(','));

      // 添加数据行
      for (const record of records) {
        const values = headers.map(header => {
          const value = record[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : String(value || '');
        });
        csvLines.push(values.join(','));
      }
    }

    return csvLines.join('\n');
  }

  /**
   * 计算校验和
   */
  private static async calculateChecksum(data: string): Promise<string> {
    // 简单的校验和计算
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 解析导入数据
   */
  private static async parseImportData(data: string): Promise<any> {
    try {
      const parsed = JSON.parse(data);

      // 检查是否为加密数据
      if (parsed.encryptedData && parsed.iv && parsed.salt) {
        const decryptResult = await EncryptionService.decryptData(
          parsed.encryptedData,
          parsed.iv,
          parsed.salt,
        );

        if (!decryptResult.success) {
          throw new Error('解密数据失败');
        }

        return JSON.parse(decryptResult.decryptedData);
      }

      return parsed;
    } catch (error) {
      throw new Error('解析导入数据失败');
    }
  }

  /**
   * 验证导入数据
   */
  private static async validateImportData(
    data: any,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // 检查数据结构
    if (!data.metadata || !data.data) {
      errors.push('无效的数据格式');
    }

    // 检查版本兼容性
    if (data.metadata?.version && data.metadata.version !== '1.0') {
      errors.push('不支持的数据版本');
    }

    // 验证数据完整性
    for (const [tableName, records] of Object.entries(data.data)) {
      if (Array.isArray(records)) {
        for (const record of records) {
          if (!record.id) {
            errors.push(`${tableName}表中发现无效记录`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 导入单条记录
   */
  private static async importRecord(
    dataType: DataType,
    record: any,
    config: ImportConfig,
  ): Promise<'imported' | 'skipped' | 'error'> {
    try {
      switch (dataType) {
        case DataType.USERS:
          return await this.importUserRecord(record, config);
        case DataType.CHECK_INS:
          return await this.importCheckInRecord(record, config);
        case DataType.AI_USAGE:
          return await this.importAiUsageRecord(record, config);
        case DataType.USER_QUOTAS:
          return await this.importQuotaRecord(record, config);
        default:
          return 'skipped';
      }
    } catch (error) {
      console.error('导入记录失败:', error);
      return 'error';
    }
  }

  /**
   * 导入用户记录
   */
  private static async importUserRecord(
    record: any,
    config: ImportConfig,
  ): Promise<'imported' | 'skipped'> {
    try {
      const existingUser = await UserRepository.getById(record.id);

      if (existingUser) {
        if (config.mergeStrategy === 'skip') {
          return 'skipped';
        } else if (config.mergeStrategy === 'overwrite') {
          await UserRepository.update(record.id, record);
          return 'imported';
        }
      } else {
        await UserRepository.create(record);
        return 'imported';
      }
    } catch (error) {
      console.error('导入用户记录失败:', error);
    }

    return 'skipped';
  }

  /**
   * 导入打卡记录
   */
  private static async importCheckInRecord(
    record: any,
    config: ImportConfig,
  ): Promise<'imported' | 'skipped'> {
    try {
      const existingRecord = await CheckInRepository.getById(record.id);

      if (!existingRecord) {
        await CheckInRepository.create(record);
        return 'imported';
      }
    } catch (error) {
      console.error('导入打卡记录失败:', error);
    }

    return 'skipped';
  }

  /**
   * 导入AI使用记录
   */
  private static async importAiUsageRecord(
    record: any,
    config: ImportConfig,
  ): Promise<'imported' | 'skipped'> {
    try {
      const existingRecord = await AiUsageRepository.getById(record.id);

      if (!existingRecord) {
        await AiUsageRepository.create(record);
        return 'imported';
      }
    } catch (error) {
      console.error('导入AI使用记录失败:', error);
    }

    return 'skipped';
  }

  /**
   * 导入配额记录
   */
  private static async importQuotaRecord(
    record: any,
    config: ImportConfig,
  ): Promise<'imported' | 'skipped'> {
    try {
      const existingRecord = await UserQuotaRepository.getById(record.id);

      if (!existingRecord) {
        await UserQuotaRepository.create(record);
        return 'imported';
      }
    } catch (error) {
      console.error('导入配额记录失败:', error);
    }

    return 'skipped';
  }
}
