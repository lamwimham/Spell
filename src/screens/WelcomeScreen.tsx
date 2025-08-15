import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, StatusBar } from 'react-native';

const WelcomeScreen = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.title}>欢迎使用 SpellApp</Text>
        <Text style={styles.subtitle}>您的个人学习助手</Text>
      </View>
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>SpellApp</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.description}>SpellApp帮助您提高学习效率，随时随地学习新知识</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>开始使用</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#3A3A3C',
    marginBottom: 20,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#E1F5FE',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  footer: {
    padding: 30,
    alignItems: 'center',
  },
  description: {
    fontSize: 16,
    color: '#3A3A3C',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default WelcomeScreen;
