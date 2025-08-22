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

  // 渲染单个选项
  const renderItem = ({ item }: { item: ScriptOption }) => {
    const isSelected = selectedId === item.id;

    return (
      <View style={[styles.itemContainer, isSelected && styles.selectedItem]}>
        <TouchableOpacity
          style={styles.itemContent}
          onLongPress={() => handleLongPress(item.id)}
          delayLongPress={200}
          activeOpacity={0.8}
        >
          <Text style={styles.itemText} numberOfLines={3}>
            {item.content}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>选择咒语</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#393640" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.instructionText}>长按选择咒语，或滑动浏览选项</Text>

            <View style={styles.carouselContainer}>
              <FlatList
                data={options}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                decelerationRate="normal"
                snapToAlignment="start"
                contentContainerStyle={styles.listContent}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.regenerateButton}
              onPress={onRegenerate}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <ActivityIndicator size="small" color="#393640" />
              ) : (
                <Text style={styles.regenerateButtonText}>重新生成</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, !selectedId && styles.disabledButton]}
              onPress={handleConfirmSelection}
              disabled={!selectedId || isRegenerating}
            >
              <Text style={styles.confirmButtonText}>选中</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: SCREEN_WIDTH * 0.9,
    maxHeight: SCREEN_HEIGHT * 0.8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E3F1',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Rubik',
    fontWeight: '600',
    color: '#393640',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#535059',
    textAlign: 'center',
    marginBottom: 20,
  },
  carouselContainer: {
    width: '100%',
    height: 240,
    marginVertical: 20,
  },
  listContent: {
    paddingVertical: 10,
  },
  itemContainer: {
    height: 100,
    marginVertical: 8,
    marginHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#F8F8F8',
    borderWidth: 2,
    borderColor: '#E3E3F1',
    overflow: 'hidden',
  },
  selectedItem: {
    borderColor: '#7572B7',
    backgroundColor: '#EDECF7',
    shadowColor: '#7572B7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  itemContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 14,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#393640',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E3E3F1',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Rubik',
    fontWeight: '500',
    color: '#535059',
  },
  regenerateButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#E3E3F1',
  },
  regenerateButtonText: {
    fontSize: 16,
    fontFamily: 'Rubik',
    fontWeight: '500',
    color: '#393640',
  },
  confirmButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#7572B7',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Rubik',
    fontWeight: '500',
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#C8C5D0',
  },
});
