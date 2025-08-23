/**
 * 打卡记录数据仓库 - 打卡数据的访问层
 * 支持每日打卡、连续统计和情绪分析功能
 */

import { Q } from '@nozbe/watermelondb';
import database from '../index';
import CheckIn from '../models/CheckIn';

// 打卡数据类型定义
export interface CheckInData {
  userId: string;
  date: string; // YYYY-MM-DD 格式
  checkInTime: number; // Unix 时间戳
  notes?: string;
  moodScore?: number; // 1-5 情绪评分
}

// 打卡查询条件类型
export interface CheckInQuery {
  userId?: string;
  dateRange?: {
    start: string; // YYYY-MM-DD
    end: string; // YYYY-MM-DD
  };
  moodScore?: number;
  sortBy?: 'date' | 'check_in_time' | 'mood_score';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

// 打卡统计数据类型
export interface CheckInStats {
  totalDays: number;
  currentStreak: number;
  longestStreak: number;
  averageMoodScore: number;
  thisMonthCount: number;
  lastMonthCount: number;
}

export class CheckInRepository {
  /**
   * 创建新打卡记录
   */
  static async create(data: CheckInData): Promise<CheckIn> {
    const newCheckIn = await database.write(async () => {
      return await database.get<CheckIn>('check_ins').create(checkIn => {
        checkIn.userId = data.userId;
        checkIn.date = data.date;
        checkIn.checkInTime = data.checkInTime;
        checkIn.notes = data.notes;
        checkIn.moodScore = data.moodScore;
        // WatermelonDB会自动处理createdAt和updatedAt字段
      });
    });
    return newCheckIn;
  }

  /**
   * 检查今日是否已打卡
   */
  static async hasTodayCheckIn(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const count = await database
      .get<CheckIn>('check_ins')
      .query(Q.where('user_id', userId), Q.where('date', today))
      .fetchCount();
    return count > 0;
  }

  /**
   * 获取今日打卡记录
   */
  static async getTodayCheckIn(userId: string): Promise<CheckIn | null> {
    const today = new Date().toISOString().split('T')[0];
    const checkIns = await database
      .get<CheckIn>('check_ins')
      .query(Q.where('user_id', userId), Q.where('date', today))
      .fetch();
    return checkIns.length > 0 ? checkIns[0] : null;
  }

  /**
   * 获取用户所有打卡记录（静态查询）
   */
  static async getAllByUser(userId: string): Promise<CheckIn[]> {
    return await database
      .get<CheckIn>('check_ins')
      .query(Q.where('user_id', userId), Q.sortBy('date', 'desc'))
      .fetch();
  }

  /**
   * 根据ID获取打卡记录（静态查询）
   */
  static async getById(id: string): Promise<CheckIn> {
    return await database.get<CheckIn>('check_ins').find(id);
  }

  /**
   * 更新打卡记录
   */
  static async update(id: string, data: Partial<CheckInData>): Promise<void> {
    const checkIn = await database.get<CheckIn>('check_ins').find(id);
    await database.write(async () => {
      await checkIn.update(record => {
        if (data.userId !== undefined) record.userId = data.userId;
        if (data.date !== undefined) record.date = data.date;
        if (data.checkInTime !== undefined) record.checkInTime = data.checkInTime;
        if (data.notes !== undefined) record.notes = data.notes;
        if (data.moodScore !== undefined) record.moodScore = data.moodScore;
        // WatermelonDB会自动处理updatedAt字段
      });
    });
  }

  /**
   * 删除打卡记录
   */
  static async delete(id: string): Promise<void> {
    const checkIn = await database.get<CheckIn>('check_ins').find(id);
    await database.write(async () => {
      await checkIn.markAsDeleted();
    });
  }

  /**
   * 响应式查询用户打卡记录（按日期倒序）
   */
  static observeByUser(userId: string) {
    return database
      .get<CheckIn>('check_ins')
      .query(Q.where('user_id', userId), Q.sortBy('date', 'desc'))
      .observe();
  }

  /**
   * 响应式查询单个打卡记录
   */
  static observeById(id: string) {
    return database.get<CheckIn>('check_ins').findAndObserve(id);
  }

  /**
   * 响应式查询带条件的打卡记录
   */
  static observeWithQuery(query?: CheckInQuery) {
    const queries = [];

    // 添加用户ID条件
    if (query && query.userId) {
      queries.push(Q.where('user_id', query.userId));
    }

    // 添加日期范围条件
    if (query && query.dateRange) {
      queries.push(
        Q.where('date', Q.gte(query.dateRange.start)),
        Q.where('date', Q.lte(query.dateRange.end)),
      );
    }

    // 添加情绪评分条件
    if (query && query.moodScore) {
      queries.push(Q.where('mood_score', query.moodScore));
    }

    // 添加排序条件
    if (query && query.sortBy) {
      queries.push(Q.sortBy(query.sortBy, query.sortOrder || 'desc'));
    } else {
      queries.push(Q.sortBy('date', 'desc'));
    }

    // 添加限制条件
    if (query && query.limit) {
      queries.push(Q.take(query.limit));
    }

    return database
      .get<CheckIn>('check_ins')
      .query(...queries)
      .observe();
  }

  /**
   * 获取用户打卡统计数据
   */
  static async getUserStats(userId: string): Promise<CheckInStats> {
    const allCheckIns = await this.getAllByUser(userId);

    if (allCheckIns.length === 0) {
      return {
        totalDays: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageMoodScore: 0,
        thisMonthCount: 0,
        lastMonthCount: 0,
      };
    }

    // 计算总打卡天数
    const totalDays = allCheckIns.length;

    // 计算当前连续打卡天数
    const currentStreak = this.calculateCurrentStreak(allCheckIns);

    // 计算最长连续打卡天数
    const longestStreak = this.calculateLongestStreak(allCheckIns);

    // 计算平均情绪评分
    const moodScores = allCheckIns
      .map(c => c.moodScore)
      .filter(score => score !== null && score !== undefined) as number[];
    const averageMoodScore =
      moodScores.length > 0
        ? moodScores.reduce((sum, score) => sum + score, 0) / moodScores.length
        : 0;

    // 计算本月和上月打卡次数
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonth = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;

    const thisMonthCount = allCheckIns.filter(c => c.date.startsWith(thisMonth)).length;
    const lastMonthCount = allCheckIns.filter(c => c.date.startsWith(lastMonth)).length;

    return {
      totalDays,
      currentStreak,
      longestStreak,
      averageMoodScore: Math.round(averageMoodScore * 10) / 10,
      thisMonthCount,
      lastMonthCount,
    };
  }

  /**
   * 计算当前连续打卡天数
   */
  private static calculateCurrentStreak(checkIns: CheckIn[]): number {
    if (checkIns.length === 0) return 0;

    // 按日期正序排列
    const sortedCheckIns = checkIns.sort((a, b) => a.date.localeCompare(b.date));

    let streak = 0;
    const currentDate = new Date();

    // 从今天开始往前检查
    for (let i = 0; i < 365; i++) {
      // 最多检查一年
      const dateStr = currentDate.toISOString().split('T')[0];
      const hasCheckIn = sortedCheckIns.some(c => c.date === dateStr);

      if (hasCheckIn) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (i === 0) {
        // 如果今天没有打卡，检查昨天开始的连续天数
        currentDate.setDate(currentDate.getDate() - 1);
        continue;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * 计算最长连续打卡天数
   */
  private static calculateLongestStreak(checkIns: CheckIn[]): number {
    if (checkIns.length === 0) return 0;

    // 按日期正序排列
    const sortedCheckIns = checkIns.sort((a, b) => a.date.localeCompare(b.date));

    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedCheckIns.length; i++) {
      const prevDate = new Date(sortedCheckIns[i - 1].date);
      const currentDate = new Date(sortedCheckIns[i].date);

      // 计算日期差
      const diffTime = currentDate.getTime() - prevDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        // 连续的天数
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        // 不连续，重置计数
        currentStreak = 1;
      }
    }

    return maxStreak;
  }

  /**
   * 获取最近N天的打卡记录
   */
  static async getRecentCheckIns(userId: string, days: number = 7): Promise<CheckIn[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    return await database
      .get<CheckIn>('check_ins')
      .query(
        Q.where('user_id', userId),
        Q.where('date', Q.gte(startDateStr)),
        Q.where('date', Q.lte(endDateStr)),
        Q.sortBy('date', 'desc'),
      )
      .fetch();
  }

  /**
   * 获取打卡记录总数
   */
  static async getCount(): Promise<number> {
    return await database.get<CheckIn>('check_ins').query().fetchCount();
  }

  /**
   * 获取用户打卡记录总数
   */
  static async getCountByUser(userId: string): Promise<number> {
    return await database.get<CheckIn>('check_ins').query(Q.where('user_id', userId)).fetchCount();
  }

  /**
   * 响应式获取打卡记录总数
   */
  static observeCount() {
    return database.get<CheckIn>('check_ins').query().observeCount();
  }

  /**
   * 响应式获取用户打卡记录总数
   */
  static observeCountByUser(userId: string) {
    return database.get<CheckIn>('check_ins').query(Q.where('user_id', userId)).observeCount();
  }
}
