import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface CardProps {
  duration: string;
  location: string;
  title: string;
  onPlayPress?: () => void;
  playCount?: number;
  shareCount?: number;
  imageUrl?: string;
  style?: StyleProp<ViewStyle>;
}

const Card = ({
  duration,
  location,
  title,
  onPlayPress,
  playCount = 0,
  shareCount = 0,
  imageUrl,
  style,
}: CardProps) => {
  console.log('imageUrl', imageUrl);  
  const theme = useTheme();
  return (
    <TouchableOpacity
      style={[styles.card, style]}
      activeOpacity={0.7}
      onPress={onPlayPress}
    >
      {/* 左侧专辑图片 */}
      {/* <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="musical-notes" size={24} color={theme.colors.outlineVariant} />
          </View>
        )}
      </View> */}

      {/* 中间内容区域 */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        
        <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
          {location}
        </Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="play" size={12} color={theme.colors.onSurfaceDisabled} />
            <Text style={styles.statText}>plastics:{playCount}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="share-social" size={12} color={theme.colors.onSurfaceDisabled} />
            <Text style={styles.statText}>shared:{shareCount}</Text>
          </View>
          
          <Text style={[styles.statText, styles.duration]}>
            start:{duration}
          </Text>
        </View>
      </View>

      {/* 右侧播放按钮 */}
      <TouchableOpacity
        style={styles.playButton}
        onPress={onPlayPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="play-circle" size={32} color={theme.colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  imageContainer: {
    marginRight: 12,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
  duration: {
    marginLeft: 'auto',
  },
  playButton: {
    padding: 8,
  },
});

export default Card;