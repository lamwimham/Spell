import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Card, Text, useTheme } from 'react-native-paper';
import IonIcons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import OctiIcons from 'react-native-vector-icons/Octicons';
type RootStackParamList = {
  MainTabs: { screen: string; params: { screen: string; params?: any } };
  // Add other routes here if needed
};
/**
 * Reusable component for displaying a single statistic item.
 * Adheres to MD3 typography and color scheme.
 */
const StatItem = ({
  mainValue,
  subValue,
  label,
}: {
  mainValue: string;
  subValue?: string;
  label: string;
}) => {
  const theme = useTheme();
  return (
    <View style={styles.statItem}>
      <View style={styles.statValueContainer}>
        <Text
          variant='headlineMedium'
          style={{ color: theme.colors.onSurface }}
        >
          {mainValue}
        </Text>
        {subValue && (
          <Text
            variant='labelSmall'
            style={[styles.miniText, { color: theme.colors.onSurfaceVariant }]}
          >
            {subValue}
          </Text>
        )}
      </View>
      <Text
        variant='labelMedium'
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        {label}
      </Text>
    </View>
  );
};

/**
 * Reusable component for displaying a single grid item (icon + title + optional description).
 * Adheres to MD3 typography and color scheme.
 */
const GridItem = ({
  title,
  desc,
  icon,
  onPress
}: {
  title: string;
  desc?: string;
  icon: React.ReactNode;
  onPress?: () => void;
}) => {
  const theme = useTheme();
  onPress = onPress? onPress: () => {console.log('GridItem pressed');};
  return (
    <View style={styles.gridItem}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: theme.colors.primaryContainer },
        ]}
      >
        {/*
          Fix: Cast icon to React.ReactElement with a generic props type that includes 'color'.
          This tells TypeScript that the element being cloned can accept a 'color' prop,
          resolving the "No overload matches this call" error.
        */}
        {React.cloneElement(icon as React.ReactElement<{ color?: string, onPress?: () => void }>, {
          color: theme.colors.onPrimaryContainer,
          onPress: onPress
        })}
      </View>
      <Text
        variant='labelMedium'
        style={[styles.gridTitle, { color: theme.colors.onSurface }]}
      >
        {title}
      </Text>
      {desc && (
        <Text
          variant='labelSmall'
          style={[
            styles.gridDescription,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          {desc}
        </Text>
      )}
    </View>
  );
};

/**
 * Main ProfileScreen component displaying user information, statistics, and various sections.
 * Follows MD3 design language.
 */
const ProfileScreen = () => {
  const theme = useTheme(); // Access theme for styling
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const handleCheckedIn = () => {
    navigation.navigate('MainTabs', {
      screen: 'Profile',
      params: {
        screen: 'CalendarPage',
      },
    });
  };
  return (
    <SafeAreaView
      style={[
        styles.safeAreaContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* User Information Area */}
        <Card
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface, elevation: 2 },
          ]}
        >
          <Card.Title
            title='Spell User'
            titleVariant='titleLarge'
            subtitle='5 Following 0 Followers'
            subtitleVariant='bodyMedium'
            left={(props) => (
              <Avatar.Text
                {...props}
                size={48}
                label='S'
                color={theme.colors.onPrimary}
                style={{ backgroundColor: theme.colors.primary }}
              />
            )}
            right={() => (
              <OctiIcons
                name='verified'
                size={24}
                style={{ paddingRight: 16 }}
                color={theme.colors.primary}
              />
            )}
          />
          <Card.Content>
            {/* Statistics Area */}
            <View style={styles.statsContainer}>
              <StatItem mainValue='439' label='Mana' />
              <StatItem mainValue='7' subValue='mins' label="Today's Study" />
              <StatItem mainValue='0' label='Badges' />
              <StatItem mainValue='1' label='Certificates' />
            </View>
          </Card.Content>
        </Card>

        {/* My Account Section */}
        <Card
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface, elevation: 2 },
          ]}
        >
          <Card.Title title='My Account' titleVariant='titleMedium' />
          <Card.Content>
            <View style={styles.grid}>
              {[
                {
                  title: 'Account',
                  desc: '0.00 Spell Coins',
                  icon: <IonIcons name='wallet-outline' size={24} />,
                },
                // {
                //   title: 'Vouchers',
                //   desc: 'Redemption Code/Coupons',
                //   icon: <IonIcons name='ticket-outline' size={24} />,
                // },
                // {
                //   title: 'Orders',
                //   icon: <IonIcons name='clipboard-outline' size={24} />,
                // },
                // {
                //   title: 'Cart',
                //   icon: <IonIcons name='cart-outline' size={24} />,
                // },
                {
                  title: 'VIP',
                  icon: (
                    <MaterialCommunityIcons name='crown-outline' size={24} />
                  ),
                },
                // {
                //   title: 'Like',
                //   icon: (
                //     <MaterialCommunityIcons name='thumb-up-outline' size={24} />
                //   ),
                // },
                // {
                //   title: 'Tickets',
                //   icon: <IonIcons name='ticket-outline' size={24} />,
                // },
                {
                  title: 'Points',
                  icon: <IonIcons name='gift-outline' size={24} />,
                },
              ].map((item, index) => (
                <GridItem key={index} {...item} />
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* My Content Section */}
        <Card
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface, elevation: 2 },
          ]}
        >
          <Card.Title title='My Content' titleVariant='titleMedium' />
          <Card.Content>
            <View style={styles.grid}>
              {[
                {
                  title: 'Notes',
                  icon: <IonIcons name='document-outline' size={24} />,
                },
                {
                  title: 'Study',
                  icon: <IonIcons name='book-outline' size={24} />,
                },
                // {
                //   title: 'Downloads',
                //   icon: <IonIcons name='download-outline' size={24} />,
                // },
                {
                  title: 'Favorites',
                  icon: <IonIcons name='heart-outline' size={24} />,
                },
                {
                  title: 'Check-In',
                  icon: <IonIcons name='calendar-outline' size={24} />,
                  onPress: () => {
                    navigation.navigate('MainTabs', {
                      screen: 'Profile',
                      params: {
                        screen: 'CalendarPage',
                      },
                    });
                  },
                },
                {
                  title: 'Notification', // Changed from 'Subscription Notifications'
                  icon: <IonIcons name='notifications-outline' size={24} />,
                },
              ].map((item, index) => (
                <GridItem key={index} {...item} />
              ))}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12, // MD3 recommends slightly larger rounded corners for cards
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8, // Reduced margin as StatItem has its own padding/spacing
    marginTop: 8, // Add some top margin for visual separation from title
  },
  statItem: {
    alignItems: 'center',
    paddingVertical: 4, // Add some vertical padding to stat items
  },
  statValueContainer: {
    flexDirection: 'row', // Arrange main value and sub value horizontally
    alignItems: 'flex-end', // Align them at the bottom
    marginBottom: 2, // Small margin below the value line
  },
  miniText: {
    fontSize: 14, // Slightly larger than labelSmall, but smaller than headlineMedium
    lineHeight: 24, // Match headlineMedium's line height for vertical alignment
    marginLeft: 4, // Small space between number and 'mins'
    // color: '#999', // This will be overridden by theme.colors.onSurfaceVariant
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start', // Keep left alignment
    gap: 8, // Spacing between grid items
  },
  gridItem: {
    width: '23%', // Adjusted for 4 columns with gap. (100% - 3*gap_width)/4
    alignItems: 'center', // This centers the icon container and text components horizontally
    marginBottom: 8, // Adjusted margin for consistency with gap
    paddingVertical: 8, // Add vertical padding for better touch target and spacing
  },
  iconContainer: {
    width: 56, // Fixed size for circular icon background
    height: 56,
    borderRadius: 28, // Half of width/height for perfect circle
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridTitle: {
    textAlign: 'center', // Ensure text content is centered
  },
  gridDescription: {
    textAlign: 'center', // Ensure text content is centered
  },
});

// The main App component that wraps the ProfileScreen with PaperProvider
export default ProfileScreen;
