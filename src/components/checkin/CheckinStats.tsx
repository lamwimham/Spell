/**
 * 打卡统计组件 - 显示用户打卡统计信息、成就和日历视图
 * 提供完整的统计数据展示和可视化功能
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import {
  CheckInService,
  CheckInType,
  CheckInStats as CheckInStatsType,
} from '../../services/checkin/checkinService';

// 成就数据类型
interface Achievement {
  title: string;
  description: string;
  achieved: boolean;
  progress?: number;
}

// 组件属性接口
interface CheckinStatsProps {
  type?: CheckInType;
  showCalendar?: boolean;
  showAchievements?: boolean;
  onStatsUpdate?: (stats: CheckInStatsType) => void;
}

/**
 * 打卡统计组件
 */
const CheckinStats: React.FC<CheckinStatsProps> = ({
  type = 'daily',
  showCalendar = true,
  showAchievements = true,
  onStatsUpdate,
}) => {
  const { colors, textStyles, spacing } = useTheme();
  const { session, isAuthenticated } = useAuth();

  // 状态管理
  const [stats, setStats] = useState<CheckInStatsType | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [calendarData, setCalendarData] = useState<Record<string, boolean>>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // 样式定义
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: spacing.lg,
      gap: spacing.xl,
    },
    section: {
      backgroundColor: colors.backgroundElevated,
      borderRadius: spacing.md,
      padding: spacing.md,
      ...{
        // 添加阴影效果
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
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
      minWidth: 100,
      backgroundColor: colors.background,
      borderRadius: spacing.sm,
      padding: spacing.md,
      alignItems: 'center',
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
    },
    achievementList: {
      gap: spacing.sm,
    },
    achievementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: colors.background,
      borderRadius: spacing.sm,
    },
    achievementIcon: {
      fontSize: 20,
      marginRight: spacing.md,
      width: 24,
      textAlign: 'center',
    },
    achievementContent: {
      flex: 1,
    },
    achievementTitle: {
      ...textStyles.body1,
      color: colors.text,
      fontWeight: '600',
    },
    achievementDescription: {
      ...textStyles.caption,
      color: colors.textSecondary,
    },
    suggestionList: {
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
    calendarContainer: {
      gap: spacing.md,
    },
    calendarHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    calendarNavButton: {
      padding: spacing.sm,
      minWidth: 40,
      alignItems: 'center',
    },
    calendarNavText: {
      ...textStyles.h3,
      color: colors.text,
    },
    calendarMonth: {
      ...textStyles.h3,
      color: colors.text,
      fontWeight: '600',
    },
    calendarGrid: {
      gap: spacing.xs,
    },
    calendarWeek: {
      flexDirection: 'row',
    },
    calendarDay: {
      flex: 1,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: spacing.sm,
      backgroundColor: colors.background,
    },
    calendarDayChecked: {
      backgroundColor: colors.primary,
    },
    calendarDayToday: {
      backgroundColor: colors.primary + '30',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    calendarDayText: {
      ...textStyles.caption,
      color: colors.text,
    },
    calendarDayTextChecked: {
      color: colors.background,
      fontWeight: '600',
    },
    calendarDayHeader: {
      backgroundColor: 'transparent',
    },
    calendarDayHeaderWeekday: {
      fontWeight: '600',
    },
    calendarDayNotCurrentMonth: {
      opacity: 0.3,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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

    const statItems = [
      { label: '连续天数', value: stats.currentStreak },
      { label: '最长连续', value: stats.longestStreak },
      { label: '总打卡', value: stats.totalDays },
      { label: '本周', value: stats.thisWeekDays },
      { label: '本月', value: stats.thisMonthDays },
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>统计概览</Text>
        <View style={styles.statsGrid}>
          {statItems.map((item, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statNumber}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // 渲染成就列表
  const renderAchievements = () => {
    if (!showAchievements || achievements.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>成就</Text>
        <View style={styles.achievementList}>
          {achievements.map((achievement, index) => (
            <View key={index} style={styles.achievementItem}>
              <Text style={styles.achievementIcon}>{achievement.achieved ? '🏆' : '⭕'}</Text>
              <View style={styles.achievementContent}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // 渲染建议列表
  const renderSuggestions = () => {
    if (suggestions.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>建议</Text>
        <View style={styles.suggestionList}>
          {suggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Text style={styles.suggestionText}>{suggestion}</Text>
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
    const todayString = today.toDateString();

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
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = prevMonthLastDay - i;
      calendarDays.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isChecked: false,
      });
    }

    // 添加当月的天数
    for (let date = 1; date <= lastDay.getDate(); date++) {
      const currentDate = new Date(year, month, date);
      const dateString = currentDate.toDateString();
      const dateKey = currentDate.toISOString().split('T')[0];
      const isToday = dateString === todayString;
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
    for (let i = 1; i <= remainingDays; i++) {
      calendarDays.push({
        date: i,
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

    // 星期标题
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

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

          {/* 星期标题 */}
          <View style={styles.calendarWeek}>
            {weekdays.map((day, index) => (
              <View key={index} style={[styles.calendarDay, styles.calendarDayHeader]}>
                <Text style={[styles.calendarDayText, styles.calendarDayHeaderWeekday]}>{day}</Text>
              </View>
            ))}
          </View>

          {/* 日历网格 */}
          <View style={styles.calendarGrid}>
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.calendarWeek}>
                {week.map((day, dayIndex) => (
                  <View
                    key={`${weekIndex}-${dayIndex}`}
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
                        !day.isCurrentMonth && styles.calendarDayNotCurrentMonth,
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

  // 组件挂载时加载数据
  useEffect(() => {
    loadStats();
    loadCalendarData();
  }, [loadStats, loadCalendarData]);

  // 当月份或类型变化时重新加载日历数据
  useEffect(() => {
    loadCalendarData();
  }, [selectedMonth, type, loadCalendarData]);

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[textStyles.body1, { color: colors.textSecondary }]}>
          请先登录查看打卡统计
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[textStyles.body1, { color: colors.textSecondary }]}>加载中...</Text>
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
