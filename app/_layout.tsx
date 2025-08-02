import { } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { MD3LightTheme as DefaultTheme, MD3Theme, PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
// app/_layout.tsx
import { store } from '@/store'; // 确保路径正确
import { Provider } from 'react-redux';
// App.js 或 App.tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';

import { SafeAreaProvider } from 'react-native-safe-area-context'; // ✅ 引入 SafeAreaProvider

import AppNavigator from './navigator';
enableScreens();

// src/theme.ts

const customTheme: MD3Theme = {
  // 保持默认主题的结构
  ...DefaultTheme,

  // 自定义颜色
  colors: {
    ...DefaultTheme.colors,
    primary: '#FB4141',
    secondary: '#B4E50D',
    error: '#F44336',
  },
};


export default function RootLayout() {
  // const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <PaperProvider theme={customTheme}>
            <AppNavigator />
            <StatusBar style="auto" />
          </PaperProvider>
        </Provider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}