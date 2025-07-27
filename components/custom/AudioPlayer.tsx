import { RootState } from '@/store';
import { MaterialIcons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Feather from 'react-native-vector-icons/Feather';

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  InteractionManager,
  Modal,
  PanResponder,
  ActivityIndicator as RNActivityIndicator,
  Text as RNText,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from 'react-native-paper';
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopMode, setLoopMode] = useState<'none' | 'one'>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const panY = useRef(new Animated.Value(0)).current;
  const marginBottomNavHeight = 10;
  const theme = useTheme();

  // 动画控制
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get('window').height + marginBottomNavHeight)
  ).current;

  useEffect(() => {
    if (visible) {
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

  const audioPlayer = useAudioPlayer({
    uri: targetSpell?.uri,
  });

  const audioPlayerState = useAudioPlayerStatus(audioPlayer);

  useEffect(() => {
    if (audioPlayerState.currentTime !== undefined) {
      setPosition(audioPlayerState.currentTime);
    }

    if (audioPlayerState.duration !== undefined && audioPlayerState.duration > 0) {
      setDuration(audioPlayerState.duration);
      setIsLoading(false);
    }

    if (audioPlayerState.didJustFinish) {
      audioPlayer.seekTo(0);
      if (loopMode === 'none') {
        setIsPlaying(false);
      } else {
        audioPlayer.play();
      }
    }
  }, [audioPlayerState]);

  useEffect(() => {
    if (!visible || !targetSpell?.uri) return;

    const loadAndPlay = async () => {
      setIsLoading(true);
      setError(null);
      setLoadingProgress(0);

      try {
        await audioPlayer.replace({ uri: targetSpell.uri });
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
      if (audioPlayer) {
        try {
          audioPlayer.pause();
        } catch (e) {
          console.log('安全暂停失败，可能已卸载');
        }
      }
    };
  }, [visible, targetSpell?.uri]);

  const togglePlayPause = async () => {
    if (isLoading) return;

    try {
      if (isPlaying) {
        await audioPlayer.pause();
        setIsPlaying(false);
      } else {
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

  const toggleLoopMode = () => {
    setLoopMode(prev => prev === 'none' ? 'one' : 'none');
  };

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

  const handleClose = async () => {
    try {
      if (audioPlayer) {
        await audioPlayer.pause();
      }
    } catch (e) {
      console.log('关闭时暂停失败，可能已卸载', e);
    }

    slideAnim.setValue(Dimensions.get('window').height + marginBottomNavHeight);
    panY.setValue(0);
    onClose();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (!isPlaying && gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const closeThreshold = 60 ;
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progress = duration > 0 ? position / duration : loadingProgress;

  const handleDelete = () => setDeleteDialogVisible(true);

  const confirmDelete = async () => {
    setDeleteDialogVisible(false);

    try {
      if (audioPlayer && isPlaying) {
        await audioPlayer.pause();
      }

      if (onDelete) {
        onDelete(spellId);
      }
      onClose();
    } catch (error) {
      console.error('删除失败', error);
    }
  };

  if (!visible) return null;

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: Animated.add(slideAnim, panY) }],
            paddingBottom: marginBottomNavHeight,
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* 底部进度条 */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%`, backgroundColor:theme.colors.primary}]} />
        </View>
        
        <View style={styles.content}>
          {/* 左侧专辑图片 */}
          {/* <View style={styles.albumContainer}>
            {targetSpell?.image ? (
              <Image 
                source={{ uri: targetSpell.image }} 
                style={styles.albumImage} 
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.albumImage, styles.albumPlaceholder]}>
                <MaterialIcons name="music-note" size={36} color={theme.colors.onSurfaceDisabled} />
              </View>
            )}
          </View> */}
          
          {/* 中间信息区域 */}
          <View style={styles.infoContainer}>
            <RNText style={styles.title} numberOfLines={1}>
              {targetSpell?.name || '未知音频'}
            </RNText>
            <RNText style={[styles.timeText, { color: theme.colors.onSurfaceDisabled}]}>
              {formatTime(position)} / {formatTime(duration)}
            </RNText>
          </View>
          
          {/* 右侧控制按钮 */}
          <View style={styles.controls}>
            {/* 循环按钮 */}
            <TouchableOpacity 
              onPress={toggleLoopMode} 
              disabled={isLoading}
              style={styles.controlButton}
            >
              <Feather
                name={loopMode === 'one' ? 'repeat' : 'repeat'}
                size={24}
                color={loopMode !== 'none' ? '#FF5722' : '#ccc'}
              />
            </TouchableOpacity>
            
            {/* 播放/暂停按钮 */}
            {isLoading ? (
              <View style={[styles.playButton, {backgroundColor: theme.colors.primary}]}>
                <RNActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : (
              <TouchableOpacity 
                onPress={togglePlayPause} 
                style={[styles.playButton, {backgroundColor: theme.colors.primary}]}
              >
                <MaterialIcons
                  name={isPlaying ? 'pause' : 'play-arrow'}
                  size={30}
                  color="#FFF"
                />
              </TouchableOpacity>
            )}
            
            {/* 删除按钮 */}
            <TouchableOpacity 
              onPress={handleDelete} 
              disabled={isLoading}
              style={styles.controlButton}
            >
              <MaterialIcons name="delete" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* 删除确认对话框 */}
      <Modal
        visible={deleteDialogVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteDialogVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <RNText style={styles.modalTitle}>Delete Confirmation</RNText>
            <RNText style={styles.modalMessage}>
              Are you sure you want to delete this audio? This action cannot be undone.
            </RNText>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDeleteDialogVisible(false)}
              >
                <RNText style={styles.cancelButtonText}>Cancel</RNText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, {backgroundColor: theme.colors.primary}]}
                onPress={confirmDelete}
              >
                <RNText style={styles.deleteButtonText}>Delete</RNText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 8,
    // paddingBottom: 8,
    shadowColor: '#000',
    // shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
    zIndex: 100,
  },
  progressBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#E0E0E0',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%'
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  albumContainer: {
    marginRight: 16,
  },
  albumImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumPlaceholder: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#ccc',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  controlButton: {
    padding: 8,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});