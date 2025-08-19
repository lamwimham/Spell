import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Slider from '@react-native-community/slider';

interface AudioPitchSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
  style?: ViewStyle;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
}

/**
 * 音频音调滑块组件
 * 基于Figma设计实现的音频音调调节滑块
 */
export function AudioPitchSlider({
  value,
  onValueChange,
  disabled = false,
  style,
  minimumValue = -0.5,
  maximumValue = 0.5,
  step = 0.01,
}: AudioPitchSliderProps) {
  // const formatPercentage = (val: number) => {
  //   return `${Math.round(val * 100)}%`;
  // };

  const getMarkerLabels = () => {
    return ['-50%', '-25%', '0%', '25%', '50%'];
  };

  return (
    <View style={[styles.container, style]}>
      {/* 滑块容器 */}
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          value={value}
          onValueChange={onValueChange}
          minimumValue={minimumValue}
          maximumValue={maximumValue}
          step={step}
          disabled={disabled}
          minimumTrackTintColor="#7572B7"
          maximumTrackTintColor="#FDFCFF"
          // thumbStyle={styles.thumb}
          // trackStyle={styles.track}
        />
      </View>

      {/* 刻度标签 */}
      <View style={styles.markersContainer}>
        {getMarkerLabels().map((label, index) => (
          <View key={index} style={styles.markerLabel}>
            <Text style={styles.markerText}>{label}</Text>
          </View>
        ))}
      </View>

      {/* 说明文本 */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionText}>
          Audio pitch is the highness or lowness of a sound. It's determined by the frequency.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E3E3F1',
    borderRadius: 12,
    padding: 12,
  },
  sliderContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  slider: {
    width: '100%',
    height: 32,
  },
  track: {
    height: 14,
    borderRadius: 40,
  },
  thumb: {
    width: 28,
    height: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  markersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    marginTop: 8,
  },
  markerLabel: {
    width: 44,
    alignItems: 'center',
  },
  markerText: {
    fontSize: 13,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#535059',
    textAlign: 'center',
  },
  descriptionContainer: {
    marginTop: 12,
    paddingHorizontal: 8,
  },
  descriptionText: {
    fontSize: 13,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#535059',
    lineHeight: 18,
  },
});
