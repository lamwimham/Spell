import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import notifee from '@notifee/react-native';
import AddReminderForm from '../components/AddReminderForm';
import ReminderList from '../components/ReminderList';
import { getReminders, saveReminders, Reminder } from '../services/storage/storageService';
import { scheduleAllReminders } from '../services/notifications/scheduleManager';
import { useTheme } from '../hooks/useTheme';

export default function ReminderScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const { colors, textStyles, spacing, shadows } = useTheme();

  useEffect(() => {
    loadReminders();
    // 初始化通知权限
    initNotifications();
  }, []);

  // 初始化通知功能
  const initNotifications = async () => {
    // 请求通知权限，解决 notifee 未使用的警告
    await notifee.requestPermission();
  };

  const loadReminders = async () => {
    const savedReminders = await getReminders();
    setReminders(savedReminders);
  };

  const handleAddReminder = async (newReminder: Reminder) => {
    const updatedReminders = [...reminders, newReminder];
    setReminders(updatedReminders);
    await saveReminders(updatedReminders);
    await scheduleAllReminders();
  };

  const handleToggleReminder = async (id: string, enabled: boolean) => {
    const updatedReminders = reminders.map(reminder =>
      reminder.id === id ? { ...reminder, enabled } : reminder,
    );
    setReminders(updatedReminders);
    await saveReminders(updatedReminders);
    await scheduleAllReminders();
  };

  const handleDeleteReminder = async (id: string) => {
    const updatedReminders = reminders.filter(reminder => reminder.id !== id);
    setReminders(updatedReminders);
    await saveReminders(updatedReminders);
    await scheduleAllReminders();
  };

  const dynamicStyles = createStyles({ colors, textStyles, spacing, shadows });

  return (
    <View style={dynamicStyles.container}>
      <ReminderList
        reminders={reminders}
        onToggle={handleToggleReminder}
        onDelete={handleDeleteReminder}
        onAdd={() => {}}
      />
      <AddReminderForm onAdd={handleAddReminder} />
    </View>
  );
}

/**
 * 创建动态样式的函数
 */
const createStyles = ({ colors }: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });
