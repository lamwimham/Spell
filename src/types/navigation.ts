import Recording from '../database/models/Recording';

// 全局导航参数类型定义
export type RootStackParamList = {
  Home: undefined;
  Welcome: undefined;
  Play: { recording: Recording };
  Settings: undefined;
  AddCard: undefined;
  Record:
    | {
        title?: string;
        script?: string;
        category?: string;
      }
    | undefined;
  AudioKitExample: undefined;
  ClockIn: undefined;
  Reminder: undefined;
  ThemeExample: undefined;
};
