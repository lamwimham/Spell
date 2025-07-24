import HIGList, { ListItem } from '@/components/HIGList';
import SearchBar from '@/components/HIGSearchBar';
import React, { useState } from 'react';
import {
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
import { LinearGradient } from 'expo-linear-gradient';

// ---------------------------------------------------------
// 渐变 + 拟物 录音行
// ---------------------------------------------------------
const RecordingListItem: React.FC<{ item: ListItem }> = ({ item }) => {
  const isPlaying = item.isSelected;

  return (
    <View style={styles.recordingRow}>
      {/* 播放按钮 */}
      <TouchableOpacity style={styles.playButtonWrap} activeOpacity={0.8}>
        <LinearGradient
          colors={isPlaying ? ['#007AFF', '#0051D5'] : ['#FFFFFF', '#E5E5EA']}
          style={[styles.playButton, styles.shadow]}
        >
          <View style={styles.playIcon}>
            {isPlaying ? (
              <>
                <View style={[styles.pauseStick, { backgroundColor: '#FFF' }]} />
                <View
                  style={[styles.pauseStick, { backgroundColor: '#FFF', marginLeft: 4 }]}
                />
              </>
            ) : (
              <View style={styles.playTriangle} />
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* 文本 */}
      <View style={styles.textWrap}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>
          {item.subtitle} · {item.metadata}
        </Text>
      </View>

      {/* 波形 */}
      <View style={styles.waveWrap}>
        {[...Array(12)].map((_, i) => (
          <LinearGradient
            key={i}
            colors={['#007AFF', '#00C2FF']}
            style={{
              width: 2.5,
              height: 8 + Math.random() * 16,
              marginLeft: 3,
              borderRadius: 1.5,
            }}
          />
        ))}
      </View>
    </View>
  );
};

// ---------------------------------------------------------
// 页面主体
// ---------------------------------------------------------
type SearchResult = string;
type AppProps = object;

const PosterPage: React.FC<AppProps> = () => {
  /* —— 状态 —— */
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const [recordings, setRecordings] = useState<ListItem[]>([
    { id: '1', title: '项目会议讨论', subtitle: '2023-10-15', metadata: '24:30', isSelected: false },
    { id: '2', title: '产品构思笔记', subtitle: '2023-10-14', metadata: '12:45', isSelected: true },
    { id: '3', title: '客户需求记录', subtitle: '2023-10-13', metadata: '08:20', isSelected: false },
  ]);

  const [settings, setSettings] = useState<ListItem[]>([
    { id: '1', title: '通知', subtitle: '管理通知设置' },
    { id: '2', title: '隐私', subtitle: '管理您的隐私设置' },
    { id: '3', title: '深色模式', subtitle: '自动跟随系统', customData: { enabled: true } },
  ]);

  /* —— 交互 —— */
  const togglePlay = (id: string) =>
    setRecordings((prev) =>
      prev.map((it) => ({ ...it, isSelected: it.id === id ? !it.isSelected : false }))
    );

  const toggleSetting = (id: string) =>
    setSettings((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, customData: { enabled: !it.customData?.enabled } }
          : it
      )
    );

  const handleSearch = (q: string) =>
    setSearchResults([`结果1: ${q}`, `结果2: ${q}相关`, `结果3: ${q}信息`]);

  const handleVoiceInput = () => console.log('语音输入');

  /* —— 渲染 —— */
  return (
    <LinearGradient colors={['#F7F7FB', '#EAEAEF']} style={styles.container}>
      {/* 搜索栏 */}
      <SearchBar
        placeholder="搜索内容"
        onSearch={handleSearch}
        onCancel={() => setSearchResults([])}
        enableVoiceInput
        onVoiceInputPress={handleVoiceInput}
        autoFocus
      />

      {/* 搜索结果 */}
      <View style={styles.resultsWrap}>
        {searchResults.map((r, idx) => (
          <LinearGradient
            key={idx}
            colors={['#FFFFFF', '#F5F5FA']}
            style={[styles.resultCard, styles.shadow]}
          >
            <Text style={styles.resultText}>{r}</Text>
          </LinearGradient>
        ))}
      </View>

      {/* 设置列表 */}
      <HIGList
        data={settings}
        renderConfig={{
          rightContent: (item) =>
            item.id === '3' ? (
              <View style={styles.switchWrap}>
                <Switch
                  value={item.customData?.enabled}
                  onValueChange={() => toggleSetting(item.id)}
                  trackColor={{ false: '#D1D1D6', true: '#007AFF' }}
                  thumbColor="#FFF"
                />
              </View>
            ) : null,
        }}
      />

      {/* 录音列表 */}
      <HIGList
        data={recordings}
        layout="detailed"
        onItemPress={(item) => togglePlay(item.id)}
        renderConfig={{
          centerContent: (item) => <RecordingListItem item={item} />,
        }}
      />
    </LinearGradient>
  );
};

// ---------------------------------------------------------
// 样式
// ---------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  /* 搜索结果卡片 */
  resultsWrap: { paddingHorizontal: 16, marginTop: 10 },
  resultCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 15,
    color: '#000',
  },
  /* 录音行 */
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  playButtonWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: { flexDirection: 'row', alignItems: 'center' },
  pauseStick: { width: 3, height: 12, borderRadius: 1.5 },
  playTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#007AFF',
  },
  textWrap: { flex: 1, marginLeft: 14 },
  title: { fontSize: 17, fontWeight: '600', color: '#000' },
  subtitle: { fontSize: 14, color: '#8E8E93', marginTop: 2 },
  waveWrap: { flexDirection: 'row', alignItems: 'flex-end' },
  /* 开关 */
  switchWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  /* 通用阴影 */
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default PosterPage;