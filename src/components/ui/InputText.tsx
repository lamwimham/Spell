import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

interface InputTextProps extends TextInputProps {
  label: string;
  helperText?: string;
  disabled?: boolean;
}

export function InputText({
  label,
  helperText,
  disabled = false,
  value,
  onChangeText,
  ...props
}: InputTextProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    if (!disabled) {
      setIsFocused(true);
      if (props.onFocus) {
        props.onFocus(null as any);
      }
    }
  };

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
    disabled ? styles.containerDisabled : null,
    isFocused ? styles.containerFocused : null,
  ];

  const labelStyle = [styles.label, disabled ? styles.labelDisabled : null];

  const inputStyle = [styles.input, disabled ? styles.inputDisabled : null];

  const helperTextStyle = [styles.helperText, disabled ? styles.helperTextDisabled : null];

  return (
    <View>
      <Text style={labelStyle}>{label}</Text>
      <View style={containerStyle}>
        <TextInput
          style={inputStyle}
          placeholder="Enter here"
          placeholderTextColor={disabled ? '#C8C5D0' : '#9CA3AF'}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          value={value}
          onChangeText={onChangeText}
          {...props}
        />
      </View>
      {helperText && <Text style={helperTextStyle}>{helperText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D2CED9',
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
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
    height: '100%',
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
