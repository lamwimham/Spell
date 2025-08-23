/**
 * 使用统计页面 - AI使用情况、打卡统计和配额分析
 * 提供详细的数据可视化和趋势分析
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
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { UsageTrackingService } from '../services/ai/usageTrackingService';
import { CheckInService } from '../services/checkin/checkinService';
import { QuotaService } from '../services/ai/quotaService';
import { useQwenQuota } from '../hooks/useQwenWithLimits';
import ProtectedRoute from '../components/auth/ProtectedRoute';

const { width: screenWidth } = Dimensions.get('window');

// Tab类型定义
type TabType = 'ai' | 'checkin' | 'quota';

// 时间范围类型
type TimeRange = 'today' | 'week' | 'month' | 'all';

/**
 * 使用统计页面组件
 */
const UsageStatsScreen: React.FC = () => {
  const { colors, textStyles, spacing } = useTheme();
  const { session } = useAuth();
  const { quotaInfo, refreshQuota } = useQwenQuota();

  // 状态管理
  const [activeTab, setActiveTab] = useState<TabType>('ai');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // AI使用统计数据
  const [aiStats, setAiStats] = useState<any>(null);
  const [aiServiceStats, setAiServiceStats] = useState<any[]>([]);
  const [todayAiUsage, setTodayAiUsage] = useState<any>(null);

  // 打卡统计数据
  const [checkinStats, setCheckinStats] = useState<any>(null);

  // 配额统计数据
  const [quotaOverview, setQuotaOverview] = useState<any>(null);

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
    timeRangeContainer: {
      flexDirection: 'row',
      padding: spacing.md,
      gap: spacing.sm,
      backgroundColor: colors.backgroundElevated,
    },
    timeRangeButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: spacing.sm,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    timeRangeButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    timeRangeButtonText: {
      ...textStyles.caption,
      color: colors.text,
    },
    timeRangeButtonTextActive: {
      color: colors.background,
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.lg,
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
    chartContainer: {
      backgroundColor: colors.background,
      borderRadius: spacing.sm,
      padding: spacing.md,
      marginTop: spacing.md,
    },
    chartTitle: {
      ...textStyles.body1,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.md,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      marginTop: spacing.sm,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    serviceCard: {
      backgroundColor: colors.background,
      borderRadius: spacing.sm,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderLeftWidth: 4,
    },
    serviceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    serviceName: {
      ...textStyles.body1,
      color: colors.text,
      fontWeight: '600',
    },
    serviceStats: {
      flexDirection: 'row',
      gap: spacing.lg,
    },
    serviceStatItem: {
      alignItems: 'center',
    },
    serviceStatNumber: {
      ...textStyles.body2,
      color: colors.primary,
      fontWeight: '600',
    },
    serviceStatLabel: {
      ...textStyles.caption,
      color: colors.textSecondary,
    },
    quotaCard: {
      backgroundColor: colors.background,
      borderRadius: spacing.sm,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    quotaHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    quotaTitle: {
      ...textStyles.body1,
      color: colors.text,
      fontWeight: '600',
    },
    quotaUsage: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    quotaText: {
      ...textStyles.body2,
      color: colors.textSecondary,
    },
    quotaPercentage: {
      ...textStyles.caption,
      color: colors.primary,
      fontWeight: '600',
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
    warningCard: {
      backgroundColor: colors.warning + '15',
      borderRadius: spacing.sm,
      padding: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.warning,
      marginBottom: spacing.sm,
    },
    warningText: {
      ...textStyles.body2,
      color: colors.warning,
    },
    errorCard: {
      backgroundColor: colors.error + '15',
      borderRadius: spacing.sm,
      padding: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
      marginBottom: spacing.sm,
    },
    errorText: {
      ...textStyles.body2,
      color: colors.error,
    },
  });

  // Tab配置
  const tabs = [
    { key: 'ai' as const, label: 'AI使用' },
    { key: 'checkin' as const, label: '打卡统计' },
    { key: 'quota' as const, label: '配额管理' },
  ];

  // 时间范围配置
  const timeRanges = [
    { key: 'today' as const, label: '今日' },
    { key: 'week' as const, label: '本周' },
    { key: 'month' as const, label: '本月' },
    { key: 'all' as const, label: '全部' },
  ];

  // 获取时间范围对应的天数
  const getTimeRangeDays = (range: TimeRange): number => {
    switch (range) {
      case 'today':
        return 1;
      case 'week':
        return 7;
      case 'month':
        return 30;
      case 'all':
        return 365;
      default:
        return 7;
    }
  };

  // 加载AI使用统计
  const loadAiStats = useCallback(async () => {
    if (!session?.userId) return;

    try {
      const days = getTimeRangeDays(timeRange);
      const [stats, serviceStats, todayUsage] = await Promise.all([
        UsageTrackingService.getUserUsageStats(session.userId, days),
        UsageTrackingService.getUserServiceStats(session.userId, days),
        UsageTrackingService.getTodayUsageOverview(session.userId),
      ]);

      setAiStats(stats);
      setAiServiceStats(serviceStats);
      setTodayAiUsage(todayUsage);
    } catch (error) {
      console.error('加载AI使用统计失败:', error);
    }
  }, [session?.userId, timeRange]);

  // 加载打卡统计
  const loadCheckinStats = useCallback(async () => {
    if (!session?.userId) return;

    try {
      const stats = await CheckInService.getUserStats(session.userId, 'daily');
      setCheckinStats(stats);
    } catch (error) {
      console.error('加载打卡统计失败:', error);
    }
  }, [session?.userId]);

  // 加载配额概览
  const loadQuotaOverview = useCallback(async () => {
    if (!session?.userId) return;

    try {
      const overview = await QuotaService.getUserQuotaOverview(session.userId);
      setQuotaOverview(overview);
    } catch (error) {
      console.error('加载配额概览失败:', error);
    }
  }, [session?.userId]);

  // 加载所有数据
  const loadAllData = useCallback(async () => {
    if (!session?.userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await Promise.all([loadAiStats(), loadCheckinStats(), loadQuotaOverview(), refreshQuota()]);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.userId, loadAiStats, loadCheckinStats, loadQuotaOverview, refreshQuota]);

  // 刷新数据
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, [loadAllData]);

  // 获取服务颜色
  const getServiceColor = (serviceType: string): string => {
    const colors_map = {
      qwen: colors.primary,
      openai: '#10A37F',
      claude: '#FF8C42',
    };
    return colors_map[serviceType as keyof typeof colors_map] || colors.primary;
  };

  // 渲染时间范围选择器
  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      {timeRanges.map(range => (
        <TouchableOpacity
          key={range.key}
          style={[styles.timeRangeButton, timeRange === range.key && styles.timeRangeButtonActive]}
          onPress={() => setTimeRange(range.key)}
        >
          <Text
            style={[
              styles.timeRangeButtonText,
              timeRange === range.key && styles.timeRangeButtonTextActive,
            ]}
          >
            {range.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // 渲染AI使用统计
  const renderAiStats = () => {
    if (!aiStats) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无AI使用数据</Text>
          <Text style={styles.emptySubText}>开始使用AI功能后，这里将显示统计信息</Text>
        </View>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* 今日使用概览 */}
        {todayAiUsage && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>今日使用情况</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{todayAiUsage.calls.used}</Text>
                <Text style={styles.statLabel}>调用次数</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(todayAiUsage.calls.percentage || 0, 100)}%` },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{todayAiUsage.tokens.used}</Text>
                <Text style={styles.statLabel}>Token使用</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(todayAiUsage.tokens.percentage || 0, 100)}%` },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* 配额警告 */}
            {todayAiUsage.calls.percentage > 80 && (
              <View style={styles.warningCard}>
                <Text style={styles.warningText}>
                  今日调用次数已使用 {todayAiUsage.calls.percentage}%，请注意配额限制
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 总体统计 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {timeRange === 'today'
              ? '今日'
              : timeRange === 'week'
              ? '本周'
              : timeRange === 'month'
              ? '本月'
              : '总体'}
            统计
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{aiStats.totalCalls}</Text>
              <Text style={styles.statLabel}>总调用次数</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{aiStats.totalTokens}</Text>
              <Text style={styles.statLabel}>总Token数</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{(aiStats.totalCost / 100).toFixed(2)}元</Text>
              <Text style={styles.statLabel}>总费用</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{aiStats.successRate}%</Text>
              <Text style={styles.statLabel}>成功率</Text>
            </View>
          </View>
        </View>

        {/* 各服务使用情况 */}
        {aiServiceStats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>各服务使用情况</Text>
            {aiServiceStats.map((service, index) => (
              <View
                key={index}
                style={[
                  styles.serviceCard,
                  { borderLeftColor: getServiceColor(service.serviceType) },
                ]}
              >
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceName}>
                    {service.serviceType === 'qwen'
                      ? '通义千问'
                      : service.serviceType === 'openai'
                      ? 'OpenAI'
                      : service.serviceType === 'claude'
                      ? 'Claude'
                      : service.serviceType}
                  </Text>
                </View>
                <View style={styles.serviceStats}>
                  <View style={styles.serviceStatItem}>
                    <Text style={styles.serviceStatNumber}>{service.calls}</Text>
                    <Text style={styles.serviceStatLabel}>调用次数</Text>
                  </View>
                  <View style={styles.serviceStatItem}>
                    <Text style={styles.serviceStatNumber}>{service.tokens}</Text>
                    <Text style={styles.serviceStatLabel}>Token数</Text>
                  </View>
                  <View style={styles.serviceStatItem}>
                    <Text style={styles.serviceStatNumber}>
                      {(service.cost / 100).toFixed(2)}元
                    </Text>
                    <Text style={styles.serviceStatLabel}>费用</Text>
                  </View>
                  <View style={styles.serviceStatItem}>
                    <Text style={styles.serviceStatNumber}>{service.successRate}%</Text>
                    <Text style={styles.serviceStatLabel}>成功率</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  // 渲染打卡统计
  const renderCheckinStats = () => {
    if (!checkinStats) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无打卡数据</Text>
          <Text style={styles.emptySubText}>开始打卡后，这里将显示统计信息</Text>
        </View>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>打卡统计概览</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{checkinStats.currentStreak}</Text>
              <Text style={styles.statLabel}>连续天数</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{checkinStats.totalDays}</Text>
              <Text style={styles.statLabel}>总打卡天数</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{checkinStats.longestStreak}</Text>
              <Text style={styles.statLabel}>最长连续</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{checkinStats.thisMonthDays}</Text>
              <Text style={styles.statLabel}>本月打卡</Text>
            </View>
          </View>

          {/* 今日状态 */}
          {checkinStats.todayCheckedIn ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.success }]}>✓ 今日已打卡</Text>
            </View>
          ) : (
            <View style={styles.warningCard}>
              <Text style={styles.warningText}>今日还未打卡，记得完成打卡任务哦！</Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  // 渲染配额管理
  const renderQuotaStats = () => {
    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* 当前配额状态 */}
        {quotaInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>当前配额状态</Text>

            {!quotaInfo.allowed && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{quotaInfo.reason}</Text>
              </View>
            )}

            <View style={styles.quotaCard}>
              <View style={styles.quotaHeader}>
                <Text style={styles.quotaTitle}>每日调用次数</Text>
                <Text style={styles.quotaPercentage}>
                  {quotaInfo.dailyUsage?.calls?.percentage || 0}%
                </Text>
              </View>
              <View style={styles.quotaUsage}>
                <Text style={styles.quotaText}>
                  {quotaInfo.dailyUsage?.calls?.used || 0} /{' '}
                  {quotaInfo.dailyUsage?.calls?.limit || '无限制'}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(quotaInfo.dailyUsage?.calls?.percentage || 0, 100)}%` },
                  ]}
                />
              </View>
            </View>

            <View style={styles.quotaCard}>
              <View style={styles.quotaHeader}>
                <Text style={styles.quotaTitle}>每日Token使用量</Text>
                <Text style={styles.quotaPercentage}>
                  {quotaInfo.dailyUsage?.tokens?.percentage || 0}%
                </Text>
              </View>
              <View style={styles.quotaUsage}>
                <Text style={styles.quotaText}>
                  {quotaInfo.dailyUsage?.tokens?.used || 0} /{' '}
                  {quotaInfo.dailyUsage?.tokens?.limit || '无限制'}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(quotaInfo.dailyUsage?.tokens?.percentage || 0, 100)}%` },
                  ]}
                />
              </View>
            </View>

            <View style={styles.quotaCard}>
              <View style={styles.quotaHeader}>
                <Text style={styles.quotaTitle}>每日费用</Text>
                <Text style={styles.quotaPercentage}>
                  {quotaInfo.dailyUsage?.cost?.percentage || 0}%
                </Text>
              </View>
              <View style={styles.quotaUsage}>
                <Text style={styles.quotaText}>
                  {quotaInfo.dailyUsage?.cost?.usedInYuan || '0.00'}元 /{' '}
                  {quotaInfo.dailyUsage?.cost?.limitInYuan || '无限制'}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(quotaInfo.dailyUsage?.cost?.percentage || 0, 100)}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {/* 自定义配额 */}
        {quotaOverview && quotaOverview.quotas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>自定义配额</Text>
            {quotaOverview.quotas.map((quota: any, _index: number) => (
              <View key={quota.id} style={styles.quotaCard}>
                <View style={styles.quotaHeader}>
                  <Text style={styles.quotaTitle}>
                    {quota.description ||
                      `${quota.type === 'calls' ? '调用次数' : 'Token使用量'}限制`}
                  </Text>
                  <Text style={styles.quotaPercentage}>{quota.percentage}%</Text>
                </View>
                <View style={styles.quotaUsage}>
                  <Text style={styles.quotaText}>
                    {quota.used} / {quota.limit} (
                    {quota.resetPeriod === 'daily'
                      ? '每日'
                      : quota.resetPeriod === 'monthly'
                      ? '每月'
                      : quota.resetPeriod}
                    )
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${Math.min(quota.percentage, 100)}%` }]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  // 渲染内容
  const renderContent = () => {
    switch (activeTab) {
      case 'ai':
        return renderAiStats();
      case 'checkin':
        return renderCheckinStats();
      case 'quota':
        return renderQuotaStats();
      default:
        return null;
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // 时间范围变化时重新加载AI数据
  useEffect(() => {
    if (activeTab === 'ai') {
      loadAiStats();
    }
  }, [activeTab, timeRange, loadAiStats]);

  return (
    <ProtectedRoute>
      <View style={styles.container}>
        {/* 头部 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>使用统计</Text>
        </View>

        {/* Tab栏 */}
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

        {/* 时间范围选择器（仅AI统计显示） */}
        {activeTab === 'ai' && renderTimeRangeSelector()}

        {/* 内容区域 */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>加载中...</Text>
            </View>
          ) : (
            renderContent()
          )}
        </View>
      </View>
    </ProtectedRoute>
  );
};

export default UsageStatsScreen;
