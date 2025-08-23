/**
 * 打卡专页 - 整合所有打卡相关功能的完整界面
 * 包括打卡按钮、统计信息、历史记录和成就展示
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { CheckInService, CheckInType, CheckInStats } from '../services/checkin/checkinService';
import CheckinButton from '../components/checkin/CheckinButton';
import CheckinHistory from '../components/checkin/CheckinHistory';
import CheckinStats from '../components/checkin/CheckinStats';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Tab类型定义
type TabType = 'overview' | 'history' | 'stats';

/**
 * 打卡专页组件
 */
const CheckinScreen: React.FC = () => {
  const { colors, textStyles, spacing } = useTheme();
  const { session, isAuthenticated } = useAuth();

  // 状态管理
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedType, setSelectedType] = useState<CheckInType>('daily');
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // 样式
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.backgroundElevated,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      ...textStyles.h2,
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    typeSelector: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    typeButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: spacing.sm,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    typeButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    typeButtonText: {
      ...textStyles.caption,
      color: colors.text,
    },
    typeButtonTextActive: {
      color: colors.background,
      fontWeight: '600',
    },
    quickStats: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.md,
    },
    quickStatItem: {
      flex: 1,
      alignItems: 'center',
      padding: spacing.sm,
      backgroundColor: colors.background,
      borderRadius: spacing.sm,
    },
    quickStatNumber: {
      ...textStyles.h3,
      color: colors.primary,
      fontWeight: '700',
    },
    quickStatLabel: {
      ...textStyles.caption,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundElevated,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.md,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: colors.primary,
    },
    tabText: {
      ...textStyles.button,
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    overviewContent: {
      padding: spacing.lg,
      gap: spacing.xl,
    },
    checkinSection: {
      alignItems: 'center',
      gap: spacing.md,
    },
    checkinTitle: {
      ...textStyles.h3,
      color: colors.text,
      marginBottom: spacing.md,
    },
    motivationText: {
      ...textStyles.body2,
      color: colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    quickOverview: {
      backgroundColor: colors.backgroundElevated,
      borderRadius: spacing.md,
      padding: spacing.md,
    },
    sectionTitle: {
      ...textStyles.h3,
      color: colors.text,
      marginBottom: spacing.md,
    },
    achievementPreview: {
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
    achievementIcon: {
      fontSize: 24,
      marginRight: spacing.md,
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
    viewAllButton: {
      padding: spacing.md,
      backgroundColor: colors.primary + '15',
      borderRadius: spacing.sm,
      alignItems: 'center',
      marginTop: spacing.md,
    },
    viewAllButtonText: {
      ...textStyles.button,
      color: colors.primary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    emptyText: {
      ...textStyles.body1,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    emptySubText: {
      ...textStyles.body2,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  // Tab配置
  const tabs = [
    { key: 'overview' as const, label: '概览' },
    { key: 'history' as const, label: '历史' },
    { key: 'stats' as const, label: '统计' },
  ];

  // 打卡类型配置
  const checkInTypes = [
    { key: 'daily' as const, label: '每日' },
    { key: 'study' as const, label: '学习' },
    { key: 'exercise' as const, label: '运动' },
    { key: 'work' as const, label: '工作' },
  ];

  // 获取打卡类型显示名称
  const getTypeDisplayName = (type: CheckInType): string => {
    const names = {
      daily: '每日打卡',
      study: '学习打卡',
      exercise: '运动打卡',
      work: '工作打卡',
      custom: '自定义打卡',
    };
    return names[type] || type;
  };

  // 加载数据
  const loadData = async () => {
    if (!session?.userId || !isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const statsData = await CheckInService.getUserStats(session.userId, selectedType);
      setStats(statsData);
    } catch (error) {
      console.error('加载打卡数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 刷新数据
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // 打卡成功回调
  const handleCheckInSuccess = () => {
    loadData(); // 重新加载数据
    Alert.alert('恭喜', '打卡成功！继续保持好习惯！', [
      { text: '查看统计', onPress: () => setActiveTab('stats') },
      { text: '好的', style: 'default' },
    ]);
  };

  // 打卡类型变更
  const handleTypeChange = (type: CheckInType) => {
    setSelectedType(type);
  };

  // 统计数据更新回调
  const handleStatsUpdate = (newStats: CheckInStats) => {
    setStats(newStats);
  };

  // 渲染头部
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{getTypeDisplayName(selectedType)}</Text>

      {/* 打卡类型选择器 */}
      <View style={styles.typeSelector}>
        {checkInTypes.map(type => (
          <TouchableOpacity
            key={type.key}
            style={[styles.typeButton, selectedType === type.key && styles.typeButtonActive]}
            onPress={() => handleTypeChange(type.key)}
          >
            <Text
              style={[
                styles.typeButtonText,
                selectedType === type.key && styles.typeButtonTextActive,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 快速统计 */}
      {stats && (
        <View style={styles.quickStats}>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatNumber}>{stats.currentStreak}</Text>
            <Text style={styles.quickStatLabel}>连续天数</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatNumber}>{stats.totalDays}</Text>
            <Text style={styles.quickStatLabel}>总打卡</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatNumber}>{stats.thisMonthDays}</Text>
            <Text style={styles.quickStatLabel}>本月</Text>
          </View>
        </View>
      )}
    </View>
  );

  // 渲染Tab栏
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          onPress={() => setActiveTab(tab.key)}
        >
          <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // 渲染概览内容
  const renderOverviewContent = () => (
    <ScrollView
      contentContainerStyle={styles.overviewContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* 打卡按钮区域 */}
      <View style={styles.checkinSection}>
        <Text style={styles.checkinTitle}>{getTypeDisplayName(selectedType)}</Text>

        <CheckinButton
          type={selectedType}
          size="large"
          onCheckInSuccess={handleCheckInSuccess}
          showStreak={true}
        />

        {stats && !stats.todayCheckedIn && (
          <Text style={styles.motivationText}>
            {stats.currentStreak > 0
              ? `已连续${stats.currentStreak}天，今天也要坚持哦！`
              : '开始你的打卡之旅，建立良好习惯！'}
          </Text>
        )}
      </View>

      {/* 快速概览 */}
      {stats && (
        <View style={styles.quickOverview}>
          <Text style={styles.sectionTitle}>本周概览</Text>
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>{stats.thisWeekDays}</Text>
              <Text style={styles.quickStatLabel}>本周打卡</Text>
            </View>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>{stats.longestStreak}</Text>
              <Text style={styles.quickStatLabel}>最长连续</Text>
            </View>
          </View>
        </View>
      )}

      {/* 成就预览 */}
      <View style={styles.quickOverview}>
        <Text style={styles.sectionTitle}>最新成就</Text>
        <AchievementPreview userId={session?.userId || ''} />
        <TouchableOpacity style={styles.viewAllButton} onPress={() => setActiveTab('stats')}>
          <Text style={styles.viewAllButtonText}>查看全部统计</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // 渲染内容
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewContent();
      case 'history':
        return <CheckinHistory type={selectedType} limit={50} showFilters={true} />;
      case 'stats':
        return (
          <CheckinStats
            type={selectedType}
            showCalendar={true}
            showAchievements={true}
            onStatsUpdate={handleStatsUpdate}
          />
        );
      default:
        return null;
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadData();
  }, [selectedType, session?.userId, isAuthenticated]);

  return (
    <ProtectedRoute>
      <View style={styles.container}>
        {renderHeader()}
        {renderTabs()}
        <View style={styles.content}>{renderContent()}</View>
      </View>
    </ProtectedRoute>
  );
};

// 成就预览组件
const AchievementPreview: React.FC<{ userId: string }> = ({ userId }) => {
  const { colors, textStyles, spacing } = useTheme();
  const [achievements, setAchievements] = useState<any[]>([]);

  useEffect(() => {
    const loadAchievements = async () => {
      if (!userId) return;

      try {
        const data = await CheckInService.getAchievements(userId);
        // 只显示前3个成就
        setAchievements(data.slice(0, 3));
      } catch (error) {
        console.error('加载成就失败:', error);
      }
    };

    loadAchievements();
  }, [userId]);

  const styles = StyleSheet.create({
    achievementPreview: {
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
    achievementIcon: {
      fontSize: 20,
      marginRight: spacing.md,
    },
    achievementContent: {
      flex: 1,
    },
    achievementTitle: {
      ...textStyles.body2,
      color: colors.text,
      fontWeight: '600',
    },
    achievementDescription: {
      ...textStyles.caption,
      color: colors.textSecondary,
    },
  });

  if (achievements.length === 0) {
    return (
      <Text style={[textStyles.body2, { color: colors.textSecondary, textAlign: 'center' }]}>
        暂无成就，继续加油！
      </Text>
    );
  }

  return (
    <View style={styles.achievementPreview}>
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
  );
};

export default CheckinScreen;
