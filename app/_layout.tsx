import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
// app/_layout.tsx
import { store } from '@/store'; // 确保路径正确
import { Provider } from 'react-redux';

import { SafeAreaProvider } from 'react-native-safe-area-context'; // ✅ 引入 SafeAreaProvider

import { useColorScheme } from '@/hooks/useColorScheme';
import AppNavigator from './navigator';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SafeAreaProvider>
      <Provider store={store}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppNavigator />
        <StatusBar style="auto" />
      </ThemeProvider>
      </Provider>
    </SafeAreaProvider>
  );
}