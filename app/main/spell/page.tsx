import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { memo, useCallback, useState } from 'react';
import { Dimensions, SafeAreaView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput, useTheme } from 'react-native-paper';
import { SceneMap, TabBar, TabView } from 'react-native-tab-view';

// Constants for tab modes
const AI_MODE = 'AI Mode';
const MANUAL_MODE = 'Manual Mode';
type StackParamList = {
  [key:string]: any;
};
// 独立 AI 标签页组件
const AIRoute = memo(function AIRoute() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>();
  const [goal, setGoal] = useState('');
  const [selectedSpell, setSelectedSpell] = useState('');

  const handleGenerateSpell = useCallback(() => {
    const spells = [
      'May your dreams shine like stars',
      'May courage always be with you',
      'May you find inner peace',
      'May success follow you like a shadow',
      'May love guide your path',
    ];
    const randomSpell = spells[Math.floor(Math.random() * spells.length)];
    setSelectedSpell(randomSpell);
  }, []);

  // 处理发送咒语
  const handleSendSpell = useCallback(() => {
    if (goal && selectedSpell) {
      // 导航到 SendSpell 页面并传递参数
      navigation.navigate('Spell', { screen: 'RecordPage', 
          params: {
            title:goal,
            content:selectedSpell
        }
      });
    }
  }, [goal, selectedSpell, navigation]);

  return (
    <View style={[styles.tabContainer, { backgroundColor: theme.colors.background }]}>
      <Card mode='contained' style={styles.card}>
        <Card.Content>
          <Text variant='titleMedium' style={styles.cardTitle}>
            Enter Your Wish
          </Text>
          <TextInput
            label='Wish'
            value={goal}
            onChangeText={setGoal}
            mode='outlined'
            style={styles.input}
            outlineStyle={styles.inputOutline}
            placeholder='e.g., Hope to pass the exam smoothly'
            placeholderTextColor={theme.colors.onSurfaceDisabled}
            right={<TextInput.Icon icon='lightbulb-on' />}
          />

          <Button
            mode='contained'
            onPress={handleGenerateSpell}
            style={styles.button}
            labelStyle={styles.buttonLabel}
            contentStyle={styles.buttonContent}
            icon='auto-fix'
            disabled={!goal.trim()}
          >
            Generate Spell
          </Button>

          {selectedSpell ? (
            <View style={styles.resultContainer}>
              <Text variant='titleSmall' style={styles.resultLabel}>
                Generated Spell:
              </Text>
              <Card mode='contained' style={styles.spellCard}>
                <Card.Content>
                  <Text variant='bodyLarge' style={styles.spellText}>
                    {selectedSpell}
                  </Text>
                </Card.Content>
              </Card>

              <Button
                mode='elevated'
                icon='send'
                style={styles.sendButton}
                labelStyle={styles.sendButtonLabel}
                onPress={handleSendSpell} // 添加点击事件
              >
                Send Spell
              </Button>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Text variant='bodyMedium' style={styles.placeholderText}>
                Enter your wish, and AI will generate a personalized spell for you
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );
});

// 独立 Manual 标签页组件
const ManualRoute = memo(function ManualRoute() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>();
  const [goal, setGoal] = useState('');
  const [manualSpells, setManualSpells] = useState('');

  // 处理发送咒语
  // 处理发送咒语
  const handleSendSpell = useCallback(() => {
    if (goal && manualSpells) {
      // 导航到 SendSpell 页面并传递参数
      navigation.navigate('Spell', { screen: 'RecordPage', 
          params: {
            title:goal,
            content:manualSpells
        }
      });
    }
  }, [goal, manualSpells, navigation]);

  return (
    <View style={[styles.tabContainer, { backgroundColor: theme.colors.background }]}>
      <Card mode='contained' style={styles.card}>
        <Card.Content>
          <Text variant='titleMedium' style={styles.cardTitle}>
            Manually Create Spell
          </Text>

          <TextInput
            label='Wish'
            value={goal}
            onChangeText={setGoal}
            mode='outlined'
            style={styles.input}
            outlineStyle={styles.inputOutline}
            placeholder='e.g., Hope the project launches successfully'
            placeholderTextColor={theme.colors.onSurfaceDisabled}
          />

          <TextInput
            label='Custom Spell'
            value={manualSpells}
            onChangeText={setManualSpells}
            mode='outlined'
            multiline
            numberOfLines={4}
            style={[styles.input, styles.multilineInput]}
            outlineStyle={styles.inputOutline}
            placeholder='Enter your custom spell...'
            placeholderTextColor={theme.colors.onSurfaceDisabled}
          />

          <View style={styles.buttonGroup}>
            <View style={styles.buttonWrapper}>
              <Button
                mode='contained'
                style={styles.button}
                icon='send'
                disabled={!goal.trim() || !manualSpells.trim()}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                onPress={handleSendSpell} // 添加点击事件
              >
                Send Spell
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
});

const SpellPage = () => {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'ai', title: AI_MODE },
    { key: 'manual', title: MANUAL_MODE },
  ]);

  // 使用 useMemo 缓存场景映射
  const renderScene = React.useMemo(
    () =>
      SceneMap({
        ai: AIRoute,
        manual: ManualRoute,
      }),
    []
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: Dimensions.get('window').width }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            activeColor={theme.colors.primary}
            inactiveColor={theme.colors.onSurfaceVariant}
            indicatorStyle={{
              backgroundColor: theme.colors.primary,
              height: 3,
            }}
            style={{
              backgroundColor: theme.colors.surface,
              elevation: 1,
              marginHorizontal: 16,
              marginBottom: 16,
              borderRadius: 16,
              overflow: 'hidden',
            }}
            tabStyle={{
              paddingVertical: 8,
              height: 48,
            }}
            pressColor={theme.colors.primaryContainer}
            contentContainerStyle={{
              justifyContent: 'center',
            }}
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.8,
  },
  tabContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 20,
  },
  inputOutline: {
    borderRadius: 12,
  },
  multilineInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    flexDirection: 'row',
    marginTop: 8,
  },
  buttonWrapper: {
    flex: 1,
  },
  buttonSpacer: {
    width: 12,
  },
  outlineButton: {
    borderRadius: 12,
    borderWidth: 1.5,
    width: '100%',
  },
  button: {
    borderRadius: 12,
    width: '100%',
  },
  buttonContent: {
    height: 48,
  },
  buttonLabel: {
    fontSize: 16,
  },
  resultContainer: {
    marginTop: 24,
  },
  resultLabel: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  spellCard: {
    backgroundColor: 'rgba(98, 0, 238, 0.05)',
    borderColor: 'rgba(98, 0, 238, 0.2)',
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 16,
  },
  spellText: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
    color: '#6200ee',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  placeholderText: {
    textAlign: 'center',
    opacity: 0.6,
  },
  sendButton: {
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  sendButtonLabel: {
    color: '#6200ee',
    fontWeight: 'bold',
  },
});

export default SpellPage;