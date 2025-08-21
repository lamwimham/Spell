/**
 * 应用启动时的版本检查组件
 */
import { useVersionCheck } from '../hooks/useVersionCheck';
import { useEffect } from 'react';

/**
 * 应用启动时的版本检查组件
 * 用于在应用启动时自动检查版本更新
 */
export const VersionCheckStartup = () => {
  const { checkForUpdate } = useVersionCheck();

  useEffect(() => {
    // 应用启动时自动检查更新
    const timer = setTimeout(() => {
      checkForUpdate();
    }, 3000); // 延迟3秒检查更新，确保应用完全启动

    return () => clearTimeout(timer);
  }, [checkForUpdate]);

  return null; // 这个组件不渲染任何UI
};
