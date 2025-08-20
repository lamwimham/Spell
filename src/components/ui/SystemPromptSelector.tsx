import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SYSTEM_PROMPTS } from '../../services/qwen/example';
import { QwenMessage } from '../../services/qwen/types';

interface SystemPromptSelectorProps {
  onSelectPrompt: (prompt: QwenMessage) => void;
  onCustomPrompt: (content: string) => void;
  currentPrompt?: QwenMessage;
  onClose: () => void;
}

export const SystemPromptSelector: React.FC<SystemPromptSelectorProps> = ({
  onSelectPrompt,
  onCustomPrompt,
  currentPrompt,
  onClose,
}) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // 将系统提示词对象转换为数组，并确保类型正确
  const promptsList = Object.entries(SYSTEM_PROMPTS).map(([key, prompt]) => ({
    id: key,
    role: prompt.role as 'system' | 'user' | 'assistant',
    content: prompt.content,
  }));

  const handleSelectPrompt = (prompt: QwenMessage) => {
    onSelectPrompt(prompt);
    onClose();
  };

  const handleSubmitCustomPrompt = () => {
    if (customPrompt.trim()) {
      onCustomPrompt(customPrompt.trim());
      onClose();
    }
  };

  const renderPromptItem = ({ item }: { item: QwenMessage & { id: string } }) => {
    const isSelected = currentPrompt?.content === item.content;

    return (
      <TouchableOpacity
        style={[styles.promptItem, isSelected && styles.selectedPromptItem]}
        onPress={() => handleSelectPrompt(item)}
      >
        <View style={styles.promptContent}>
          <Text style={styles.promptTitle}>
            {item.id
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ')}
          </Text>
          <Text style={styles.promptPreview} numberOfLines={2}>
            {item.content}
          </Text>
        </View>
        {isSelected && <Icon name="checkmark-circle" size={24} color="#7572B7" />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>选择系统提示词</Text>
        <TouchableOpacity onPress={onClose}>
          <Icon name="close" size={24} color="#393640" />
        </TouchableOpacity>
      </View>

      {!showCustomInput ? (
        <>
          <FlatList
            data={promptsList}
            renderItem={renderPromptItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
          />

          <TouchableOpacity style={styles.customButton} onPress={() => setShowCustomInput(true)}>
            <Icon name="create-outline" size={20} color="#7572B7" />
            <Text style={styles.customButtonText}>创建自定义提示词</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.customInputContainer}>
          <Text style={styles.customInputLabel}>自定义系统提示词</Text>
          <TextInput
            style={styles.customInput}
            value={customPrompt}
            onChangeText={setCustomPrompt}
            placeholder="输入自定义系统提示词..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <View style={styles.customInputButtons}>
            <TouchableOpacity
              style={[styles.customInputButton, styles.cancelButton]}
              onPress={() => setShowCustomInput(false)}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.customInputButton,
                styles.submitButton,
                !customPrompt.trim() && styles.disabledButton,
              ]}
              onPress={handleSubmitCustomPrompt}
              disabled={!customPrompt.trim()}
            >
              <Text style={styles.submitButtonText}>确定</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: '#393640',
    fontFamily: 'Rubik',
  },
  listContent: {
    padding: 16,
  },
  promptItem: {
    flexDirection: 'row',
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedPromptItem: {
    backgroundColor: '#F0F0FF',
    borderColor: '#7572B7',
    borderWidth: 1,
  },
  promptContent: {
    flex: 1,
    marginRight: 8,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#393640',
    fontFamily: 'Rubik',
    marginBottom: 4,
  },
  promptPreview: {
    fontSize: 14,
    color: '#535059',
    lineHeight: 20,
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  customButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#7572B7',
    fontFamily: 'Rubik',
  },
  customInputContainer: {
    padding: 16,
    flex: 1,
  },
  customInputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#393640',
    marginBottom: 12,
    fontFamily: 'Rubik',
  },
  customInput: {
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#393640',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    height: 200,
  },
  customInputButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  customInputButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    color: '#393640',
    fontSize: 16,
    fontFamily: 'Rubik',
  },
  submitButton: {
    backgroundColor: '#7572B7',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Rubik',
  },
  disabledButton: {
    backgroundColor: '#C7C7CC',
  },
});
