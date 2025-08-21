/**
 * 版本更新服务测试
 */
import { versionAPI } from '../src/services/version/api';

// 模拟设备信息
jest.mock('react-native-device-info', () => ({
  getVersion: () => '1.0.0',
  getBuildNumber: () => '100',
}));

// 模拟Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: (obj: any) => obj.ios,
}));

describe('Version Update Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should check for updates and return false when no update is available', async () => {
    const result = await versionAPI.checkForUpdate('1.0.0', 100, 'ios');
    expect(result.updateAvailable).toBe(false);
  });

  test('should check for updates and return true when update is available', async () => {
    const result = await versionAPI.checkForUpdate('1.0.0', 90, 'ios');
    expect(result.updateAvailable).toBe(true);
  });

  test('should compare versions correctly', () => {
    // 测试版本比较逻辑
    expect(versionAPI.isNewerVersion('1.2.0', 120, '1.1.0', 110)).toBe(true);
    expect(versionAPI.isNewerVersion('1.1.0', 110, '1.2.0', 120)).toBe(false);
    expect(versionAPI.isNewerVersion('1.1.0', 120, '1.1.0', 110)).toBe(true);
    expect(versionAPI.isNewerVersion('1.1.0', 110, '1.1.0', 120)).toBe(false);
  });
});
