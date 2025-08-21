import { Q } from '@nozbe/watermelondb';
import database from '../index';
import Recording from '../models/Recording';

// 咒语数据类型定义
export interface RecordingData {
  title: string;
  script?: string;
  url: string;
  duration: number;
  playCount?: number;
  recordingTime?: number;
}

// 查询条件类型
export interface RecordingQuery {
  search?: string;
  sortBy?: 'created_at' | 'title' | 'duration' | 'play_count';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export class RecordingRepository {
  /**
   * 创建新咒语
   */
  static async create(data: RecordingData): Promise<Recording> {
    const newRecording = await database.write(async () => {
      return await database.get<Recording>('recordings').create(recording => {
        recording.title = data.title;
        recording.script = data.script || '';
        recording.url = data.url;
        recording.duration = data.duration;
        recording.playCount = data.playCount || 0;
        recording.recordingTime = data.recordingTime || Date.now();
        // WatermelonDB会自动处理createdAt和updatedAt字段
      });
    });
    return newRecording;
  }

  /**
   * 获取所有咒语（静态查询）
   */
  static async getAll(): Promise<Recording[]> {
    return await database.get<Recording>('recordings').query().fetch();
  }

  /**
   * 根据ID获取咒语（静态查询）
   */
  static async getById(id: string): Promise<Recording> {
    return await database.get<Recording>('recordings').find(id);
  }

  /**
   * 更新咒语
   */
  static async update(id: string, data: Partial<RecordingData>): Promise<void> {
    const recording = await database.get<Recording>('recordings').find(id);
    await database.write(async () => {
      await recording.update(record => {
        if (data.title !== undefined) record.title = data.title;
        if (data.script !== undefined) record.script = data.script;
        if (data.url !== undefined) record.url = data.url;
        if (data.duration !== undefined) record.duration = data.duration;
        if (data.playCount !== undefined) record.playCount = data.playCount;
        if (data.recordingTime !== undefined) record.recordingTime = data.recordingTime;
        // WatermelonDB会自动处理updatedAt字段
      });
    });
  }

  /**
   * 删除咒语
   */
  static async delete(id: string): Promise<void> {
    const recording = await database.get<Recording>('recordings').find(id);
    await database.write(async () => {
      await recording.markAsDeleted();
    });
  }

  /**
   * 增加播放次数
   */
  static async incrementPlayCount(id: string): Promise<void> {
    const recording = await database.get<Recording>('recordings').find(id);
    await database.write(async () => {
      await recording.update(record => {
        record.playCount = (record.playCount || 0) + 1;
        // WatermelonDB会自动处理updatedAt字段
      });
    });
  }

  /**
   * 响应式查询所有咒语（按创建时间倒序）
   */
  static observeAll() {
    return database.get<Recording>('recordings').query(Q.sortBy('created_at', 'desc')).observe();
  }

  /**
   * 响应式查询单个咒语
   */
  static observeById(id: string) {
    return database.get<Recording>('recordings').findAndObserve(id);
  }

  /**
   * 响应式查询带条件的咒语列表
   */
  static observeWithQuery(query?: RecordingQuery) {
    const queries = [];

    // 添加搜索条件
    if (query && query.search) {
      queries.push(
        Q.or(
          Q.where('title', Q.like(`%${query.search}%`)),
          Q.where('script', Q.like(`%${query.search}%`)),
        ),
      );
    }

    // 添加排序条件
    if (query && query.sortBy) {
      queries.push(Q.sortBy(query.sortBy, query.sortOrder || 'desc'));
    } else {
      queries.push(Q.sortBy('created_at', 'desc'));
    }

    // 添加限制条件
    if (query && query.limit) {
      queries.push(Q.take(query.limit));
    }

    return database
      .get<Recording>('recordings')
      .query(...queries)
      .observe();
  }

  /**
   * 获取咒语总数（静态查询）
   */
  static async getCount(): Promise<number> {
    return await database.get<Recording>('recordings').query().fetchCount();
  }

  /**
   * 响应式获取咒语总数
   */
  static observeCount() {
    return database.get<Recording>('recordings').query().observeCount();
  }
}
