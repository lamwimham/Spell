# 版本更新功能说明

## 功能概述

SpellApp 包含完整的版本更新检查功能，允许用户检查新版本并在应用商店中更新应用。

## 功能组件

### 1. 版本 API 服务 (`src/services/version/api.ts`)

- 检查应用版本更新
- 比较版本号
- 获取当前应用版本信息

### 2. 版本更新服务 (`src/services/version/updateService.ts`)

- 处理版本更新逻辑
- 打开应用商店链接
- 显示更新提示

### 3. 版本检查 Hook (`src/hooks/useVersionCheck.ts`)

- React Hook 封装版本检查逻辑
- 自动在应用启动时检查更新
- 提供手动检查更新功能

### 4. 版本检查启动组件 (`src/components/VersionCheckStartup.tsx`)

- 在应用启动时自动检查更新
- 3 秒延迟检查以确保应用完全启动

### 5. 设置面板集成 (`src/components/ui/SettingsPanel.tsx`)

- 在设置页面显示当前版本信息
- 提供手动检查更新按钮

## 使用方法

### 自动检查更新

应用会在启动后 3 秒自动检查是否有新版本可用。

### 手动检查更新

用户可以在设置页面点击"检查更新"按钮手动检查新版本。

## 配置

### 应用商店链接

在 `src/constants/version.ts` 中配置应用商店链接：

```typescript
export const APP_STORE_URLS = {
  ios: 'https://apps.apple.com/app/idYOUR_APP_ID',
  android: 'https://play.google.com/store/apps/details?id=com.yourpackage.name',
};
```

### 版本检查 API

版本检查 API 目前使用模拟数据，在实际部署时需要连接到真实的 API 端点。

## 测试

运行版本更新相关测试：

```bash
npm test __tests__/versionUpdate.test.ts
```
