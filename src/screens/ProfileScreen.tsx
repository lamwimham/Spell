/**
 * 用户资料页面 - 完整的个人信息管理和账户设置
 * 支持头像上传、信息编辑、密码修改和账户状态管理
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { UserRepository } from '../database/repositories/UserRepository';
import { AuthService } from '../services/auth/authService';
import { PasswordService } from '../services/auth/passwordService';
import { InputText } from '../components/ui/InputText';
import { Button } from '../components/ui/Button';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// 用户资料数据类型
interface UserProfile {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  role: string;
  status: string;
  lastLoginAt?: number;
  createdAt: Date;
}

// 编辑模式类型
type EditMode = 'none' | 'profile' | 'password' | 'avatar';

/**
 * 用户资料页面组件
 */
const ProfileScreen: React.FC = () => {
  const { colors, textStyles, spacing } = useTheme();
  const { session, logout, isAuthenticated } = useAuth();

  // 状态管理
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [saving, setSaving] = useState(false);

  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    avatarUrl: '',
  });

  // 密码修改表单状态
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
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
      alignItems: 'center',
      padding: spacing.xl,
      backgroundColor: colors.backgroundElevated,
      borderRadius: spacing.md,
      marginBottom: spacing.lg,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: spacing.md,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.border,
    },
    avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      ...textStyles.h2,
      color: colors.primary,
      fontWeight: '700',
    },
    avatarEditButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: colors.primary,
      borderRadius: 15,
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.background,
    },
    avatarEditIcon: {
      color: colors.background,
      fontSize: 14,
    },
    userInfo: {
      alignItems: 'center',
      gap: spacing.xs,
    },
    username: {
      ...textStyles.h2,
      color: colors.text,
      fontWeight: '600',
    },
    userEmail: {
      ...textStyles.body2,
      color: colors.textSecondary,
    },
    userRole: {
      ...textStyles.caption,
      color: colors.primary,
      backgroundColor: colors.primary + '15',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: spacing.sm,
      fontWeight: '600',
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
    editButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.primary + '15',
      borderRadius: spacing.sm,
    },
    editButtonText: {
      ...textStyles.button,
      color: colors.primary,
      fontSize: 14,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoLabel: {
      ...textStyles.body2,
      color: colors.textSecondary,
      flex: 1,
    },
    infoValue: {
      ...textStyles.body2,
      color: colors.text,
      flex: 2,
      textAlign: 'right',
    },
    editForm: {
      gap: spacing.md,
    },
    formActions: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.md,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: colors.border,
    },
    saveButton: {
      flex: 1,
    },
    passwordRequirements: {
      backgroundColor: colors.background,
      borderRadius: spacing.sm,
      padding: spacing.sm,
      marginTop: spacing.sm,
    },
    requirementText: {
      ...textStyles.caption,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    dangerSection: {
      backgroundColor: colors.error + '15',
      borderRadius: spacing.md,
      padding: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
    },
    dangerTitle: {
      ...textStyles.h3,
      color: colors.error,
      marginBottom: spacing.sm,
    },
    dangerText: {
      ...textStyles.body2,
      color: colors.error,
      marginBottom: spacing.md,
    },
    dangerButton: {
      backgroundColor: colors.error,
      alignSelf: 'flex-start',
    },
    statsContainer: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: colors.background,
      borderRadius: spacing.sm,
    },
    statNumber: {
      ...textStyles.h3,
      color: colors.primary,
      fontWeight: '700',
    },
    statLabel: {
      ...textStyles.caption,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
  });

  // 获取用户角色显示名称
  const getRoleDisplayName = (role: string): string => {
    const names = {
      admin: '管理员',
      premium: '高级用户',
      user: '普通用户',
      guest: '访客',
    };
    return names[role as keyof typeof names] || role;
  };

  // 获取用户状态显示名称
  const getStatusDisplayName = (status: string): string => {
    const names = {
      active: '正常',
      suspended: '暂停',
      inactive: '未激活',
    };
    return names[status as keyof typeof names] || status;
  };

  // 格式化时间显示
  const formatTime = (timestamp?: number): string => {
    if (!timestamp) return '从未';
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // 加载用户资料
  const loadUserProfile = useCallback(async () => {
    if (!session?.userId || !isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const user = await UserRepository.getById(session.userId);
      if (user) {
        const profile: UserProfile = {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          role: user.role,
          status: user.status,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
        };
        setUserProfile(profile);
        setEditForm({
          username: user.username,
          email: user.email || '',
          avatarUrl: user.avatarUrl || '',
        });
      }
    } catch (error) {
      console.error('加载用户资料失败:', error);
      Alert.alert('错误', '加载用户资料失败');
    } finally {
      setLoading(false);
    }
  }, [session?.userId, isAuthenticated]);

  // 刷新数据
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserProfile();
    setRefreshing(false);
  }, [loadUserProfile]);

  // 开始编辑
  const startEdit = (mode: EditMode) => {
    setEditMode(mode);
    setErrors({});
    if (mode === 'password') {
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditMode('none');
    setErrors({});
    if (userProfile) {
      setEditForm({
        username: userProfile.username,
        email: userProfile.email || '',
        avatarUrl: userProfile.avatarUrl || '',
      });
    }
  };

  // 验证个人信息表单
  const validateProfileForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editForm.username.trim()) {
      newErrors.username = '用户名不能为空';
    } else if (editForm.username.length < 3 || editForm.username.length > 20) {
      newErrors.username = '用户名长度应为3-20个字符';
    } else if (!/^[a-zA-Z0-9_]+$/.test(editForm.username)) {
      newErrors.username = '用户名只能包含字母、数字和下划线';
    }

    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      newErrors.email = '邮箱格式不正确';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 验证密码表单
  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = '请输入当前密码';
    }

    const passwordValidation = PasswordService.validatePassword(passwordForm.newPassword);
    if (!passwordValidation.isValid) {
      newErrors.newPassword = passwordValidation.feedback.join('；');
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存个人信息
  const saveProfile = async () => {
    if (!validateProfileForm() || !userProfile) return;

    setSaving(true);
    try {
      await UserRepository.update(userProfile.id, {
        username: editForm.username.trim(),
        email: editForm.email.trim() || undefined,
        avatarUrl: editForm.avatarUrl.trim() || undefined,
      });

      // 更新本地状态
      setUserProfile(prev =>
        prev
          ? {
              ...prev,
              username: editForm.username.trim(),
              email: editForm.email.trim() || undefined,
              avatarUrl: editForm.avatarUrl.trim() || undefined,
            }
          : null,
      );

      setEditMode('none');
      Alert.alert('成功', '个人信息已更新');
    } catch (error) {
      console.error('保存个人信息失败:', error);
      Alert.alert('错误', '保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  // 修改密码
  const changePassword = async () => {
    if (!validatePasswordForm()) return;

    setSaving(true);
    try {
      const result = await AuthService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
      );

      if (result.success) {
        setEditMode('none');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        Alert.alert('成功', '密码已修改');
      } else {
        setErrors({ currentPassword: result.message });
      }
    } catch (error) {
      console.error('修改密码失败:', error);
      Alert.alert('错误', '修改密码失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  // 注销账户
  const handleLogout = () => {
    Alert.alert('确认注销', '确定要注销当前账户吗？', [
      { text: '取消', style: 'cancel' },
      { text: '注销', style: 'destructive', onPress: logout },
    ]);
  };

  // 渲染头像
  const renderAvatar = () => {
    if (userProfile?.avatarUrl) {
      return (
        <Image
          source={{ uri: userProfile.avatarUrl }}
          style={styles.avatar}
          onError={() => {
            // 头像加载失败时的处理
            if (userProfile) {
              setUserProfile(prev => (prev ? { ...prev, avatarUrl: undefined } : null));
            }
          }}
        />
      );
    }

    return (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>
          {userProfile?.username?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>
    );
  };

  // 渲染个人信息编辑表单
  const renderProfileEditForm = () => {
    if (editMode !== 'profile') return null;

    return (
      <View style={styles.editForm}>
        <InputText
          label="用户名"
          value={editForm.username}
          onChangeText={(text: string) => setEditForm(prev => ({ ...prev, username: text }))}
          placeholder="请输入用户名"
          autoCapitalize="none"
          autoCorrect={false}
          helperText={errors.username}
        />

        <InputText
          label="邮箱（可选）"
          value={editForm.email}
          onChangeText={(text: string) => setEditForm(prev => ({ ...prev, email: text }))}
          placeholder="请输入邮箱地址"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          helperText={errors.email}
        />

        <InputText
          label="头像URL（可选）"
          value={editForm.avatarUrl}
          onChangeText={(text: string) => setEditForm(prev => ({ ...prev, avatarUrl: text }))}
          placeholder="请输入头像图片链接"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.formActions}>
          <Button
            label="取消"
            onPress={cancelEdit}
            variant="secondary"
            style={styles.cancelButton}
          />
          <Button label="保存" onPress={saveProfile} loading={saving} style={styles.saveButton} />
        </View>
      </View>
    );
  };

  // 渲染密码修改表单
  const renderPasswordEditForm = () => {
    if (editMode !== 'password') return null;

    return (
      <View style={styles.editForm}>
        <InputText
          label="当前密码"
          value={passwordForm.currentPassword}
          onChangeText={(text: string) =>
            setPasswordForm(prev => ({ ...prev, currentPassword: text }))
          }
          placeholder="请输入当前密码"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          helperText={errors.currentPassword}
        />

        <InputText
          label="新密码"
          value={passwordForm.newPassword}
          onChangeText={(text: string) => setPasswordForm(prev => ({ ...prev, newPassword: text }))}
          placeholder="请输入新密码"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          helperText={errors.newPassword}
        />

        <InputText
          label="确认新密码"
          value={passwordForm.confirmPassword}
          onChangeText={(text: string) =>
            setPasswordForm(prev => ({ ...prev, confirmPassword: text }))
          }
          placeholder="请再次输入新密码"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          helperText={errors.confirmPassword}
        />

        <View style={styles.passwordRequirements}>
          <Text style={styles.requirementText}>
            密码要求：至少8个字符，包含大小写字母、数字和特殊字符
          </Text>
        </View>

        <View style={styles.formActions}>
          <Button
            label="取消"
            onPress={cancelEdit}
            variant="secondary"
            style={styles.cancelButton}
          />
          <Button
            label="修改密码"
            onPress={changePassword}
            loading={saving}
            style={styles.saveButton}
          />
        </View>
      </View>
    );
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  if (!isAuthenticated || !userProfile) {
    return (
      <ProtectedRoute>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={[textStyles.body1, { color: colors.textSecondary }]}>
            {loading ? '加载中...' : '用户信息不存在'}
          </Text>
        </View>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
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
        {/* 用户头像和基本信息 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.avatarContainer} onPress={() => startEdit('avatar')}>
            {renderAvatar()}
            <View style={styles.avatarEditButton}>
              <Text style={styles.avatarEditIcon}>✎</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <Text style={styles.username}>{userProfile.username}</Text>
            {userProfile.email && <Text style={styles.userEmail}>{userProfile.email}</Text>}
            <Text style={styles.userRole}>{getRoleDisplayName(userProfile.role)}</Text>
          </View>

          {/* 快速统计 */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {Math.floor((Date.now() - userProfile.createdAt.getTime()) / (24 * 60 * 60 * 1000))}
              </Text>
              <Text style={styles.statLabel}>注册天数</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{getStatusDisplayName(userProfile.status)}</Text>
              <Text style={styles.statLabel}>账户状态</Text>
            </View>
          </View>
        </View>

        {/* 个人信息部分 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>个人信息</Text>
            {editMode !== 'profile' && (
              <TouchableOpacity style={styles.editButton} onPress={() => startEdit('profile')}>
                <Text style={styles.editButtonText}>编辑</Text>
              </TouchableOpacity>
            )}
          </View>

          {editMode === 'profile' ? (
            renderProfileEditForm()
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>用户名</Text>
                <Text style={styles.infoValue}>{userProfile.username}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>邮箱</Text>
                <Text style={styles.infoValue}>{userProfile.email || '未设置'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>注册时间</Text>
                <Text style={styles.infoValue}>
                  {userProfile.createdAt.toLocaleDateString('zh-CN')}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>最后登录</Text>
                <Text style={styles.infoValue}>{formatTime(userProfile.lastLoginAt)}</Text>
              </View>
            </>
          )}
        </View>

        {/* 安全设置部分 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>安全设置</Text>
            {editMode !== 'password' && (
              <TouchableOpacity style={styles.editButton} onPress={() => startEdit('password')}>
                <Text style={styles.editButtonText}>修改密码</Text>
              </TouchableOpacity>
            )}
          </View>

          {editMode === 'password' ? (
            renderPasswordEditForm()
          ) : (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>密码</Text>
              <Text style={styles.infoValue}>••••••••</Text>
            </View>
          )}
        </View>

        {/* 危险操作部分 */}
        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>危险操作</Text>
          <Text style={styles.dangerText}>注销当前账户会清除本地会话，需要重新登录。</Text>
          <Button
            label="注销账户"
            onPress={handleLogout}
            variant="primary"
            style={styles.dangerButton}
          />
        </View>
      </ScrollView>
    </ProtectedRoute>
  );
};

export default ProfileScreen;
