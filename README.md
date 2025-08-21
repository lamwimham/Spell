# SpellApp - React Native iOS 应用

一个基于 React Native 的语音库管理应用，支持语音文件的播放、管理和存储。

## 📋 目录

- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [开发指南](#开发指南)
- [通义千问 API 集成](#通义千问-api-集成)
- [测试](#测试)
- [构建和部署](#构建和部署)
- [故障排除](#故障排除)

## 🛠 环境要求

### 系统要求

- macOS (用于 iOS 开发)
- Node.js >= 18.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0
- Xcode >= 14.0 (用于 iOS 开发)
- CocoaPods >= 1.11.0

### 开发工具

- React Native CLI
- iOS Simulator (通过 Xcode 安装)
- Android Studio (可选，用于 Android 开发)

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd SpellApp
```

### 2. 安装依赖

```bash
# 安装 Node.js 依赖
npm install

# 安装 iOS 依赖 (仅 macOS)
cd ios && pod install && cd ..
```

### 3. 配置 React Native Vector Icons

由于项目使用了 `react-native-vector-icons`，需要进行额外配置：

#### iOS 配置

1. 打开 `ios/SpellApp.xcworkspace` (不是 .xcodeproj)
2. 在 Xcode 中，右键点击项目名称，选择 "Add Files to SpellApp"
3. 导航到 `node_modules/react-native-vector-icons/Fonts`
4. 选择所需的字体文件 (如 Ionicons.ttf)
5. 确保 "Add to target" 选中了你的应用目标
6. 在 `ios/SpellApp/Info.plist` 中添加字体：

```xml
<key>UIAppFonts</key>
<array>
    <string>Ionicons.ttf</string>
</array>
```

### 4. 启动开发服务器

```bash
# 启动 Metro bundler
npm start
```

### 5. 运行应用

在新的终端窗口中：

```bash
# iOS (推荐)
npm run ios

# 或者指定特定的模拟器
npx react-native run-ios --simulator="iPhone 15 Pro"

# Android (可选)
npm run android
```

## 📁 项目结构

```
SpellApp/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── ui/             # UI 组件库
│   │   └── providers/      # Context Providers
│   ├── screens/            # 页面组件
│   ├── navigation/         # 导航配置
│   ├── store/             # Redux 状态管理
│   ├── services/          # API 服务
│   ├── hooks/             # 自定义 Hooks
│   ├── constants/         # 常量定义
│   ├── assets/            # 静态资源
│   └── utils/             # 工具函数
├── __tests__/             # 测试文件
├── ios/                   # iOS 原生代码
├── android/               # Android 原生代码
└── package.json
```

## 🔧 开发指南

### 代码规范

项目使用 ESLint 和 Prettier 进行代码格式化：

```bash
# 检查代码规范
npm run lint

# 自动修复代码格式
npm run lint:fix

# 格式化代码
npm run format
```

### Git Hooks

项目配置了 Husky 和 lint-staged，在提交前会自动：

- 运行 ESLint 检查
- 格式化代码
- 运行测试

### 添加新页面

1. 在 `src/screens/` 创建新的页面组件
2. 在 `src/navigation/AppNavigator.tsx` 中添加路由配置
3. 更新相关的导航逻辑

### 状态管理

项目使用 Redux Toolkit 进行状态管理：

```typescript
// 创建新的 slice
import { createSlice } from '@reduxjs/toolkit';

const newSlice = createSlice({
  name: 'feature',
  initialState: {},
  reducers: {
    // 定义 reducers
  },
});
```

## 🤖 通义千问 API 集成

SpellApp 现在集成了通义千问 API，可以为应用提供强大的 AI 能力。

### 安装和配置

1. 获取 API Key：

   - 访问 [阿里云控制台](https://dashscope.console.aliyun.com/)
   - 创建应用并获取 API Key

2. 配置环境变量：
   ```bash
   # 在项目根目录创建 .env 文件
   echo "QWEN_API_KEY=your_api_key_here" > .env
   ```

### 使用方法

#### Hook 方式（推荐）

```typescript
import { useQwenChat } from './src/services/qwen';

const MyComponent = () => {
  const {
    loading,
    error,
    messages,
    sendMessage,
    resetConversation
  } = useQwenChat({
    apiKey: process.env.QWEN_API_KEY,
    model: 'qwen-max',
    parameters: {
      temperature: 0.8,
      max_tokens: 1500,
    }
  });

  const handleSend = async () => {
    try {
      await sendMessage("你好，通义千问！");
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    // 组件渲染逻辑
  );
};
```

#### 客户端方式

```typescript
import { QwenAPI } from './src/services/qwen';

const qwenAPI = new QwenAPI(process.env.QWEN_API_KEY);

const chatCompletion = async () => {
  try {
    const response = await qwenAPI.chatCompletion({
      model: 'qwen-max',
      input: {
        messages: [{ role: 'user', content: '你好，通义千问！' }],
      },
    });

    console.log(response.output.text);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### API 文档

#### 主要类型

- `QwenMessage`: 定义消息角色和内容
- `QwenChatRequest`: 聊天请求参数
- `QwenChatResponse`: 聊天响应格式

#### 支持的模型

- `qwen-turbo`: 速度快，成本低
- `qwen-plus`: 平衡速度和效果
- `qwen-max`: 效果最佳，适合复杂任务

#### 参数说明

- `temperature`: 控制随机性 (0-2)
- `top_p`: 核采样参数 (0-1)
- `max_tokens`: 最大生成长度
- `enable_search`: 是否启用互联网搜索

### 错误处理

API 封装包含完整的错误处理机制：

```typescript
try {
  const response = await qwenAPI.chatCompletion(request);
} catch (error) {
  if (error.message.includes('Qwen API Error')) {
    // 处理 API 错误
  } else if (error.message.includes('Network error')) {
    // 处理网络错误
  } else {
    // 处理其他错误
  }
}
```

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm test -- --coverage

# 监听模式运行测试
npm test -- --watch
```

### 测试结构

- 单元测试：`__tests__/` 目录
- 组件测试：使用 React Native Testing Library
- 集成测试：测试组件间的交互

### 编写测试

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../src/screens/HomeScreen';

describe('HomeScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Spell Library')).toBeTruthy();
  });
});
```

## 📱 构建和部署

### iOS 构建

1. **开发构建**

```bash
# 运行在模拟器
npm run ios

# 运行在真机 (需要开发者账号)
npx react-native run-ios --device
```

2. **发布构建**

```bash
# 在 Xcode 中
# 1. 选择 Product > Archive
# 2. 选择发布目标 (App Store, Ad Hoc, Enterprise)
# 3. 按照向导完成构建
```

### Android 构建

```bash
# 开发构建
npm run android

# 发布构建
cd android
./gradlew assembleRelease
```

### 环境配置

创建不同环境的配置文件：

```javascript
// config/development.js
export default {
  API_URL: 'https://dev-api.example.com',
  DEBUG: true
};

// config/production.js
export default {
  API_URL: 'https://api.example.com',
  DEBUG: false
};
```

## 🔍 故障排除

### 常见问题

1. **Metro bundler 启动失败**

```bash
# 清理缓存
npx react-native start --reset-cache
```

2. **iOS 构建失败**

```bash
# 清理 iOS 构建
cd ios
rm -rf build/
pod deintegrate
pod install
cd ..
```

3. **依赖安装问题**

```bash
# 删除 node_modules 重新安装
rm -rf node_modules
npm install
```

4. **模拟器问题**

```bash
# 重置 iOS 模拟器
xcrun simctl erase all
```

### 调试技巧

1. **使用 Flipper 调试**

   - 安装 Flipper 桌面应用
   - 在应用中启用 Flipper 集成

2. **React Native Debugger**

```bash
# 安装
brew install --cask react-native-debugger

# 启动
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

3. **日志调试**

```bash
# iOS 日志
npx react-native log-ios

# Android 日志
npx react-native log-android
```

### 性能优化

1. **Bundle 分析**

```bash
npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output ios-bundle.js --assets-dest ios-assets
```

2. **内存泄漏检测**
   - 使用 Xcode Instruments
   - 监控组件的挂载和卸载

## 📚 相关资源

- [React Native 官方文档](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [React Native Vector Icons](https://github.com/oblador/react-native-vector-icons)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 💾 WatermelonDB 版本信息存储

SpellApp 集成了 WatermelonDB 进行版本信息的本地持久化存储，支持离线版本检查和历史版本追踪。

### 核心功能

- **本地优先检查**: 首先查询本地数据库中的版本信息
- **离线支持**: 无网络时仍可进行版本检查
- **数据持久化**: 版本信息长期保存，支持历史追踪
- **自动清理**: 防止数据库无限增长

### 数据库架构

```typescript
// 版本表结构
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

### 使用方法

```typescript
import { versionAPI } from '../services/version/api';

// 基本版本检查
const result = await versionAPI.checkForUpdate();

// 直接使用Repository
import { versionRepository } from '../../database';
const latest = await versionRepository.getLatestVersion('ios');
```

## 📚 详细文档

项目包含以下详细技术文档：

- [数据库集成指南](docs/DATABASE_INTEGRATION.md) - WatermelonDB 集成说明
- [数据库迁移指南](docs/DATABASE_MIGRATION_GUIDE.md) - 数据库版本迁移规范
- [版本存储实现](docs/VERSION_STORAGE_IMPLEMENTATION.md) - 版本信息存储详细设计
- [WatermelonDB 版本存储总结](docs/WATERMELONDB_VERSION_STORAGE_SUMMARY.md) - 实现总结和最佳实践
- [播放屏幕优化](docs/PLAYSCREEN_OPTIMIZATION.md) - 播放界面性能优化
- [播放屏幕更新](docs/PLAYSCREEN_UPDATE.md) - 播放功能更新记录
- [版本更新说明](docs/VERSION_UPDATE.md) - 版本更新历史

## 📞 支持

如果遇到问题，请：

1. 查看 [故障排除](#故障排除) 部分
2. 搜索现有的 Issues
3. 创建新的 Issue 并提供详细信息

---

**注意**: 确保在开发前已正确配置所有环境要求，特别是 Xcode 和相关的开发工具。
