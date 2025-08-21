# WatermelonDB 录音功能集成说明

## 功能概述

本项目集成了 WatermelonDB 作为本地数据库，用于存储和管理录音信息。通过响应式特性，实现了录音的增删改查操作，并确保 UI 能够实时更新。

## 核心组件

### 1. 数据模型 (Recording Model)

- 位置: `src/database/models/Recording.js`
- 字段:
  - `title`: 录音标题
  - `script`: 录音脚本内容
  - `url`: 录音文件路径
  - `duration`: 录音时长(秒)
  - `playCount`: 播放次数
  - `recordingTime`: 录音时间戳
  - `createdAt`: 创建时间
  - `updatedAt`: 更新时间

### 2. 数据访问层 (Repository)

- 位置: `src/database/repositories/RecordingRepository.ts`
- 提供方法:
  - `create()`: 创建录音记录
  - `getAll()`: 获取所有录音(静态查询)
  - `getById()`: 根据 ID 获取录音(静态查询)
  - `update()`: 更新录音信息
  - `delete()`: 删除录音
  - `incrementPlayCount()`: 增加播放次数
  - `observeAll()`: 观察所有录音(响应式查询)
  - `observeById()`: 观察单个录音(响应式查询)
  - `observeWithQuery()`: 条件观察录音(响应式查询)
  - `getCount()`: 获取录音总数(静态查询)
  - `observeCount()`: 观察录音总数(响应式查询)

### 3. 业务逻辑层 (React Hooks)

- 位置: `src/hooks/useRecordings.ts`
- 提供 Hooks:
  - `useRecordings()`: 获取所有录音列表
  - `useRecordingsQuery()`: 条件查询录音列表
  - `useRecording()`: 获取单个录音详情
  - `useRecordingsCount()`: 获取录音总数
  - `useRecordingActions()`: 录音操作方法集合

## 使用示例

### 在组件中使用响应式录音列表:

```typescript
import { useRecordings } from '../hooks/useRecordings';

const RecordingList = () => {
  const recordings = useRecordings();

  return (
    <FlatList
      data={recordings}
      renderItem={({ item }) => <RecordingItem recording={item} />}
      keyExtractor={item => item.id}
    />
  );
};
```

### 创建新录音:

```typescript
import { useRecordingActions } from '../hooks/useRecordings';

const RecordingForm = () => {
  const { createRecording } = useRecordingActions();

  const handleSave = async () => {
    const result = await createRecording({
      title: 'My Recording',
      url: '/path/to/recording.m4a',
      duration: 120,
    });

    if (result.success) {
      console.log('录音保存成功');
    }
  };
};
```

### 删除录音:

```typescript
import { useRecordingActions } from '../hooks/useRecordings';

const RecordingItem = ({ recordingId }) => {
  const { deleteRecording } = useRecordingActions();

  const handleDelete = async () => {
    const result = await deleteRecording(recordingId);
    if (result.success) {
      console.log('录音删除成功');
    }
  };
};
```

## 响应式特性

通过使用 WatermelonDB 的 `observe()` 方法和 React 的 `useObservable` Hook，实现了数据的响应式更新：

1. 当数据库中的录音数据发生变化时，所有订阅了该数据的组件会自动重新渲染
2. 无需手动刷新或重新查询数据
3. 提供了更好的用户体验和性能优化

## 错误处理

所有操作方法都包含了错误处理机制，返回统一的响应格式:

```typescript
{
  success: boolean;
  data?: any;
  error?: string;
}
```

## 测试

相关测试文件位于 `__tests__/useRecordings.test.ts`，包含了对核心功能的单元测试。
