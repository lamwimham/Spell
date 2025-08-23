/**
 * 打卡统计组件 - 显示用户打卡数据分析和可视化统计
 * 包括连续天数、成就徽章、日历视图和趋势分析
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { CheckInService, CheckInType, CheckInStats } from '../../services/checkin/checkinService';

const { width: screenWidth } = Dimensions.get('window');

// 组件属性接口
interface CheckinStatsProps {
  type?: CheckInType;
  showCalendar?: boolean;
  showAchievements?: boolean;
  showLeaderboard?: boolean;
  onStatsUpdate?: (stats: CheckInStats) => void;
}

// 成就数据类型
interface Achievement {
  title: string;
  description: string;
  achieved: boolean;
  progress?: number;
}

/**
 * 打卡统计组件
 */
const CheckinStats: React.FC<CheckinStatsProps> = ({
  type = 'daily',
  showCalendar = true,
  showAchievements = true,
  showLeaderboard = false,
  onStatsUpdate,
}) => {
  const { colors, textStyles, spacing } = useTheme();
  const { session, isAuthenticated } = useAuth();

  // 状态管理
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [calendarData, setCalendarData] = useState<Record<string, boolean>>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // 样式
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: spacing.md,
      gap: spacing.lg,
    },
    section: {
      backgroundColor: colors.backgroundElevated,
      borderRadius: spacing.md,
      padding: spacing.md,
    },
    sectionTitle: {
      ...textStyles.h3,
      color: colors.text,
      marginBottom: spacing.md,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    statCard: {
      flex: 1,
      minWidth: (screenWidth - spacing.md * 4) / 2,
      backgroundColor: colors.background,
      borderRadius: spacing.sm,
      padding: spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statNumber: {
      ...textStyles.h2,
      color: colors.primary,
      fontWeight: '700',
      marginBottom: spacing.xs,
    },
    statLabel: {
      ...textStyles.caption,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    streakCard: {
      backgroundColor: colors.primary + '15',
      borderRadius: spacing.md,
      padding: spacing.lg,
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    streakNumber: {
      ...textStyles.h1,
      color: colors.primary,
      fontWeight: '800',
      marginBottom: spacing.xs,
    },
    streakLabel: {
      ...textStyles.body1,
      color: colors.primary,
      fontWeight: '600',
    },
    streakSubLabel: {
      ...textStyles.caption,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    achievementsContainer: {
      gap: spacing.sm,
    },
    achievementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: colors.background,
      borderRadius: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    achievementItemAchieved: {
      backgroundColor: colors.success + '15',
      borderColor: colors.success,
    },
    achievementIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    achievementIconAchieved: {
      backgroundColor: colors.success,
    },
    achievementIconNotAchieved: {
      backgroundColor: colors.border,
    },
    achievementIconText: {
      fontSize: 18,
    },
    achievementContent: {
      flex: 1,
    },
    achievementTitle: {
      ...textStyles.body1,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    achievementDescription: {
      ...textStyles.body2,
      color: colors.textSecondary,
    },
    progressBar: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      marginTop: spacing.sm,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    calendarContainer: {
      gap: spacing.sm,
    },
    calendarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    calendarNavButton: {
      padding: spacing.sm,
      borderRadius: spacing.sm,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    calendarNavText: {
      ...textStyles.button,
      color: colors.primary,
    },
    calendarMonth: {
      ...textStyles.h3,
      color: colors.text,
    },
    calendarGrid: {
      gap: spacing.xs,
    },
    calendarWeek: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    calendarDay: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    calendarDayChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    calendarDayToday: {
      backgroundColor: colors.secondary + '30',
      borderColor: colors.secondary,
    },
    calendarDayText: {
      ...textStyles.caption,
      color: colors.text,
    },
    calendarDayTextChecked: {
      color: colors.background,
      fontWeight: '600',
    },
    suggestionContainer: {
      gap: spacing.sm,
    },
    suggestionItem: {
      padding: spacing.md,
      backgroundColor: colors.background,
      borderRadius: spacing.sm,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    suggestionText: {
      ...textStyles.body2,
      color: colors.text,
    },
  });

  // 加载统计数据
  const loadStats = useCallback(async () => {
    if (!session?.userId || !isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [statsData, achievementsData, suggestionsData] = await Promise.all([
        CheckInService.getUserStats(session.userId, type),
        CheckInService.getAchievements(session.userId),
        CheckInService.getCheckInSuggestions(session.userId),
      ]);

      setStats(statsData);
      setAchievements(achievementsData);
      setSuggestions(suggestionsData);
      onStatsUpdate?.(statsData);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.userId, isAuthenticated, type, onStatsUpdate]);

  // 加载日历数据
  const loadCalendarData = useCallback(async () => {
    if (!session?.userId || !isAuthenticated) return;

    try {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;
      const data = await CheckInService.getCalendarData(session.userId, year, month, type);
      setCalendarData(data);
    } catch (error) {
      console.error('加载日历数据失败:', error);
    }
  }, [session?.userId, isAuthenticated, selectedMonth, type]);

  // 刷新数据
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), loadCalendarData()]);
    setRefreshing(false);
  }, [loadStats, loadCalendarData]);

  // 渲染统计卡片
  const renderStatsCards = () => {
    if (!stats) return null;

    const statsData = [
      { label: '总打卡天数', value: stats.totalDays, suffix: '天' },
      { label: '最长连续', value: stats.longestStreak, suffix: '天' },
      { label: '本周打卡', value: stats.thisWeekDays, suffix: '天' },
      { label: '本月打卡', value: stats.thisMonthDays, suffix: '天' },
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>打卡概览</Text>

        {/* 当前连续天数高亮显示 */}
        <View style={styles.streakCard}>
          <Text style={styles.streakNumber}>{stats.currentStreak}</Text>
          <Text style={styles.streakLabel}>连续打卡天数</Text>
          {stats.todayCheckedIn && <Text style={styles.streakSubLabel}>今日已打卡 ✓</Text>}
        </View>

        {/* 统计网格 */}
        <View style={styles.statsGrid}>
          {statsData.map((item, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statNumber}>
                {item.value}
                <Text style={[styles.statNumber, { fontSize: 16 }]}>{item.suffix}</Text>
              </Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // 渲染成就徽章
  const renderAchievements = () => {
    if (!showAchievements || achievements.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>成就徽章</Text>
        <View style={styles.achievementsContainer}>
          {achievements.map((achievement, index) => (
            <View
              key={index}
              style={[
                styles.achievementItem,
                achievement.achieved && styles.achievementItemAchieved,
              ]}
            >
              <View
                style={[
                  styles.achievementIcon,
                  achievement.achieved
                    ? styles.achievementIconAchieved
                    : styles.achievementIconNotAchieved,
                ]}
              >
                <Text style={styles.achievementIconText}>{achievement.achieved ? '🏆' : '⭕'}</Text>
              </View>

              <View style={styles.achievementContent}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>

                {!achievement.achieved && achievement.progress !== undefined && (
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(achievement.progress, 100)}%` },
                      ]}
                    />
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // 渲染日历
  const renderCalendar = () => {
    if (!showCalendar) return null;

    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const today = new Date();

    // 获取月份第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 获取月份第一天是星期几
    const startDayOfWeek = firstDay.getDay();

    // 生成日历数据
    const calendarDays: Array<{
      date: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isChecked: boolean;
    }> = [];

    // 添加上个月的尾部天数
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(firstDay.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
      calendarDays.push({
        date: prevDate.getDate(),
        isCurrentMonth: false,
        isToday: false,
        isChecked: false,
      });
    }

    // 添加当月的天数
    for (let date = 1; date <= lastDay.getDate(); date++) {
      const currentDate = new Date(year, month, date);
      const dateKey = currentDate.toISOString().split('T')[0];
      const isToday = currentDate.toDateString() === today.toDateString();
      const isChecked = calendarData[dateKey] || false;

      calendarDays.push({
        date,
        isCurrentMonth: true,
        isToday,
        isChecked,
      });
    }

    // 补齐到完整的6周
    const remainingDays = 42 - calendarDays.length;
    for (let date = 1; date <= remainingDays; date++) {
      calendarDays.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isChecked: false,
      });
    }

    // 分割成周
    const weeks: Array<typeof calendarDays> = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }

    const navigateMonth = (direction: 'prev' | 'next') => {
      const newMonth = new Date(selectedMonth);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      setSelectedMonth(newMonth);
    };

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>打卡日历</Text>

        <View style={styles.calendarContainer}>
          {/* 日历头部 */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              style={styles.calendarNavButton}
              onPress={() => navigateMonth('prev')}
            >
              <Text style={styles.calendarNavText}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.calendarMonth}>
              {selectedMonth.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
              })}
            </Text>

            <TouchableOpacity
              style={styles.calendarNavButton}
              onPress={() => navigateMonth('next')}
            >
              <Text style={styles.calendarNavText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* 日历网格 */}
          <View style={styles.calendarGrid}>
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.calendarWeek}>
                {week.map((day, dayIndex) => (
                  <View
                    key={dayIndex}
                    style={[
                      styles.calendarDay,
                      day.isChecked && styles.calendarDayChecked,
                      day.isToday && styles.calendarDayToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        day.isChecked && styles.calendarDayTextChecked,
                        !day.isCurrentMonth && { opacity: 0.3 },
                      ]}
                    >
                      {day.date}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // 渲染建议
  const renderSuggestions = () => {
    if (suggestions.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>打卡建议</Text>
        <View style={styles.suggestionContainer}>
          {suggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // 加载日历数据
  useEffect(() => {
    if (showCalendar) {
      loadCalendarData();
    }
  }, [showCalendar, loadCalendarData]);

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[textStyles.body1, { color: colors.textSecondary }]}>
          请先登录查看打卡统计
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {renderStatsCards()}
      {renderAchievements()}
      {renderCalendar()}
      {renderSuggestions()}
    </ScrollView>
  );
};

export default CheckinStats;
