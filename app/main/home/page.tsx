import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// 为了类型安全，推荐使用 typed hooks
import AudioPlayerDrawer from '@/components/custom/AudioPlayer';
import Card from '@/components/custom/Card';
import KeyboardButton from '@/components/custom/KeyboardButton';
import { ThemedText } from '@/components/ThemedText';
import { AppDispatch, RootState } from '@/store';
import { deleteSpell } from '@/store/spellSlice';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch: () => AppDispatch = useDispatch;
type StackParamList = {
  [key: string]: any;
};
export default function HomePage() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>();
  const dispatch = useAppDispatch();
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [selectedSpellId, setSelectedSpellId] = useState('');

  const spells = useAppSelector((state) => state.spellsReducer.spells); // 从 store 中读取 spells 列表

  const spellCards = spells.map((item) => {
    return {
      id: item.id,
      duration: item.createdAt,
      location: item.description,
      playCount: item.playCount,
      shareCount: item.shareCount,
      imageUrl: item.image,
      title: item.name,
      uri: item.uri,
    };
  });
  // 卡片数据数组
  const closePlayer = () => {
    setIsPlayerVisible(false);
  };
  const handleKeyPress = (value: string | number) => {
    console.log(`按键: ${value}`);
    // 在这里处理按键逻辑，比如更新状态、拼接数字等
  };

  const handleDelete = (cardId: string) => {
    dispatch(deleteSpell(cardId));
  };

  const handlePlayPress = (cardId: string) => {
    setSelectedSpellId(cardId);
    setIsPlayerVisible(true);
  };

  return (
    <SafeAreaView
      style={[{ backgroundColor: theme.colors.background }, styles.container]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText
          type='title'
          style={{ fontSize: 24, letterSpacing: 0.5 }}
          lightColor={theme.colors.primary}
          darkColor={theme.colors.primary}
        >
          My Spells
        </ThemedText>
        {spellCards.map((card) => (
          <Card
            key={card.id}
            title={card.title}
            duration={card.duration}
            location={card.location}
            playCount={card.playCount || 10} // 添加播放次数
            shareCount={card.shareCount || 110} // 添加分享次数
            imageUrl={card.imageUrl} // 添加图片URL
            onPlayPress={() => handlePlayPress(card.id)}
            style={styles.cardStyle} // 自定义样式示例
          />
        ))}
        <View style={styles.keyboardContainer}>
          {/* 第一行 */}
          <View style={styles.row}>
            <KeyboardButton label='1' onPress={() => handleKeyPress(1)} />
            <KeyboardButton label='2' onPress={() => handleKeyPress(2)} />
            <KeyboardButton label='3' onPress={() => handleKeyPress(3)} />
          </View>
          {/* 第二行 */}
          <View style={styles.row}>
            <KeyboardButton label='4' onPress={() => handleKeyPress(4)} />
            <KeyboardButton label='5' onPress={() => handleKeyPress(5)} />
            <KeyboardButton label='6' onPress={() => handleKeyPress(6)} />
          </View>
          {/* 第三行 */}
          <View style={styles.row}>
            <KeyboardButton label='7' onPress={() => handleKeyPress(7)} />
            <KeyboardButton label='8' onPress={() => handleKeyPress(8)} />
            <KeyboardButton label='9' onPress={() => handleKeyPress(9)} />
          </View>
          {/* 第四行 */}
          <View style={styles.row}>
            <KeyboardButton label='C' onPress={() => handleKeyPress('clear')} />
            <KeyboardButton label='0' onPress={() => handleKeyPress(0)} />
            <KeyboardButton
              label='⌫'
              onPress={() => handleKeyPress('backspace')}
            />
          </View>
        </View>
      </ScrollView>

      <AudioPlayerDrawer
        spellId={selectedSpellId}
        visible={isPlayerVisible}
        onClose={closePlayer}
        onDelete={handleDelete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  keyboardContainer: {
    // 键盘整体的样式
    width: '100%',
    alignItems: 'center',
  },
  row: {
    // 每行按钮的样式
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  scrollContent: {
    padding: 8,
    // paddingBottom: 80,
  },
  cardStyle: {},
  title: {
    fontSize: 46,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
