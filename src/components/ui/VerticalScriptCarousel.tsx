// VerticalScriptCarousel.tsx - 垂直轮播组件

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ScriptOption {
  id: string;
  content: string;
}

interface VerticalScriptCarouselProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (script: string) => void;
  onRegenerate: () => void;
  options: ScriptOption[];
  isRegenerating?: boolean;
}

export const VerticalScriptCarousel: React.FC<VerticalScriptCarouselProps> = ({
  visible,
  onClose,
  onSelect,
  onRegenerate,
  options,
  isRegenerating = false,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { colors, textStyles, spacing, shadows } = useTheme();

  // 处理长按选择
  const handleLongPress = (id: string) => {
    setSelectedId(id);
  };

  // 处理确认选择
  const handleConfirmSelection = () => {
    if (selectedId) {
      const selectedOption = options.find(option => option.id === selectedId);
      if (selectedOption) {
        onSelect(selectedOption.content);
        onClose();
      }
    }
  };

  // 创建动态样式
  const createStyles = () =>
    StyleSheet.create({
      overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      modalContainer: {
        width: SCREEN_WIDTH * 0.9,
        maxHeight: SCREEN_HEIGHT * 0.8,
        backgroundColor: colors.surface,
        borderRadius: spacing.borderRadius.lg,
        overflow: 'hidden',
        ...shadows.heavy,
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      headerTitle: {
        ...textStyles.h3,
        color: colors.text,
      } as any,
      closeButton: {
        padding: spacing.xs,
      },
      content: {
        padding: spacing.lg,
        alignItems: 'center',
      },
      carouselContainer: {
        width: '100%',
        height: 300,
        marginVertical: spacing.sm,
      },
      listContent: {
        paddingVertical: spacing.sm,
      },
      itemContainer: {
        height: 100,
        marginVertical: spacing.sm,
        marginHorizontal: spacing.lg,
        borderRadius: spacing.borderRadius.md,
        backgroundColor: colors.backgroundElevated,
        borderWidth: 2,
        borderColor: colors.border,
        overflow: 'hidden',
      },
      selectedItem: {
        borderColor: colors.primary,
        backgroundColor: colors.backgroundPrimary,
        ...shadows.medium,
      },
      itemContent: {
        flex: 1,
        padding: spacing.md,
        justifyContent: 'center',
      },
      itemText: {
        ...textStyles.body2,
        color: colors.text,
      } as any,
      footer: {
        flexDirection: 'row',
        padding: spacing.lg,
        gap: spacing.md,
      },
      regenerateButton: {
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: spacing.borderRadius.md,
        backgroundColor: colors.backgroundElevated,
        borderWidth: 1,
        borderColor: colors.border,
      },
      regenerateButtonText: {
        ...textStyles.button,
        color: colors.text,
      } as any,
      confirmButton: {
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: spacing.borderRadius.md,
        backgroundColor: colors.primary,
      },
      confirmButtonText: {
        ...textStyles.button,
        color: colors.buttonText,
      } as any,
      disabledButton: {
        backgroundColor: colors.textTertiary,
      },
    });

  // 渲染单个选项
  const renderItem = ({ item }: { item: ScriptOption }) => {
    const isSelected = selectedId === item.id;
    const dynamicStyles = createStyles();

    return (
      <View style={[dynamicStyles.itemContainer, isSelected && dynamicStyles.selectedItem]}>
        <TouchableOpacity
          style={dynamicStyles.itemContent}
          onLongPress={() => handleLongPress(item.id)}
          delayLongPress={200}
          activeOpacity={0.8}
        >
          <Text style={dynamicStyles.itemText} numberOfLines={3}>
            {item.content}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const dynamicStyles = createStyles();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={dynamicStyles.overlay}>
        <View style={dynamicStyles.modalContainer}>
          <View style={dynamicStyles.header}>
            <Text style={dynamicStyles.headerTitle}>选择咒语</Text>
            <TouchableOpacity onPress={onClose} style={dynamicStyles.closeButton}>
              <Icon name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={dynamicStyles.content}>
            <View style={dynamicStyles.carouselContainer}>
              <FlatList
                data={options}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                decelerationRate="normal"
                snapToAlignment="start"
                contentContainerStyle={dynamicStyles.listContent}
              />
            </View>
          </View>

          <View style={dynamicStyles.footer}>
            <TouchableOpacity
              style={dynamicStyles.regenerateButton}
              onPress={onRegenerate}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text style={dynamicStyles.regenerateButtonText}>重新生成</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[dynamicStyles.confirmButton, !selectedId && dynamicStyles.disabledButton]}
              onPress={handleConfirmSelection}
              disabled={!selectedId || isRegenerating}
            >
              <Text style={dynamicStyles.confirmButtonText}>选中</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
