import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 2, // 升级到版本2以支持用户管理系统
  tables: [
    // 现有录音表 - 添加用户关联
    tableSchema({
      name: 'recordings',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'script', type: 'string' },
        { name: 'url', type: 'string' },
        { name: 'duration', type: 'number' },
        { name: 'play_count', type: 'number' },
        { name: 'recording_time', type: 'number' },
        { name: 'user_id', type: 'string' }, // 新增：关联用户ID
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // 用户表 - 本地优先的用户管理
    tableSchema({
      name: 'users',
      columns: [
        { name: 'username', type: 'string' },
        { name: 'email', type: 'string', isOptional: true },
        { name: 'password_hash', type: 'string' },
        { name: 'avatar_url', type: 'string', isOptional: true },
        { name: 'status', type: 'string' }, // active, suspended
        { name: 'role', type: 'string' }, // admin, user, premium
        { name: 'last_login_at', type: 'number', isOptional: true },
        { name: 'sync_id', type: 'string', isOptional: true }, // 云端同步预留
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // 用户设置表 - 灵活的键值对设置存储
    tableSchema({
      name: 'user_settings',
      columns: [
        { name: 'user_id', type: 'string' },
        { name: 'key', type: 'string' },
        { name: 'value', type: 'string' },
        { name: 'type', type: 'string' }, // string, number, boolean, json
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // 打卡记录表 - 用户每日打卡与情绪记录
    tableSchema({
      name: 'check_ins',
      columns: [
        { name: 'user_id', type: 'string' },
        { name: 'date', type: 'string' }, // YYYY-MM-DD 格式
        { name: 'check_in_time', type: 'number' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'mood_score', type: 'number', isOptional: true }, // 1-5 情绪评分
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // AI使用记录表 - 详细的API调用统计
    tableSchema({
      name: 'ai_usage_logs',
      columns: [
        { name: 'user_id', type: 'string' },
        { name: 'service_type', type: 'string' }, // qwen, openai
        { name: 'endpoint', type: 'string' },
        { name: 'tokens_used', type: 'number' },
        { name: 'cost_estimate', type: 'number' }, // 成本估算（分）
        { name: 'status', type: 'string' }, // success, error, timeout
        { name: 'error_message', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),

    // 用户配额表 - 灵活的配额管理系统
    tableSchema({
      name: 'user_quotas',
      columns: [
        { name: 'user_id', type: 'string' },
        { name: 'service_type', type: 'string' },
        { name: 'quota_type', type: 'string' }, // daily, monthly, total
        { name: 'quota_limit', type: 'number' },
        { name: 'quota_used', type: 'number' },
        { name: 'reset_date', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
