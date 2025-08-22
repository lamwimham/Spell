import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
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
  useColorScheme,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { DrawerPanel } from '../components/ui/DrawerPanel';
import { TopNavigationBar } from '../components/ui/TopNavigationBar';
import { useRecordings, useRecordingActions } from '../hooks/useRecordings';
import Recording from '../database/models/Recording';
import { RootStackParamList } from '../types/navigation';
import { Colors } from '../constants/Colors';
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
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  // 获取咒语列表和操作方法
  const recordings = useRecordings();
  const { deleteRecording } = useRecordingActions();

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
  const renderRecordingItem = ({ item }: { item: Recording }) => (
    <TouchableOpacity
      style={styles.recordingItem}
      onPress={() =>
        isDeleteMode ? toggleSelectItem(item.id) : navigation.navigate('Play', { recording: item })
      }
      activeOpacity={0.7}
    >
      {isDeleteMode && (
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            onPress={() => toggleSelectItem(item.id)}
            style={[styles.checkbox, selectedItems.includes(item.id) && styles.checkboxSelected]}
          >
            {selectedItems.includes(item.id) && (
              <Icon name="checkmark" size={16} color={theme.buttonText} />
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.iconContainer}>
        <Icon name="mic" size={32} color={theme.icon} />
      </View>
      <View style={styles.recordingInfo}>
        <Text style={styles.recordingTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.recordingScript} numberOfLines={1}>
          {item.script}
        </Text>
        <View style={styles.recordingMetaContainer}>
          <Text style={styles.recordingMeta}>{formatDuration(item.duration)}</Text>
          <Text style={styles.recordingMetaSeparator}>-</Text>
          <Text style={styles.recordingMeta}>{item.playCount}次播放</Text>
        </View>
      </View>

      {!isDeleteMode && (
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => {
            navigation.navigate('Play', { recording: item });
          }}
        >
          <Icon name="play" size={24} color={theme.icon} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  // 空状态组件
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="mic-outline" size={64} color={theme.textLight} />
      <Text style={styles.emptyStateTitle}>还没有咒语</Text>
      <Text style={styles.emptyStateSubtitle}>点击下方麦克风按钮开始录制</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      {isDeleteMode ? (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={toggleDeleteMode}>
            <Icon name="close-circle" size={24} color={theme.error} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>咒语库</Text>
          <TouchableOpacity
            style={styles.deleteButton}
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
                color={selectedItems.length > 0 ? theme.primary : theme.textLight}
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
          iconColor={theme.primary}
        />
      )}

      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: theme.text }]}>我的咒语</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          您录制的音频文件将显示在这里
        </Text>
      </View>

      <FlatList
        data={recordings}
        renderItem={renderRecordingItem}
        keyExtractor={item => item.id}
        contentContainerStyle={
          recordings.length === 0 ? styles.emptyContainer : styles.listContainer
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
            title="刷新中..."
            titleColor={theme.textSecondary}
          />
        }
      />

      {/* FAB按钮 - 测试通知 */}
      {/* <TouchableOpacity
        style={[styles.fabButton, { bottom: 150 }]}
        onPress={scheduleTestNotification}
        activeOpacity={0.8}
      >
        <Icon name="notifications" size={28} color="#FFFFFF" />
      </TouchableOpacity> */}

      {/* FAB按钮 - 咒语 */}
      <TouchableOpacity
        style={[styles.fabButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('Record')}
        activeOpacity={0.8}
      >
        <Icon name="mic" size={28} color={theme.buttonText} />
      </TouchableOpacity>

      <View style={[styles.tabIndicator, { backgroundColor: theme.primary }]} />

      {/* 抽屉面板 */}
      <DrawerPanel
        isVisible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        onNavigate={screen => navigation.navigate(screen as never)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.light.primary,
  },
  checkboxContainer: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 8,
    height: 96,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Rubik',
  },
  deleteButton: {
    padding: 8,
  },
  titleContainer: {
    paddingHorizontal: 24,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '400',
    fontFamily: 'Rubik',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    fontFamily: 'Rubik',
    lineHeight: 22,
  },
  listContainer: {
    paddingHorizontal: 20,
    marginTop: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 80,
  },
  iconContainer: {
    width: 48,
    height: 56,
    borderRadius: 8,
    backgroundColor: Colors.light.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  recordingTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: Colors.light.text,
    fontFamily: 'Rubik',
    marginBottom: 2,
  },
  recordingScript: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    fontFamily: 'Rubik',
    marginBottom: 2,
  },
  recordingMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingMeta: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontFamily: 'Rubik',
  },
  recordingMetaSeparator: {
    fontSize: 13,
    color: Colors.light.border,
    fontFamily: 'Rubik',
    marginHorizontal: 8,
  },
  playButton: {
    padding: 8,
  },
  fabButton: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tabIndicator: {
    width: 139,
    height: 5,
    borderRadius: 100,
    alignSelf: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
