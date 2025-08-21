// 版本管理API
import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';
import { APP_STORE_URLS } from '../../constants/version';

export interface AppVersion {
  id: string;
  version: string; // 版本号，如 "1.2.3"
  buildNumber: number; // 构建号
  platform: 'ios' | 'android'; // 平台
  releaseNotes: string; // 更新日志
  downloadUrl: string; // 下载链接
  forceUpdate: boolean; // 是否强制更新
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
}

export interface VersionCheckResponse {
  updateAvailable: boolean;
  latestVersion?: AppVersion;
  currentVersionInfo?: {
    version: string;
    buildNumber: number;
  };
}

// 模拟API客户端
class VersionAPI {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://api.spellapp.com') {
    this.baseUrl = baseUrl;
  }

  /**
   * 检查是否有新版本
   * @param currentVersion 当前版本号
   * @param currentBuildNumber 当前构建号
   * @param platform 平台
   * @returns 版本检查结果
   */
  async checkForUpdate(
    currentVersion: string,
    currentBuildNumber: number,
    platform: 'ios' | 'android',
  ): Promise<VersionCheckResponse> {
    try {
      // 在实际实现中，这里会调用真实的API
      // 模拟API调用
      const response = await this.simulateApiCall(currentVersion, currentBuildNumber, platform);
      return response;
    } catch (error) {
      console.error('检查更新失败:', error);
      return {
        updateAvailable: false,
      };
    }
  }

  /**
   * 模拟API调用
   */
  private async simulateApiCall(
    currentVersion: string,
    currentBuildNumber: number,
    platform: 'ios' | 'android',
  ): Promise<VersionCheckResponse> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    // 模拟版本数据（实际应该从数据库获取）
    const latestVersion: AppVersion = {
      id: '1',
      version: '1.2.0',
      buildNumber: 120,
      platform,
      releaseNotes: '1. 修复了一些已知问题\n2. 优化了用户体验\n3. 增加了新功能',
      downloadUrl: APP_STORE_URLS[platform],
      forceUpdate: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 比较版本
    const updateAvailable = this.isNewerVersion(
      latestVersion.version,
      latestVersion.buildNumber,
      currentVersion,
      currentBuildNumber,
    );

    return {
      updateAvailable,
      latestVersion: updateAvailable ? latestVersion : undefined,
      currentVersionInfo: {
        version: currentVersion,
        buildNumber: currentBuildNumber,
      },
    };
  }

  /**
   * 比较版本号
   */
  private isNewerVersion(
    latestVersion: string,
    latestBuild: number,
    currentVersion: string,
    currentBuild: number,
  ): boolean {
    // 简单的版本比较逻辑
    // 实际项目中可能需要更复杂的版本比较算法
    const latestParts = latestVersion.split('.').map(Number);
    const currentParts = currentVersion.split('.').map(Number);

    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
      const latest = latestParts[i] || 0;
      const current = currentParts[i] || 0;

      if (latest > current) return true;
      if (latest < current) return false;
    }

    // 版本号相同，比较构建号
    return latestBuild > currentBuild;
  }

  /**
   * 获取当前应用版本信息
   */
  getCurrentVersionInfo() {
    return {
      version: DeviceInfo.getVersion(),
      buildNumber: parseInt(DeviceInfo.getBuildNumber(), 10),
      platform: Platform.OS as 'ios' | 'android',
    };
  }
}

// 导出单例实例
export const versionAPI = new VersionAPI();
