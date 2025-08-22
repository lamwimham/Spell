import React, { useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToggleSwitch } from './ToggleSwitch';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.80; // 75%屏幕宽度
const PAN_RESPONDER_THRESHOLD = 15; // 降低阈值，更容易触发
const PAN_RESPONDER_VELOCITY_THRESHOLD = -0.3; // 降低速度阈值
const PAN_RESPONDER_DISTANCE_THRESHOLD = -30; // 降低距离阈值

interface DrawerPanelProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigate?: (screen: string) => void;
}

interface User {
  avatar: string;
  name: string;
  bio: string;
  joinDate: string;
}

interface UserStats {
  totalDays: number;
  currentStreak: number;
  totalRecordings: number;
  totalListeningTime: string;
}

interface CheckInRecord {
  date: string;
  completed: boolean;
  recordings: number;
  listeningTime: number;
}

interface Settings {
  notifications: boolean;
  darkMode: boolean;
  autoPlay: boolean;
  dailyReminder: boolean;
}

/**
 * 抽屉式侧边栏组件
 * 包含用户信息、打卡记录、系统设置
 */
export function DrawerPanel({ isVisible, onClose, onNavigate }: DrawerPanelProps) {
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // 使用 useMemo 来避免每次渲染时重新创建模拟数据
  const { userData, userStats, checkInRecords } = useMemo(() => {
    // 模拟用户数据
    const userData: User = {
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      name: '张三',
      bio: '每天进步一点点',
      joinDate: '2024年1月加入',
    };

    // 模拟统计数据
    const userStats: UserStats = {
      totalDays: 45,
      currentStreak: 7,
      totalRecordings: 23,
      totalListeningTime: '12小时30分',
    };

    // 模拟打卡记录（最近7天）
    const checkInRecords: CheckInRecord[] = [
      { date: '今天', completed: true, recordings: 2, listeningTime: 25 },
      { date: '昨天', completed: true, recordings: 1, listeningTime: 15 },
      { date: '前天', completed: false, recordings: 0, listeningTime: 0 },
      { date: '3天前', completed: true, recordings: 3, listeningTime: 35 },
      { date: '4天前', completed: true, recordings: 1, listeningTime: 20 },
    ];

    return { userData, userStats, checkInRecords };
  }, []);

  // 系统设置状态
  const [settings, setSettings] = React.useState<Settings>({
    notifications: true,
    darkMode: false,
    autoPlay: true,
    dailyReminder: true,
  });

  // 显示/隐藏动画 - 增强动画效果
  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
          restSpeedThreshold: 0.1,
          restDisplacementThreshold: 0.1,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, translateX, overlayOpacity]);

  // 使用PanResponder替代PanGestureHandler - 增强手势响应
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // 更敏感的手势检测
        return (
          Math.abs(gestureState.dx) > PAN_RESPONDER_THRESHOLD || Math.abs(gestureState.vx) > 0.2
        );
      },
      onPanResponderGrant: () => {
        // 手势开始时添加反馈
        translateX.setOffset(0);
        translateX.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // 限制拖动范围，添加阻尼效果
        const dx = Math.min(gestureState.dx, 0);
        const dampedDx = dx * 0.8; // 添加阻尼效果
        translateX.setValue(dampedDx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        // 更灵敏的关闭条件
        const shouldClose =
          gestureState.dx < PAN_RESPONDER_DISTANCE_THRESHOLD ||
          gestureState.vx < PAN_RESPONDER_VELOCITY_THRESHOLD;

        if (shouldClose) {
          // 关闭动画更快更明显
          Animated.timing(translateX, {
            toValue: -DRAWER_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onClose());
        } else {
          // 弹回动画更有弹性
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 120,
            friction: 7,
            restSpeedThreshold: 0.1,
            restDisplacementThreshold: 0.1,
          }).start();
        }
      },
    }),
  ).current;

  const updateSetting = (key: keyof Settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!isVisible) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* 背景遮罩 */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
          },
        ]}
      >
        <TouchableOpacity style={styles.overlayTouchable} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* 抽屉面板 */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.drawerHeader}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: userData.avatar }} style={styles.avatar} />
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color="#535059" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userBio}>{userData.bio}</Text>
          <Text style={styles.joinDate}>{userData.joinDate}</Text>
          
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={true}
          >
            {/* 统计数据 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>学习统计</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{userStats.totalDays}</Text>
                  <Text style={styles.statLabel}>总天数</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{userStats.currentStreak}</Text>
                  <Text style={styles.statLabel}>连续天数</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{userStats.totalRecordings}</Text>
                  <Text style={styles.statLabel}>咒语数</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{userStats.totalListeningTime}</Text>
                  <Text style={styles.statLabel}>收听时长</Text>
                </View>
              </View>
            </View>

            {/* 打卡记录 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>最近打卡</Text>
              <View style={styles.checkInList}>
                {checkInRecords.map((record, index) => (
                  <View key={index} style={styles.checkInItem}>
                    <View style={styles.checkInDate}>
                      <Text style={styles.checkInDateText}>{record.date}</Text>
                    </View>
                    <View
                      style={[
                        styles.checkInStatus,
                        record.completed ? styles.checkInCompleted : styles.checkInMissed,
                      ]}
                    >
                      <Icon
                        name={record.completed ? 'checkmark-circle' : 'close-circle'}
                        size={16}
                        color={record.completed ? '#4CAF50' : '#FF6B6B'}
                      />
                    </View>
                    <Text style={styles.checkInDetails}>
                      {record.completed
                        ? `${record.recordings}咒语 ${record.listeningTime}分钟`
                        : '未完成'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 系统设置 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>系统设置</Text>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Icon name="notifications-outline" size={20} color="#7572B7" />
                  <Text style={styles.settingLabel}>推送通知</Text>
                </View>
                <ToggleSwitch
                  value={settings.notifications}
                  onValueChange={value => updateSetting('notifications', value)}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Icon name="moon-outline" size={20} color="#7572B7" />
                  <Text style={styles.settingLabel}>深色模式</Text>
                </View>
                <ToggleSwitch
                  value={settings.darkMode}
                  onValueChange={value => updateSetting('darkMode', value)}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Icon name="alarm-outline" size={20} color="#7572B7" />
                  <Text style={styles.settingLabel}>每日提醒</Text>
                </View>
                <ToggleSwitch
                  value={settings.dailyReminder}
                  onValueChange={value => updateSetting('dailyReminder', value)}
                />
              </View>
            </View>

            {/* 底部菜单 */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onNavigate?.('Settings');
                  onClose();
                }}
              >
                <Icon name="settings-outline" size={20} color="#535059" />
                <Text style={styles.menuItemText}>高级设置</Text>
                <Icon name="chevron-forward" size={16} color="#C8C5D0" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Icon name="help-circle-outline" size={20} color="#535059" />
                <Text style={styles.menuItemText}>帮助与反馈</Text>
                <Icon name="chevron-forward" size={16} color="#C8C5D0" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <Icon name="information-circle-outline" size={20} color="#535059" />
                <Text style={styles.menuItemText}>关于应用</Text>
                <Icon name="chevron-forward" size={16} color="#C8C5D0" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: 'rgba(253, 252, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3E3F1',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  closeButton: {
    padding: 8,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Rubik',
    fontWeight: '600',
    color: '#393640',
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  userBio: {
    fontSize: 16,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#7572B7',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  joinDate: {
    fontSize: 14,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#C8C5D0',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 50,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E3F1',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Rubik',
    fontWeight: '600',
    color: '#393640',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E3E3F1',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Rubik',
    fontWeight: '700',
    color: '#7572B7',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#535059',
    textAlign: 'center',
  },
  checkInList: {
    gap: 8,
  },
  checkInItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkInDate: {
    width: 60,
  },
  checkInDateText: {
    fontSize: 12,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#535059',
  },
  checkInStatus: {
    marginRight: 12,
  },
  checkInCompleted: {},
  checkInMissed: {},
  checkInDetails: {
    fontSize: 12,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#C8C5D0',
    flex: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#393640',
    marginLeft: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#535059',
    marginLeft: 12,
    flex: 1,
  },
});