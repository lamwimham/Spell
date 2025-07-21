import React, { useState } from 'react';
import {
  FlatList,
  ListRenderItem,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewStyle
} from 'react-native';

// 通用列表项类型定义
export interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  metadata?: string;
  isSelected?: boolean;
  isDisabled?: boolean;
  customData?: any; // 用于存储特定类型的数据
}

// 列表项渲染配置
export interface ListItemRenderConfig {
  leftContent?: (item: ListItem) => React.ReactNode;
  centerContent?: (item: ListItem) => React.ReactNode;
  rightContent?: (item: ListItem) => React.ReactNode;
}

// 主题配置
export interface ListTheme {
  backgroundColor?: string;
  textColor?: string;
  secondaryTextColor?: string;
  separatorColor?: string;
  accentColor?: string;
  pressedBackground?: string;
  selectedBackground?: string;
}

// 组件属性
interface HIGListProps {
  data: ListItem[];
  renderConfig?: ListItemRenderConfig;
  theme?: 'auto' | 'light' | 'dark' | ListTheme;
  layout?: 'default' | 'compact' | 'detailed';
  onItemPress?: (item: ListItem) => void;
  onItemLongPress?: (item: ListItem) => void;
  style?: StyleProp<ViewStyle>;
  itemStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  selectedItemStyle?: StyleProp<ViewStyle>;
  disabledItemStyle?: StyleProp<ViewStyle>;
  separatorVisible?: boolean;
  accessibilityLabel?: string;
}

// 通用列表组件
const HIGList: React.FC<HIGListProps> = ({
  data,
  renderConfig = {},
  theme = 'auto',
  layout = 'default',
  onItemPress,
  onItemLongPress,
  style,
  itemStyle,
  titleStyle,
  subtitleStyle,
  selectedItemStyle,
  disabledItemStyle,
  separatorVisible = true,
  accessibilityLabel = '列表'
}) => {
  const systemColorScheme = useColorScheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // 解析主题配置
  const getTheme = (): ListTheme => {
    if (typeof theme === 'string') {
      const isDark = theme === 'auto' 
        ? systemColorScheme === 'dark' 
        : theme === 'dark';
      
      return {
        backgroundColor: isDark ? '#000000' : '#F2F2F7',
        textColor: isDark ? '#FFFFFF' : '#000000',
        secondaryTextColor: isDark ? '#8E8E93' : '#8E8E93',
        separatorColor: isDark ? '#38383A' : '#C6C6C8',
        accentColor: isDark ? '#0A84FF' : '#007AFF',
        pressedBackground: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        selectedBackground: isDark ? 'rgba(10,132,255,0.2)' : 'rgba(0,122,255,0.1)',
      };
    }
    return theme;
  };
  
  const currentTheme = getTheme();
  
  // 布局配置
  const getLayoutConfig = () => {
    switch (layout) {
      case 'compact':
        return {
          paddingVertical: 8,
          paddingHorizontal: 12,
          minHeight: 44,
          titleFontSize: 16,
          subtitleFontSize: 13,
          iconSize: 20,
          spacing: 8
        };
      case 'detailed':
        return {
          paddingVertical: 16,
          paddingHorizontal: 20,
          minHeight: 72,
          titleFontSize: 18,
          subtitleFontSize: 15,
          iconSize: 28,
          spacing: 12
        };
      default: // 'default'
        return {
          paddingVertical: 12,
          paddingHorizontal: 16,
          minHeight: 60,
          titleFontSize: 17,
          subtitleFontSize: 15,
          iconSize: 24,
          spacing: 10
        };
    }
  };
  
  const layoutConfig = getLayoutConfig();
  
  // 渲染列表项
  const renderItem: ListRenderItem<ListItem> = ({ item }) => {
    const isSelected = selectedId === item.id || item.isSelected;
    const isDisabled = item.isDisabled;
    
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedId(item.id);
          onItemPress?.(item);
        }}
        onLongPress={() => onItemLongPress?.(item)}
        activeOpacity={0.7}
        disabled={isDisabled}
        style={[
          styles.listItem,
          {
            backgroundColor: currentTheme.backgroundColor,
            paddingVertical: layoutConfig.paddingVertical,
            paddingHorizontal: layoutConfig.paddingHorizontal,
            minHeight: layoutConfig.minHeight,
          },
          isSelected && [
            { backgroundColor: currentTheme.selectedBackground },
            selectedItemStyle
          ],
          isDisabled && [
            { opacity: 0.5 },
            disabledItemStyle
          ],
          itemStyle
        ]}
        accessibilityLabel={item.title}
        accessibilityRole="button"
        accessibilityState={{ 
          selected: isSelected, 
          disabled: isDisabled 
        }}
      >
        {/* 左侧内容插槽 */}
        <View style={styles.leftContent}>
          {renderConfig.leftContent ? (
            renderConfig.leftContent(item)
          ) : (
            <DefaultLeftContent item={item} theme={currentTheme} layoutConfig={layoutConfig} />
          )}
        </View>
        
        {/* 中间内容插槽 */}
        <View style={[styles.centerContent, { marginHorizontal: layoutConfig.spacing }]}>
          {renderConfig.centerContent ? (
            renderConfig.centerContent(item)
          ) : (
            <DefaultCenterContent 
              item={item} 
              theme={currentTheme} 
              layoutConfig={layoutConfig}
              titleStyle={titleStyle}
              subtitleStyle={subtitleStyle}
            />
          )}
        </View>
        
        {/* 右侧内容插槽 */}
        <View style={styles.rightContent}>
          {renderConfig.rightContent ? (
            renderConfig.rightContent(item)
          ) : (
            <DefaultRightContent item={item} theme={currentTheme} layoutConfig={layoutConfig} />
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  // 渲染分隔线
  const renderSeparator = () => (
    <View style={[
      styles.separator, 
      { backgroundColor: currentTheme.separatorColor }
    ]} />
  );
  
  return (
    <View 
      style={[styles.container, style]} 
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="list"
    >
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={separatorVisible ? renderSeparator : null}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

// 默认左侧内容组件
const DefaultLeftContent: React.FC<{
  item: ListItem;
  theme: ListTheme;
  layoutConfig: any;
}> = ({ item, theme, layoutConfig }) => {
  return (
    <View style={[
      styles.iconContainer,
      { 
        width: layoutConfig.iconSize * 1.5,
        height: layoutConfig.iconSize * 1.5,
        borderRadius: layoutConfig.iconSize * 0.75,
        backgroundColor: theme.accentColor + '20', // 添加透明度
      }
    ]}>
      <Text style={[
        styles.defaultIconText,
        { 
          color: theme.accentColor,
          fontSize: layoutConfig.iconSize * 0.7,
        }
      ]}>
        {item.title.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
};

// 默认中间内容组件
const DefaultCenterContent: React.FC<{
  item: ListItem;
  theme: ListTheme;
  layoutConfig: any;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
}> = ({ item, theme, layoutConfig, titleStyle, subtitleStyle }) => {
  return (
    <View style={styles.textContainer}>
      <Text 
        style={[
          styles.title,
          {
            fontSize: layoutConfig.titleFontSize,
            color: theme.textColor,
          },
          titleStyle
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {item.title}
      </Text>
      {(item.subtitle || item.metadata) && (
        <Text 
          style={[
            styles.subtitle,
            {
              fontSize: layoutConfig.subtitleFontSize,
              color: theme.secondaryTextColor,
            },
            subtitleStyle
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.subtitle || item.metadata}
        </Text>
      )}
    </View>
  );
};

// 默认右侧内容组件
const DefaultRightContent: React.FC<{
  item: ListItem;
  theme: ListTheme;
  layoutConfig: any;
}> = ({ item, theme, layoutConfig }) => {
  return (
    <View style={styles.moreButton}>
      <View style={styles.moreButtonDots}>
        <View style={[styles.dot, { backgroundColor: theme.secondaryTextColor }]} />
        <View style={[styles.dot, { 
          backgroundColor: theme.secondaryTextColor, 
          marginTop: 4 
        }]} />
        <View style={[styles.dot, { 
          backgroundColor: theme.secondaryTextColor, 
          marginTop: 4 
        }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  leftContent: {
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    minWidth: 0, // 确保文本压缩时不会溢出
  },
  rightContent: {
    justifyContent: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultIconText: {
    fontWeight: '500',
  },
  textContainer: {
    justifyContent: 'center',
  },
  title: {
    fontFamily: Platform.select({ ios: 'SFProText-Regular', android: 'sans-serif' }),
    marginBottom: 2,
    letterSpacing: -0.41, // HIG推荐字距
  },
  subtitle: {
    fontFamily: Platform.select({ ios: 'SFProText-Regular', android: 'sans-serif' }),
    letterSpacing: -0.24,
  },
  moreButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButtonDots: {
    height: 20,
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export default HIGList;