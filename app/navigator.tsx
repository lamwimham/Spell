// /src/app/navigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

// 页面导入

import HomePage from './main/home/page';
import PosterPage from './main/poster/page';
import RecordPage from './main/record/page';
import SpellPage from './main/spell/page';
import CalendarPage from './profile/calendar/page';
import ProfilePage from './profile/page';
import WelcomePage from './welcome/page';

// 创建导航器
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Home导航栈
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomePage" component={HomePage} />
    </Stack.Navigator>
  );
}

// Spell导航栈
function SpellStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SpellPage" component={SpellPage} />
      <Stack.Screen name="RecordPage" component={RecordPage} />
      <Stack.Screen name="PosterPage" component={PosterPage} />
    </Stack.Navigator>
  );
}

// Profile中心导航栈
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfilePage" component={ProfilePage} options={{title: 'Profile'}} />
      <Stack.Screen name="CalendarPage" component={CalendarPage} />
    </Stack.Navigator>
  );
}

// 底部 Tab 导航
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';

          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Spell') iconName = focused ? 'sparkles' : 'sparkles-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ headerShown: false }} />
      <Tab.Screen name="Spell" component={SpellStack} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

// 根导航器
export default function AppNavigator() {
  return (
      <Stack.Navigator initialRouteName="MainTabs" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomePage} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
  );
}