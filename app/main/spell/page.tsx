import React, { useState } from 'react';
import { Dimensions, SafeAreaView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput, useTheme } from 'react-native-paper';
import { SceneMap, TabBar, TabView } from 'react-native-tab-view';

// Constants for tab modes
const AI_MODE = 'AI Mode';
const MANUAL_MODE = 'Manual Mode';
const DRAFT_MODE = 'Drafts';

const SpellPage = () => {
  const theme = useTheme(); // Access theme from React Native Paper
  const [index, setIndex] = useState(0); // State for current tab index
  const [routes] = useState([
    // Tab routes configuration
    { key: 'ai', title: AI_MODE },
    { key: 'manual', title: MANUAL_MODE },
    { key: 'draft', title: DRAFT_MODE },
  ]);

  const [goal, setGoal] = useState(''); // State for user's wish/goal
  const [manualSpells, setManualSpells] = useState(''); // State for manually entered spells
  const [selectedSpell, setSelectedSpell] = useState(''); // State for AI-generated spell

  /**
   * Handles the generation of a spell using a simulated AI.
   * Selects a random spell from a predefined list.
   */
  const handleGenerateSpell = () => {
    // Simulate AI-generated spells
    const spells = [
      'May your dreams shine like stars',
      'May courage always be with you',
      'May you find inner peace',
      'May success follow you like a shadow',
      'May love guide your path',
    ];
    const randomSpell = spells[Math.floor(Math.random() * spells.length)];
    setSelectedSpell(randomSpell);
  };

  /**
   * AI Mode tab content component.
   * Allows users to input a wish and generate a spell using AI.
   */
  const AIRoute = () => (
    <View
      style={[
        styles.tabContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <Card mode='contained' style={styles.card}>
        <Card.Content>
          <Text variant='titleMedium' style={styles.cardTitle}>
            Enter Your Wish
          </Text>
          <TextInput
            label='Wish Description'
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
            disabled={!goal.trim()} // Disable button if goal is empty
          >
            Generate Spell
          </Button>

          {selectedSpell ? ( // Show generated spell if available
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
              >
                Send Spell
              </Button>
            </View>
          ) : (
            // Show placeholder text if no spell is generated
            <View style={styles.placeholderContainer}>
              <Text variant='bodyMedium' style={styles.placeholderText}>
                Enter your wish, and AI will generate a personalized spell for
                you
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );

  /**
   * Manual Mode tab content component.
   * Allows users to manually create and save/send spells.
   */
  /**
   * Manual Mode tab content component.
   * Allows users to manually create and save/send spells.
   */
  const ManualRoute = () => (
    <View
      style={[
        styles.tabContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <Card mode='contained' style={styles.card}>
        <Card.Content>
          <Text variant='titleMedium' style={styles.cardTitle}>
            Manually Create Spell
          </Text>

          <TextInput
            label='Wish Description'
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

          {/* 修改后的按钮组 - 确保水平对齐 */}
          <View style={styles.buttonGroup}>
            <View style={styles.buttonWrapper}>
              <Button
                mode='outlined'
                style={styles.outlineButton}
                icon='content-save'
                onPress={() => console.log('Save draft')}
              >
                Save Draft
              </Button>
            </View>

            <View style={styles.buttonSpacer} />

            <View style={styles.buttonWrapper}>
              <Button
                mode='contained'
                style={styles.button}
                icon='send'
                disabled={!goal.trim() || !manualSpells.trim()}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Send Spell
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>
    </View>
  );

  /**
   * Drafts tab content component.
   * Shows recording functionality and a sample draft.
   */
  const DraftRoute = () => (
    <View
      style={[
        styles.tabContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <Card mode='contained' style={styles.draftCard}>
        <Card.Title
          title='Draft Example'
          titleVariant='titleSmall'
          left={(props) => (
            <Text {...props} style={styles.draftIcon}>
              📝
            </Text>
          )}
        />
        <Card.Content>
          <Text variant='bodyMedium' style={styles.draftText}>
            &quot;May this interview go smoothly, allowing me to show my best
            self.&rdquo;
          </Text>
          <Text variant='bodySmall' style={styles.draftDate}>
            October 15, 2023
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button mode='text' icon='play-circle-outline'>
            Play
          </Button>
          <Button mode='text' icon='delete' textColor={theme.colors.error}>
            Delete
          </Button>
        </Card.Actions>
      </Card>
      <Card mode='contained' style={styles.draftCard}>
        <Card.Title
          title='Draft Example'
          titleVariant='titleSmall'
          left={(props) => (
            <Text {...props} style={styles.draftIcon}>
              📝
            </Text>
          )}
        />
        <Card.Content>
          <Text variant='bodyMedium' style={styles.draftText}>
            &quot;May this interview go smoothly, allowing me to show my best
            self.&rdquo;
          </Text>
          <Text variant='bodySmall' style={styles.draftDate}>
            October 15, 2023
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button mode='text' icon='play-circle-outline'>
            Play
          </Button>
          <Button mode='text' icon='delete' textColor={theme.colors.error}>
            Delete
          </Button>
        </Card.Actions>
      </Card>
      <Card mode='contained' style={styles.draftCard}>
        <Card.Title
          title='Draft Example'
          titleVariant='titleSmall'
          left={(props) => (
            <Text {...props} style={styles.draftIcon}>
              📝
            </Text>
          )}
        />
        <Card.Content>
          <Text variant='bodyMedium' style={styles.draftText}>
            &quot;May this interview go smoothly, allowing me to show my best
            self.&rdquo;
          </Text>
          <Text variant='bodySmall' style={styles.draftDate}>
            October 15, 2023
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button mode='text' icon='play-circle-outline'>
            Play
          </Button>
          <Button mode='text' icon='delete' textColor={theme.colors.error}>
            Delete
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );

  // SceneMap for TabView to render different components for each tab
  const renderScene = SceneMap({
    ai: AIRoute,
    manual: ManualRoute,
    draft: DraftRoute,
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>Magic Spell Generator</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>Manifest Your Wishes with Spells</Text>
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
            // labelStyle={{ // Keeping this commented as it was in original code
            //   fontWeight: 'bold',
            //   textTransform: 'none',
            // }}
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
  // button: {
  //   borderRadius: 12,
  //   marginTop: 8,
  // },
  // buttonContent: {
  //   height: 48,
  // },
  // buttonLabel: {
  //   fontSize: 16,
  // },
  // outlineButton: {
  //   borderRadius: 12,
  //   borderWidth: 1.5,
  // },
  // buttonGroup: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   marginTop: 8,
  //   gap: 12,
  // },
  

  //..
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
  recordingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  recordingIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  recordingText: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recordingTime: {
    marginBottom: 24,
    opacity: 0.7,
  },
  recordingButton: {
    borderRadius: 12,
  },
  recordingButtonContent: {
    height: 48,
  },
  draftContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  draftPlaceholder: {
    marginBottom: 24,
    opacity: 0.6,
  },
  recordButton: {
    borderRadius: 12,
    width: '100%',
  },
  recordButtonContent: {
    height: 48,
  },
  draftCard: {
    borderRadius: 16,
    marginTop: 8,
  },
  draftIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  draftText: {
    marginBottom: 4,
  },
  draftDate: {
    opacity: 0.6,
  },
});

export default SpellPage;
