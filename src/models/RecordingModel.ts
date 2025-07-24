export interface Recording {
  id: string;        // 唯一标识符（如UUID），用于唯一定位
  title: string;      // 录音标题（如“今天早上练习对话”）
  transcript: string; // 录音文稿（原文，如“Hello, how are you?”）
  content: Buffer | string;
  audioPath: string;  // 语音资源本地路径（如"/storage/emulated/0/AppName/recording_123.mp3"）
  createdAt: number;  // 创建时间（时间戳或ISO格式字符串，便于排序）
}