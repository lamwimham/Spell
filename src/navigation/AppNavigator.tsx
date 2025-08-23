import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import PlayScreen from '../screens/PlayScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AddCardScreen } from '../screens/AddCardScreen';
import { RecordScreen } from '../screens/RecordScreen';
import AudioKitExampleScreen from '../screens/AudioKitExampleScreen';
import ClockInScreen from '../screens/ClockInScreen';
import ReminderScreen from '../screens/ReminderScreen';
import ThemeExampleScreen from '../screens/ThemeExampleScreen';

// 用户管理相关页面
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UsageStatsScreen from '../screens/UsageStatsScreen';
import QuotaManagementScreen from '../screens/QuotaManagementScreen';
import CheckinScreen from '../screens/CheckinScreen';
// import { VersionCheckStartup } from '../components/VersionCheckStartup';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      {/* <VersionCheckStartup /> */}
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Play" component={PlayScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="AddCard" component={AddCardScreen} />
        <Stack.Screen name="Record" component={RecordScreen} />
        <Stack.Screen name="AudioKitExample" component={AudioKitExampleScreen} />
        <Stack.Screen name="ClockIn" component={ClockInScreen} />
        <Stack.Screen name="Reminder" component={ReminderScreen} />
        <Stack.Screen name="ThemeExample" component={ThemeExampleScreen} />

        {/* 用户认证相关页面 */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        {/* 用户管理相关页面 */}
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="UsageStats" component={UsageStatsScreen} />
        <Stack.Screen name="QuotaManagement" component={QuotaManagementScreen} />
        <Stack.Screen name="Checkin" component={CheckinScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
