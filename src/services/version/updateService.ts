import { Linking, Platform, Alert } from 'react-native';
import { versionAPI, AppVersion } from './api';

/**
 * 版本更新服务
 * 处理应用版本检查、下载和安装
 */
class VersionUpdateService {
  /**
   * 检查是否有新版本
   */
  async checkForUpdate(): Promise<{
    updateAvailable: boolean;
    latestVersion?: AppVersion;
    currentVersion: string;
    currentBuildNumber: number;
  }> {
    try {
      // 获取当前应用版本信息
      const currentVersion = this.getCurrentVersion();
      const currentBuildNumber = this.getCurrentBuildNumber();
      const platform = Platform.OS as 'ios' | 'android';

      // 调用版本检查API
      const response = await versionAPI.checkForUpdate(
        currentVersion,
        currentBuildNumber,
        platform,
      );

      return {
        updateAvailable: response.updateAvailable,
        latestVersion: response.latestVersion,
        currentVersion,
        currentBuildNumber,
      };
    } catch (error) {
      console.error('检查版本更新失败:', error);
      throw new Error('检查更新失败，请稍后重试');
    }
  }

  /**
   * 获取当前应用版本号
   */
  getCurrentVersion(): string {
    // 这里应该是实际的版本获取逻辑
    // 暂时返回模拟数据
    return '1.0.0';
  }

  /**
   * 获取当前构建号
   */
  getCurrentBuildNumber(): number {
    // 这里应该是实际的构建号获取逻辑
    // 暂时返回模拟数据
    return 100;
  }

  /**
   * 下载更新
   */
  async downloadUpdate(version: AppVersion): Promise<void> {
    try {
      // 在实际应用中，这里会处理APK或IPA文件的下载
      // 对于iOS应用，通常会直接跳转到App Store
      // 对于Android应用，可能需要下载APK文件

      if (Platform.OS === 'ios') {
        // iOS应用跳转到App Store
        await this.openAppStore(version.downloadUrl);
      } else {
        // Android应用可以下载APK或跳转到应用商店
        await this.openAppStore(version.downloadUrl);
      }
    } catch (error) {
      console.error('下载更新失败:', error);
      throw new Error('下载更新失败，请稍后重试');
    }
  }

  /**
   * 打开应用商店
   */
  async openAppStore(url: string): Promise<void> {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        throw new Error('无法打开应用商店');
      }
    } catch (error) {
      console.error('打开应用商店失败:', error);
      throw new Error('无法打开应用商店，请手动搜索应用进行更新');
    }
  }

  /**
   * 显示更新提示
   */
  showUpdatePrompt(
    latestVersion: AppVersion,
    currentVersion: string,
    onDownload: () => void,
    onCancel?: () => void,
  ): void {
    const isForceUpdate = latestVersion.forceUpdate;

    const title = isForceUpdate ? '重要更新' : '发现新版本';
    const message = `${
      isForceUpdate ? '检测到重要更新，建议立即升级以获得最佳体验。' : ''
    }当前版本: ${currentVersion}
最新版本: ${latestVersion.version}

更新内容:
${latestVersion.releaseNotes}`;

    const actions = [
      {
        text: '稍后更新',
        onPress: onCancel || (() => {}),
        style: 'cancel' as const,
      },
      {
        text: '立即更新',
        onPress: onDownload,
      },
    ];

    // 如果是强制更新，移除"稍后更新"选项
    const alertActions = isForceUpdate ? [actions[1]] : actions;

    Alert.alert(title, message, alertActions, {
      cancelable: !isForceUpdate,
    });
  }
}

export const versionUpdateService = new VersionUpdateService();
