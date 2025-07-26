import { RootState } from '@/store';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  InteractionManager,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Dialog,
  IconButton,
  Portal,
  ProgressBar,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSelector } from 'react-redux';

interface AudioPlayerDrawerProps {
  spellId: string;
  visible: boolean;
  onClose: () => void;
  onDelete?: (spellId: string) => void;
}

export default function AudioPlayerDrawer({
  spellId,
  visible,
  onClose,
  onDelete,
}: AudioPlayerDrawerProps) {
  const theme = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopMode, setLoopMode] = useState<'none' | 'one'>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerHeight, setDrawerHeight] = useState(0);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const panY = useRef(new Animated.Value(0)).current;
  // 获取底部安全区域
  const marginBottomNavHeight = 10

  // 修正动画初始值
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get('window').height + marginBottomNavHeight)
  ).current;

  // 修正动画效果
  useEffect(() => {
    if (visible) {
      // 打开时确保从初始位置开始
      slideAnim.setValue(Dimensions.get('window').height + marginBottomNavHeight);
      panY.setValue(0);

      InteractionManager.runAfterInteractions(() => {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 15,
        }).start();
      });
    } else {
      // 关闭时确保完全移出屏幕
      InteractionManager.runAfterInteractions(() => {
        Animated.spring(slideAnim, {
          toValue: Dimensions.get('window').height + marginBottomNavHeight,
          useNativeDriver: true,
          damping: 15,
        }).start();
      });
    }
  }, [visible, marginBottomNavHeight]);

  const targetSpell = useSelector((state: RootState) =>
    state.spellsReducer.spells.find((spell) => spell.id === spellId)
  );

  // 创建音频播放器实例
  const audioPlayer = useAudioPlayer({
    uri: targetSpell?.uri,
  });

  // 获取播放状态
  const audioPlayerState = useAudioPlayerStatus(audioPlayer);

  // 监听播放器状态变化
  useEffect(() => {
    // 更新播放位置
    if (audioPlayerState.currentTime !== undefined) {
      setPosition(audioPlayerState.currentTime);
    }

    // 更新持续时间（当音频加载完成后）
    if (
      audioPlayerState.duration !== undefined &&
      audioPlayerState.duration > 0
    ) {
      setDuration(audioPlayerState.duration);
      setIsLoading(false);
    }

    // 处理播放结束
    if (audioPlayerState.didJustFinish) {
      if (loopMode === 'none') {
        setIsPlaying(false);
      } else {
        // 循环播放 - 重置位置并重新播放
        audioPlayer.seekTo(0);
        audioPlayer.play();
      }
    }
  }, [audioPlayerState]);

  // 加载音频并自动播放
  useEffect(() => {
    if (!visible || !targetSpell?.uri) return;

    const loadAndPlay = async () => {
      setIsLoading(true);
      setError(null);
      setLoadingProgress(0);

      try {
        // 替换音频源
        await audioPlayer.replace({ uri: targetSpell.uri });
        // 自动播放
        await audioPlayer.play();
        setIsPlaying(true);
        setLoadingProgress(1);

      } catch (error) {
        console.error('加载或播放音频失败', error);
        setError('无法加载或播放音频');
      } finally {
        setTimeout(() => setIsLoading(false), 500);
      }
    };

    loadAndPlay();

    return () => {
      // 组件卸载时清理
      if (audioPlayer) {
        // 安全地暂停音频，避免在组件卸载后调用
        try {
          audioPlayer.pause();
        } catch (e) {
          console.log('安全暂停失败，可能已卸载');
        }
      }
    };
  }, [visible, targetSpell?.uri]);

  // 播放/暂停
  const togglePlayPause = async () => {
    if (isLoading) {
      return;
    }

    try {
      if (isPlaying) {
        await audioPlayer.pause();
        setIsPlaying(false);
      } else {
        // 修复：检查是否播放结束，如果是则重置位置
        if (position >= duration - 0.1) {
          await audioPlayer.seekTo(0);
          setPosition(0);
        }
        await audioPlayer.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('播放控制失败', error);
      setError('播放控制失败');
    }
  };
  // 切换循环模式
  const toggleLoopMode = () => {
    const modes: ('none' | 'one')[] = ['none', 'one'];
    const currentIndex = modes.indexOf(loopMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setLoopMode(modes[nextIndex]);
  };

  // 处理进度条变化
  const handleSliderValueChange = async (value: number) => {
    if (!audioPlayer || !duration) return;

    try {
      const newPosition = value * duration;
      await audioPlayer.seekTo(newPosition);
      setPosition(newPosition);
    } catch (error) {
      console.error('进度调整失败', error);
    }
  };

  // 关闭播放器
  // 关闭播放器
  const handleClose = async () => {
    try {
      if (audioPlayer) {
        await audioPlayer.pause();
      }
    } catch (e) {
      console.log('关闭时暂停失败，可能已卸载');
    }

    // 重置动画值
    slideAnim.setValue(Dimensions.get('window').height + marginBottomNavHeight);
    panY.setValue(0);

    onClose();
  };

  // 创建滑动手势响应器
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // 允许在暂停状态下滑动关闭
        if (!isPlaying && gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const closeThreshold = marginBottomNavHeight + 100;

        if (!isPlaying && gestureState.dy > closeThreshold) {
          handleClose();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // 计算播放进度百分比
  const progress = duration > 0 ? position / duration : loadingProgress;

  // 处理删除操作
  const handleDelete = () => {
    setDeleteDialogVisible(true);
  };

  // 确认删除
  const confirmDelete = async () => {
    setDeleteDialogVisible(false);

    try {
      // 安全地暂停音频
      if (audioPlayer && isPlaying) {
        await audioPlayer.pause();
      }

      // 调用删除回调
      if (onDelete) {
        onDelete(spellId);
      }

      // 显示删除成功的消息

      // 关闭播放器
      onClose();
    } catch (error) {
      console.error('删除失败', error);
    }
  };

  if (!visible) return null;

  return (
    <>
      <Animated.View
        onLayout={(e) => setDrawerHeight(e.nativeEvent.layout.height)}
        style={[
          styles.container,
          {
            transform: [{ translateY: Animated.add(slideAnim, panY) }],
            backgroundColor: theme.colors.background,
            paddingBottom: marginBottomNavHeight, // 确保内容不被遮挡
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Card style={styles.card}>
          <Card.Content style={styles.content}>
            {/* 头部标题和关闭按钮 */}
            <View style={styles.header}>
              <Text variant='titleMedium' style={styles.title}>
                {targetSpell?.name || '音频播放器'}
              </Text>
              <IconButton icon='close' size={20} onPress={handleClose} />
            </View>

            {/* 错误提示 */}
            {error && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons
                  name='alert-circle'
                  size={20}
                  color={theme.colors.error}
                />
                <Text
                  variant='bodySmall'
                  style={[styles.errorText, { color: theme.colors.error }]}
                >
                  {error}
                </Text>
              </View>
            )}

            {/* 进度条 */}
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={progress}
                color={theme.colors.primary}
                style={styles.progressBar}
              />
              <View style={styles.timeContainer}>
                <Text variant='labelSmall'>{formatTime(position)}</Text>
                <Text variant='labelSmall'>
                  {duration > 0 ? formatTime(duration) : '--:--'}
                </Text>
              </View>
            </View>

            {/* 控制按钮 */}
            <View style={styles.controls}>
              <IconButton
                icon={loopMode === 'one' ? 'repeat-once' : 'repeat-off'}
                size={28}
                onPress={toggleLoopMode}
                iconColor={
                  loopMode !== 'none'
                    ? theme.colors.primary
                    : theme.colors.onSurface
                }
                disabled={isLoading}
              />

              {isLoading ? (
                <ActivityIndicator
                  animating={true}
                  size={40}
                  color={theme.colors.primary}
                  style={styles.loadingIndicator}
                />
              ) : (
                <IconButton
                  icon={isPlaying ? 'pause' : 'play'}
                  size={48}
                  onPress={togglePlayPause}
                  style={[
                    styles.playButton,
                    {
                      backgroundColor: theme.colors.primaryContainer,
                      marginHorizontal: 16,
                    },
                  ]}
                  iconColor={theme.colors.onPrimaryContainer}
                  containerColor={theme.colors.primaryContainer}
                  rippleColor='transparent' // 关键修改：移除点击涟漪效果
                />
              )}

              {/* 删除按钮 */}
              <IconButton
                icon='delete'
                size={28}
                onPress={handleDelete}
                iconColor={theme.colors.error}
                disabled={isLoading}
              />
            </View>
          </Card.Content>
        </Card>
      </Animated.View>

      {/* 删除确认对话框 */}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>删除确认</Dialog.Title>
          <Dialog.Content>
            <Text variant='bodyMedium'>
              确定要删除这个音频吗？此操作不可撤销。
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>取消</Button>
            <Button onPress={confirmDelete} textColor={theme.colors.error}>
              删除
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    zIndex: 100,
  },
  card: {
    borderRadius: 16,
    elevation: 8,
  },
  content: {
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    flex: 1,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  errorText: {
    marginLeft: 8,
    flex: 1,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 调整控制按钮容器的对齐方式
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  playButtonContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0, // 新增：移除外边距
    padding: 0, // 新增：移除内边距
  },
  loopIndicator: {
    alignItems: 'center',
    marginTop: 8,
    padding: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(94, 96, 206, 0.1)',
  },
  loadingIndicator: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: 'white',
    borderRadius: 12,
  },
});
