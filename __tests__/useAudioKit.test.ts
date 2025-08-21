// AudioKit Hook 测试

import { renderHook, act } from '@testing-library/react-native';
import useAudioKit from '../src/hooks/useAudioKit';

// Mock react-native-audio-recorder-player
jest.mock('react-native-audio-recorder-player', () => {
  const mockInstance = {
    setSubscriptionDuration: jest.fn(),
    startRecorder: jest.fn().mockResolvedValue('/test/path/recording.m4a'),
    stopRecorder: jest.fn().mockResolvedValue('/test/path/recording.m4a'),
    pauseRecorder: jest.fn().mockResolvedValue('paused'),
    resumeRecorder: jest.fn().mockResolvedValue('resumed'),
    startPlayer: jest.fn().mockResolvedValue('started'),
    pausePlayer: jest.fn().mockResolvedValue('paused'),
    resumePlayer: jest.fn().mockResolvedValue('resumed'),
    stopPlayer: jest.fn().mockResolvedValue('stopped'),
    seekToPlayer: jest.fn().mockResolvedValue('seeked'),
    setVolume: jest.fn().mockResolvedValue('volume set'),
    setPlaybackSpeed: jest.fn().mockResolvedValue('speed set'),
    addRecordBackListener: jest.fn(),
    removeRecordBackListener: jest.fn(),
    addPlayBackListener: jest.fn(),
    removePlayBackListener: jest.fn(),
    mmssss: jest.fn().mockImplementation(millis => {
      const totalSeconds = Math.floor(millis / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const milliseconds = Math.floor((millis % 1000) / 10);
      return `${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
    }),
  };

  return jest.fn(() => mockInstance);
});

describe('useAudioKit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useAudioKit());

    expect(result.current.audioState).toEqual({
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
  });

  it('should start recording', async () => {
    const { result } = renderHook(() => useAudioKit());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.audioState.isRecording).toBe(true);
    expect(result.current.audioState.isPaused).toBe(false);
    expect(result.current.getRecordingUri()).toBe('/test/path/recording.m4a');
  });

  it('should stop recording', async () => {
    const { result } = renderHook(() => useAudioKit());

    // Start recording first
    await act(async () => {
      await result.current.startRecording();
    });

    // Stop recording
    await act(async () => {
      await result.current.stopRecording();
    });

    expect(result.current.audioState.isRecording).toBe(false);
    expect(result.current.audioState.isPaused).toBe(false);
  });

  it('should pause and resume recording', async () => {
    const { result } = renderHook(() => useAudioKit());

    // Start recording
    await act(async () => {
      await result.current.startRecording();
    });

    // Pause recording
    await act(async () => {
      await result.current.pauseRecording();
    });

    expect(result.current.audioState.isPaused).toBe(true);

    // Resume recording
    await act(async () => {
      await result.current.resumeRecording();
    });

    expect(result.current.audioState.isPaused).toBe(false);
  });

  it('should reset recording', async () => {
    const { result } = renderHook(() => useAudioKit());

    // Start recording
    await act(async () => {
      await result.current.startRecording();
    });

    // Reset recording
    await act(async () => {
      await result.current.resetRecording();
    });

    expect(result.current.audioState.isRecording).toBe(false);
    expect(result.current.audioState.isPaused).toBe(false);
    expect(result.current.getRecordingUri()).toBeNull();
  });

  it('should start playing', async () => {
    const { result } = renderHook(() => useAudioKit());

    await act(async () => {
      await result.current.startPlaying('/test/path/audio.mp3');
    });

    expect(result.current.audioState.isPlaying).toBe(true);
    expect(result.current.audioState.isPaused).toBe(false);
    expect(result.current.getPlayingUri()).toBe('/test/path/audio.mp3');
  });

  it('should pause and resume playing', async () => {
    const { result } = renderHook(() => useAudioKit());

    // Start playing
    await act(async () => {
      await result.current.startPlaying('/test/path/audio.mp3');
    });

    // Pause playing
    await act(async () => {
      await result.current.pausePlaying();
    });

    expect(result.current.audioState.isPaused).toBe(true);

    // Resume playing
    await act(async () => {
      await result.current.resumePlaying();
    });

    expect(result.current.audioState.isPaused).toBe(false);
  });

  it('should stop playing', async () => {
    const { result } = renderHook(() => useAudioKit());

    // Start playing
    await act(async () => {
      await result.current.startPlaying('/test/path/audio.mp3');
    });

    // Stop playing
    await act(async () => {
      await result.current.stopPlaying();
    });

    expect(result.current.audioState.isPlaying).toBe(false);
    expect(result.current.audioState.isPaused).toBe(false);
  });

  it('should handle errors properly', async () => {
    const { result } = renderHook(() => useAudioKit());

    // Test starting recording when already recording
    await act(async () => {
      await result.current.startRecording();
      await expect(result.current.startRecording()).rejects.toThrow('已经在咒语中');
    });

    // Test stopping recording when not recording
    await act(async () => {
      await result.current.stopRecording();
      await expect(result.current.stopRecording()).rejects.toThrow('当前没有在咒语');
    });
  });
});
