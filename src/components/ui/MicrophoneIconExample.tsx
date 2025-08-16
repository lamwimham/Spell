import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MicrophoneIcon from './SearchIcon'; // 注意：文件名还是SearchIcon但导出的是MicrophoneIcon

const MicrophoneIconExample: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>麦克风图标示例</Text>

      <View style={styles.iconRow}>
        <View style={styles.iconItem}>
          <MicrophoneIcon size={16} />
          <Text style={styles.label}>小号 (16px)</Text>
        </View>

        <View style={styles.iconItem}>
          <MicrophoneIcon size={24} />
          <Text style={styles.label}>默认 (24px)</Text>
        </View>

        <View style={styles.iconItem}>
          <MicrophoneIcon size={32} />
          <Text style={styles.label}>大号 (32px)</Text>
        </View>
      </View>

      <View style={styles.iconRow}>
        <View style={styles.iconItem}>
          <MicrophoneIcon size={24} color="#007AFF" />
          <Text style={styles.label}>蓝色</Text>
        </View>

        <View style={styles.iconItem}>
          <MicrophoneIcon size={24} color="#34C759" />
          <Text style={styles.label}>绿色</Text>
        </View>

        <View style={styles.iconItem}>
          <MicrophoneIcon size={24} color="#FF3B30" />
          <Text style={styles.label}>红色</Text>
        </View>
      </View>
    </View>
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

export default MicrophoneIconExample;
