import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../components/ui/Button';

type RootStackParamList = {
  ClockIn: { id?: string };
  // Add other routes here as needed
};

type ClockInScreenRouteProp = RouteProp<RootStackParamList, 'ClockIn'>;
type ClockInScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ClockInScreen() {
  const route = useRoute<ClockInScreenRouteProp>();
  const navigation = useNavigation<ClockInScreenNavigationProp>();
  const { id } = route.params || {};

  const handleClockIn = () => {
    // 处理打卡逻辑
    console.log('打卡成功', id);
    // 可以添加打卡记录到数据库等操作

    // 打卡完成后返回主页
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⏰ 打卡时间</Text>
      <Text style={styles.subtitle}>记得完成今天的打卡任务哦！</Text>

      <Button label="确认打卡" onPress={handleClockIn} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  button: {
    width: '80%',
  },
});
