import { useNavigation, NavigationProp } from '@react-navigation/native';
import React, { useState, useRef } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { DrawerPanel } from '../components/ui/DrawerPanel';
import { TopNavigationBar } from '../components/ui/TopNavigationBar';

// 启用LayoutAnimation在Android上工作
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface VoiceItem {
  id: string;
  title: string;
  duration: string;
  size: string;
}

const voiceData: VoiceItem[] = [
  { id: '1', title: 'loss wight', duration: '13m 24s', size: '3.9mb' },
  { id: '2', title: 'loss wight', duration: '0m 45s', size: '35kb' },
  { id: '3', title: 'loss wight', duration: '10m 5s', size: '2.5mb' },
  { id: '4', title: 'loss wight', duration: '16m 46s', size: '4.7mb' },
  { id: '5', title: 'loss wight', duration: '00m 00s', size: '00mb' },
  { id: '6', title: 'no smoking', duration: '24m 10s', size: '4.6mb' },
];

// 模拟删除API
const deleteVoiceItems = async (ids: string[]): Promise<boolean> => {
  // 这里应该是实际的API调用
  console.log('删除项目:', ids);
  return new Promise(resolve => {
    setTimeout(() => resolve(true), 500);
  });
};

// 定义导航参数类型
type RootStackParamList = {
  Home: undefined;
  Welcome: undefined;
  Play: { item: VoiceItem };
  Timer: undefined;
};

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [voiceItems, setVoiceItems] = useState<VoiceItem[]>(voiceData);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

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
      const success = await deleteVoiceItems(selectedItems);
      if (success) {
        // 从列表中移除已删除项
        const updatedItems = voiceItems.filter(item => !selectedItems.includes(item.id));

        // 配置布局动画
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        // 更新列表数据
        setVoiceItems(updatedItems);

        // 重置选中项
        setSelectedItems([]);

        // 退出删除模式
        setIsDeleteMode(false);

        // 重置动画值
        checkboxAnimation.setValue(0);
        deleteButtonAnimation.setValue(0);

        // 显示成功提示
        Alert.alert('成功', '已删除所选项目');
      }
    } catch (error) {
      Alert.alert('错误', '删除失败，请重试');
    }
  };

  // 渲染列表项
  const renderVoiceItem = ({ item }: { item: VoiceItem }) => (
    <TouchableOpacity
      style={styles.voiceItem}
      onPress={() =>
        isDeleteMode ? toggleSelectItem(item.id) : navigation.navigate('Play', { item })
      }
      activeOpacity={0.7}
    >
      {isDeleteMode && (
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            onPress={() => toggleSelectItem(item.id)}
            style={[styles.checkbox, selectedItems.includes(item.id) && styles.checkboxSelected]}
          >
            {selectedItems.includes(item.id) && <Icon name="checkmark" size={16} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.iconContainer}>
        <Icon name="mic" size={32} color="#6B7280" />
      </View>
      <View style={styles.voiceInfo}>
        <Text style={styles.voiceTitle}>{item.title}</Text>
        <View style={styles.voiceMetaContainer}>
          <Text style={styles.voiceMeta}>{item.duration}</Text>
          <Text style={styles.voiceMetaSeparator}>-</Text>
          <Text style={styles.voiceMeta}>{item.size}</Text>
        </View>
      </View>

      {!isDeleteMode && (
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => {
            navigation.navigate('Play', { item });
          }}
        >
          <Icon name="play" size={24} color="#6B7280" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {isDeleteMode ? (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={toggleDeleteMode}>
            <Icon name="close-circle" size={24} color="#FF3B30" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your library</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={isDeleteMode ? handleDelete : toggleDeleteMode}
            disabled={isDeleteMode && selectedItems.length === 0}
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
                color={selectedItems.length > 0 ? '#007AFF' : '#A0A0A0'}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
      ) : (
        <TopNavigationBar
          title="Your library"
          showBackButton={true}
          leftIconName="person-circle-outline"
          onLeftIconPress={() => setIsDrawerVisible(true)}
          rightIconName="trash-outline"
          onRightIconPress={toggleDeleteMode}
          iconColor="#7572B7"
        />
      )}

      <View style={styles.titleContainer}>
        <Text style={styles.title}>Voices Library</Text>
        <Text style={styles.subtitle}>
          Voices generated by vocalicious and you've saved will appear here.
        </Text>
      </View>

      <FlatList
        data={voiceItems}
        renderItem={renderVoiceItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB按钮 - 录音 */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => navigation.navigate('Record' as never)}
        activeOpacity={0.8}
      >
        <Icon name="mic" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.tabIndicator} />

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
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
  },
  checkboxContainer: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#FDFCFF',
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
    color: '#393640',
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
    color: '#393640',
    fontFamily: 'Rubik',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: '#535059',
    fontFamily: 'Rubik',
    lineHeight: 22,
  },
  listContainer: {
    paddingHorizontal: 20,
    marginTop: 40,
  },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    height: 80,
  },
  iconContainer: {
    width: 48,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#E3E3F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceInfo: {
    flex: 1,
    marginLeft: 12,
    height: 46,
    justifyContent: 'center',
  },
  voiceTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#393640',
    fontFamily: 'Rubik',
    marginBottom: 5,
  },
  voiceMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceMeta: {
    fontSize: 15,
    color: '#535059',
    fontFamily: 'Rubik',
  },
  voiceMetaSeparator: {
    fontSize: 15,
    color: '#D2CED9',
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
    backgroundColor: '#7572B7',
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
    backgroundColor: 'black',
    borderRadius: 100,
    alignSelf: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
});
