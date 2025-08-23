/**
 * 配额管理页面 - 完整的配额设置和管理功能
 * 支持查看、创建、编辑和删除用户配额设置
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { QuotaService, QuotaSettings } from '../services/ai/quotaService';
import { AiServiceType } from '../database/models/AiUsageLog';
import { QuotaType, ResetPeriod } from '../database/models/UserQuota';
import { InputText } from '../components/ui/InputText';
import { Button } from '../components/ui/Button';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import RoleGuard from '../components/auth/RoleGuard';

// 配额表单数据类型
interface QuotaForm {
  quotaType: QuotaType;
  quotaLimit: string;
  serviceType?: AiServiceType;
  resetPeriod: ResetPeriod;
  description: string;
}

/**
 * 配额管理页面组件
 */
const QuotaManagementScreen: React.FC = () => {
  const { colors, textStyles, spacing } = useTheme();
  const { session, isAuthenticated } = useAuth();

  // 状态管理
  const [quotaOverview, setQuotaOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuota, setEditingQuota] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // 表单状态
  const [quotaForm, setQuotaForm] = useState<QuotaForm>({
    quotaType: 'calls',
    quotaLimit: '',
    resetPeriod: 'daily',
    description: '',
  });

  // 表单验证错误
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 样式
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: spacing.lg,
      gap: spacing.lg,
    },
    header: {
      backgroundColor: colors.backgroundElevated,
      padding: spacing.lg,
      borderRadius: spacing.md,
      marginBottom: spacing.lg,
    },
    headerTitle: {
      ...textStyles.h2,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    headerSubtitle: {
      ...textStyles.body2,
      color: colors.textSecondary,
    },
    section: {
      backgroundColor: colors.backgroundElevated,
      borderRadius: spacing.md,
      padding: spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...textStyles.h3,
      color: colors.text,
    },
    addButton: {
      backgroundColor: colors.primary + '15',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: spacing.sm,
    },
    addButtonText: {
      ...textStyles.button,
      color: colors.primary,
      fontSize: 14,
    },
    quotaCard: {
      backgroundColor: colors.background,
      borderRadius: spacing.sm,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    quotaHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
    },
    quotaTitle: {
      ...textStyles.body1,
      color: colors.text,
      fontWeight: '600',
      flex: 1,
    },
    quotaActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    actionButton: {
      padding: spacing.xs,
    },
    actionButtonText: {
      ...textStyles.caption,
      color: colors.primary,
    },
    deleteButtonText: {
      color: colors.error,
    },
    quotaDetails: {
      gap: spacing.xs,
    },
    quotaDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    quotaLabel: {
      ...textStyles.body2,
      color: colors.textSecondary,
    },
    quotaValue: {
      ...textStyles.body2,
      color: colors.text,
      fontWeight: '500',
    },
    progressContainer: {
      marginTop: spacing.sm,
    },
    progressBar: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
    progressText: {
      ...textStyles.caption,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
    emptyContainer: {
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
    // Modal样式
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: spacing.md,
      padding: spacing.lg,
      margin: spacing.lg,
      maxHeight: '80%',
      width: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    modalTitle: {
      ...textStyles.h3,
      color: colors.text,
    },
    closeButton: {
      padding: spacing.sm,
    },
    closeButtonText: {
      ...textStyles.button,
      color: colors.textSecondary,
      fontSize: 18,
    },
    formContainer: {
      gap: spacing.md,
    },
    pickerContainer: {
      marginBottom: spacing.md,
    },
    pickerLabel: {
      ...textStyles.body2,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    pickerRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    pickerButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: spacing.sm,
      backgroundColor: colors.backgroundElevated,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    pickerButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    pickerButtonText: {
      ...textStyles.caption,
      color: colors.text,
    },
    pickerButtonTextActive: {
      color: colors.background,
      fontWeight: '600',
    },
    modalActions: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: colors.border,
    },
    saveButton: {
      flex: 1,
    },
    defaultLimitsCard: {
      backgroundColor: colors.background,
      borderRadius: spacing.sm,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    defaultLimitsHeader: {
      ...textStyles.body1,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.sm,
    },
    limitRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    limitLabel: {
      ...textStyles.body2,
      color: colors.textSecondary,
    },
    limitValue: {
      ...textStyles.body2,
      color: colors.text,
    },
  });

  // 配额类型选项
  const quotaTypeOptions = [
    { key: 'calls' as const, label: '调用次数' },
    { key: 'tokens' as const, label: 'Token数量' },
    { key: 'cost' as const, label: '费用限制' },
  ];

  // 重置周期选项
  const resetPeriodOptions = [
    { key: 'daily' as const, label: '每日' },
    { key: 'weekly' as const, label: '每周' },
    { key: 'monthly' as const, label: '每月' },
    { key: 'yearly' as const, label: '每年' },
  ];

  // AI服务选项
  const serviceTypeOptions = [
    { key: undefined, label: '全部服务' },
    { key: 'qwen' as const, label: '通义千问' },
    { key: 'openai' as const, label: 'OpenAI' },
    { key: 'claude' as const, label: 'Claude' },
  ];

  // 获取配额类型显示名称
  const getQuotaTypeDisplayName = (type: QuotaType): string => {
    const names = {
      calls: '调用次数',
      tokens: 'Token数量',
      cost: '费用限制',
    };
    return names[type] || type;
  };

  // 获取重置周期显示名称
  const getResetPeriodDisplayName = (period: ResetPeriod): string => {
    const names = {
      daily: '每日',
      weekly: '每周',
      monthly: '每月',
      yearly: '每年',
    };
    return names[period] || period;
  };

  // 获取服务类型显示名称
  const getServiceTypeDisplayName = (type?: AiServiceType): string => {
    if (!type) return '全部服务';
    const names = {
      qwen: '通义千问',
      openai: 'OpenAI',
      claude: 'Claude',
    };
    return names[type] || type;
  };

  // 加载配额概览
  const loadQuotaOverview = useCallback(async () => {
    if (!session?.userId || !isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const overview = await QuotaService.getUserQuotaOverview(session.userId);
      setQuotaOverview(overview);
    } catch (error) {
      console.error('加载配额概览失败:', error);
      Alert.alert('错误', '加载配额信息失败');
    } finally {
      setLoading(false);
    }
  }, [session?.userId, isAuthenticated]);

  // 刷新数据
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadQuotaOverview();
    setRefreshing(false);
  }, [loadQuotaOverview]);

  // 重置表单
  const resetForm = () => {
    setQuotaForm({
      quotaType: 'calls',
      quotaLimit: '',
      resetPeriod: 'daily',
      description: '',
    });
    setErrors({});
    setEditingQuota(null);
  };

  // 打开新增配额模态框
  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  // 打开编辑配额模态框
  const openEditModal = (quota: any) => {
    setEditingQuota(quota);
    setQuotaForm({
      quotaType: quota.type,
      quotaLimit: quota.limit.toString(),
      serviceType: quota.serviceType,
      resetPeriod: quota.resetPeriod,
      description: quota.description || '',
    });
    setErrors({});
    setModalVisible(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!quotaForm.quotaLimit.trim()) {
      newErrors.quotaLimit = '请输入配额限制';
    } else {
      const limit = parseInt(quotaForm.quotaLimit);
      if (isNaN(limit) || limit <= 0) {
        newErrors.quotaLimit = '配额限制必须是大于0的数字';
      }
    }

    // 验证配额设置的合理性
    const validation = QuotaService.validateQuotaSettings({
      userId: session?.userId || '',
      quotaType: quotaForm.quotaType,
      quotaLimit: parseInt(quotaForm.quotaLimit) || 0,
      serviceType: quotaForm.serviceType,
      resetPeriod: quotaForm.resetPeriod,
      description: quotaForm.description,
    });

    if (!validation.valid) {
      validation.errors.forEach(error => {
        newErrors.general = error;
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存配额
  const saveQuota = async () => {
    if (!validateForm() || !session?.userId) return;

    setSaving(true);
    try {
      const quotaSettings: QuotaSettings = {
        userId: session.userId,
        quotaType: quotaForm.quotaType,
        quotaLimit: parseInt(quotaForm.quotaLimit),
        serviceType: quotaForm.serviceType,
        resetPeriod: quotaForm.resetPeriod,
        description: quotaForm.description.trim() || undefined,
      };

      await QuotaService.setUserQuota(quotaSettings);

      Alert.alert('成功', editingQuota ? '配额已更新' : '配额已创建');
      closeModal();
      await loadQuotaOverview();
    } catch (error) {
      console.error('保存配额失败:', error);
      Alert.alert('错误', '保存配额失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  // 删除配额
  const deleteQuota = async (quotaId: string) => {
    Alert.alert('确认删除', '确定要删除这个配额设置吗？此操作不可撤销。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await QuotaService.removeUserQuota(quotaId);
            Alert.alert('成功', '配额已删除');
            await loadQuotaOverview();
          } catch (error) {
            console.error('删除配额失败:', error);
            Alert.alert('错误', '删除配额失败，请稍后重试');
          }
        },
      },
    ]);
  };

  // 渲染默认限制
  const renderDefaultLimits = () => {
    if (!quotaOverview) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>默认配额限制</Text>
        <View style={styles.defaultLimitsCard}>
          <Text style={styles.defaultLimitsHeader}>
            {quotaOverview.userRole === 'admin'
              ? '管理员'
              : quotaOverview.userRole === 'premium'
              ? '高级用户'
              : quotaOverview.userRole === 'user'
              ? '普通用户'
              : '访客'}
          </Text>

          <View style={styles.limitRow}>
            <Text style={styles.limitLabel}>每日调用次数</Text>
            <Text style={styles.limitValue}>
              {quotaOverview.defaultLimits.dailyCalls === -1
                ? '无限制'
                : quotaOverview.defaultLimits.dailyCalls}
            </Text>
          </View>

          <View style={styles.limitRow}>
            <Text style={styles.limitLabel}>每日Token数量</Text>
            <Text style={styles.limitValue}>
              {quotaOverview.defaultLimits.dailyTokens === -1
                ? '无限制'
                : quotaOverview.defaultLimits.dailyTokens}
            </Text>
          </View>

          <View style={styles.limitRow}>
            <Text style={styles.limitLabel}>每月调用次数</Text>
            <Text style={styles.limitValue}>
              {quotaOverview.defaultLimits.monthlyCalls === -1
                ? '无限制'
                : quotaOverview.defaultLimits.monthlyCalls}
            </Text>
          </View>

          <View style={styles.limitRow}>
            <Text style={styles.limitLabel}>每月Token数量</Text>
            <Text style={styles.limitValue}>
              {quotaOverview.defaultLimits.monthlyTokens === -1
                ? '无限制'
                : quotaOverview.defaultLimits.monthlyTokens}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // 渲染自定义配额列表
  const renderCustomQuotas = () => {
    if (!quotaOverview || quotaOverview.quotas.length === 0) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>自定义配额</Text>
            <RoleGuard allowedRoles={['admin', 'premium']}>
              <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                <Text style={styles.addButtonText}>+ 添加配额</Text>
              </TouchableOpacity>
            </RoleGuard>
          </View>

          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无自定义配额</Text>
            <Text style={styles.emptySubText}>您可以设置自定义配额来更精确地控制AI使用量</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>自定义配额</Text>
          <RoleGuard allowedRoles={['admin', 'premium']}>
            <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
              <Text style={styles.addButtonText}>+ 添加配额</Text>
            </TouchableOpacity>
          </RoleGuard>
        </View>

        {quotaOverview.quotas.map((quota: any) => (
          <View key={quota.id} style={styles.quotaCard}>
            <View style={styles.quotaHeader}>
              <Text style={styles.quotaTitle}>
                {quota.description || `${getQuotaTypeDisplayName(quota.type)}限制`}
              </Text>
              <RoleGuard allowedRoles={['admin', 'premium']}>
                <View style={styles.quotaActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openEditModal(quota)}
                  >
                    <Text style={styles.actionButtonText}>编辑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => deleteQuota(quota.id)}
                  >
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>删除</Text>
                  </TouchableOpacity>
                </View>
              </RoleGuard>
            </View>

            <View style={styles.quotaDetails}>
              <View style={styles.quotaDetailRow}>
                <Text style={styles.quotaLabel}>类型</Text>
                <Text style={styles.quotaValue}>{getQuotaTypeDisplayName(quota.type)}</Text>
              </View>

              <View style={styles.quotaDetailRow}>
                <Text style={styles.quotaLabel}>限制</Text>
                <Text style={styles.quotaValue}>{quota.limit}</Text>
              </View>

              <View style={styles.quotaDetailRow}>
                <Text style={styles.quotaLabel}>重置周期</Text>
                <Text style={styles.quotaValue}>
                  {getResetPeriodDisplayName(quota.resetPeriod)}
                </Text>
              </View>

              {quota.serviceType && (
                <View style={styles.quotaDetailRow}>
                  <Text style={styles.quotaLabel}>适用服务</Text>
                  <Text style={styles.quotaValue}>
                    {getServiceTypeDisplayName(quota.serviceType)}
                  </Text>
                </View>
              )}
            </View>

            {/* 使用进度 */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(quota.percentage, 100)}%`,
                      backgroundColor:
                        quota.percentage > 90
                          ? colors.error
                          : quota.percentage > 70
                          ? colors.warning
                          : colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                已使用 {quota.used} / {quota.limit} ({quota.percentage}%)
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // 渲染配额表单模态框
  const renderQuotaModal = () => (
    <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingQuota ? '编辑配额' : '添加配额'}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {/* 配额类型选择 */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>配额类型</Text>
              <View style={styles.pickerRow}>
                {quotaTypeOptions.map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.pickerButton,
                      quotaForm.quotaType === option.key && styles.pickerButtonActive,
                    ]}
                    onPress={() => setQuotaForm(prev => ({ ...prev, quotaType: option.key }))}
                  >
                    <Text
                      style={[
                        styles.pickerButtonText,
                        quotaForm.quotaType === option.key && styles.pickerButtonTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 配额限制输入 */}
            <InputText
              label="配额限制"
              value={quotaForm.quotaLimit}
              onChangeText={(text: string) => setQuotaForm(prev => ({ ...prev, quotaLimit: text }))}
              placeholder="请输入配额限制数值"
              keyboardType="numeric"
              helperText={errors.quotaLimit}
            />

            {/* 重置周期选择 */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>重置周期</Text>
              <View style={styles.pickerRow}>
                {resetPeriodOptions.map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.pickerButton,
                      quotaForm.resetPeriod === option.key && styles.pickerButtonActive,
                    ]}
                    onPress={() => setQuotaForm(prev => ({ ...prev, resetPeriod: option.key }))}
                  >
                    <Text
                      style={[
                        styles.pickerButtonText,
                        quotaForm.resetPeriod === option.key && styles.pickerButtonTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 适用服务选择 */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>适用服务</Text>
              <View style={styles.pickerRow}>
                {serviceTypeOptions.map(option => (
                  <TouchableOpacity
                    key={option.key || 'all'}
                    style={[
                      styles.pickerButton,
                      quotaForm.serviceType === option.key && styles.pickerButtonActive,
                    ]}
                    onPress={() => setQuotaForm(prev => ({ ...prev, serviceType: option.key }))}
                  >
                    <Text
                      style={[
                        styles.pickerButtonText,
                        quotaForm.serviceType === option.key && styles.pickerButtonTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 描述输入 */}
            <InputText
              label="描述（可选）"
              value={quotaForm.description}
              onChangeText={(text: string) =>
                setQuotaForm(prev => ({ ...prev, description: text }))
              }
              placeholder="请输入配额描述"
              multiline
              numberOfLines={3}
            />

            {/* 一般错误显示 */}
            {errors.general && (
              <Text style={[textStyles.caption, { color: colors.error, textAlign: 'center' }]}>
                {errors.general}
              </Text>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              label="取消"
              onPress={closeModal}
              variant="secondary"
              style={styles.cancelButton}
            />
            <Button
              label={editingQuota ? '更新' : '创建'}
              onPress={saveQuota}
              loading={saving}
              style={styles.saveButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  // 组件挂载时加载数据
  useEffect(() => {
    loadQuotaOverview();
  }, [loadQuotaOverview]);

  if (!isAuthenticated) {
    return (
      <ProtectedRoute>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={[textStyles.body1, { color: colors.textSecondary }]}>请先登录</Text>
        </View>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <View style={styles.container}>
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
          showsVerticalScrollIndicator={false}
        >
          {/* 页面头部 */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>配额管理</Text>
            <Text style={styles.headerSubtitle}>管理您的AI使用配额，合理控制使用量和费用</Text>
          </View>

          {loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>加载中...</Text>
            </View>
          ) : (
            <>
              {renderDefaultLimits()}
              {renderCustomQuotas()}
            </>
          )}
        </ScrollView>

        {renderQuotaModal()}
      </View>
    </ProtectedRoute>
  );
};

export default QuotaManagementScreen;
