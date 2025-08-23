import React, { useState, useRef, useCallback } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect, NavigationProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { DrawerPanel } from '../components/ui/DrawerPanel';
import { TopNavigationBar } from '../components/ui/TopNavigationBar';
import { useRecordings, useRecordingActions } from '../hooks/useRecordings';
import { useRecordingValidation } from '../hooks/useRecordingValidation';
import Recording from '../database/models/Recording';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../hooks/useTheme';
// import { scheduleTestNotification } from '../services/notifications/scheduleManager';

// 启用LayoutAnimation在Android上工作
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { colors, textStyles, spacing, shadows, isDark } = useTheme();

  // 获取咒语列表和操作方法
  const recordings = useRecordings();
  const { deleteRecording } = useRecordingActions();

  // 录音数据验证（后台自动运行）
  useRecordingValidation();

  // 当屏幕重新获得焦点时刷新数据
  useFocusEffect(
    useCallback(() => {
      console.log('HomeScreen获得焦点，刷新数据');
      // 这里不需要额外操作，因为useRecordings钩子已经设置了响应式订阅
      // 但我们可以添加一些调试日志来确认焦点事件被触发
      return () => {
        // 清理函数，当屏幕失去焦点时执行
      };
    }, []),
  );

  // 处理下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // 等待一小段时间以显示刷新动画
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // 动画值
  const checkboxAnimation = useRef(new Animated.Value(0)).current;
  const deleteButtonAnimation = useRef(new Animated.Value(0)).current;

  // 切换删除模式
  const toggleDeleteMode = () => {
    const toValue = isDeleteMode ? 0 : 1;

    // 配置布局动画
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    // 运行动画
    Animated.parallel([
      Animated.timing(checkboxAnimation, {
        toValue,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(deleteButtonAnimation, {
        toValue,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();

    setIsDeleteMode(!isDeleteMode);
    setSelectedItems([]);
  };

  // 选择/取消选择项目
  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // 执行删除操作
  const handleDelete = async () => {
    if (selectedItems.length === 0) return;

    try {
      // 删除选中的咒语
      for (const id of selectedItems) {
        await deleteRecording(id);
      }

      // 重置选中项
      setSelectedItems([]);

      // 退出删除模式
      setIsDeleteMode(false);

      // 重置动画值
      checkboxAnimation.setValue(0);
      deleteButtonAnimation.setValue(0);

      // 显示成功提示
      Alert.alert('成功', '已删除所选咒语');
    } catch (error) {
      Alert.alert('错误', '删除失败，请重试');
    }
  };

  // 格式化时间显示
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  // 渲染咒语列表项
  const renderRecordingItem = ({ item }: { item: Recording }) => {
    return (
      <TouchableOpacity
        style={dynamicStyles.recordingItem}
        onPress={() =>
          isDeleteMode
            ? toggleSelectItem(item.id)
            : navigation.navigate('Play', { recording: item })
        }
        activeOpacity={0.7}
      >
        {/* 左侧区域：复选框和麦克风图标 */}
        <View style={dynamicStyles.leftSection}>
          {isDeleteMode && (
            <TouchableOpacity
              onPress={() => toggleSelectItem(item.id)}
              style={[
                dynamicStyles.checkbox,
                selectedItems.includes(item.id) && dynamicStyles.checkboxSelected,
              ]}
            >
              {selectedItems.includes(item.id) && (
                <Icon name="checkmark" size={16} color={colors.buttonText} />
              )}
            </TouchableOpacity>
          )}

          <View style={dynamicStyles.iconContainer}>
            <Icon name="mic" size={24} color={colors.primary} />
          </View>
        </View>

        {/* 中间区域：三行内容 */}
        <View style={dynamicStyles.recordingInfo}>
          {/* 第一行：标题 */}
          <Text style={dynamicStyles.recordingTitle} numberOfLines={1}>
            {item.title}
          </Text>

          {/* 第二行：脚本 */}
          {item.script && item.script.trim() ? (
            <Text style={dynamicStyles.recordingScript} numberOfLines={2}>
              {item.script}
            </Text>
          ) : (
            <Text style={dynamicStyles.noScript}>暂无脚本内容</Text>
          )}

          {/* 第三行：播放次数和录音时长 */}
          <View style={dynamicStyles.metaSection}>
            <View style={dynamicStyles.metaItem}>
              <Icon name="play-outline" size={12} color={colors.textTertiary} />
              <Text style={dynamicStyles.metaText}>{item.playCount}次播放</Text>
            </View>

            <View style={dynamicStyles.metaDivider} />

            <View style={dynamicStyles.metaItem}>
              <Icon name="time-outline" size={12} color={colors.textTertiary} />
              <Text style={dynamicStyles.metaText}>{formatDuration(item.duration)}</Text>
            </View>
          </View>
        </View>

        {/* 右侧区域：播放按钮 */}
        {!isDeleteMode && (
          <TouchableOpacity
            style={dynamicStyles.playButton}
            onPress={() => {
              navigation.navigate('Play', { recording: item });
            }}
          >
            <Icon name="play-circle" size={32} color={colors.primary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  // 空状态组件
  const renderEmptyState = () => {
    return (
      <View style={dynamicStyles.emptyState}>
        <Icon name="mic-outline" size={64} color={colors.textTertiary} />
        <Text style={dynamicStyles.emptyStateTitle}>还没有咒语</Text>
        <Text style={dynamicStyles.emptyStateSubtitle}>点击下方麦克风按钮开始录制</Text>
      </View>
    );
  };

  const dynamicStyles = createStyles({ colors, textStyles, spacing, shadows });

  return (
    <View style={[dynamicStyles.container]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {isDeleteMode ? (
        <View style={dynamicStyles.header}>
          <TouchableOpacity style={dynamicStyles.backButton} onPress={toggleDeleteMode}>
            <Icon name="close-circle" size={24} color={colors.error} />
          </TouchableOpacity>
          <Text style={[dynamicStyles.headerTitle]}>咒语库</Text>
          <TouchableOpacity
            style={dynamicStyles.deleteButton}
            onPress={handleDelete}
            disabled={selectedItems.length === 0}
          >
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: deleteButtonAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              }}
            >
              <Icon
                name="checkmark-circle"
                size={24}
                color={selectedItems.length > 0 ? colors.primary : colors.textTertiary}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
      ) : (
        <TopNavigationBar
          title="咒语库"
          showBackButton={true}
          leftIconName="person-circle-outline"
          onLeftIconPress={() => setIsDrawerVisible(true)}
          rightIconName="trash-outline"
          onRightIconPress={toggleDeleteMode}
          iconColor={colors.primary}
        />
      )}

      <View style={dynamicStyles.titleContainer}>
        <Text style={[dynamicStyles.title]}>我的咒语</Text>
        <Text style={[dynamicStyles.subtitle]}>您录制的咒语文件将显示在这里</Text>
      </View>

      <FlatList
        data={recordings}
        renderItem={renderRecordingItem}
        keyExtractor={item => item.id}
        contentContainerStyle={
          recordings.length === 0 ? dynamicStyles.emptyContainer : dynamicStyles.listContainer
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            title="刷新中..."
            titleColor={colors.textSecondary}
          />
        }
      />

      {/* FAB按钮 - 咒语 */}
      <TouchableOpacity
        style={[dynamicStyles.fabButton]}
        onPress={() => navigation.navigate('Record')}
        activeOpacity={0.8}
      >
        <Icon name="mic" size={28} color={colors.buttonText} />
      </TouchableOpacity>

      <View style={[dynamicStyles.tabIndicator]} />

      {/* 抽屉面板 */}
      <DrawerPanel
        isVisible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        onNavigate={screen => navigation.navigate(screen as never)}
      />
    </View>
  );
}

/**
 * 创建动态样式的函数
 */
const createStyles = ({ colors, textStyles, spacing, shadows }: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.padding.screen,
      paddingTop: 48,
      paddingBottom: spacing.sm,
      height: 96,
    },
    backButton: {
      padding: spacing.sm,
    },
    headerTitle: {
      ...textStyles.body1,
      color: colors.text,
    },
    deleteButton: {
      padding: spacing.sm,
    },
    titleContainer: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.lg,
    },
    title: {
      ...textStyles.h2,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...textStyles.body1,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    listContainer: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.xl,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    recordingItem: {
      flexDirection: 'row',
      alignItems: 'center', // 改为center实现整体垂直居中
      paddingVertical: spacing.padding.card,
      paddingHorizontal: spacing.md,
      minHeight: 110,
      borderRadius: spacing.borderRadius.md,
      backgroundColor: colors.surface,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.light,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center', // 垂直居中对齐
      marginRight: spacing.md,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: spacing.borderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.backgroundPrimary,
      marginLeft: spacing.sm,
    },
    recordingInfo: {
      flex: 1,
      paddingRight: spacing.sm,
      justifyContent: 'center', // 添加垂直居中
    },
    recordingTitle: {
      ...textStyles.body1,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.sm,
      minHeight: 24,
    },
    recordingScript: {
      ...textStyles.body2,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.sm,
      minHeight: 20,
    },
    noScript: {
      ...textStyles.body2,
      color: colors.textTertiary,
      fontStyle: 'italic',
      marginBottom: spacing.sm,
      minHeight: 20,
    },
    metaSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaText: {
      ...textStyles.caption,
      color: colors.textTertiary,
      marginLeft: 3,
    },
    metaDivider: {
      width: 1,
      height: 12,
      backgroundColor: colors.border,
      marginHorizontal: spacing.sm,
    },
    playButton: {
      justifyContent: 'center',
      alignItems: 'center',
      width: 44,
      height: 44,
      // 移除marginTop，让它自然居中
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.sm,
    },
    checkboxSelected: {
      backgroundColor: colors.primary,
    },
    fabButton: {
      position: 'absolute',
      right: spacing.lg,
      bottom: 80,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.heavy,
    },
    tabIndicator: {
      width: 139,
      height: 5,
      borderRadius: spacing.borderRadius.circle,
      backgroundColor: colors.primary,
      alignSelf: 'center',
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },
    emptyState: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    emptyStateTitle: {
      ...textStyles.h3,
      color: colors.text,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    emptyStateSubtitle: {
      ...textStyles.body1,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
