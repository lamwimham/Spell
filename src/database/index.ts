// 数据库配置文件
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { appSchema, tableSchema } from '@nozbe/watermelondb';

// 定义应用模式
const mySchema = appSchema({
  version: 1,
  tables: [
    // 示例表结构，可以根据实际需求修改
    tableSchema({
      name: 'voice_items',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'file_path', type: 'string' },
        { name: 'duration', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'settings',
      columns: [
        { name: 'key', type: 'string' },
        { name: 'value', type: 'string' },
      ],
    }),
  ],
});

// 创建适配器
const adapter = new SQLiteAdapter({
  schema: mySchema,
});

// 创建数据库实例
const database = new Database({
  adapter,
  modelClasses: [
    // 在这里注册模型类
    // 示例:
    // Task,
  ],
});

export default database;
