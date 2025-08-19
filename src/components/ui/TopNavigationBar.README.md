# 顶部导航栏组件使用指南

## 概述

为了统一应用中各个页面的顶部导航栏样式和行为，我们创建了一个可复用的 `TopNavigationBar` 组件。该组件提供了灵活的配置选项，可以满足不同页面的需求。

## 组件属性

| 属性名               | 类型     | 默认值      | 描述                                |
| -------------------- | -------- | ----------- | ----------------------------------- |
| `title`              | string   | 必需        | 页面标题                            |
| `showBackButton`     | boolean  | `true`      | 是否显示返回按钮                    |
| `showSettingsButton` | boolean  | `false`     | 是否显示设置按钮                    |
| `onBackPress`        | function | `undefined` | 返回按钮点击回调                    |
| `onSettingsPress`    | function | `undefined` | 设置按钮点击回调                    |
| `rightIconName`      | string   | `undefined` | 右侧自定义图标名称（使用 Ionicons） |
| `onRightIconPress`   | function | `undefined` | 右侧自定义图标点击回调              |
| `backgroundColor`    | string   | `'#FDFCFF'` | 导航栏背景颜色                      |
| `titleColor`         | string   | `'#393640'` | 标题文字颜色                        |
| `iconColor`          | string   | `'#000'`    | 图标颜色                            |

## 使用示例

### 基本用法（带返回按钮）

```tsx
import { TopNavigationBar } from '../components/ui/TopNavigationBar';

<TopNavigationBar title="页面标题" showBackButton={true} onBackPress={() => navigation.goBack()} />;
```

### 带设置按钮

```tsx
<TopNavigationBar
  title="Player"
  showBackButton={true}
  onBackPress={() => navigation.goBack()}
  showSettingsButton={true}
  onSettingsPress={() => navigation.navigate('Settings')}
/>
```

### 带自定义右侧图标

```tsx
<TopNavigationBar
  title="Add New Card"
  showBackButton={true}
  onBackPress={() => navigation.goBack()}
  rightIconName="save-outline"
  onRightIconPress={handleSave}
  iconColor="#FF6B6B"
/>
```

## 在页面中集成

1. 导入组件：

   ```tsx
   import { TopNavigationBar } from '../components/ui/TopNavigationBar';
   ```

2. 替换原有的自定义导航栏实现：

   ```tsx
   // 之前的手动实现
   <View style={styles.header}>
     <TouchableOpacity
       style={styles.backButton}
       onPress={() => navigation.goBack()}
     >
       <Icon name="chevron-back" size={24} color="#000" />
     </TouchableOpacity>
     <Text style={styles.headerTitle}>页面标题</Text>
     <View style={styles.settingsButton} />
   </View>

   // 使用统一组件
   <TopNavigationBar
     title="页面标题"
     showBackButton={true}
     onBackPress={() => navigation.goBack()}
   />
   ```

## 注意事项

1. 组件默认高度为 96，包含 48 的顶部安全区域填充。
2. 如果页面需要特殊的导航栏行为（如 HomeScreen 的删除模式），可以在特殊状态下使用原有的自定义实现。
3. 图标使用 Ionicons 图标库，可以通过 `rightIconName` 属性指定任何 Ionicons 图标。
4. 颜色属性支持所有 React Native 支持的颜色格式。
