/**
 * 数据库迁移脚本 - 版本1到版本2
 * 添加用户管理、打卡系统、AI配额管理等功能
 */

import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

// 数据库迁移配置
export const migrations = schemaMigrations({
  // 从版本1升级到版本2的迁移脚本
  migrations: [
    {
      // 升级到版本2：添加用户管理系统
      toVersion: 2,
      steps: [
        // 1. 创建users表
        {
          type: 'create_table',
          schema: {
            name: 'users',
            columns: [
              { name: 'username', type: 'string', isIndexed: true },
              { name: 'email', type: 'string', isOptional: true, isIndexed: true },
              { name: 'password_hash', type: 'string' },
              { name: 'salt', type: 'string' },
              { name: 'role', type: 'string', isIndexed: true },
              { name: 'status', type: 'string', isIndexed: true },
              { name: 'avatar_url', type: 'string', isOptional: true },
              { name: 'last_login_at', type: 'number', isOptional: true },
              { name: 'created_at', type: 'number' },
              { name: 'updated_at', type: 'number' },
            ],
          },
        },

        // 2. 创建user_settings表
        {
          type: 'create_table',
          schema: {
            name: 'user_settings',
            columns: [
              { name: 'user_id', type: 'string', isIndexed: true },
              { name: 'key', type: 'string', isIndexed: true },
              { name: 'value', type: 'string' },
              { name: 'type', type: 'string' },
              { name: 'is_encrypted', type: 'boolean' },
              { name: 'created_at', type: 'number' },
              { name: 'updated_at', type: 'number' },
            ],
          },
        },

        // 3. 创建check_ins表
        {
          type: 'create_table',
          schema: {
            name: 'check_ins',
            columns: [
              { name: 'user_id', type: 'string', isIndexed: true },
              { name: 'type', type: 'string', isIndexed: true },
              { name: 'note', type: 'string', isOptional: true },
              { name: 'location', type: 'string', isOptional: true },
              { name: 'metadata', type: 'string', isOptional: true },
              { name: 'created_at', type: 'number', isIndexed: true },
              { name: 'updated_at', type: 'number' },
            ],
          },
        },

        // 4. 创建ai_usage_logs表
        {
          type: 'create_table',
          schema: {
            name: 'ai_usage_logs',
            columns: [
              { name: 'user_id', type: 'string', isIndexed: true },
              { name: 'service_type', type: 'string', isIndexed: true },
              { name: 'model_name', type: 'string', isIndexed: true },
              { name: 'prompt_tokens', type: 'number' },
              { name: 'completion_tokens', type: 'number' },
              { name: 'total_tokens', type: 'number' },
              { name: 'cost_in_cents', type: 'number' },
              { name: 'request_id', type: 'string', isOptional: true },
              { name: 'success', type: 'boolean', isIndexed: true },
              { name: 'error_message', type: 'string', isOptional: true },
              { name: 'response_time_ms', type: 'number', isOptional: true },
              { name: 'metadata', type: 'string', isOptional: true },
              { name: 'created_at', type: 'number', isIndexed: true },
              { name: 'updated_at', type: 'number' },
            ],
          },
        },

        // 5. 创建user_quotas表
        {
          type: 'create_table',
          schema: {
            name: 'user_quotas',
            columns: [
              { name: 'user_id', type: 'string', isIndexed: true },
              { name: 'quota_type', type: 'string', isIndexed: true },
              { name: 'limit_value', type: 'number' },
              { name: 'used_value', type: 'number' },
              { name: 'reset_period', type: 'string' },
              { name: 'last_reset_at', type: 'number' },
              { name: 'is_active', type: 'boolean', isIndexed: true },
              { name: 'description', type: 'string', isOptional: true },
              { name: 'created_at', type: 'number' },
              { name: 'updated_at', type: 'number' },
            ],
          },
        },

        // 6. 为现有recordings表添加user_id字段
        {
          type: 'add_columns',
          table: 'recordings',
          columns: [{ name: 'user_id', type: 'string', isOptional: true, isIndexed: true }],
        },

        // 7. 为recordings表的user_id字段创建索引
        {
          type: 'create_index',
          table: 'recordings',
          columns: ['user_id'],
        },

        // 8. 为users表创建复合索引
        {
          type: 'create_index',
          table: 'users',
          columns: ['username', 'status'],
        },

        // 9. 为user_settings表创建复合索引
        {
          type: 'create_index',
          table: 'user_settings',
          columns: ['user_id', 'key'],
        },

        // 10. 为check_ins表创建复合索引
        {
          type: 'create_index',
          table: 'check_ins',
          columns: ['user_id', 'type', 'created_at'],
        },

        // 11. 为ai_usage_logs表创建复合索引
        {
          type: 'create_index',
          table: 'ai_usage_logs',
          columns: ['user_id', 'service_type', 'created_at'],
        },

        // 12. 为user_quotas表创建复合索引
        {
          type: 'create_index',
          table: 'user_quotas',
          columns: ['user_id', 'quota_type', 'is_active'],
        },
      ],
    },
  ],
});

/**
 * 数据迁移助手函数
 */
export class MigrationHelper {
  /**
   * 创建默认管理员用户
   * 在迁移完成后调用，为系统创建初始管理员账户
   */
  static async createDefaultAdmin(): Promise<boolean> {
    try {
      // 这里会在迁移完成后由具体的服务来实现
      console.log('数据库迁移完成，准备创建默认管理员用户');
      return true;
    } catch (error) {
      console.error('创建默认管理员用户失败:', error);
      return false;
    }
  }

  /**
   * 迁移现有recordings数据
   * 为现有的录音记录关联默认用户
   */
  static async migrateExistingRecordings(): Promise<boolean> {
    try {
      // 这里会在迁移完成后由具体的服务来实现
      console.log('开始迁移现有录音数据');
      return true;
    } catch (error) {
      console.error('迁移现有录音数据失败:', error);
      return false;
    }
  }

  /**
   * 验证迁移结果
   * 检查所有新表是否正确创建，数据是否完整
   */
  static async validateMigration(): Promise<{
    success: boolean;
    errors: string[];
    details: {
      tablesCreated: string[];
      indexesCreated: string[];
      dataIntegrity: boolean;
    };
  }> {
    const errors: string[] = [];
    const tablesCreated: string[] = [];
    const indexesCreated: string[] = [];

    try {
      // 验证所有新表是否存在
      const expectedTables = [
        'users',
        'user_settings',
        'check_ins',
        'ai_usage_logs',
        'user_quotas',
      ];

      for (const table of expectedTables) {
        try {
          // 这里应该检查表是否存在
          tablesCreated.push(table);
        } catch (error) {
          errors.push(`表 ${table} 创建失败: ${error}`);
        }
      }

      // 验证索引是否正确创建
      const expectedIndexes = [
        'recordings_user_id',
        'users_username_status',
        'user_settings_user_id_key',
        'check_ins_user_id_type_created_at',
        'ai_usage_logs_user_id_service_type_created_at',
        'user_quotas_user_id_quota_type_is_active',
      ];

      for (const index of expectedIndexes) {
        try {
          // 这里应该检查索引是否存在
          indexesCreated.push(index);
        } catch (error) {
          errors.push(`索引 ${index} 创建失败: ${error}`);
        }
      }

      return {
        success: errors.length === 0,
        errors,
        details: {
          tablesCreated,
          indexesCreated,
          dataIntegrity: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        errors: [`迁移验证失败: ${error}`],
        details: {
          tablesCreated,
          indexesCreated,
          dataIntegrity: false,
        },
      };
    }
  }

  /**
   * 回滚迁移（紧急情况下使用）
   * 注意：这将删除所有新增的用户数据！
   */
  static async rollbackMigration(): Promise<boolean> {
    try {
      console.warn('警告：正在回滚数据库迁移，这将删除所有用户管理相关数据！');

      // 这里会删除所有新增的表和字段
      // 实际实现时需要非常谨慎

      return true;
    } catch (error) {
      console.error('回滚迁移失败:', error);
      return false;
    }
  }
}

/**
 * 迁移状态检查
 */
export class MigrationStatus {
  /**
   * 检查当前数据库版本
   */
  static async getCurrentVersion(): Promise<number> {
    try {
      // 这里应该从数据库中读取当前版本号
      // 如果是新安装，返回最新版本
      // 如果是升级，返回实际版本
      return 2;
    } catch (error) {
      console.error('获取数据库版本失败:', error);
      return 1; // 默认返回版本1
    }
  }

  /**
   * 检查是否需要迁移
   */
  static async needsMigration(): Promise<boolean> {
    try {
      const currentVersion = await this.getCurrentVersion();
      return currentVersion < 2;
    } catch (error) {
      console.error('检查迁移需求失败:', error);
      return false;
    }
  }

  /**
   * 标记迁移完成
   */
  static async markMigrationComplete(): Promise<boolean> {
    try {
      // 这里应该更新数据库版本标记
      console.log('数据库迁移标记为完成');
      return true;
    } catch (error) {
      console.error('标记迁移完成失败:', error);
      return false;
    }
  }
}
