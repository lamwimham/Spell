import { debounce } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle
} from 'react-native';

// 类型定义
interface LyricLine {
  time: number;
  text: string;
}

// 定义样式的 TypeScript 接口
interface LyricsStylesType {
  container?: ViewStyle;
  overlayMask?: ViewStyle;
  contentContainer?: ViewStyle;
  line?: TextStyle;
  highlighted?: TextStyle;
  blurred?: TextStyle;
  noLyrics?: TextStyle;
  centerLine?: TextStyle;
}
interface LyricsDisplayProps {
  lyrics: LyricLine[];
  currentTime: number;
  styles?: LyricsStylesType
}

const LyricsDisplay: React.FC<LyricsDisplayProps> = ({
  lyrics: propLyrics,
  currentTime,
  styles: LyricsStyles = {}
}) => {
  // 状态管理
  const [highlightedLineIndex, setHighlightedLineIndex] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const [lineHeight, setLineHeight] = useState<number>(30);
  const [visibleLines, setVisibleLines] = useState<number>(0);

  // 引用管理
  const flatListRef = useRef<FlatList>(null);
  const scrollOffset = useRef<number>(0);
  const prevIndexRef = useRef<number>(-1);
  const isScrolling = useRef<boolean>(false);
  const wasUserScroll = useRef<boolean>(false);
  const scrollTimerRef = useRef<number | null>(null);

  // 防抖滚动函数
  const debouncedScroll = useMemo(
    () =>
      debounce((offset: number) => {
        if (flatListRef.current && !isScrolling.current) {
          flatListRef.current.scrollToOffset({ offset, animated: true });
        }
      }, 150),
    []
  );

  // 清理防抖函数
  useEffect(() => {
    return () => {
      debouncedScroll.cancel();
    };
  }, [debouncedScroll]);

  // 计算高亮行
  useEffect(() => {
    if (!propLyrics.length) return;

    let newIndex = 0;
    for (let i = 0; i < propLyrics.length; i++) {
      const currentLine = propLyrics[i];
      if (
        currentLine.time <= currentTime &&
        (i === propLyrics.length - 1 || propLyrics[i + 1].time > currentTime)
      ) {
        newIndex = i;
        break;
      }
    }
    console.log('需要高亮的行数', newIndex)

    if (newIndex !== highlightedLineIndex) {
      setHighlightedLineIndex(newIndex);
    }
  }, [currentTime, propLyrics, highlightedLineIndex]);

  // 强制居中方法
  const forceAlignToCenter = useCallback(() => {
    if (
      !propLyrics.length ||
      !flatListRef.current ||
      containerHeight === 0 ||
      lineHeight === 0
    ) {
      console.log('no data')
      return;
    }

    const targetOffset = Math.max(
      0,
      lineHeight * highlightedLineIndex
    );

    console.log(targetOffset, 'targetOffset')
    flatListRef.current.scrollToOffset({
      offset: targetOffset,
      animated: true,
    });
  }, [highlightedLineIndex, containerHeight, lineHeight, propLyrics.length]);

  // 滚动事件处理
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffset.current = event.nativeEvent.contentOffset.y;
      isScrolling.current = true;
      wasUserScroll.current = true;

      // 清除之前的定时器
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }

      // 设置新的定时器
      scrollTimerRef.current = setTimeout(() => {
        isScrolling.current = false;
        // 只有在用户主动滚动后才触发对齐
        if (wasUserScroll.current) {
          forceAlignToCenter();
        }
        wasUserScroll.current = false;
      }, 300);
    },
    [forceAlignToCenter]
  );

  // 自动滚动到高亮行
  useEffect(() => {
    if (
      !propLyrics.length ||
      containerHeight === 0 ||
      lineHeight === 0 ||
      !flatListRef.current ||
      wasUserScroll.current
    ) {
      return;
    }

    if (prevIndexRef.current === highlightedLineIndex) return;
    prevIndexRef.current = highlightedLineIndex;
    console.log(containerHeight, '容器高度')
    // const middleOffset = (containerHeight - lineHeight) / 2;
    // const middleOffset = containerHeight / 2;
    const targetOffset = Math.max(
      0,
      highlightedLineIndex * lineHeight
    );
    const maxScroll = Math.max(
      lineHeight * highlightedLineIndex,
      propLyrics.length * lineHeight
      // propLyrics.length * lineHeight - containerHeight
    );
    const finalOffset = Math.min(targetOffset, maxScroll);

    console.log(finalOffset, 'finalOffset');
    debouncedScroll(finalOffset);
  }, [
    highlightedLineIndex,
    containerHeight,
    lineHeight,
    propLyrics.length,
    debouncedScroll,
  ]);

  // 容器布局处理
  const onContainerLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height, width } = event.nativeEvent.layout;
      console.log(height, width, 'containerHeight And Width')
      setContainerHeight(height);
      if (lineHeight > 0) {
        setVisibleLines(Math.floor(height / lineHeight));
      }
    },
    [lineHeight]
  );

  // 获取实际行高
  const onFirstItemLayout = useCallback((event: LayoutChangeEvent) => {
    if (
      lineHeight === 30 &&
      event.nativeEvent.layout.height > 0
    ) {
      setLineHeight(event.nativeEvent.layout.height);
    }
  }, [lineHeight]);

  // 进度计算
  const progress = useMemo(() => {
    if (!propLyrics.length || containerHeight === 0 || lineHeight === 0)
      return 0;

    const totalHeight = propLyrics.length * lineHeight;
    const scrollableHeight = Math.max(0, totalHeight - containerHeight);

    if (scrollableHeight === 0) return 1;

    return Math.min(1, Math.max(0, scrollOffset.current / scrollableHeight));
  }, [propLyrics.length, containerHeight, lineHeight]);

  // 渲染歌词行
  const renderItem = useCallback(
    ({ item, index }: { item: LyricLine; index: number }) => {
      const isHighlighted = index === highlightedLineIndex;
      const isPast = index < highlightedLineIndex;

      return (
        <View onLayout={index === 0 ? onFirstItemLayout : undefined}>
          <Text
            style={[
              styles.line,
              LyricsStyles.line,
              isHighlighted && styles.highlighted,
              isHighlighted && LyricsStyles.highlighted,
              isPast && styles.blurred,
              isPast && LyricsStyles.blurred,
            ]}
          >
            {item.text}
          </Text>
        </View>
      );
    },
    [highlightedLineIndex, onFirstItemLayout]
  );

  // 空歌词处理
  if (!propLyrics.length) {
    return (
      <View style={[styles.container, LyricsStyles.container]}>
        <Text style={[styles.noLyrics, LyricsStyles.noLyrics]}>暂无歌词</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, LyricsStyles.container]} onLayout={onContainerLayout}>


      {/* 歌词列表 */}
      <FlatList
        ref={flatListRef}
        data={propLyrics}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        initialNumToRender={visibleLines}
        maxToRenderPerBatch={5}
        windowSize={7}
        removeClippedSubviews={true}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop:
              containerHeight > 0 && lineHeight > 0
                ? (containerHeight - lineHeight) / 2
                : 0,
            paddingBottom:
              containerHeight > 0 && lineHeight > 0
                ? (containerHeight - lineHeight) / 2
                : 0,
          },
          LyricsStyles.contentContainer
        ]}
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: lineHeight,
          offset: index * lineHeight,
          index,
        })}
      />
    </View>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
  },
  noLyrics: {
    color: '#666',
    fontSize: 10,
    textAlign: 'center',
    marginTop: '50%',
  },
  overlayMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLine: {
    height: 30,
    width: '100%',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -15 }],
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#333',
    marginVertical: 12,
    borderRadius: 2,
    overflow: 'hidden',
    zIndex: 1,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  contentContainer: {
    justifyContent: 'center',
    flexGrow: 1,
    minHeight: '100%',
  },
  line: {
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
    marginVertical: 5,
    fontFamily: 'System',
    lineHeight: 30,
  },
  highlighted: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#5900ffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  blurred: {
    fontSize: 18,
    opacity: 0.5,
    color: '#aaa',
  },
});

export default LyricsDisplay;