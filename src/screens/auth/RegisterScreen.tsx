/**
 * 注册页面 - 用户注册界面
 * 完全集成主题系统，提供统一的视觉体验
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import RegisterForm from '../../components/auth/RegisterForm';
import { useTheme } from '../../hooks/useTheme';
import { RootStackParamList } from '../../types/navigation';

const RegisterScreen: React.FC = () => {
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
    },
  });

  const handleRegisterSuccess = () => {
    // 注册成功后返回到主界面
    navigation.goBack();
  };

  const handleSwitchToLogin = () => {
    navigation.navigate('Login');
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
        <Text style={styles.headerTitle}>用户注册</Text>
      </View>

      <View style={styles.content}>
        <RegisterForm
          onSuccess={handleRegisterSuccess}
          onSwitchToLogin={handleSwitchToLogin}
          allowRoleSelection={false}
        />
      </View>
    </SafeAreaView>
  );
};

export default RegisterScreen;
