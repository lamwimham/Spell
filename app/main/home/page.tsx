// HomePage.tsx
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Button, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { RootState } from '@/store';
import { Spell } from '../../../store/spellSlice';
type RootStackParamList = {
  MainTabs: { screen: string, params: {screen: string} };
  // Add other routes here if needed
};

export default function HomePage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // const dispatch = useDispatch();

  // 从 Redux 获取咒语列表
  const spells = useSelector((state: RootState) => state.spellsReducer.spells);

const handleCreateNewSpell = () => {
  navigation.navigate('MainTabs', {
    screen: 'Spell',
    params: {
      screen: 'SpellPage',
    },
  });
};

  const handleViewSpell = (spell: Spell) => {
    // 可选：跳转到详情页
    // navigation.navigate('SpellDetailPage', { spellId: spell.id });
  };

  return (
    <ThemedView style={styles.container}>
      {spells.length === 0 ? (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>You haven&apos;t created any spells yet</ThemedText>
          <Button title="Create Your First Spell" onPress={handleCreateNewSpell} />
        </ThemedView>
      ) : (
        <FlatList
          data={spells}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.spellItem} onPress={() => handleViewSpell(item)}>
              <ThemedText style={styles.spellName}>{item.name}</ThemedText>
              <ThemedText>{item.description}</ThemedText>
            </TouchableOpacity>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 16,
  },
  spellItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  spellName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});