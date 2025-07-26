import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, FAB, Searchbar, Text, useTheme } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// 为了类型安全，推荐使用 typed hooks
import AudioPlayerDrawer from '@/components/AudioPlayerDrawer';
import { AppDispatch, RootState } from '@/store';

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch: () => AppDispatch = useDispatch;

type RootStackParamList = {
  MainTabs: { screen: string; params: { screen: string; params?: any } };
};

// 定义卡片数据类型
interface SpellCardProps {
  duration: string;
  location: string;
  title: string;
  onPlayPress?: () => void;
}

// 可复用的卡片组件
const SpellCard = ({ duration, location, title, onPlayPress }: SpellCardProps) => {
  const theme = useTheme();

  return (
    <Card
      style={[
        styles.card,
        { backgroundColor: theme.colors.elevation.level1 },
      ]}
    >
      <Card.Title
        title={duration}
        titleStyle={[
          theme.fonts.labelSmall,
          { color: theme.colors.onSurfaceDisabled },
        ]}
        subtitleStyle={[theme.fonts.labelLarge]}
        subtitle={title}
        right={(props) => (
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
            onPress={onPlayPress}
          >
            <Ionicons
              {...props}
              name="play-circle-outline"
              size={32}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        )}
      />
      <Card.Content>
        <Text
          variant="titleLarge"
          numberOfLines={2}
          ellipsizeMode="tail"
          style={[
            theme.fonts.bodyMedium,
            { color: theme.colors.onSurface },
          ]}
        >
          {location}
        </Text>
      </Card.Content>
    </Card>
  );
};

export default function HomePage() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [selectedSpellId, setSelectedSpellId] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const spells = useAppSelector((state) => state.spellsReducer.spells); // 从 store 中读取 spells 列表

  const spellCard = spells.map(item => {
    return {
      id: item.id,
      duration: item.createdAt,
      location: item.description,
      title: item.name,
      uri: item.uri,
    }
  })
  // 卡片数据数组
  const spellCards = spellCard;

  const handleCreateNewSpell = () => {
    navigation.navigate('MainTabs', {
      screen: 'Spell',
      params: { screen: 'SpellPage' },
    });
  };

  const closePlayer = () => {
    setIsPlayerVisible(false);
  };

  const handlePlayPress = (cardId: string) => {
    setSelectedSpellId(cardId);
    setIsPlayerVisible(true);
    // navigation.navigate('MainTabs', {
    //   screen: 'Spell',
    //   params: { screen: 'RecordPage', params: {
    //     spellId: cardId,
    //   }},
    // });
  };

  return (
    <SafeAreaView style={[{ backgroundColor: theme.colors.background }, styles.container]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Searchbar
          placeholder="Search"
          placeholderTextColor={theme.colors.onSurfaceDisabled}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        {spellCards.map((card) => (
          <SpellCard
            key={card.id}
            duration={card.duration}
            location={card.location}
            title={card.title}
            onPlayPress={() => handlePlayPress(card.id)}
          />
        ))}
      </ScrollView>
      <AudioPlayerDrawer 
        spellId={selectedSpellId}
        visible={isPlayerVisible}
        onClose={closePlayer}
      />

      <FAB
        style={styles.fab}
        icon={() => (
          <Ionicons name="sparkles" size={24} color={theme.colors.onSurface} />
        )}
        onPress={handleCreateNewSpell}
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
    paddingBottom: 80,
  },
  searchbar: {
    margin: 8,
  },
  card: {
    marginVertical: 16,
    marginHorizontal: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});