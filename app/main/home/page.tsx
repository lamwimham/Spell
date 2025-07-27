import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// 为了类型安全，推荐使用 typed hooks
import AudioPlayerDrawer from '@/components/custom/AudioPlayer';
import Card from '@/components/custom/Card';
import { ThemedText } from '@/components/ThemedText';
import { AppDispatch, RootState } from '@/store';
import { deleteSpell } from '@/store/spellSlice';

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch: () => AppDispatch = useDispatch;

export default function HomePage() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [selectedSpellId, setSelectedSpellId] = useState('');
  
  const spells = useAppSelector((state) => state.spellsReducer.spells); // 从 store 中读取 spells 列表

  const spellCards = spells.map(item => {
    return {
      id: item.id,
      duration: item.createdAt,
      location: item.description,
      playCount: item.playCount,
      shareCount: item.shareCount,
      imageUrl: item.image,
      title: item.name,
      uri: item.uri,
    }
  })
  // 卡片数据数组
  const closePlayer = () => {
    setIsPlayerVisible(false);
  };

  const handleDelete = (cardId: string) => {
    dispatch(deleteSpell(cardId));
  };

  const handlePlayPress = (cardId: string) => {
    setSelectedSpellId(cardId);
    setIsPlayerVisible(true);
  };

  return (
    <SafeAreaView style={[{ backgroundColor: theme.colors.background }, styles.container]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText 
          type="title"
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
            playCount={card.playCount || 10}  // 添加播放次数
            shareCount={card.shareCount || 110} // 添加分享次数
            imageUrl={card.imageUrl} // 添加图片URL
            onPlayPress={() => handlePlayPress(card.id)}
            style={styles.cardStyle} // 自定义样式示例
          />
        ))}
        <ThemedText           
          type="title"
          style={{ fontSize: 24, letterSpacing: 0.5 }}
                   lightColor={theme.colors.primary}
          darkColor={theme.colors.primary}>Explore</ThemedText>
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
  scrollContent: {
    padding: 8,
    // paddingBottom: 80,
  },
  cardStyle: {

  },
  title: {
    fontSize: 46,

  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});