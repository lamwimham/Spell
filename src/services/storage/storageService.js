import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@clock_in_reminders';

export const saveReminders = async reminders => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
};

export const getReminders = async () => {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  return value ? JSON.parse(value) : [];
};
