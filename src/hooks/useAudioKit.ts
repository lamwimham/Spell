// 全局音频管理 Hook
// 提供录音和播放功能的统一接口

import { useState, useEffect, useRef } from 'react';
import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSet,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
} from 'react-native-audio-recorder-player';

interface AudioState {
  isRecording: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  recordSecs: number;
  recordTime: string;
  currentPosition: number;
  totalDuration: number;
  playTime: string;
  duration: string;
}

interface AudioKitHook {
  // 状态
  audioState: AudioState;

  // 录音方法
  startRecording: () => Promise<string>;
  stopRecording: () => Promise<string>;
  pauseRecording: () => Promise<string>;
  resumeRecording: () => Promise<string>;
  resetRecording: () => Promise<void>;

  // 播放方法
  startPlaying: (uri: string, isLooping?: boolean) => Promise<string>;
  pausePlaying: () => Promise<string>;
  resumePlaying: () => Promise<string>;
  stopPlaying: () => Promise<string>;
  seekTo: (milliseconds: number) => Promise<string>;

  // 控制方法
  setVolume: (volume: number) => Promise<string>;
  setPlaybackSpeed: (speed: number) => Promise<string>;

  // 获取音频 URI
  getRecordingUri: () => string | null;
  getPlayingUri: () => string | null;
}

const useAudioKit = (): AudioKitHook => {
  // 音频播放器实例
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;

  // 状态管理
  const [audioState, setAudioState] = useState<AudioState>({
    isRecording: false,
    isPlaying: false,
    isPaused: false,
    recordSecs: 0,
    recordTime: '00:00:00',
    currentPosition: 0,
    totalDuration: 0,
    playTime: '00:00:00',
    duration: '00:00:00',
  });

  // 当前录音和播放的 URI
  const recordingUri = useRef<string | null>(null);
  const playingUri = useRef<string | null>(null);
  const isLooping = useRef<boolean>(false);

  // 初始化
  useEffect(() => {
    // 设置默认的回调间隔为500ms
    audioRecorderPlayer.setSubscriptionDuration(0.5);

    // 清理函数
    return () => {
      cleanup();
    };
  }, []);

  // 清理资源
  const cleanup = () => {
    // 移除所有监听器
    audioRecorderPlayer.removeRecordBackListener();
    audioRecorderPlayer.removePlayBackListener();

    // 停止录音和播放
    if (audioState.isRecording) {
      audioRecorderPlayer.stopRecorder().catch(() => {});
    }

    if (audioState.isPlaying) {
      audioRecorderPlayer.stopPlayer().catch(() => {});
    }
  };

  // 录音相关方法
  const startRecording = async (): Promise<string> => {
    if (audioState.isRecording) {
      throw new Error('已经在录音中');
    }

    try {
      const audioSet: AudioSet = {
        // iOS Settings
        AVSampleRateKeyIOS: 44100,
        AVFormatIDKeyIOS: 'aac',
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVNumberOfChannelsKeyIOS: 2,

        // Android Settings
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
      };

      // 设置录音进度监听器
      audioRecorderPlayer.addRecordBackListener(e => {
        setAudioState(prev => ({
          ...prev,
          recordSecs: e.currentPosition,
          recordTime: audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)),
        }));
      });

      // 开始录音
      const uri = await audioRecorderPlayer.startRecorder(undefined, audioSet, true);
      recordingUri.current = uri;

      setAudioState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
      }));

      return uri;
    } catch (err: any) {
      console.error('开始录音失败:', err);
      // 提供更具体的错误信息
      if (err.message && err.message.includes('permission')) {
        throw new Error('录音权限被拒绝，请在设置中允许访问麦克风');
      }
      throw new Error(`录音启动失败: ${err.message || err}`);
    }
  };

  const stopRecording = async (): Promise<string> => {
    if (!audioState.isRecording) {
      throw new Error('当前没有在录音');
    }

    try {
      const uri = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();

      setAudioState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false,
      }));

      return uri;
    } catch (err: any) {
      console.error('停止录音失败:', err);
      throw new Error(`停止录音失败: ${err.message || err}`);
    }
  };

  const pauseRecording = async (): Promise<string> => {
    if (!audioState.isRecording) {
      throw new Error('当前没有在录音');
    }

    try {
      const result = await audioRecorderPlayer.pauseRecorder();

      setAudioState(prev => ({
        ...prev,
        isPaused: true,
      }));

      return result;
    } catch (err: any) {
      console.error('暂停录音失败:', err);
      throw new Error(`暂停录音失败: ${err.message || err}`);
    }
  };

  const resumeRecording = async (): Promise<string> => {
    if (!audioState.isRecording || !audioState.isPaused) {
      throw new Error('当前没有暂停的录音');
    }

    try {
      const result = await audioRecorderPlayer.resumeRecorder();

      setAudioState(prev => ({
        ...prev,
        isPaused: false,
      }));

      return result;
    } catch (err: any) {
      console.error('恢复录音失败:', err);
      throw new Error(`恢复录音失败: ${err.message || err}`);
    }
  };

  const resetRecording = async (): Promise<void> => {
    if (audioState.isRecording) {
      try {
        await stopRecording();
      } catch (err) {
        console.warn('停止录音时出错:', err);
      }
    }

    // 重置状态
    recordingUri.current = null;
    setAudioState(prev => ({
      ...prev,
      isRecording: false,
      isPaused: false,
      recordSecs: 0,
      recordTime: '00:00:00',
    }));
  };

  // 播放相关方法
  const startPlaying = async (uri: string, looping: boolean = false): Promise<string> => {
    if (audioState.isPlaying) {
      await stopPlaying();
    }

    try {
      isLooping.current = looping;
      playingUri.current = uri;

      // 设置播放进度监听器
      audioRecorderPlayer.addPlayBackListener(e => {
        // 检查是否播放完成
        if (e.currentPosition >= e.duration) {
          if (isLooping.current) {
            // 循环播放
            audioRecorderPlayer.seekToPlayer(0);
          } else {
            // 播放完成
            stopPlaying();
          }
        }

        setAudioState(prev => ({
          ...prev,
          currentPosition: e.currentPosition,
          totalDuration: e.duration,
          playTime: audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)),
          duration: audioRecorderPlayer.mmssss(Math.floor(e.duration)),
        }));
      });

      const result = await audioRecorderPlayer.startPlayer(uri);

      setAudioState(prev => ({
        ...prev,
        isPlaying: true,
        isPaused: false,
      }));

      return result;
    } catch (err: any) {
      console.error('开始播放失败:', err);
      throw new Error(`播放启动失败: ${err.message || err}`);
    }
  };

  const pausePlaying = async (): Promise<string> => {
    if (!audioState.isPlaying) {
      throw new Error('当前没有在播放');
    }

    try {
      const result = await audioRecorderPlayer.pausePlayer();

      setAudioState(prev => ({
        ...prev,
        isPaused: true,
      }));

      return result;
    } catch (err: any) {
      console.error('暂停播放失败:', err);
      throw new Error(`暂停播放失败: ${err.message || err}`);
    }
  };

  const resumePlaying = async (): Promise<string> => {
    if (!audioState.isPlaying || !audioState.isPaused) {
      throw new Error('当前没有暂停的播放');
    }

    try {
      const result = await audioRecorderPlayer.resumePlayer();

      setAudioState(prev => ({
        ...prev,
        isPaused: false,
      }));

      return result;
    } catch (err: any) {
      console.error('恢复播放失败:', err);
      throw new Error(`恢复播放失败: ${err.message || err}`);
    }
  };

  const stopPlaying = async (): Promise<string> => {
    if (!audioState.isPlaying) {
      return '未在播放中';
    }

    try {
      const result = await audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();

      setAudioState(prev => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        currentPosition: 0,
        playTime: '00:00:00',
      }));

      playingUri.current = null;
      return result;
    } catch (err: any) {
      console.error('停止播放失败:', err);
      throw new Error(`停止播放失败: ${err.message || err}`);
    }
  };

  const seekTo = async (milliseconds: number): Promise<string> => {
    if (!audioState.isPlaying && !audioState.isPaused) {
      throw new Error('当前没有在播放');
    }

    try {
      return await audioRecorderPlayer.seekToPlayer(milliseconds);
    } catch (err: any) {
      console.error('跳转位置失败:', err);
      throw new Error(`跳转位置失败: ${err.message || err}`);
    }
  };

  // 控制方法
  const setVolume = async (volume: number): Promise<string> => {
    if (!audioState.isPlaying && !audioState.isPaused) {
      throw new Error('当前没有在播放');
    }

    try {
      return await audioRecorderPlayer.setVolume(volume);
    } catch (err: any) {
      console.error('设置音量失败:', err);
      throw new Error(`设置音量失败: ${err.message || err}`);
    }
  };

  const setPlaybackSpeed = async (speed: number): Promise<string> => {
    if (!audioState.isPlaying && !audioState.isPaused) {
      throw new Error('当前没有在播放');
    }

    try {
      return await audioRecorderPlayer.setPlaybackSpeed(speed);
    } catch (err: any) {
      console.error('设置播放速度失败:', err);
      throw new Error(`设置播放速度失败: ${err.message || err}`);
    }
  };

  // 获取 URI 方法
  const getRecordingUri = (): string | null => {
    return recordingUri.current;
  };

  const getPlayingUri = (): string | null => {
    return playingUri.current;
  };

  return {
    // 状态
    audioState,

    // 录音方法
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,

    // 播放方法
    startPlaying,
    pausePlaying,
    resumePlaying,
    stopPlaying,
    seekTo,

    // 控制方法
    setVolume,
    setPlaybackSpeed,

    // 获取 URI
    getRecordingUri,
    getPlayingUri,
  };
};

export default useAudioKit;
