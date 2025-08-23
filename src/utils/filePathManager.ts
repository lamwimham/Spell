import RNFS from 'react-native-fs';

/**
 * 文件路径管理工具
 * 处理录音文件的路径问题，确保重新安装后仍能正确播放
 */
export class FilePathManager {
  /**
   * 获取录音文件的完整路径
   * @param fileNameOrPath 文件名或原始路径
   * @returns 有效的完整文件路径
   */
  static async getValidPath(fileNameOrPath: string): Promise<string | null> {
    if (!fileNameOrPath) {
      return null;
    }

    // 如果包含路径分隔符，可能是完整路径
    if (fileNameOrPath.includes('/')) {
      // 检查原始路径是否存在
      const exists = await RNFS.exists(fileNameOrPath);
      if (exists) {
        return fileNameOrPath;
      }

      // 从完整路径中提取文件名
      const fileName = fileNameOrPath.split('/').pop();
      if (fileName) {
        const newPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
        const newExists = await RNFS.exists(newPath);
        if (newExists) {
          return newPath;
        }
      }
    } else {
      // 如果是文件名，直接构建路径
      const fullPath = `${RNFS.DocumentDirectoryPath}/${fileNameOrPath}`;
      const exists = await RNFS.exists(fullPath);
      if (exists) {
        return fullPath;
      }
    }

    return null;
  }

  /**
   * 从完整路径提取文件名
   * @param path 完整路径或文件名
   * @returns 文件名
   */
  static extractFileName(path: string): string {
    if (!path.includes('/')) {
      return path;
    }
    return path.split('/').pop() || path;
  }

  /**
   * 检查录音文件是否存在
   * @param fileNameOrPath 文件名或路径
   * @returns 是否存在
   */
  static async fileExists(fileNameOrPath: string): Promise<boolean> {
    const validPath = await this.getValidPath(fileNameOrPath);
    return validPath !== null;
  }

  /**
   * 获取录音目录下的所有文件
   * @returns 文件列表
   */
  static async listRecordingFiles(): Promise<string[]> {
    try {
      const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
      return files
        .filter(file => file.isFile() && (file.name.endsWith('.m4a') || file.name.endsWith('.mp4')))
        .map(file => file.name);
    } catch (error) {
      console.error('读取录音目录失败:', error);
      return [];
    }
  }

  /**
   * 清理无效的录音文件记录
   * 检查数据库中的录音记录，删除文件不存在的记录
   */
  static async validateRecordingFiles(
    recordings: Array<{ id: string; url: string }>,
  ): Promise<string[]> {
    const invalidIds: string[] = [];

    for (const recording of recordings) {
      const exists = await this.fileExists(recording.url);
      if (!exists) {
        invalidIds.push(recording.id);
        console.warn(`录音文件不存在: ${recording.url}`);
      }
    }

    return invalidIds;
  }
}
