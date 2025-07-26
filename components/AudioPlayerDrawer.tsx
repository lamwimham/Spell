import { RootState } from '@/store';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  useAudioPlayer,
  useAudioPlayerStatus
} from 'expo-audio';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  IconButton,
  ProgressBar,
  Text,
  useTheme
} from 'react-native-paper';
import { useSelector } from 'react-redux';

interface AudioPlayerDrawerProps {
  spellId: string;
  visible: boolean;
  onClose: () => void;
}

export default function AudioPlayerDrawer({
  spellId,
  visible,
  onClose,
}: AudioPlayerDrawerProps) {
  const theme = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopMode, setLoopMode] = useState<'none' | 'one' | 'all'>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const panY = useRef(new Animated.Value(0)).current;
  
  const targetSpell = useSelector((state: RootState) =>
    state.spellsReducer.spells.find((spell) => spell.id === spellId)
  );
  
  // 创建音频播放器实例
  const audioPlayer = useAudioPlayer({
    uri: targetSpell?.uri,
  });
  
  // 获取播放状态
  const audioPlayerState = useAudioPlayerStatus(audioPlayer);
  
  // 抽屉动画效果
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : Dimensions.get('window').height,
      useNativeDriver: true,
      damping: 15,
    }).start();
  }, [visible]);
  
  // 加载音频并自动播放
  useEffect(() => {
    if (!visible || !targetSpell?.uri) return;
    
    const loadAndPlay = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // 替换音频源
        await audioPlayer.replace({ uri: targetSpell.uri });
        
        // 获取音频时长
        const duration = await audioPlayer.duration;
        setDuration(duration);
        
        // 设置循环模式
        // await audioPlayer.setAudioSamplingEnabled(loopMode === 'one');
        
        // 自动播放
        await audioPlayer.play();
        setIsPlaying(true);
        
        setSnackbarVisible(true);
      } catch (error) {
        console.error('加载或播放音频失败', error);
        setError('无法加载或播放音频');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAndPlay();
    
    return () => {
      if (audioPlayer) {
        audioPlayer.pause();
      }
    };
  }, [visible, targetSpell?.uri, loopMode]);
  
  // 监听播放状态变化
  useEffect(() => {
    if (audioPlayerState) {
      // 更新播放位置
      if (audioPlayerState.currentTime !== undefined) {
        setPosition(audioPlayerState.currentTime);
      }
      
      // 处理播放结束
      if (audioPlayerState.didJustFinish) {
        if (loopMode === 'none') {
          setIsPlaying(false);
        } else if (loopMode === 'all') {
          // 列表循环逻辑（需要多个音频支持）
        }
      }
    }
  }, [audioPlayerState]);
  
  // 播放/暂停
  const togglePlayPause = async () => {
    if (isLoading) return;
    
    try {
      if (isPlaying) {
        await audioPlayer.pause();
      } else {
        await audioPlayer.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('播放控制失败', error);
      setError('播放控制失败');
    }
  };
  
  // 切换循环模式
  const toggleLoopMode = () => {
    const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(loopMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setLoopMode(modes[nextIndex]);
    
    // 设置循环模式
    // audioPlayer.setIsLoopingAsync(modes[nextIndex] === 'one');
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
  const handleClose = async () => {
    if (audioPlayer) {
      await audioPlayer.pause();
    }
    onClose();
  };
  
  // 创建滑动手势响应器
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // 仅当暂停时才允许关闭
        if (!isPlaying && gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // 仅当暂停时才允许关闭
        if (!isPlaying && gestureState.dy > 100) {
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
  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // 计算播放进度百分比
  const progress = duration > 0 ? position / duration : 0;
  
  if (!visible) return null;
  
  return (
    <>
      <Animated.View 
        style={[
          styles.container,
          { 
            transform: [
              { translateY: Animated.add(slideAnim, panY) } 
            ],
            backgroundColor: theme.colors.background,
          }
        ]}
        {...panResponder.panHandlers}
      >
        <Card style={styles.card}>
          <Card.Content style={styles.content}>
            {/* 头部标题和关闭按钮 */}
            <View style={styles.header}>
              <Text variant="titleMedium" style={styles.title}>
                {targetSpell?.name || '音频播放器'}
              </Text>
              <IconButton
                icon="close"
                size={20}
                onPress={handleClose}
              />
            </View>
            
            {/* 错误提示 */}
            {error && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons 
                  name="alert-circle" 
                  size={20} 
                  color={theme.colors.error} 
                />
                <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
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
                <Text variant="labelSmall">
                  {formatTime(position)}
                </Text>
                <Text variant="labelSmall">
                  {formatTime(duration)}
                </Text>
              </View>
            </View>
            
            {/* 控制按钮 */}
            <View style={styles.controls}>
              <IconButton
                icon={loopMode === 'one' ? 'repeat-once' : loopMode === 'all' ? 'repeat' : 'repeat-off'}
                size={28}
                onPress={toggleLoopMode}
                iconColor={loopMode !== 'none' ? theme.colors.primary : theme.colors.onSurface}
                disabled={isLoading}
              />
              
              <IconButton
                icon="skip-previous"
                size={28}
                onPress={() => {}}
                iconColor={theme.colors.onSurface}
                disabled
              />
              
              {isLoading ? (
                <ActivityIndicator animating={true} size={40} color={theme.colors.primary} />
              ) : (
                <Button
                  mode="contained-tonal"
                  onPress={togglePlayPause}
                  style={styles.playButton}
                  contentStyle={styles.playButtonContent}
                >
                  <MaterialCommunityIcons
                    name={isPlaying ? "pause" : "play"}
                    size={32}
                    color={theme.colors.onPrimaryContainer}
                  />
                </Button>
              )}
              
              <IconButton
                icon="skip-next"
                size={28}
                onPress={() => {}}
                iconColor={theme.colors.onSurface}
                disabled
              />
              
              <IconButton
                icon="volume-high"
                size={28}
                onPress={() => {}}
                iconColor={theme.colors.onSurface}
              />
            </View>
            
            {/* 循环模式标签 */}
            <View style={styles.chipContainer}>
              <Chip
                mode="outlined"
                style={[
                  styles.chip, 
                  loopMode === 'none' && { backgroundColor: theme.colors.surfaceVariant }
                ]}
              >
                单次
              </Chip>
              <Chip
                mode="outlined"
                style={[
                  styles.chip, 
                  loopMode === 'one' && { backgroundColor: theme.colors.primaryContainer }
                ]}
              >
                单曲循环
              </Chip>
              <Chip
                mode="outlined"
                style={[
                  styles.chip, 
                  loopMode === 'all' && { backgroundColor: theme.colors.primaryContainer }
                ]}
              >
                列表循环
              </Chip>
            </View>
          </Card.Content>
        </Card>
      </Animated.View>
      
      {/* 提示信息 */}
      {/* <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={{ marginBottom: 80 }}
      >
        音频已加载，正在播放...
      </Snackbar> */}
    </>
  );
}

// const { width } = Dimensions.get('window');
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
  },
  errorText: {
    marginLeft: 8,
    flex: 1,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  chip: {
    marginHorizontal: 4,
  },
});