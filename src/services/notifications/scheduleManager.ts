import notifee, { TriggerType, RepeatFrequency } from '@notifee/react-native';
import { getReminders, Reminder } from '../storage/storageService';

// 安排所有已保存的提醒
export async function scheduleAllReminders(): Promise<void> {
  const reminders: Reminder[] = await getReminders();
  await cancelAllScheduledNotifications(); // 先清除旧的

  const channelId = await notifee.createChannel({
    id: 'reminder',
    name: '打卡提醒',
  });

  for (const reminder of reminders) {
    const { id, hour, minute, enabled } = reminder;
    if (!enabled) continue;

    const triggerTime = getNextTriggerTime(hour, minute);

    await notifee.createTriggerNotification(
      {
        id: `reminder_${id}`,
        title: '⏰ 打卡提醒',
        body: '记得完成今天的打卡任务哦！',
        data: { type: 'clock_in_reminder', id },
        android: {
          channelId,
          smallIcon: 'ic_notification',
        },
        ios: {
          foregroundPresentationOptions: {
            alert: true,
            sound: true,
          },
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerTime,
        repeatFrequency: RepeatFrequency.DAILY, // 每天重复
      },
    );
  }

  // 添加一个5分钟后触发的测试通知
  await scheduleTestNotification();
}

// 计算明天指定时间的时间戳
function getNextTriggerTime(hour: number, minute: number): number {
  const now = new Date();
  const trigger = new Date(now);
  trigger.setHours(hour, minute, 0, 0);

  // 如果今天的时间已过，则设为明天
  if (trigger <= now) {
    trigger.setDate(trigger.getDate() + 1);
  }

  return trigger.getTime();
}

// 取消所有已安排的打卡提醒
export async function cancelAllScheduledNotifications(): Promise<void> {
  const ids = await notifee.getTriggerNotificationIds();
  const reminderIds = ids.filter(id => id.startsWith('reminder_'));
  for (const id of reminderIds) {
    await notifee.cancelTriggerNotification(id);
  }
}

// 安排一个5分钟后触发的测试通知
export async function scheduleTestNotification(): Promise<void> {
  try {
    const channelId = await notifee.createChannel({
      id: 'test_reminder',
      name: '测试提醒',
    });

    // 设置5分钟后触发
    const triggerTime = Date.now() + 5 * 60 * 1000;

    await notifee.createTriggerNotification(
      {
        id: 'test_reminder_5min',
        title: '⏰ 测试提醒',
        body: '这是一个5分钟后触发的测试通知！',
        data: { type: 'test_reminder' },
        android: {
          channelId,
          smallIcon: 'ic_notification',
        },
        ios: {
          foregroundPresentationOptions: {
            alert: true,
            sound: true,
          },
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerTime,
      },
    );

    console.log('测试通知已安排');
  } catch (error) {
    console.error('安排测试通知时出错:', error);
  }
}
