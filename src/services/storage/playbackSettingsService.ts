import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PlaybackSettings {
  playMode: 'single' | 'loop';
  loopCount: number;
}

const PLAYBACK_SETTINGS_KEY = '@playback_settings';

export const savePlaybackSettings = async (settings: PlaybackSettings): Promise<void> => {
  await AsyncStorage.setItem(PLAYBACK_SETTINGS_KEY, JSON.stringify(settings));
};

export const getPlaybackSettings = async (): Promise<PlaybackSettings> => {
  const value = await AsyncStorage.getItem(PLAYBACK_SETTINGS_KEY);
  return value ? JSON.parse(value) : { playMode: 'single', loopCount: 1 };
};
