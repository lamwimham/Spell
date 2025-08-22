import { useEffect, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { versionAPI, VersionCheckResponse } from '../services/version/api';

/**
 * 版本检查Hook
 * 用于检查应用是否有新版本可用
 */
export const useVersionCheck = () => {
  /**
   * 检查版本更新
   */
  const checkForUpdate = useCallback(async (showNoUpdateMessage: boolean = false) => {
    try {
      // 获取当前应用版本信息
      const versionInfo = versionAPI.getCurrentVersionInfo();
      const { version: currentVersion, buildNumber: currentBuildNumber, platform } = versionInfo;

      console.log('当前版本信息:', versionInfo);

      // 调用版本检查API
      const response: VersionCheckResponse = await versionAPI.checkForUpdate(
        currentVersion,
        currentBuildNumber,
        platform,
      );

      console.log('版本检查结果:', response);

      if (response.updateAvailable && response.latestVersion) {
        // 有新版本可用，显示更新提示
        showUpdateAlert(response);
      } else if (showNoUpdateMessage) {
        // 没有新版本，显示提示（如果需要）
        Alert.alert('提示', '当前已是最新版本');
      }
    } catch (error) {
      console.error('检查版本更新失败:', error);
      if (showNoUpdateMessage) {
        Alert.alert('错误', '检查更新失败，请稍后重试');
      }
    }
  }, []);

  /**
   * 显示更新提示弹窗
   */
  const showUpdateAlert = (response: VersionCheckResponse) => {
    if (!response.latestVersion) return;

    const { latestVersion, currentVersionInfo } = response;
    const isForceUpdate = latestVersion.forceUpdate;

    const title = isForceUpdate ? '重要更新' : '发现新版本';
    const message = `${
      isForceUpdate ? '检测到重要更新，建议立即升级以获得最佳体验。\\n\\n' : ''
    }当前版本: ${currentVersionInfo?.version || '未知'}\\n最新版本: ${
      latestVersion.version
    }\\n\\n更新内容:\\n${latestVersion.releaseNotes}`;

    const actions = [
      {
        text: '稍后更新',
        onPress: () => {},
        style: 'cancel' as const,
      },
      {
        text: '立即更新',
        onPress: () => {
          // 打开应用商店
          openAppStore(latestVersion.downloadUrl);
        },
      },
    ];

    // 如果是强制更新，移除"稍后更新"选项
    const alertActions = isForceUpdate ? [actions[1]] : actions;

    Alert.alert(title, message, alertActions, {
      cancelable: !isForceUpdate,
    });
  };

  /**
   * 打开应用商店
   */
  const openAppStore = (url: string) => {
    Linking.openURL(url).catch(err => {
      console.error('打开应用商店失败:', err);
      Alert.alert('错误', '无法打开应用商店，请手动搜索应用进行更新');
    });
  };

  /**
   * 应用启动时自动检查更新
   * 注意：此逻辑已移至 VersionCheckStartup 组件中，避免重复检查
   */
  // useEffect(() => {
  //   // 延迟检查更新，确保应用完全启动
  //   const timer = setTimeout(() => {
  //     checkForUpdate();
  //   }, 3000);

  //   return () => clearTimeout(timer);
  // }, [checkForUpdate]);

  return {
    checkForUpdate,
  };
};
