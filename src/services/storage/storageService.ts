import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Reminder {
  id: string;
  hour: number;
  minute: number;
  enabled: boolean;
}

const STORAGE_KEY = '@clock_in_reminders';

export const saveReminders = async (reminders: Reminder[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
};

export const getReminders = async (): Promise<Reminder[]> => {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  return value ? JSON.parse(value) : [];
};
