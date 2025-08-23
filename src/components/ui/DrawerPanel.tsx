import React, { useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ToggleSwitch } from './ToggleSwitch';
import { useTheme } from '../../hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.8; // 75%屏幕宽度

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
  const { colors, textStyles, spacing, shadows } = useTheme();
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
  // 注释掉暂时未使用的手势处理代码
  /*
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
  */

  const updateSetting = (key: keyof Settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!isVisible) return null;

  // 创建动态样式
  const dynamicStyles = createStyles({ colors, textStyles, spacing, shadows });

  return (
    <View style={dynamicStyles.container} pointerEvents="box-none">
      {/* 背景遮罩 */}
      <Animated.View
        style={[
          dynamicStyles.overlay,
          {
            opacity: overlayOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={dynamicStyles.overlayTouchable}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* 抽屉面板 */}
      <Animated.View
        style={[
          dynamicStyles.drawer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={dynamicStyles.drawerHeader}>
            <View style={dynamicStyles.avatarContainer}>
              <Image source={{ uri: userData.avatar }} style={dynamicStyles.avatar} />
            </View>

            <TouchableOpacity style={dynamicStyles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={dynamicStyles.userName}>{userData.name}</Text>
          <Text style={dynamicStyles.userBio}>{userData.bio}</Text>
          <Text style={dynamicStyles.joinDate}>{userData.joinDate}</Text>

          <ScrollView
            style={dynamicStyles.scrollView}
            contentContainerStyle={dynamicStyles.scrollViewContent}
            showsVerticalScrollIndicator={true}
          >
            {/* 统计数据 */}
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>学习统计</Text>
              <View style={dynamicStyles.statsGrid}>
                <View style={dynamicStyles.statItem}>
                  <Text style={dynamicStyles.statNumber}>{userStats.totalDays}</Text>
                  <Text style={dynamicStyles.statLabel}>总天数</Text>
                </View>
                <View style={dynamicStyles.statItem}>
                  <Text style={dynamicStyles.statNumber}>{userStats.currentStreak}</Text>
                  <Text style={dynamicStyles.statLabel}>连续天数</Text>
                </View>
                <View style={dynamicStyles.statItem}>
                  <Text style={dynamicStyles.statNumber}>{userStats.totalRecordings}</Text>
                  <Text style={dynamicStyles.statLabel}>咒语数</Text>
                </View>
                <View style={dynamicStyles.statItem}>
                  <Text style={dynamicStyles.statNumber}>{userStats.totalListeningTime}</Text>
                  <Text style={dynamicStyles.statLabel}>收听时长</Text>
                </View>
              </View>
            </View>

            {/* 打卡记录 */}
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>最近打卡</Text>
              <View style={dynamicStyles.checkInList}>
                {checkInRecords.map((record, index) => (
                  <View key={index} style={dynamicStyles.checkInItem}>
                    <View style={dynamicStyles.checkInDate}>
                      <Text style={dynamicStyles.checkInDateText}>{record.date}</Text>
                    </View>
                    <View
                      style={[
                        dynamicStyles.checkInStatus,
                        record.completed
                          ? dynamicStyles.checkInCompleted
                          : dynamicStyles.checkInMissed,
                      ]}
                    >
                      <Icon
                        name={record.completed ? 'checkmark-circle' : 'close-circle'}
                        size={16}
                        color={record.completed ? '#4CAF50' : '#FF6B6B'}
                      />
                    </View>
                    <Text style={dynamicStyles.checkInDetails}>
                      {record.completed
                        ? `${record.recordings}咒语 ${record.listeningTime}分钟`
                        : '未完成'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 系统设置 */}
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>系统设置</Text>

              <View style={dynamicStyles.settingItem}>
                <View style={dynamicStyles.settingInfo}>
                  <Icon name="notifications-outline" size={20} color={colors.primary} />
                  <Text style={dynamicStyles.settingLabel}>推送通知</Text>
                </View>
                <ToggleSwitch
                  value={settings.notifications}
                  onValueChange={value => updateSetting('notifications', value)}
                />
              </View>

              <View style={dynamicStyles.settingItem}>
                <View style={dynamicStyles.settingInfo}>
                  <Icon name="moon-outline" size={20} color={colors.primary} />
                  <Text style={dynamicStyles.settingLabel}>深色模式</Text>
                </View>
                <ToggleSwitch
                  value={settings.darkMode}
                  onValueChange={value => updateSetting('darkMode', value)}
                />
              </View>

              <View style={dynamicStyles.settingItem}>
                <View style={dynamicStyles.settingInfo}>
                  <Icon name="alarm-outline" size={20} color={colors.primary} />
                  <Text style={dynamicStyles.settingLabel}>每日提醒</Text>
                </View>
                <ToggleSwitch
                  value={settings.dailyReminder}
                  onValueChange={value => updateSetting('dailyReminder', value)}
                />
              </View>
            </View>

            {/* 底部菜单 */}
            <View style={dynamicStyles.section}>
              <TouchableOpacity
                style={dynamicStyles.menuItem}
                onPress={() => {
                  onNavigate?.('ClockIn');
                  onClose();
                }}
              >
                <Icon name="calendar-outline" size={20} color={colors.textSecondary} />
                <Text style={dynamicStyles.menuItemText}>每日打卡</Text>
                <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={dynamicStyles.menuItem}
                onPress={() => {
                  onNavigate?.('Settings');
                  onClose();
                }}
              >
                <Icon name="settings-outline" size={20} color={colors.textSecondary} />
                <Text style={dynamicStyles.menuItemText}>高级设置</Text>
                <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity style={dynamicStyles.menuItem}>
                <Icon name="help-circle-outline" size={20} color={colors.textSecondary} />
                <Text style={dynamicStyles.menuItemText}>帮助与反馈</Text>
                <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity style={dynamicStyles.menuItem}>
                <Icon name="information-circle-outline" size={20} color={colors.textSecondary} />
                <Text style={dynamicStyles.menuItemText}>关于应用</Text>
                <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

/**
 * 创建动态样式的函数
 */
const createStyles = ({ colors, textStyles, spacing, shadows }: any) =>
  StyleSheet.create({
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
      backgroundColor: colors.surface,
      ...shadows.heavy,
    },
    drawerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.backgroundPrimary,
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
      padding: spacing.sm,
    },
    userName: {
      ...textStyles.h2,
      color: colors.text,
      marginBottom: spacing.xs,
      paddingHorizontal: spacing.lg,
    },
    userBio: {
      ...textStyles.body1,
      color: colors.primary,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    joinDate: {
      ...textStyles.caption,
      color: colors.textTertiary,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    scrollView: {
      flex: 1,
    },
    scrollViewContent: {
      paddingBottom: 50,
    },
    section: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionTitle: {
      ...textStyles.h3,
      color: colors.text,
      marginBottom: spacing.md,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statItem: {
      width: '48%',
      backgroundColor: colors.backgroundElevated,
      borderRadius: spacing.borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.light,
    },
    statNumber: {
      ...textStyles.h2,
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    statLabel: {
      ...textStyles.caption,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    checkInList: {
      gap: spacing.sm,
    },
    checkInItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    checkInDate: {
      width: 60,
    },
    checkInDateText: {
      ...textStyles.caption,
      color: colors.textSecondary,
    },
    checkInStatus: {
      marginRight: spacing.md,
    },
    checkInCompleted: {},
    checkInMissed: {},
    checkInDetails: {
      ...textStyles.caption,
      color: colors.textTertiary,
      flex: 1,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
    },
    settingInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingLabel: {
      ...textStyles.body1,
      color: colors.text,
      marginLeft: spacing.md,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
    },
    menuItemText: {
      ...textStyles.body1,
      color: colors.textSecondary,
      marginLeft: spacing.md,
      flex: 1,
    },
  });
