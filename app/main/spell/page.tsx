import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { StyleSheet } from 'react-native';
import MainLayout from '../layout';
export default function SpellPage() {
  return (
    <MainLayout>
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>SpellPage</ThemedText>
      </ThemedView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
