import React from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import * as Icons from './index';

const IconLibraryDemo: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Icon Library Demo</Text>

      <View style={styles.iconRow}>
        <View style={styles.iconItem}>
          <Icons.Icon1 size={24} />
          <Text style={styles.label}>Icon1</Text>
        </View>

        <View style={styles.iconItem}>
          <Icons.Icon2 size={24} />
          <Text style={styles.label}>Icon2</Text>
        </View>

        <View style={styles.iconItem}>
          <Icons.Icon3 size={24} />
          <Text style={styles.label}>Icon3</Text>
        </View>

        <View style={styles.iconItem}>
          <Icons.Icon4 size={24} />
          <Text style={styles.label}>Icon4</Text>
        </View>
      </View>

      <View style={styles.iconRow}>
        <View style={styles.iconItem}>
          <Icons.Icon1 size={32} color="#007AFF" />
          <Text style={styles.label}>Blue</Text>
        </View>

        <View style={styles.iconItem}>
          <Icons.Icon2 size={32} color="#34C759" />
          <Text style={styles.label}>Green</Text>
        </View>

        <View style={styles.iconItem}>
          <Icons.Icon3 size={32} color="#FF3B30" />
          <Text style={styles.label}>Red</Text>
        </View>

        <View style={styles.iconItem}>
          <Icons.Icon4 size={32} color="#FF9500" />
          <Text style={styles.label}>Orange</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  iconItem: {
    alignItems: 'center',
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
});

export default IconLibraryDemo;
