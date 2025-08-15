import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

/**
 * InputTextarea组件属性接口
 * @property {string} label - 输入框标签文本
 * @property {string} [helperText] - 辅助说明文本（可选）
 * @property {boolean} [disabled] - 是否禁用（默认为false）
 * @property {number} [height] - 文本区域高度（默认为120）
 * @property {string} [placeholder] - 占位符文本（默认为"Write your script here..."）
 * @property {React.CSSProperties} [style] - 自定义样式
 */
interface InputTextareaProps extends TextInputProps {
  label: string;
  helperText?: string;
  disabled?: boolean;
  height?: number;
  placeholder?: string;
  style?: any;
}

/**
 * 多行文本输入组件
 *
 * 支持三种状态：
 * - 默认状态：白色背景，灰色边框
 * - 聚焦状态：白色背景，紫色边框（加粗）
 * - 禁用状态：浅灰色背景，灰色边框，文字变灰
 */
export function InputTextarea({
  label,
  helperText,
  disabled = false,
  height = 120,
  placeholder = 'Write your script here...',
  value,
  onChangeText,
  style,
  ...props
}: InputTextareaProps) {
  // 聚焦状态管理
  const [isFocused, setIsFocused] = useState(false);

  // 处理聚焦事件
  const handleFocus = () => {
    if (!disabled) {
      setIsFocused(true);
      if (props.onFocus) {
        props.onFocus(null as any);
      }
    }
  };

  // 处理失焦事件
  const handleBlur = () => {
    if (!disabled) {
      setIsFocused(false);
      if (props.onBlur) {
        props.onBlur(null as any);
      }
    }
  };

  // 根据状态确定样式
  const containerStyle = [
    styles.container,
    { height },
    disabled ? styles.containerDisabled : null,
    isFocused ? styles.containerFocused : null,
    style,
  ];

  const labelStyle = [styles.label, disabled ? styles.labelDisabled : null];

  const inputStyle = [
    styles.input,
    { height: height - 32 }, // 减去内边距
    disabled ? styles.inputDisabled : null,
  ];

  const helperTextStyle = [styles.helperText, disabled ? styles.helperTextDisabled : null];

  return (
    <View>
      <Text style={labelStyle}>{label}</Text>
      <View style={containerStyle}>
        <TextInput
          style={inputStyle}
          placeholder={placeholder}
          placeholderTextColor={disabled ? '#C8C5D0' : '#9CA3AF'}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          value={value}
          onChangeText={onChangeText}
          multiline={true}
          textAlignVertical="top"
          {...props}
        />
      </View>
      {helperText && <Text style={helperTextStyle}>{helperText}</Text>}
    </View>
  );
}

/**
 * 组件样式定义
 *
 * 尺寸规格：
 * - 容器默认高度：120px（可通过height属性自定义）
 * - 内边距：16px
 * - 边框圆角：8px
 * - 标签字体大小：15px
 * - 辅助文本字体大小：13px
 *
 * 颜色规格：
 * - 默认边框色：#D2CED9
 * - 聚焦边框色：#7572B7
 * - 禁用背景色：#F5F3FA
 * - 默认文本色：#393640
 * - 禁用文本色：#9CA3AF
 * - 辅助文本色：#535059
 */
const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#D2CED9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  containerFocused: {
    borderColor: '#7572B7',
    borderWidth: 2,
  },
  containerDisabled: {
    backgroundColor: '#F5F3FA',
    borderColor: '#D2CED9',
  },
  label: {
    fontSize: 15,
    fontWeight: '400',
    color: '#393640',
    fontFamily: 'Rubik',
  },
  labelDisabled: {
    color: '#9CA3AF',
  },
  input: {
    fontSize: 15,
    fontWeight: '400',
    color: '#393640',
    fontFamily: 'Rubik',
    padding: 0,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    color: '#9CA3AF',
  },
  helperText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#535059',
    fontFamily: 'Rubik',
    marginTop: 4,
  },
  helperTextDisabled: {
    color: '#9CA3AF',
  },
});
