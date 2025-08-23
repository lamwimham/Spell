import { useEffect, useState } from 'react';
import RNFS from 'react-native-fs';
import { FilePathManager } from '../utils/filePathManager';
import { useRecordings, useRecordingActions } from './useRecordings';

/**
 * 录音数据验证和清理Hook
 * 检查录音文件是否存在，清理无效记录
 */
export const useRecordingValidation = () => {
  const recordings = useRecordings();
  const { deleteRecording } = useRecordingActions();
  const [isValidating, setIsValidating] = useState(false);
  const [invalidCount, setInvalidCount] = useState(0);

  // 验证录音文件的有效性
  const validateRecordings = async () => {
    if (recordings.length === 0) return;

    setIsValidating(true);
    let removedCount = 0;

    try {
      const recordingData = recordings.map(r => ({
        id: r.id,
        url: r.url,
        title: r.title,
      }));

      const invalidIds = await FilePathManager.validateRecordingFiles(recordingData);

      // 删除无效记录
      for (const id of invalidIds) {
        try {
          await deleteRecording(id);
          removedCount++;
          console.log(`已删除无效录音记录: ${id}`);
        } catch (error) {
          console.error(`删除无效录音记录失败 ${id}:`, error);
        }
      }

      setInvalidCount(removedCount);

      if (removedCount > 0) {
        console.log(`数据清理完成，删除了 ${removedCount} 个无效录音记录`);
      }
    } catch (error) {
      console.error('录音数据验证失败:', error);
    } finally {
      setIsValidating(false);
    }
  };

  // 获取可用的录音文件列表
  const getAvailableFiles = async (): Promise<string[]> => {
    try {
      return await FilePathManager.listRecordingFiles();
    } catch (error) {
      console.error('获取录音文件列表失败:', error);
      return [];
    }
  };

  // 清理孤立文件（数据库中没有记录但文件存在）
  const cleanOrphanFiles = async (): Promise<number> => {
    try {
      const allFiles = await getAvailableFiles();
      const recordingUrls = recordings.map(r => FilePathManager.extractFileName(r.url));

      let cleanedCount = 0;
      for (const fileName of allFiles) {
        if (!recordingUrls.includes(fileName)) {
          try {
            const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
            await RNFS.unlink(filePath);
            cleanedCount++;
            console.log(`已删除孤立文件: ${fileName}`);
          } catch (error) {
            console.error(`删除孤立文件失败 ${fileName}:`, error);
          }
        }
      }

      return cleanedCount;
    } catch (error) {
      console.error('清理孤立文件失败:', error);
      return 0;
    }
  };

  // 应用启动时自动验证
  useEffect(() => {
    // 延迟执行，避免影响应用启动性能
    const timer = setTimeout(() => {
      validateRecordings();
    }, 2000);

    return () => clearTimeout(timer);
  }, [recordings.length]);

  return {
    isValidating,
    invalidCount,
    validateRecordings,
    getAvailableFiles,
    cleanOrphanFiles,
  };
};
