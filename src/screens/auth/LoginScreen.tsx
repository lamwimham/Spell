/**
 * 登录页面 - 用户登录界面
 * 完全集成主题系统，提供统一的视觉体验
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LoginForm from '../../components/auth/LoginForm';
import { useTheme } from '../../hooks/useTheme';
import { RootStackParamList } from '../../types/navigation';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { colors, textStyles, spacing, shadows } = useTheme();

  // 动态样式，完全集成主题系统
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      ...shadows.light,
    },
    backButton: {
      padding: spacing.sm,
      marginRight: spacing.sm,
      borderRadius: spacing.sm,
      backgroundColor: colors.backgroundElevated,
    },
    headerTitle: {
      ...textStyles.h3,
      color: colors.text,
      flex: 1,
      fontWeight: '600',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
    },
  });

  const handleLoginSuccess = () => {
    // 登录成功后返回到主界面
    navigation.goBack();
  };

  const handleSwitchToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>用户登录</Text>
      </View>

      <View style={styles.content}>
        <LoginForm
          onSuccess={handleLoginSuccess}
          onSwitchToRegister={handleSwitchToRegister}
          showRememberMe={true}
          showForgotPassword={true}
        />
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
