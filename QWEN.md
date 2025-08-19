# SpellApp - React Native iOS 应用

## 项目概述

SpellApp 是一个基于 React Native 的语音库管理应用，主要用于语音文件的播放、管理和存储。它为用户提供了一个直观的界面来管理他们的语音内容。

### 主要技术栈

- **核心框架**: React Native 0.81.0
- **状态管理**: Redux Toolkit
- **导航**: React Navigation (Native Stack)
- **UI 组件**: React Native Vector Icons, React Native SVG
- **开发工具**: TypeScript, ESLint, Prettier, Jest
- **平台**: iOS (主要), Android (支持)

## 项目结构

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

## 核心功能

1. **语音库管理**: 在 HomeScreen 中展示语音文件列表，支持删除模式和选择操作。
2. **录音功能**: RecordScreen 提供录音、暂停、继续、停止、保存和播放录音的功能。
3. **音频播放**: PlayScreen 提供音频播放控制，包括播放/暂停、进度条调节等。
4. **设置页面**: SettingsScreen 提供应用设置功能。
5. **添加卡片**: AddCardScreen 允许用户添加新的语音卡片。

## 开发环境与构建

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0
- Xcode >= 14.0 (用于 iOS 开发)
- CocoaPods >= 1.11.0

### 构建和运行

```bash
# 安装依赖
npm install

# iOS 依赖安装 (仅 macOS)
cd ios && pod install && cd ..

# 启动 Metro bundler
npm start

# 运行 iOS 应用
npm run ios

# 运行 Android 应用
npm run android
```

## 开发规范

项目使用 ESLint 和 Prettier 进行代码格式化和检查：

```bash
# 检查代码规范
npm run lint

# 自动修复代码格式
npm run lint:fix

# 格式化代码
npm run format
```

Git Hooks 通过 Husky 和 lint-staged 在提交前自动运行检查和测试。

## 测试

使用 Jest 和 React Native Testing Library 进行测试：

```bash
# 运行所有测试
npm test

# 监听模式运行测试
npm test -- --watch
```
