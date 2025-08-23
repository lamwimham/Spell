import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../components/ui/Button';
import { useTheme } from '../hooks/useTheme';

type RootStackParamList = {
  ClockIn: { id?: string };
  // Add other routes here as needed
};

type ClockInScreenRouteProp = RouteProp<RootStackParamList, 'ClockIn'>;
type ClockInScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ClockInScreen() {
  const route = useRoute<ClockInScreenRouteProp>();
  const navigation = useNavigation<ClockInScreenNavigationProp>();
  const { colors, textStyles, spacing, shadows } = useTheme();
  const { id } = route.params || {};

  const handleClockIn = () => {
    // 处理打卡逻辑
    console.log('打卡成功', id);
    // 可以添加打卡记录到数据库等操作

    // 打卡完成后返回主页
    navigation.goBack();
  };

  const dynamicStyles = createStyles({ colors, textStyles, spacing, shadows });

  return (
    <View style={dynamicStyles.container}>
      <Text style={dynamicStyles.title}>⏰ 打卡时间</Text>
      <Text style={dynamicStyles.subtitle}>记得完成今天的打卡任务哦！</Text>

      <Button label="确认打卡" onPress={handleClockIn} style={dynamicStyles.button} />
    </View>
  );
}

/**
 * 创建动态样式的函数
 */
const createStyles = ({ colors, textStyles, spacing }: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    title: {
      ...textStyles.h2,
      color: colors.text,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    subtitle: {
      ...textStyles.body1,
      color: colors.textSecondary,
      marginBottom: spacing.xl,
      textAlign: 'center',
    },
    button: {
      width: '80%',
    },
  });
