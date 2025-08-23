/**
 * 打卡服务 - 每日打卡与连续统计的业务逻辑
 * 提供打卡记录、连续天数统计、历史查询等功能
 */

import { CheckInRepository, CheckInData as RepoCheckInData } from '../../database/repositories/CheckInRepository';
import { UserRepository } from '../../database/repositories/UserRepository';
import CheckIn from '../../database/models/CheckIn';

// 打卡类型枚举
export type CheckInType = 'daily' | 'study' | 'exercise' | 'work' | 'custom';

// 打卡数据类型
export interface CheckInData {
  userId: string;
  type: CheckInType;
  note?: string;
  location?: string;
  metadata?: Record<string, any>;
}

// 打卡统计数据
export interface CheckInStats {
  totalDays: number;
  currentStreak: number;
  longestStreak: number;
  thisWeekDays: number;
  thisMonthDays: number;
  todayCheckedIn: boolean;
  lastCheckInDate?: Date;
  checkInTypes: Record<CheckInType, number>;
}

// 打卡历史查询条件
export interface CheckInHistoryQuery {
  userId: string;
  type?: CheckInType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

// 连续打卡数据
export interface StreakData {
  current: number;
  longest: number;
  streakStart?: Date;
  streakEnd?: Date;
  isActive: boolean;
}

// 打卡排行榜数据
export interface CheckInLeaderboard {
  userId: string;
  username: string;
  avatarUrl?: string;
  currentStreak: number;
  totalDays: number;
  rank: number;
}

export class CheckInService {
  /**
   * 每日打卡
   */
  static async checkIn(
    data: CheckInData,
  ): Promise<{ success: boolean; message: string; checkIn?: any }> {
    try {
      // 验证用户存在
      const user = await UserRepository.getById(data.userId);
      if (!user) {
        return { success: false, message: '用户不存在' };
      }

      if (user.status !== 'active') {
        return { success: false, message: '用户账户未激活' };
      }

      // 检查今日是否已打卡
      const todayCheckedIn = await CheckInRepository.hasTodayCheckIn(data.userId);
      if (todayCheckedIn) {
        return { success: false, message: '今日已打卡，请明天再来' };
      }

      // 创建打卡记录
      // 转换数据结构以匹配仓库期望的格式
      const repoData: RepoCheckInData = {
        userId: data.userId,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD 格式
        checkInTime: Date.now(),
        notes: data.note,
      };

      const checkIn = await CheckInRepository.create(repoData);

      return {
        success: true,
        message: '打卡成功！',
        checkIn,
      };
    } catch (error) {
      console.error('打卡失败:', error);
      return { success: false, message: '打卡失败，请稍后重试' };
    }
  }

  /**
   * 检查今日是否已打卡
   */
  static async isTodayCheckedIn(userId: string, _type: CheckInType = 'daily'): Promise<boolean> {
    try {
      // 对于这个实现，我们忽略type参数，因为CheckInRepository只有一种打卡类型
      const todayCheckedIn = await CheckInRepository.hasTodayCheckIn(userId);
      return todayCheckedIn;
    } catch (error) {
      console.error('检查今日打卡状态失败:', error);
      return false;
    }
  }

  /**
   * 获取用户打卡统计
   */
  static async getUserStats(userId: string, type: CheckInType = 'daily'): Promise<CheckInStats> {
    try {
      const checkIns = await CheckInRepository.getAllByUser(userId);

      if (checkIns.length === 0) {
        return {
          totalDays: 0,
          currentStreak: 0,
          longestStreak: 0,
          thisWeekDays: 0,
          thisMonthDays: 0,
          todayCheckedIn: false,
          checkInTypes: this.getEmptyCheckInTypes(),
        };
      }

      // 计算基础统计
      const totalDays = checkIns.length;
      const todayCheckedIn = await this.isTodayCheckedIn(userId, type);
      const lastCheckInDate = checkIns[0]?.createdAt; // checkIns已按时间倒序排列

      // 计算连续天数
      const streakData = this.calculateStreak(checkIns);

      // 计算本周和本月天数
      const now = new Date();
      const thisWeekStart = this.getWeekStart(now);
      const thisMonthStart = this.getMonthStart(now);

      const thisWeekDays = checkIns.filter(checkIn => checkIn.createdAt >= thisWeekStart).length;

      const thisMonthDays = checkIns.filter(checkIn => checkIn.createdAt >= thisMonthStart).length;

      // 按类型统计（简化实现，因为仓库不支持多种类型）
      const checkInTypes = this.getCheckInTypeStats(checkIns);

      return {
        totalDays,
        currentStreak: streakData.current,
        longestStreak: streakData.longest,
        thisWeekDays,
        thisMonthDays,
        todayCheckedIn,
        lastCheckInDate,
        checkInTypes,
      };
    } catch (error) {
      console.error('获取用户打卡统计失败:', error);
      return {
        totalDays: 0,
        currentStreak: 0,
        longestStreak: 0,
        thisWeekDays: 0,
        thisMonthDays: 0,
        todayCheckedIn: false,
        checkInTypes: this.getEmptyCheckInTypes(),
      };
    }
  }

  /**
   * 获取用户打卡历史
   */
  static async getUserHistory(query: CheckInHistoryQuery) {
    try {
      // 简化实现，因为仓库没有完全匹配的方法
      return await CheckInRepository.getAllByUser(query.userId);
    } catch (error) {
      console.error('获取打卡历史失败:', error);
      return [];
    }
  }

  /**
   * 获取连续打卡数据
   */
  static async getStreakData(userId: string, _type: CheckInType = 'daily'): Promise<StreakData> {
    try {
      const checkIns = await CheckInRepository.getAllByUser(userId);
      return this.calculateStreak(checkIns);
    } catch (error) {
      console.error('获取连续打卡数据失败:', error);
      return {
        current: 0,
        longest: 0,
        isActive: false,
      };
    }
  }

  /**
   * 获取打卡排行榜
   */
  static async getLeaderboard(
    type: CheckInType = 'daily',
    limit: number = 10,
  ): Promise<CheckInLeaderboard[]> {
    try {
      // 获取所有用户的打卡统计
      const users = await UserRepository.getAll();
      const leaderboardData: CheckInLeaderboard[] = [];

      for (const user of users) {
        if (user.status !== 'active') continue;

        const stats = await this.getUserStats(user.id, type);
        leaderboardData.push({
          userId: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          currentStreak: stats.currentStreak,
          totalDays: stats.totalDays,
          rank: 0, // 稍后计算
        });
      }

      // 按当前连续天数排序
      leaderboardData.sort((a, b) => {
        if (b.currentStreak === a.currentStreak) {
          return b.totalDays - a.totalDays; // 连续天数相同时按总天数排序
        }
        return b.currentStreak - a.currentStreak;
      });

      // 设置排名
      leaderboardData.forEach((item, index) => {
        item.rank = index + 1;
      });

      return leaderboardData.slice(0, limit);
    } catch (error) {
      console.error('获取打卡排行榜失败:', error);
      return [];
    }
  }

  /**
   * 获取用户打卡日历数据
   */
  static async getCalendarData(
    userId: string,
    year: number,
    month: number,
    _type: CheckInType = 'daily',
  ) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // 当月最后一天

      // 简化实现，因为仓库没有完全匹配的方法
      const checkIns = await CheckInRepository.getAllByUser(userId);

      // 过滤指定日期范围内的打卡记录
      const filteredCheckIns = checkIns.filter(checkIn => {
        return checkIn.createdAt >= startDate && checkIn.createdAt <= endDate;
      });

      // 转换为日历格式
      const calendarData: Record<string, boolean> = {};
      filteredCheckIns.forEach(checkIn => {
        const dateKey = checkIn.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
        calendarData[dateKey] = true;
      });

      return calendarData;
    } catch (error) {
      console.error('获取打卡日历数据失败:', error);
      return {};
    }
  }

  /**
   * 删除打卡记录（管理员功能）
   */
  static async deleteCheckIn(
    checkInId: string,
    operatorUserId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 验证操作者权限
      const operator = await UserRepository.getById(operatorUserId);
      if (!operator || !operator.isAdmin) {
        return { success: false, message: '权限不足' };
      }

      await CheckInRepository.delete(checkInId);
      return { success: true, message: '打卡记录删除成功' };
    } catch (error) {
      console.error('删除打卡记录失败:', error);
      return { success: false, message: '删除失败，请稍后重试' };
    }
  }

  /**
   * 计算连续打卡天数
   */
  private static calculateStreak(checkIns: CheckIn[]): StreakData {
    if (checkIns.length === 0) {
      return { current: 0, longest: 0, isActive: false };
    }

    // 按日期分组（去重同一天的多次打卡）
    const checkInDates = new Set(
      checkIns.map(checkIn => checkIn.createdAt.toISOString().split('T')[0]),
    );

    const sortedDates = Array.from(checkInDates).sort().reverse(); // 最新日期在前

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let isActive = false;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 检查是否今天或昨天有打卡（连续性判断）
    if (sortedDates[0] === today) {
      isActive = true;
      currentStreak = 1;
    } else if (sortedDates[0] === yesterday) {
      isActive = true;
      currentStreak = 1;
    }

    // 计算当前连续天数
    if (isActive) {
      for (let i = 0; i < sortedDates.length - 1; i++) {
        const currentDate = new Date(sortedDates[i]);
        const nextDate = new Date(sortedDates[i + 1]);

        const diffDays = Math.floor(
          (currentDate.getTime() - nextDate.getTime()) / (24 * 60 * 60 * 1000),
        );

        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // 计算最长连续天数
    tempStreak = 1;
    longestStreak = 1;

    for (let i = 0; i < sortedDates.length - 1; i++) {
      const currentDate = new Date(sortedDates[i]);
      const nextDate = new Date(sortedDates[i + 1]);

      const diffDays = Math.floor(
        (currentDate.getTime() - nextDate.getTime()) / (24 * 60 * 60 * 1000),
      );

      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    return {
      current: currentStreak,
      longest: longestStreak,
      isActive,
      streakStart: isActive ? new Date(sortedDates[currentStreak - 1] + 'T00:00:00') : undefined,
      streakEnd: isActive ? new Date(sortedDates[0] + 'T23:59:59') : undefined,
    };
  }

  /**
   * 获取本周开始日期
   */
  private static getWeekStart(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day; // 周日为第一天
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  /**
   * 获取本月开始日期
   */
  private static getMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  }

  /**
   * 获取空的打卡类型统计
   */
  private static getEmptyCheckInTypes(): Record<CheckInType, number> {
    return {
      daily: 0,
      study: 0,
      exercise: 0,
      work: 0,
      custom: 0,
    };
  }

  /**
   * 统计各类型打卡次数（简化实现）
   */
  private static getCheckInTypeStats(checkIns: CheckIn[]): Record<CheckInType, number> {
    const stats = this.getEmptyCheckInTypes();
    
    // 由于仓库不支持多种类型，我们将所有打卡都归类为daily类型
    stats.daily = checkIns.length;

    return stats;
  }

  /**
   * 获取打卡建议
   */
  static async getCheckInSuggestions(userId: string): Promise<string[]> {
    try {
      const stats = await this.getUserStats(userId);
      const suggestions: string[] = [];

      if (!stats.todayCheckedIn) {
        suggestions.push('今天还没有打卡，快来打卡吧！');
      }

      if (stats.currentStreak === 0) {
        suggestions.push('开始你的第一次打卡，建立良好习惯！');
      } else if (stats.currentStreak < 7) {
        suggestions.push(`已连续${stats.currentStreak}天，继续保持！`);
      } else if (stats.currentStreak < 30) {
        suggestions.push(`连续${stats.currentStreak}天打卡，你很棒！`);
      } else {
        suggestions.push(`连续${stats.currentStreak}天，你是打卡达人！`);
      }

      if (stats.currentStreak > 0 && stats.currentStreak < stats.longestStreak) {
        suggestions.push(`距离最高纪录还差${stats.longestStreak - stats.currentStreak}天`);
      }

      return suggestions;
    } catch (error) {
      console.error('获取打卡建议失败:', error);
      return ['每日打卡，养成好习惯！'];
    }
  }

  /**
   * 获取打卡成就
   */
  static async getAchievements(
    userId: string,
  ): Promise<Array<{ title: string; description: string; achieved: boolean; progress?: number }>> {
    try {
      const stats = await this.getUserStats(userId);

      const achievements = [
        {
          title: '初次打卡',
          description: '完成第一次打卡',
          achieved: stats.totalDays >= 1,
        },
        {
          title: '连续一周',
          description: '连续打卡7天',
          achieved: stats.longestStreak >= 7,
          progress: Math.min((stats.currentStreak / 7) * 100, 100),
        },
        {
          title: '连续一月',
          description: '连续打卡30天',
          achieved: stats.longestStreak >= 30,
          progress: Math.min((stats.currentStreak / 30) * 100, 100),
        },
        {
          title: '百日坚持',
          description: '连续打卡100天',
          achieved: stats.longestStreak >= 100,
          progress: Math.min((stats.currentStreak / 100) * 100, 100),
        },
        {
          title: '月度达人',
          description: '单月打卡25天以上',
          achieved: stats.thisMonthDays >= 25,
          progress: (stats.thisMonthDays / 25) * 100,
        },
      ];

      return achievements;
    } catch (error) {
      console.error('获取打卡成就失败:', error);
      return [];
    }
  }
}