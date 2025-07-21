import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewStyle
} from 'react-native';

// 定义组件的属性接口
interface SearchBarProps {
  /** 占位符文本 */
  placeholder?: string;
  /** 搜索提交回调函数 */
  onSearch?: (query: string) => void;
  /** 取消搜索回调函数 */
  onCancel?: () => void;
  /** 是否显示取消按钮 */
  showCancelButton?: boolean;
  /** 是否自动获取焦点 */
  autoFocus?: boolean;
  /** 是否启用语音输入按钮 */
  enableVoiceInput?: boolean;
  /** 语音输入按钮点击回调 */
  onVoiceInputPress?: () => void;
  /** 自定义容器样式 */
  containerStyle?: StyleProp<ViewStyle>;
  /** 自定义输入框样式 */
  inputStyle?: StyleProp<TextStyle>;
}

// 定义颜色方案类型
type ColorScheme = 'light' | 'dark';

// 定义颜色集
interface ColorSet {
  background: string;
  activeBorder: string;
  placeholderText: string;
  text: string;
  icon: string;
  cancelText: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = '搜索',
  onSearch,
  onCancel,
  showCancelButton = true,
  autoFocus = false,
  enableVoiceInput = false,
  onVoiceInputPress,
  containerStyle,
  inputStyle,
}) => {
  const colorScheme = useColorScheme() as ColorScheme;
  // const isDarkMode = colorScheme === 'dark';
  const [isFocused, setIsFocused] = useState(autoFocus);
  const [searchText, setSearchText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const cancelButtonWidth = useRef(new Animated.Value(0)).current;
  const cancelButtonOpacity = useRef(new Animated.Value(0)).current;

  // 颜色定义 - 符合 HIG 规范
  const colors: Record<ColorScheme, ColorSet> = {
    light: {
      background: '#E8E8E8', // systemGray6
      activeBorder: '#007AFF', // systemBlue
      placeholderText: '#8E8E93', // systemGray2
      text: '#000000', // label
      icon: '#8E8E93', // systemGray2
      cancelText: '#007AFF', // systemBlue
    },
    dark: {
      background: '#38383A', // systemGray6 (dark)
      activeBorder: '#0A84FF', // systemBlue (dark)
      placeholderText: '#8E8E93', // systemGray3
      text: '#FFFFFF', // label
      icon: '#8E8E93', // systemGray3
      cancelText: '#0A84FF', // systemBlue (dark)
    }
  };

  const currentColors = colors[colorScheme];

  // 处理搜索框聚焦
  const handleFocus = () => {
    setIsFocused(true);
    if (showCancelButton) {
      Animated.parallel([
        Animated.timing(cancelButtonWidth, {
          toValue: 50,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false
        }),
        Animated.timing(cancelButtonOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false
        })
      ]).start();
    }
  };

  // 处理搜索框失去焦点
  const handleBlur = () => {
    setIsFocused(false);
    if (!searchText && showCancelButton) {
      Animated.parallel([
        Animated.timing(cancelButtonWidth, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false
        }),
        Animated.timing(cancelButtonOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false
        })
      ]).start();
    }
  };

  // 处理清除按钮点击
  const handleClearPress = () => {
    setSearchText('');
    inputRef.current?.focus();
  };

  // 处理取消按钮点击
  const handleCancelPress = () => {
    setSearchText('');
    Keyboard.dismiss();
    setIsFocused(false);
    onCancel?.();
    
    if (showCancelButton) {
      Animated.parallel([
        Animated.timing(cancelButtonWidth, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false
        }),
        Animated.timing(cancelButtonOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false
        })
      ]).start();
    }
  };

  // 处理搜索提交
  const handleSubmit = () => {
    onSearch?.(searchText);
    Keyboard.dismiss();
  };

  // 处理文本变化
  const handleTextChange = (text: string) => {
    setSearchText(text);
    // 可选：实现实时搜索
    // if (text.length > 0) {
    //   onSearch?.(text);
    // }
  };

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [autoFocus]);

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[
        styles.searchContainer,
        {
          backgroundColor: currentColors.background,
          borderColor: isFocused ? currentColors.activeBorder : 'transparent'
        }
      ]}>
        {/* 搜索图标 */}
        <View style={styles.iconContainer}>
          <Text 
            style={[styles.icon, { color: currentColors.icon }]}
            accessibilityLabel="搜索"
          >
            {'􀊫'} {/* Magnifying glass symbol */}
          </Text>
        </View>
        
        {/* 文本输入框 */}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              color: currentColors.text,
              fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto'
            },
            inputStyle
          ]}
          placeholder={placeholder}
          placeholderTextColor={currentColors.placeholderText}
          value={searchText}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
          autoFocus={autoFocus}
          returnKeyType="search"
          clearButtonMode="never" // 使用自定义清除按钮
          enablesReturnKeyAutomatically={true}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          keyboardAppearance={colorScheme}
          accessibilityLabel="搜索输入框"
          accessibilityHint="输入搜索内容"
        />
        
        {/* 清除按钮 */}
        {isFocused && searchText.length > 0 && (
          <TouchableOpacity 
            onPress={handleClearPress}
            style={styles.clearButton}
            accessibilityLabel="清除搜索内容"
            accessibilityRole="button"
          >
            <Text style={[styles.icon, { color: currentColors.icon }]}>
              {'􀁡'} {/* xmark.circle.fill symbol */}
            </Text>
          </TouchableOpacity>
        )}
        
        {/* 语音输入按钮 */}
        {enableVoiceInput && searchText.length === 0 && (
          <TouchableOpacity 
            onPress={onVoiceInputPress}
            style={styles.voiceButton}
            accessibilityLabel="语音输入"
            accessibilityRole="button"
          >
            <Text style={[styles.icon, { color: currentColors.icon }]}>
              {'􀊱'} {/* mic.fill symbol */}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* 取消按钮 */}
      {showCancelButton && (
        <Animated.View 
          style={[
            styles.cancelButtonContainer,
            {
              width: cancelButtonWidth,
              opacity: cancelButtonOpacity
            }
          ]}
          accessibilityElementsHidden={!isFocused}
          importantForAccessibility={isFocused ? "auto" : "no-hide-descendants"}
        >
          <TouchableOpacity 
            onPress={handleCancelPress}
            accessibilityLabel="取消搜索"
            accessibilityRole="button"
          >
            <Text style={[
              styles.cancelButton, 
              { color: currentColors.cancelText }
            ]}>
              取消
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingLeft: 8,
    height: 36,
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  icon: {
    fontSize: 17,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  input: {
    flex: 1,
    height: 36,
    paddingVertical: 0,
    paddingHorizontal: 4,
    fontSize: 17,
    letterSpacing: -0.41,
  },
  clearButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  voiceButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  cancelButtonContainer: {
    overflow: 'hidden',
    justifyContent: 'center',
    height: 36,
  },
  cancelButton: {
    fontSize: 17,
    fontWeight: '400',
    paddingLeft: 12,
    paddingVertical: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default SearchBar;