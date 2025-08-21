# WatermelonDB 数据库迁移规范

## 概述

本文档规定了 WatermelonDB 数据库的迁移规范，确保在增量开发过程中不会影响现有数据。

## 迁移原则

1. **数据安全第一**: 任何迁移都必须保证现有数据不丢失
2. **向后兼容**: 新版本必须兼容旧版本的数据结构
3. **渐进式升级**: 支持从任意旧版本迁移到最新版本
4. **测试验证**: 所有迁移都必须经过充分测试

## 迁移流程

### 1. 创建新的 Schema 版本

```typescript
// src/database/migrations/vXSchema.ts
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const vXSchema = appSchema({
  version: X, // 递增版本号
  tables: [
    // 包含所有现有表和新表
  ],
});
```

### 2. 创建迁移步骤

```typescript
// src/database/migrations/index.ts
{
  toVersion: X,
  migration: new Migration({
    from: X-1, // 从哪个版本迁移
    to: X,     // 迁移到哪个版本
    steps: [
      // 具体的迁移操作
    ],
  }),
}
```

### 3. 更新迁移配置

- 在`migrations/index.ts`中添加新的迁移配置
- 更新`getLatestSchema()`返回最新 schema
- 确保所有迁移步骤都正确配置

### 4. 测试迁移

- 编写迁移测试用例
- 验证数据完整性
- 测试回滚场景（如需要）

## 支持的迁移操作

### 表操作

- `create_table` - 创建新表
- `add_columns` - 向现有表添加列
- `drop_columns` - 删除列（谨慎使用）
- `rename_table` - 重命名表

### 数据操作

- `sql` - 执行自定义 SQL 语句
- `unsafe_raw` - 执行原始 SQL（慎用）

## 最佳实践

### 1. 添加新表

```typescript
{
  type: 'create_table',
  name: 'new_table',
  columns: [
    { name: 'column1', type: 'string' },
    { name: 'column2', type: 'number' },
  ],
}
```

### 2. 添加新列

```typescript
{
  type: 'add_columns',
  table: 'existing_table',
  columns: [
    { name: 'new_column', type: 'string' },
  ],
}
```

### 3. 数据转换

```typescript
{
  type: 'sql',
  sql: 'UPDATE existing_table SET new_column = old_column || "_suffix"',
}
```

## 迁移测试

每个迁移都必须包含测试：

```typescript
// 测试数据迁移
test('should migrate data correctly', async () => {
  // 创建旧版本数据库
  // 插入测试数据
  // 执行迁移
  // 验证数据完整性
});
```

## 版本管理

- 每次数据库结构变更都必须增加版本号
- 版本号从 1 开始递增
- 必须提供从每个旧版本到新版本的迁移路径

## 紧急情况处理

### 迁移失败

如果迁移失败，WatermelonDB 会：

1. 回滚所有更改
2. 保持数据库在旧版本状态
3. 抛出错误信息

### 数据恢复

- 定期备份数据库
- 提供数据导出功能
- 记录迁移日志

## 示例：从 v1 到 v2 的迁移

```typescript
{
  toVersion: 2,
  migration: new Migration({
    from: 1,
    to: 2,
    steps: [
      {
        type: 'create_table',
        name: 'versions',
        columns: [...],
      },
    ],
  }),
}
```

## 注意事项

1. **不要删除现有表**: 除非确定数据不再需要
2. **谨慎修改列类型**: 类型变更可能导致数据丢失
3. **测试所有边缘情况**: 空数据、异常数据等
4. **文档化所有变更**: 记录每个版本的变更内容

通过遵循本规范，可以确保数据库迁移过程安全、可靠，不会影响现有功能和数据。
