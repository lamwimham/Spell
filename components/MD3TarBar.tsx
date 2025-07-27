// /src/components/MD3TabBar.tsx
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';


interface TabBarItemProps {
  label: string;
  icon: string;
  focused: boolean;
  onPress: () => void;
}

const TabBarItem = ({ label, icon, focused, onPress }: TabBarItemProps) => {
  const theme = useTheme();
  const color = focused ? theme.colors.primary : theme.colors.onSurfaceVariant;

  return (
    <TouchableOpacity style={[styles.tabItem]} onPress={onPress}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={{ color, fontSize: 10, marginTop: 4 }}>{label}</Text>
    </TouchableOpacity>
  );
};

// ... 其他导入保持不变 ...

export default function MD3TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  return (
    <View style={[styles.container, {paddingBottom: insets.bottom}]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        
        // 安全地处理标签文本
        let label: string;
        const labelNode = options.tabBarLabel;
        
        if (typeof labelNode === 'string') {
          label = labelNode;
        } else if (React.isValidElement(labelNode)) {
          // 使用类型断言明确 props 结构
          const props = labelNode.props as { children?: any };
          if (typeof props?.children === 'string') {
            label = props.children;
          } else {
            label = options.title ?? route.name;
          }
        } else {
          label = options.title ?? route.name;
        }

        const color = isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant;
        // 安全地处理图标
        console.log(color);
        const tabBarIconResult = options.tabBarIcon?.({ 
          focused: isFocused, 
          color: color, 
          size: 24 
        });
        
        let icon = 'ellipse-outline';
        if (tabBarIconResult) {
          if (typeof tabBarIconResult === 'string') {
            icon = tabBarIconResult;
          } else if (React.isValidElement(tabBarIconResult)) {
            const props = tabBarIconResult.props as { name?: string };
            if (props?.name) icon = props.name;
          }
        }

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabBarItem
            key={route.key}
            label={label}
            icon={icon}
            focused={isFocused}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

// ... 样式保持不变 ...

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    minHeight: 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    justifyContent: 'space-around',
    alignItems: 'flex-end', // 图标+文字贴在底部
  },
  tabItem: {
    flex: 1,
    paddingTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});