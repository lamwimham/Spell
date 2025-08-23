import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useTheme } from '../hooks/useTheme';

const WelcomeScreen = () => {
  const { colors, textStyles, spacing, shadows, isDark } = useTheme();
  const dynamicStyles = createStyles({ colors, textStyles, spacing, shadows });

  return (
    <View style={dynamicStyles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>欢迎使用 Spell</Text>
        <Text style={dynamicStyles.subtitle}>您的个人学习助手</Text>
      </View>
      <View style={dynamicStyles.imageContainer}>
        <View style={dynamicStyles.imagePlaceholder}>
          <Text style={dynamicStyles.placeholderText}>Spell</Text>
        </View>
      </View>
      <View style={dynamicStyles.footer}>
        <Text style={dynamicStyles.description}>Spell帮助您提高学习效率，随时随地学习新知识</Text>
        <TouchableOpacity style={dynamicStyles.button}>
          <Text style={dynamicStyles.buttonText}>开始使用</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * 创建动态样式的函数
 */
const createStyles = ({ colors, textStyles, spacing, shadows }: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      alignItems: 'center',
      paddingTop: 120,
      paddingHorizontal: spacing.lg,
    },
    title: {
      ...textStyles.h1,
      color: colors.primary,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    subtitle: {
      ...textStyles.h3,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
      textAlign: 'center',
    },
    imageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },
    imagePlaceholder: {
      width: 200,
      height: 200,
      backgroundColor: colors.backgroundPrimary,
      borderRadius: 100,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.primary,
      ...shadows.medium,
    },
    placeholderText: {
      ...textStyles.h2,
      color: colors.primary,
    },
    footer: {
      padding: spacing.xl,
      alignItems: 'center',
    },
    description: {
      ...textStyles.body1,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.xl,
      lineHeight: textStyles.body1.lineHeight * textStyles.body1.fontSize,
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.padding.button,
      paddingHorizontal: spacing.xl,
      borderRadius: spacing.borderRadius.xl,
      width: '80%',
      alignItems: 'center',
      ...shadows.medium,
    },
    buttonText: {
      ...textStyles.button,
      color: colors.buttonText,
    },
  });

export default WelcomeScreen;
