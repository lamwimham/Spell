// /src/app/main/not-found/page.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>404 - 页面未找到</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: 'red',
  },
});