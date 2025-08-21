# WatermelonDB 版本信息存储实现

## 概述

本实现将版本检查信息持久化存储到本地 WatermelonDB 数据库中，支持离线版本检查和历史版本追踪。

## 架构设计

### 数据库 Schema (v2)

```typescript
tableSchema({
  name: 'versions',
  columns: [
    { name: 'version', type: 'string' }, // 版本号
    { name: 'build_number', type: 'number' }, // 构建号
    { name: 'platform', type: 'string' }, // 平台 (ios/android)
    { name: 'release_notes', type: 'string' }, // 更新日志
    { name: 'download_url', type: 'string' }, // 下载链接
    { name: 'force_update', type: 'boolean' }, // 是否强制更新
    { name: 'checked_at', type: 'number' }, // 检查时间戳
    { name: 'created_at', type: 'number' }, // 创建时间
    { name: 'updated_at', type: 'number' }, // 更新时间
  ],
});
```

### 数据模型 (Version Model)

- 继承自 WatermelonDB 的 Model 基类
- 使用装饰器定义字段映射
- 支持自动时间戳管理

### 版本仓库 (VersionRepository)

提供以下核心功能：

- `saveVersionInfo()` - 保存版本信息
- `getLatestVersion()` - 获取最新版本
- `getVersionHistory()` - 获取版本历史
- `hasForceUpdate()` - 检查强制更新
- `cleanupOldVersions()` - 清理旧版本

## 工作流程

### 版本检查流程

1. **本地优先检查**: 首先查询本地数据库中的版本信息
2. **远程回退**: 如果本地没有数据，调用远程 API
3. **数据持久化**: 将远程版本信息保存到数据库
4. **自动清理**: 保留最近 10 条版本记录

### 离线支持

- 无网络时使用本地存储的版本信息
- 支持历史版本信息查看
- 确保版本检查功能的可用性

## 核心优势

1. **性能优化**: 减少远程 API 调用，提升响应速度
2. **离线支持**: 无网络时仍可进行版本检查
3. **数据持久化**: 版本信息长期保存，支持历史追踪
4. **自动清理**: 防止数据库无限增长

## 使用方法

### 基本版本检查

```typescript
import { versionAPI } from '../services/version/api';

const result = await versionAPI.checkForUpdate(currentVersion, currentBuildNumber, platform);
```

### 直接使用 Repository

```typescript
import { versionRepository } from '../../database';

// 保存版本信息
await versionRepository.saveVersionInfo(versionInfo);

// 获取最新版本
const latest = await versionRepository.getLatestVersion('ios');
```

## 测试验证

包含完整的单元测试，验证：

- 版本信息存储功能
- 版本检索功能
- 版本比较逻辑
- 数据清理机制

## 向后兼容

- 数据库 schema 从 v1 升级到 v2
- 保持现有 API 接口不变
- 无缝集成到现有版本检查流程
