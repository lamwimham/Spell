import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { memo, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  View
} from 'react-native';
import { Button, Card, Icon, Text, TextInput, useTheme } from 'react-native-paper';
import { SceneMap, TabBar, TabView } from 'react-native-tab-view';

// Constants for tab modes
const AI_MODE = 'AI生成';
const MANUAL_MODE = '手动输入';

type StackParamList = {
  [key:string]: any;
};

// 魔法咒语强度选项
const SPELL_STRENGTH_OPTIONS = [
  { label: '微弱', value: 1 },
  { label: '普通', value: 2 },
  { label: '强力', value: 3 },
  { label: '超强', value: 4 },
  { label: '传奇', value: 5 },
];

// 独立 AI 标签页组件
const AIRoute = memo(function AIRoute() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>();
  const [goal, setGoal] = useState('');
  const [selectedSpell, setSelectedSpell] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [strength, setStrength] = useState(3); // 默认中等强度

  // 示例咒语库
  const spells = [
    '愿星辰指引你前行的道路，梦想如月光般皎洁',
    '勇气之盾护你周全，智慧之剑斩断荆棘',
    '内心的平静如深潭，灵魂的火焰永不熄灭',
    '成功如影随形，机遇之门为你敞开',
    '爱如春风化雨，温暖你生命的每个角落',
  ];

  const handleGenerateSpell = useCallback(() => {
    if (!goal.trim()) return;
    
    setIsGenerating(true);
    Vibration.vibrate(50); // 震动反馈
    
    // 模拟AI生成延迟
    setTimeout(() => {
      const strengthFactor = strength / 5;
      const randomIndex = Math.floor(Math.random() * spells.length * strengthFactor);
      const randomSpell = spells[Math.min(randomIndex, spells.length - 1)];
      
      setSelectedSpell(randomSpell);
      setIsGenerating(false);
    }, 1500);
  }, [goal, strength]);

  // 处理发送咒语
  const handleSendSpell = useCallback(() => {
    if (goal && selectedSpell) {
      navigation.navigate('Spell', { 
        screen: 'RecordPage', 
        params: { title: goal, content: selectedSpell }
      });
    }
  }, [goal, selectedSpell, navigation]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.tabContainer, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card mode='contained' style={[styles.card, styles.magicCard]}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Icon source="wand" size={24} color={theme.colors.primary} />
              <Text variant='titleMedium' style={[styles.cardTitle, styles.magicTitle]}>
                用魔法实现愿望
              </Text>
            </View>
            
            <TextInput
              label='你的愿望'
              value={goal}
              onChangeText={setGoal}
              mode='outlined'
              style={styles.input}
              outlineStyle={styles.inputOutline}
              placeholder='例如：希望能顺利通过重要考试'
              placeholderTextColor={theme.colors.onSurfaceDisabled}
              multiline
              numberOfLines={2}
              right={<TextInput.Icon icon="lightbulb-on" color={theme.colors.primary} />}
            />

            <View style={styles.strengthContainer}>
              <Text variant='labelMedium' style={styles.strengthLabel}>
                咒语强度:
              </Text>
              <View style={styles.strengthOptions}>
                {SPELL_STRENGTH_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.strengthOption,
                      strength === option.value && styles.selectedStrengthOption
                    ]}
                    onPress={() => setStrength(option.value)}
                  >
                    <Text 
                      style={[
                        styles.strengthText,
                        strength === option.value && styles.selectedStrengthText
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button
              mode='contained'
              onPress={handleGenerateSpell}
              style={[styles.button, styles.magicButton]}
              labelStyle={styles.buttonLabel}
              contentStyle={styles.buttonContent}
              icon={isGenerating ? undefined : "auto-fix"}
              disabled={!goal.trim() || isGenerating}
            >
              {isGenerating ? (
                <View style={styles.generatingContainer}>
                  <ActivityIndicator size="small" color="#FFF" />
                  <Text style={styles.generatingText}>魔法生成中...</Text>
                </View>
              ) : (
                '生成咒语'
              )}
            </Button>

            {selectedSpell ? (
              <View style={styles.resultContainer}>
                <Text variant='titleSmall' style={styles.resultLabel}>
                  魔法咒语:
                </Text>
                <Card mode='contained' style={[styles.spellCard, styles.generatedSpellCard]}>
                  <Card.Content>
                    <Text variant='bodyLarge' style={styles.spellText}>
                      {selectedSpell}
                    </Text>
                  </Card.Content>
                </Card>

                <Button
                  mode='contained'
                  icon='send'
                  style={styles.sendButton}
                  labelStyle={styles.sendButtonLabel}
                  onPress={handleSendSpell}
                  contentStyle={styles.sendButtonContent}
                >
                  发送咒语
                </Button>
              </View>
            ) : (
              <View style={styles.placeholderContainer}>
                <Text variant='bodyMedium' style={styles.placeholderText}>
                  描述你的愿望，AI将为你生成专属魔法咒语
                </Text>
                {!goal.trim() && (
                  <Text variant='bodySmall' style={styles.tipText}>
                    ✨ 提示：愿望描述越具体，咒语效果越好
                  </Text>
                )}
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

// 独立 Manual 标签页组件
const ManualRoute = memo(function ManualRoute() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>();
  const [goal, setGoal] = useState('');
  const [manualSpells, setManualSpells] = useState('');

  // 处理发送咒语
  const handleSendSpell = useCallback(() => {
    if (goal && manualSpells) {
      navigation.navigate('Spell', { 
        screen: 'RecordPage', 
        params: { title: goal, content: manualSpells }
      });
    }
  }, [goal, manualSpells, navigation]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.tabContainer, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card mode='contained' style={[styles.card, styles.spellBookCard]}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Icon source="book-open" size={24} color={theme.colors.primary} />
              <Text variant='titleMedium' style={[styles.cardTitle, styles.spellBookTitle]}>
                亲手书写咒语
              </Text>
            </View>

            <TextInput
              label='愿望主题'
              value={goal}
              onChangeText={setGoal}
              mode='outlined'
              style={styles.input}
              outlineStyle={styles.inputOutline}
              placeholder='例如：希望项目成功上线'
              placeholderTextColor={theme.colors.onSurfaceDisabled}
            />

            <TextInput
              label='咒语内容'
              value={manualSpells}
              onChangeText={setManualSpells}
              mode='outlined'
              multiline
              numberOfLines={6}
              style={[styles.input, styles.multilineInput]}
              outlineStyle={styles.inputOutline}
              placeholder='在此书写你的魔法咒语...'
              placeholderTextColor={theme.colors.onSurfaceDisabled}
            />

            <View style={styles.tipContainer}>
              <Text variant='bodySmall' style={styles.tipText}>
                📜 咒语书写技巧:
              </Text>
              <Text variant='bodySmall' style={styles.tipItem}>
                • 使用正面肯定的语言（如&quot;我将成功&quot;而非&quot;我不会失败&quot;）
              </Text>
              <Text variant='bodySmall' style={styles.tipItem}>
                • 包含具体目标和情感词汇
              </Text>
              <Text variant='bodySmall' style={styles.tipItem}>
                • 保持简洁有力，最好在3行以内
              </Text>
            </View>

            <Button
              mode='contained'
              style={styles.sendButton}
              icon='send'
              disabled={!goal.trim() || !manualSpells.trim()}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              onPress={handleSendSpell}
            >
              发送咒语
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
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
      {/* <View style={styles.header}>
        <Text variant='headlineMedium' style={[styles.title, { color: theme.colors.primary }]}>
          魔法咒语工坊
        </Text>
        <Text variant='bodyMedium' style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          用咒语为你的愿望注入魔力
        </Text>
      </View> */}
      
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
              borderRadius: 2,
            }}
            style={{
              backgroundColor: theme.colors.surface,
              marginHorizontal: 16,
              marginBottom: 16,
              borderRadius: 16,
              overflow: 'hidden',
              elevation: 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
            tabStyle={{
              paddingVertical: 8,
              height: 48,
            }}
            pressColor={theme.colors.primaryContainer}
            // renderLabel={({ route, focused, color }) => (
            //   <View style={styles.tabLabelContainer}>
            //     {route.key === 'ai' ? (
            //       <Icon 
            //         source="wand"
            //         size={20}
            //         color={focused ? theme.colors.primary : theme.colors.onSurfaceVariant}
            //       />
            //     ) : (
            //       <Icon 
            //         source="book-open"
            //         size={20}
            //         color={focused ? theme.colors.primary : theme.colors.onSurfaceVariant}
            //       />
            //     )}
            //     <Text 
            //       style={[
            //         styles.tabLabelText, 
            //         { 
            //           color,
            //           fontWeight: focused ? 'bold' : 'normal',
            //           marginLeft: 8
            //         }
            //       ]}
            //     >
            //       {route.title}
            //     </Text>
            //   </View>
            // )}
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
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
  },
  magicCard: {
    borderTopWidth: 4,
    borderTopColor: '#7E57C2',
  },
  spellBookCard: {
    borderTopWidth: 4,
    borderTopColor: '#4CAF50',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    marginLeft: 12,
    fontWeight: 'bold',
  },
  magicTitle: {
    color: '#7E57C2',
  },
  spellBookTitle: {
    color: '#4CAF50',
  },
  input: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  inputOutline: {
    borderRadius: 12,
  },
  multilineInput: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
  button: {
    borderRadius: 14,
    marginTop: 8,
  },
  magicButton: {
    backgroundColor: '#7E57C2',
  },
  buttonContent: {
    height: 50,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: 24,
  },
  resultLabel: {
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#5E35B1',
  },
  spellCard: {
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  generatedSpellCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#7E57C2',
  },
  spellText: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
    color: '#5E35B1',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  placeholderText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  sendButton: {
    borderRadius: 14,
    marginTop: 16,
    backgroundColor: '#5E35B1',
  },
  sendButtonLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  sendButtonContent: {
    height: 50,
  },
  strengthContainer: {
    marginBottom: 20,
  },
  strengthLabel: {
    marginBottom: 10,
    fontWeight: 'bold',
    color: '#5E35B1',
  },
  strengthOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  strengthOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1C4E9',
    marginBottom: 10,
  },
  selectedStrengthOption: {
    backgroundColor: '#7E57C2',
    borderColor: '#7E57C2',
  },
  strengthText: {
    color: '#7E57C2',
  },
  selectedStrengthText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tipContainer: {
    backgroundColor: 'rgba(126, 87, 194, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  tipText: {
    marginBottom: 8,
    color: '#5E35B1',
  },
  tipItem: {
    marginLeft: 8,
    marginBottom: 4,
    color: '#5E35B1',
    opacity: 0.8,
  },
  tabLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabelText: {
    fontSize: 16,
  },
  generatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatingText: {
    marginLeft: 8,
    color: '#FFF',
    fontWeight: 'bold',
  }
});

export default SpellPage;