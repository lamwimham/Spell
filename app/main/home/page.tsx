import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, FAB, Searchbar, Text, useTheme } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
type RootStackParamList = {
  MainTabs: { screen: string; params: { screen: string; params?: any } };
  // Add other routes here if needed
};
export default function HomePage() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const handleCreateNewSpell = () => {
    navigation.navigate('MainTabs', {
      screen: 'Spell',
      params: {
        screen: 'PosterPage',
      },
    });
  };
  return (
    <SafeAreaView
      style={[{ backgroundColor: theme.colors.background }, styles.container]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false} // 可选：隐藏滚动条
      >
        <Searchbar
          placeholder='Search'
          placeholderTextColor={theme.colors.onSurfaceDisabled}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchbar]}
        />
        {/* <ThemedText style={styles.title}>CalendarPage</ThemedText> */}
        <Card
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.elevation.level1,
            },
          ]}
        >
          <Card.Title
            title='duration: 10:41'
            titleStyle={[
              theme.fonts.labelSmall,
              { color: theme.colors.onSurfaceDisabled },
            ]}
            subtitleStyle={[theme.fonts.labelLarge]}
            subtitle='Heath Club'
            right={(props) => (
              <TouchableOpacity
                hitSlop={{top:10, bottom:10, left: 10, right:10}}
                activeOpacity={1}
                style={{ backgroundColor: 'transparent' }}
                onPress={() => {console.log('share')}}
              >
                <Ionicons
                  {...props}
                  name='play-circle-outline'
                  size={32}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            )}
          />
          <Card.Content>
            <Text
              variant='titleLarge'
              selectionColor={theme.colors.primary}
              numberOfLines={2}
              ellipsizeMode='tail'
              style={[
                theme.fonts.bodyMedium,
                {
                  color: theme.colors.onSurface,
                },
              ]}
            >
              Card title: Morning Fitness Routine — duration: 10:41. This
              session includes warm-up, strength training, and cool-down
              exercises. Performed at the Heath Club with a personal trainer.{' '}
            </Text>
          </Card.Content>
        </Card>
        <Card
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.elevation.level1,
            },
          ]}
        >
          <Card.Title
            title='duration: 10:41'
            titleStyle={[
              theme.fonts.labelSmall,
              { color: theme.colors.onSurfaceDisabled },
            ]}
            subtitleStyle={[theme.fonts.labelLarge]}
            subtitle='Heath Club'
            right={(props) => (
              <TouchableOpacity
                hitSlop={{top:10, bottom:10, left: 10, right:10}}
                activeOpacity={1}
                style={{ backgroundColor: 'transparent' }}
                onPress={() => {console.log('share')}}
              >
                <Ionicons
                  {...props}
                  name='play-circle-outline'
                  size={32}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            )}
          />
          <Card.Content>
            <Text
              variant='titleLarge'
              selectionColor={theme.colors.primary}
              numberOfLines={2}
              ellipsizeMode='tail'
              style={[
                theme.fonts.bodyMedium,
                {
                  color: theme.colors.onSurface,
                },
              ]}
            >
              Card title,Card titleCard titleCard titleCard{' '}
            </Text>
          </Card.Content>
        </Card>
        <Card
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.elevation.level1,
            },
          ]}
        >
          <Card.Title
            title='duration: 10:41'
            titleStyle={[
              theme.fonts.labelSmall,
              { color: theme.colors.onSurfaceDisabled },
            ]}
            subtitleStyle={[theme.fonts.labelLarge]}
            subtitle='Heath Club'
            right={(props) => (
              <TouchableOpacity
                hitSlop={{top:10, bottom:10, left: 10, right:10}}
                activeOpacity={1}
                style={{ backgroundColor: 'transparent' }}
                onPress={() => {console.log('share')}}
              >
                <Ionicons
                  {...props}
                  name='play-circle-outline'
                  size={32}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            )}
          />
          <Card.Content>
            <Text
              variant='titleLarge'
              selectionColor={theme.colors.primary}
              numberOfLines={2}
              ellipsizeMode='tail'
              style={[
                theme.fonts.bodyMedium,
                {
                  color: theme.colors.onSurface,
                },
              ]}
            >
              Card title,Card titleCard titleCard titleCard{' '}
            </Text>
          </Card.Content>
        </Card>
        <Card
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.elevation.level1,
            },
          ]}
        >
          <Card.Title
            title='duration: 10:41'
            titleStyle={[
              theme.fonts.labelSmall,
              { color: theme.colors.onSurfaceDisabled },
            ]}
            subtitleStyle={[theme.fonts.labelLarge]}
            subtitle='Heath Club'
            right={(props) => (
              <TouchableOpacity
                hitSlop={{top:10, bottom:10, left: 10, right:10}}
                activeOpacity={1}
                style={{ backgroundColor: 'transparent' }}
                onPress={() => {console.log('share')}}
              >
                <Ionicons
                  {...props}
                  name='play-circle-outline'
                  size={32}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            )}
          />
          <Card.Content>
            <Text
              variant='titleLarge'
              selectionColor={theme.colors.primary}
              numberOfLines={2}
              ellipsizeMode='tail'
              style={[
                theme.fonts.bodyMedium,
                {
                  color: theme.colors.onSurface,
                },
              ]}
            >
              Card title,Card titleCard titleCard titleCard{' '}
            </Text>
          </Card.Content>
        </Card>
        <Card
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.elevation.level1,
            },
          ]}
        >
          <Card.Title
            title='duration: 10:41'
            titleStyle={[
              theme.fonts.labelSmall,
              { color: theme.colors.onSurfaceDisabled },
            ]}
            subtitleStyle={[theme.fonts.labelLarge]}
            subtitle='Heath Club'
            right={(props) => (
              <TouchableOpacity
                hitSlop={{top:10, bottom:10, left: 10, right:10}}
                activeOpacity={1}
                style={{ backgroundColor: 'transparent' }}
                onPress={() => {console.log('share')}}
              >
                <Ionicons
                  {...props}
                  name='play-circle-outline'
                  size={32}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            )}
          />
          <Card.Content>
            <Text
              variant='titleLarge'
              selectionColor={theme.colors.primary}
              numberOfLines={2}
              ellipsizeMode='tail'
              style={[
                theme.fonts.bodyMedium,
                {
                  color: theme.colors.onSurface,
                },
              ]}
            >
              Card title,Card titleCard titleCard titleCard{' '}
            </Text>
          </Card.Content>
        </Card>
        <Card
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.elevation.level1,
            },
          ]}
        >
          <Card.Title
            title='duration: 10:41'
            titleStyle={[
              theme.fonts.labelSmall,
              { color: theme.colors.onSurfaceDisabled },
            ]}
            subtitleStyle={[theme.fonts.labelLarge]}
            subtitle='Heath Club'
            right={(props) => (
              <TouchableOpacity
                hitSlop={{top:10, bottom:10, left: 10, right:10}}
                activeOpacity={1}
                style={{ backgroundColor: 'transparent' }}
                onPress={() => {console.log('share')}}
              >
                <Ionicons
                  {...props}
                  name='play-circle-outline'
                  size={32}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            )}
          />
          <Card.Content>
            <Text
              variant='titleLarge'
              selectionColor={theme.colors.primary}
              numberOfLines={2}
              ellipsizeMode='tail'
              style={[
                theme.fonts.bodyMedium,
                {
                  color: theme.colors.onSurface,
                },
              ]}
            >
              Card title,Card titleCard titleCard titleCard{' '}
            </Text>
          </Card.Content>
        </Card>
        <Card
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.elevation.level1,
            },
          ]}
        >
          <Card.Title
            title='duration: 10:41'
            titleStyle={[
              theme.fonts.labelSmall,
              { color: theme.colors.onSurfaceDisabled },
            ]}
            subtitleStyle={[theme.fonts.labelLarge]}
            subtitle='Heath Club'
            right={(props) => (
              <TouchableOpacity
                hitSlop={{top:10, bottom:10, left: 10, right:10}}
                activeOpacity={1}
                style={{ backgroundColor: 'transparent' }}
                onPress={() => {console.log('share')}}
              >
                <Ionicons
                  {...props}
                  name='play-circle-outline'
                  size={32}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            )}
          />
          <Card.Content>
            <Text
              variant='titleLarge'
              selectionColor={theme.colors.primary}
              numberOfLines={2}
              ellipsizeMode='tail'
              style={[
                theme.fonts.bodyMedium,
                {
                  color: theme.colors.onSurface,
                },
              ]}
            >
              Card title,Card titleCard titleCard titleCard{' '}
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
      <FAB
        style={styles.fab}
        icon={() => (
          <Ionicons name='sparkles' size={24} color={theme.colors.onSurface} />
        )} // 使用 FontAwesome 的 rocket 图标
        onPress={handleCreateNewSpell}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // marginHorizontal: 8,
    // paddingVertical: 16,x
    padding: 8,
    // paddingHorizontal: 16,
    // backgroundColor: 'red'
  },
  scrollContent: {
    padding: 8,
    paddingBottom: 80, // 避免内容被 FAB 挡住（可选）
  },
  searchbar: {
    margin: 8,
    // paddingHorizontal: 8,
  },
  card: {
    marginVertical: 16,
    marginHorizontal: 8,
    paddingHorizontal: 8,
    borderRadius: 12, // 可选：MD3 推荐圆角 12px
    backgroundColor: 'red',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
