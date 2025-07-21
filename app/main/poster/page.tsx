import HIGList, { ListItem } from '@/components/HIGList';
import SearchBar from '@/components/HIGSearchBar';
import React, { useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

// 自定义录音列表项
const RecordingListItem: React.FC<{ item: ListItem }> = ({ item }) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
      {/* 播放按钮 */}
      <TouchableOpacity style={{ padding: 8 }}>
        <View style={{ 
          width: 24, 
          height: 24, 
          borderRadius: 12, 
          backgroundColor: item.isSelected ? '#007AFF' : '#E5E5EA',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {item.isSelected ? (
            // 暂停图标
            <>
              <View style={{ width: 3, height: 10, backgroundColor: '#FFF' }} />
              <View style={{ width: 3, height: 10, backgroundColor: '#FFF', marginLeft: 4 }} />
            </>
          ) : (
            // 播放图标
            <View style={{
              width: 0,
              height: 0,
              borderTopWidth: 6,
              borderBottomWidth: 6,
              borderLeftWidth: 10,
              borderTopColor: 'transparent',
              borderBottomColor: 'transparent',
              borderLeftColor: '#007AFF'
            }} />
          )}
        </View>
      </TouchableOpacity>
      
      {/* 文本信息 */}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 17, color: '#000' }}>{item.title}</Text>
        <Text style={{ fontSize: 14, color: '#8E8E93' }}>
          {item.subtitle} · {item.metadata}
        </Text>
      </View>
      
      {/* 波形图 */}
      <View style={{ flexDirection: 'row', height: 24, alignItems: 'flex-end' }}>
        {[...Array(10)].map((_, i) => (
          <View 
            key={i} 
            style={{ 
              width: 2, 
              height: 8 + Math.random() * 16, 
              backgroundColor: '#007AFF', 
              marginLeft: 2,
              borderRadius: 1 
            }} 
          />
        ))}
      </View>
    </View>
  );
};
// 定义搜索结果类型
type SearchResult = string;

// 定义 App 组件的 props 类型（如果将来需要传参）
type AppProps = object;

// 声明 SearchBar 的类型（如果 SearchBar 本身是 .ts(x) 文件）

const PosterPage: React.FC<AppProps> = () => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [settings, setSettings] = useState<ListItem[]>([
    { id: '1', title: '通知', subtitle: '管理通知设置' },
    { id: '2', title: '隐私', subtitle: '管理您的隐私设置' },
    {
      id: '3',
      title: '深色模式',
      subtitle: '自动跟随系统',
      customData: { enabled: true },
    },
  ]);
  const togglePlay = (id: string) => {
    setRecordings(prev => prev.map(item => ({
      ...item,
      isSelected: item.id === id ? !item.isSelected : false
    })));
  };

   const [recordings, setRecordings] = useState<ListItem[]>([
    {
      id: '1',
      title: '项目会议讨论',
      subtitle: '2023-10-15',
      metadata: '24:30',
      isSelected: false
    },
    {
      id: '2',
      title: '产品构思笔记',
      subtitle: '2023-10-14',
      metadata: '12:45',
      isSelected: true
    },
    {
      id: '3',
      title: '客户需求记录',
      subtitle: '2023-10-13',
      metadata: '08:20',
      isSelected: false
    }
  ]);


  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              customData: {
                enabled: !item.customData?.enabled,
              },
            }
          : item
      )
    );
  };
  const handleSearch = (query: string) => {
    // 模拟搜索API调用
    const results: SearchResult[] = [
      `结果1: ${query}`,
      `结果2: ${query}相关`,
      `结果3: ${query}信息`,
    ];
    setSearchResults(results);
  };

  const handleVoiceInput = () => {
    console.log('语音输入激活');
    // 这里可以集成语音识别功能
  };

  return (
    <View style={styles.container}>
      <SearchBar
        placeholder='搜索内容'
        onSearch={handleSearch}
        onCancel={() => setSearchResults([])}
        enableVoiceInput={true}
        onVoiceInputPress={handleVoiceInput}
        autoFocus={true}
      />

      <View style={styles.resultsContainer}>
        {searchResults.map((result, index) => (
          <Text key={index} style={styles.resultItem}>
            {result}
          </Text>
        ))}
      </View>
      <HIGList
        data={settings}
        renderConfig={{
          rightContent: (item) =>
            item.id === '3' ? (
              <Switch
                value={item.customData?.enabled}
                onValueChange={() => toggleSetting(item.id)}
              />
            ) : null,
        }}
      />
      <HIGList
      data={recordings}
      layout="detailed"
      onItemPress={(item) => togglePlay(item.id)}
      renderConfig={{
        centerContent: (item) => <RecordingListItem item={item} />
      }}
    />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: '#F2F2F7',
  },
  resultsContainer: {
    padding: 16,
  },
  resultItem: {
    fontSize: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
});

export default PosterPage;
