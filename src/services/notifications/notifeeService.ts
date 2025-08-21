import notifee, { AndroidImportance } from '@notifee/react-native';

export async function initNotifee(): Promise<string> {
  // 请求通知权限
  await notifee.requestPermission();

  // 创建通知通道（Android 必需，iOS 忽略但建议统一处理）
  const channelId = await notifee.createChannel({
    id: 'reminder',
    name: '打卡提醒',
    importance: AndroidImportance.DEFAULT,
  });

  return channelId;
}
