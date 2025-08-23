/**
 * 打卡历史组件 - 显示用户打卡记录和历史统计
 * 支持时间筛选、类型筛选和分页加载
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import {
  CheckInService,
  CheckInType,
  CheckInHistoryQuery,
} from '../../services/checkin/checkinService';

// 历史记录项数据类型
interface CheckInHistoryItem {
  id: string;
  type: CheckInType;
  createdAt: Date;
  note?: string;
  location?: string;
}

// 组件属性接口
interface CheckinHistoryProps {
  type?: CheckInType;
  limit?: number;
  showFilters?: boolean;
  onItemPress?: (item: CheckInHistoryItem) => void;
  emptyMessage?: string;
}

/**
 * 打卡历史组件
 */
const CheckinHistory: React.FC<CheckinHistoryProps> = ({
  type,
  limit = 20,
  showFilters = true,
  onItemPress,
  emptyMessage = '暂无打卡记录',
}) => {
  const { colors, textStyles, spacing } = useTheme();
  const { session, isAuthenticated } = useAuth();

  // 状态管理
  const [history, setHistory] = useState<CheckInHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<CheckInType | undefined>(type);
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month'>('all');

  // 样式
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    filterContainer: {
      flexDirection: 'row',
      padding: spacing.md,
      gap: spacing.sm,
      backgroundColor: colors.backgroundElevated,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filterButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: spacing.sm,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterButtonText: {
      ...textStyles.caption,
      color: colors.text,
    },
    filterButtonTextActive: {
      color: colors.background,
    },
    listContent: {
      padding: spacing.md,
    },
    historyItem: {
      backgroundColor: colors.backgroundElevated,
      borderRadius: spacing.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    historyItemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    historyItemType: {
      ...textStyles.body1,
      color: colors.text,
      fontWeight: '600',
    },
    historyItemTime: {
      ...textStyles.caption,
      color: colors.textSecondary,
    },
    historyItemContent: {
      gap: spacing.xs,
    },
    historyItemNote: {
      ...textStyles.body2,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    historyItemLocation: {
      ...textStyles.caption,
      color: colors.textSecondary,
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      ...textStyles.body2,
      color: colors.textSecondary,
      marginTop: spacing.md,
    },
    statsContainer: {
      flexDirection: 'row',
      padding: spacing.md,
      backgroundColor: colors.backgroundElevated,
      gap: spacing.lg,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statNumber: {
      ...textStyles.h3,
      color: colors.primary,
      fontWeight: '600',
    },
    statLabel: {
      ...textStyles.caption,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
  });

  // 获取打卡类型显示名称
  const getTypeDisplayName = (checkInType: CheckInType): string => {
    const names = {
      daily: '每日打卡',
      study: '学习打卡',
      exercise: '运动打卡',
      work: '工作打卡',
      custom: '自定义打卡',
    };
    return names[checkInType] || checkInType;
  };

  // 获取打卡类型颜色
  const getTypeColor = (checkInType: CheckInType): string => {
    const colors_map = {
      daily: colors.primary,
      study: '#4CAF50',
      exercise: '#FF9800',
      work: '#2196F3',
      custom: '#9C27B0',
    };
    return colors_map[checkInType] || colors.primary;
  };

  // 格式化时间显示
  const formatTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffDays === 0) {
      return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  // 获取查询条件
  const getQueryParams = useCallback((): CheckInHistoryQuery => {
    const query: CheckInHistoryQuery = {
      userId: session?.userId || '',
      limit,
    };

    if (selectedType) {
      query.type = selectedType;
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query.startDate = weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query.startDate = monthAgo;
      }
      query.endDate = now;
    }

    return query;
  }, [session?.userId, selectedType, dateFilter, limit]);

  // 加载历史记录
  const loadHistory = useCallback(async () => {
    if (!session?.userId || !isAuthenticated) {
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const query = getQueryParams();
      const result = await CheckInService.getUserHistory(query);
      setHistory(result);
    } catch (error) {
      console.error('加载打卡历史失败:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [session?.userId, isAuthenticated, getQueryParams]);

  // 刷新数据
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [loadHistory]);

  // 类型筛选
  const handleTypeFilter = (filterType: CheckInType | undefined) => {
    setSelectedType(filterType);
  };

  // 渲染筛选器
  const renderFilters = () => {
    if (!showFilters) return null;

    const typeFilters: Array<{ key: CheckInType | undefined; label: string }> = [
      { key: undefined, label: '全部' },
      { key: 'daily', label: '每日' },
      { key: 'study', label: '学习' },
      { key: 'exercise', label: '运动' },
      { key: 'work', label: '工作' },
    ];

    const dateFilters = [
      { key: 'all' as const, label: '全部时间' },
      { key: 'week' as const, label: '最近一周' },
      { key: 'month' as const, label: '最近一月' },
    ];

    // 时间筛选
    const handleDateFilter = (filter: 'all' | 'week' | 'month') => {
      setDateFilter(filter);
    };

    return (
      <View style={styles.filterContainer}>
        {/* 类型筛选 */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={typeFilters}
          keyExtractor={item => item.key || 'all'}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterButton, selectedType === item.key && styles.filterButtonActive]}
              onPress={() => handleTypeFilter(item.key)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedType === item.key && styles.filterButtonTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
        />

        {/* 时间筛选 */}
        <View style={{ flexDirection: 'row', marginTop: spacing.sm }}>
          {dateFilters.map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                dateFilter === filter.key && styles.filterButtonActive,
                { marginRight: spacing.sm },
              ]}
              onPress={() => handleDateFilter(filter.key)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  dateFilter === filter.key && styles.filterButtonTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // 渲染历史记录项
  const renderHistoryItem = ({ item }: { item: CheckInHistoryItem }) => (
    <TouchableOpacity
      style={[styles.historyItem, { borderLeftColor: getTypeColor(item.type) }]}
      onPress={() => onItemPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.historyItemHeader}>
        <Text style={styles.historyItemType}>{getTypeDisplayName(item.type)}</Text>
        <Text style={styles.historyItemTime}>{formatTime(item.createdAt)}</Text>
      </View>

      <View style={styles.historyItemContent}>
        {item.note && <Text style={styles.historyItemNote}>📝 {item.note}</Text>}
        {item.location && <Text style={styles.historyItemLocation}>📍 {item.location}</Text>}
      </View>
    </TouchableOpacity>
  );

  // 渲染空状态
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{emptyMessage}</Text>
      <Text style={styles.emptySubText}>开始你的第一次打卡，建立良好习惯！</Text>
    </View>
  );

  // 渲染加载状态
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>加载中...</Text>
    </View>
  );

  // 渲染统计信息
  const renderStats = () => {
    const totalCount = history.length;
    const thisWeekCount = history.filter(item => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return item.createdAt >= weekAgo;
    }).length;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalCount}</Text>
          <Text style={styles.statLabel}>总打卡</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{thisWeekCount}</Text>
          <Text style={styles.statLabel}>本周</Text>
        </View>
      </View>
    );
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // 筛选条件变化时重新加载
  useEffect(() => {
    if (!loading) {
      loadHistory();
    }
  }, [selectedType, dateFilter]);

  if (!isAuthenticated) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>请先登录查看打卡历史</Text>
      </View>
    );
  }

  if (loading) {
    return renderLoading();
  }

  return (
    <View style={styles.container}>
      {renderFilters()}

      <FlatList
        data={history}
        keyExtractor={item => item.id}
        renderItem={renderHistoryItem}
        ListHeaderComponent={history.length > 0 ? renderStats : null}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={history.length === 0 ? { flex: 1 } : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default CheckinHistory;
