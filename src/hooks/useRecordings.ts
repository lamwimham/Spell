import { useDatabase } from '../database/DatabaseProvider';
import { useEffect, useState } from 'react';
import {
  RecordingRepository,
  RecordingQuery,
  RecordingData,
} from '../database/repositories/RecordingRepository';
import Recording from '../database/models/Recording';

/**
 * 使用所有录音列表的Hook
 * 提供响应式的录音列表，会自动更新当数据库变化时
 */
export const useRecordings = () => {
  const database = useDatabase();
  const [recordings, setRecordings] = useState<Recording[]>([]);

  useEffect(() => {
    // 创建响应式查询
    const subscription = RecordingRepository.observeAll().subscribe(
      (newRecordings: Recording[]) => {
        setRecordings(newRecordings);
      },
    );

    // 清理订阅
    return () => subscription.unsubscribe();
  }, [database]);

  return recordings;
};

/**
 * 使用带条件查询的录音列表Hook
 * @param query 查询条件
 */
export const useRecordingsQuery = (query: RecordingQuery) => {
  const database = useDatabase();
  const [recordings, setRecordings] = useState<Recording[]>([]);

  useEffect(() => {
    // 创建响应式查询
    const subscription = RecordingRepository.observeWithQuery(query).subscribe(
      (newRecordings: Recording[]) => {
        setRecordings(newRecordings);
      },
    );

    // 清理订阅
    return () => subscription.unsubscribe();
  }, [database, JSON.stringify(query)]);

  return recordings;
};

/**
 * 使用单个录音详情的Hook
 * @param id 录音ID
 */
export const useRecording = (id: string | null) => {
  const database = useDatabase();
  const [recording, setRecording] = useState<Recording | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      setRecording(undefined);
      return;
    }

    // 创建响应式查询
    const subscription = RecordingRepository.observeById(id).subscribe(
      (newRecording: Recording) => {
        setRecording(newRecording);
      },
    );

    // 清理订阅
    return () => subscription.unsubscribe();
  }, [database, id]);

  return recording;
};

/**
 * 使用录音总数的Hook
 */
export const useRecordingsCount = () => {
  const database = useDatabase();
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    // 创建响应式查询
    const subscription = RecordingRepository.observeCount().subscribe((newCount: number) => {
      setCount(newCount);
    });

    // 清理订阅
    return () => subscription.unsubscribe();
  }, [database]);

  return count;
};

/**
 * 录音操作Hook
 * 提供创建、更新、删除等操作方法
 */
export const useRecordingActions = () => {
  // const database = useDatabase();

  // 创建录音
  const createRecording = async (data: RecordingData) => {
    try {
      const recording = await RecordingRepository.create(data);
      return { success: true, data: recording };
    } catch (error: any) {
      console.error('创建录音失败:', error);
      return { success: false, error: error.message };
    }
  };

  // 更新录音
  const updateRecording = async (id: string, data: Partial<RecordingData>) => {
    try {
      await RecordingRepository.update(id, data);
      return { success: true };
    } catch (error: any) {
      console.error('更新录音失败:', error);
      return { success: false, error: error.message };
    }
  };

  // 删除录音
  const deleteRecording = async (id: string) => {
    try {
      await RecordingRepository.delete(id);
      return { success: true };
    } catch (error: any) {
      console.error('删除录音失败:', error);
      return { success: false, error: error.message };
    }
  };

  // 增加播放次数
  const incrementPlayCount = async (id: string) => {
    try {
      await RecordingRepository.incrementPlayCount(id);
      return { success: true };
    } catch (error: any) {
      console.error('增加播放次数失败:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    createRecording,
    updateRecording,
    deleteRecording,
    incrementPlayCount,
  };
};
