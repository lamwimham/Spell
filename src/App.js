import notifee, { EventType } from '@notifee/react-native';
import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { initNotifee } from './services/notifications/notifeeService';
import { scheduleAllReminders } from './services/notifications/scheduleManager';

export default function App() {
  useEffect(() => {
    async function initApp() {
      await initNotifee(); // 初始化 Notifee
      await scheduleAllReminders(); // 恢复所有提醒
    }
    initApp();
  }, []);

  useEffect(() => {
    return notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        handleNotificationPress(detail.notification);
      }
    });
  }, []);

  useEffect(() => {
    const unsubscribe = notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        // 后台点击处理（不能执行 UI 操作，但可触发事件）
        console.log('后台点击通知', detail.notification);
        // 可发送事件给 Redux 或触发本地逻辑
      }
    });

    return unsubscribe;
  }, []);

  const handleNotificationPress = notification => {
    const { data } = notification;
    if (data?.type === 'clock_in_reminder') {
      // 跳转到打卡页面（需结合 Navigation）
      // 例如：navigation.navigate('ClockIn');
      console.log('跳转到打卡页面', data.id);
    }
  };

  return <NavigationContainer>{/* 你的页面 */}</NavigationContainer>;
}
