# PlayScreen 功能更新说明

## 更新内容

### 1. 参数接收和处理

- PlayScreen 现在可以正确接收来自 HomeScreen 的咒语参数
- 支持响应式数据更新，当咒语数据在数据库中发生变化时，界面会自动更新

### 2. 音频播放控制

- 集成了 useAudioKit hook 实现完整的音频播放控制
- 支持播放、暂停、继续、停止等操作
- 实时进度显示和拖拽控制

### 3. 脚本内容显示

- 自动显示咒语关联的脚本文案
- 提供良好的阅读体验

### 4. 播放统计

- 自动增加播放次数
- 显示播放统计数据

## 功能特性

### 参数传递

HomeScreen 通过导航传递完整的 Recording 对象：

```typescript
navigation.navigate('Play', { recording: item });
```

### 响应式更新

使用 WatermelonDB 的响应式特性：

```typescript
const recording = useRecording(recordingParam?.id || null);
```

### 播放控制

集成音频播放功能：

- 播放/暂停切换
- 停止播放
- 进度控制
- 播放次数统计

### 界面优化

- 错误处理和边界情况处理
- 加载状态显示
- 用户友好的提示信息

## 使用方式

1. 在 HomeScreen 中点击咒语项目
2. PlayScreen 接收咒语参数并加载音频文件
3. 用户可以播放音频并查看脚本文案
4. 播放次数自动增加并实时显示
