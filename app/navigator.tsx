// /src/app/navigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';


// 页面导入

import MD3TabBar from '@/components/MD3TarBar';
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
    <Stack.Navigator initialRouteName='HomePage' screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomePage" component={HomePage} />
    </Stack.Navigator>
  );
}

// Spell导航栈
function SpellStack() {
  return (
    <Stack.Navigator initialRouteName='SpellPage' screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SpellPage" component={SpellPage} />
      <Stack.Screen name="RecordPage" component={RecordPage} />
      <Stack.Screen name="PosterPage" component={PosterPage} />
    </Stack.Navigator>
  );
}

// Profile中心导航栈
function ProfileStack() {
  return (
    <Stack.Navigator initialRouteName='ProfilePage' screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfilePage" component={ProfilePage} options={{title: 'Profile'}} />
      <Stack.Screen name="CalendarPage" component={CalendarPage} />
    </Stack.Navigator>
  );
}

// /src/app/navigator.tsx

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <MD3TabBar {...props} />} // 使用自定义 TabBar
    >
      <Tab.Screen 
        name="Home"
        component={HomeStack}
        options={{
          headerShown: false,
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Spell"
        component={SpellStack}
        options={{
          headerShown: false,
          tabBarLabel: 'Spell',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          headerShown: false,
          tabBarLabel: 'My',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
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