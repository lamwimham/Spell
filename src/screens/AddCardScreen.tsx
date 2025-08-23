import React, { useState } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { InputText } from '../components/ui/InputText';
import { InputTextarea } from '../components/ui/InputTextarea';
import { TopNavigationBar } from '../components/ui/TopNavigationBar';

// 定义路由参数类型
type RootStackParamList = {
  AddCard: {
    category?: string;
    title?: string;
    script?: string;
    voiceType?: 'Male' | 'Female' | 'Custom';
    notifications?: boolean;
    repeatCount?: number;
    interval?: number;
  };
};

type AddCardScreenRouteProp = RouteProp<RootStackParamList, 'AddCard'>;

interface VoiceTypeOption {
  id: 'Male' | 'Female' | 'Custom';
  label: string;
}

// interface CounterProps {
//   label: string;
//   value: number;
//   onValueChange: (value: number) => void;
//   min?: number;
//   max?: number;
// }

// const Counter: React.FC<CounterProps> = ({
//   label,
//   value,
//   onValueChange,
//   min = 1,
//   max = 99
// }) => {
//   const handleDecrease = () => {
//     if (value > min) {
//       onValueChange(value - 1);
//     }
//   };

//   const handleIncrease = () => {
//     if (value < max) {
//       onValueChange(value + 1);
//     }
//   };

//   return (
//     <View style={styles.counterContainer}>
//       <Text style={styles.counterLabel}>{label}</Text>
//       <View style={styles.counterControls}>
//         <TouchableOpacity
//           style={[styles.counterButton, value <= min && styles.counterButtonDisabled]}
//           onPress={handleDecrease}
//           disabled={value <= min}
//         >
//           <Icon name="remove" size={16} color={value <= min ? '#C8C5D0' : '#7572B7'} />
//         </TouchableOpacity>

//         <Text style={styles.counterValue}>{value}</Text>

//         <TouchableOpacity
//           style={[styles.counterButton, value >= max && styles.counterButtonDisabled]}
//           onPress={handleIncrease}
//           disabled={value >= max}
//         >
//           <Icon name="add" size={16} color={value >= max ? '#C8C5D0' : '#7572B7'} />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

/**
 * 添加新卡片页面
 * 基于设计稿实现的咒语文稿添加页面
 */
export function AddCardScreen() {
  const navigation = useNavigation();
  const route = useRoute<AddCardScreenRouteProp>();
  const params = route.params || {};
  const insets = useSafeAreaInsets();

  // 状态管理
  const [cardData, setCardData] = useState({
    category: params.category || 'Breaking Bad Habits',
    title: params.title || '',
    script: params.script || '',
    voiceType: params.voiceType || ('Male' as 'Male' | 'Female' | 'Custom'),
    notifications: params.notifications ?? false,
    repeatCount: params.repeatCount || 1,
    interval: params.interval || 5,
  });

  const voiceOptions: VoiceTypeOption[] = [
    { id: 'Male', label: 'Male' },
    { id: 'Female', label: 'Female' },
    { id: 'Custom', label: 'Custom Voice' },
  ];

  const handleSave = () => {
    // 这里处理保存逻辑
    console.log('Saving card data:', cardData);
    // 可以调用API保存数据
    // 保存成功后返回上一页
    navigation.goBack();
  };

  const updateCardData = (key: string, value: any) => {
    setCardData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <TopNavigationBar
        title="Add New Card"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightIconName="save-outline"
        onRightIconPress={handleSave}
        iconColor="#FF6B6B"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 分类标签 */}
        <View style={styles.categoryContainer}>
          <View style={styles.categoryBadge}>
            <Icon name="close-circle" size={16} color="#FF6B6B" />
            <Text style={styles.categoryText}>{cardData.category}</Text>
          </View>
        </View>

        {/* 卡片标题 */}
        <View style={styles.inputContainer}>
          <InputText
            label="Card Title"
            placeholder="Card Title"
            value={cardData.title}
            onChangeText={text => updateCardData('title', text)}
          />
        </View>

        {/* 脚本内容 */}
        <View style={styles.sectionContainer}>
          <InputTextarea
            label="Script"
            placeholder="Enter your script here (one line per affirmation)"
            value={cardData.script}
            onChangeText={text => updateCardData('script', text)}
            height={120}
            helperText="Enter one line per affirmation"
          />
        </View>

        {/* 自定义设置 */}
        <View style={styles.sectionContainer}>
          {/* <Text style={styles.sectionTitle}>Customization</Text> */}

          {/* 语音类型 */}
          <View style={styles.voiceTypeContainer}>
            <Text style={styles.voiceTypeTitle}>Voice Type</Text>
            <View style={styles.voiceOptions}>
              {voiceOptions.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.voiceOption}
                  onPress={() => updateCardData('voiceType', option.id)}
                >
                  <View
                    style={[
                      styles.radioButton,
                      cardData.voiceType === option.id && styles.radioButtonSelected,
                    ]}
                  >
                    {cardData.voiceType === option.id && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={styles.voiceOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* 通知设置 */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Notifications</Text>
          <ToggleSwitch
            value={cardData.notifications}
            onValueChange={value => updateCardData('notifications', value)}
          />
        </View>

        {/* 播放设置 */}
        {/* <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Playback Settings</Text>
          
          <Counter
            label="Repeat Count: 1"
            value={cardData.repeatCount}
            onValueChange={(value) => updateCardData('repeatCount', value)}
            min={1}
            max={10}
          />
          
          <Counter
            label="Interval: 5s"
            value={cardData.interval}
            onValueChange={(value) => updateCardData('interval', value)}
            min={1}
            max={60}
          />
        </View> */}

        {/* 隐私模式 */}
        <View style={styles.privacyContainer}>
          <Text style={styles.privacyText}>Privacy Mode</Text>
          <View style={styles.privacyIndicator} />
          <ToggleSwitch value={false} onValueChange={() => {}} disabled />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E3F1',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Rubik',
    fontWeight: '600',
    color: '#393640',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 17,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#FF6B6B',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  categoryContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 15,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#FF6B6B',
    marginLeft: 6,
  },
  inputContainer: {
    marginBottom: 24,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  voiceTypeContainer: {
    marginBottom: 16,
  },
  voiceTypeTitle: {
    fontSize: 15,
    fontFamily: 'Rubik',
    fontWeight: '500',
    color: '#535059',
    marginBottom: 12,
  },
  voiceOptions: {
    gap: 12,
  },
  voiceOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D2CED9',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#FF6B6B',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
  },
  voiceOptionText: {
    fontSize: 15,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#393640',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E3F1',
  },
  settingLabel: {
    fontSize: 15,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#393640',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  counterLabel: {
    fontSize: 15,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#393640',
    flex: 1,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 4,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonDisabled: {
    backgroundColor: '#F0F0F0',
  },
  counterValue: {
    fontSize: 15,
    fontFamily: 'Rubik',
    fontWeight: '500',
    color: '#393640',
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: 'center',
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 32,
  },
  privacyText: {
    fontSize: 15,
    fontFamily: 'Rubik',
    fontWeight: '400',
    color: '#393640',
    flex: 1,
  },
  privacyIndicator: {
    width: 100,
    height: 4,
    backgroundColor: '#393640',
    borderRadius: 2,
    marginRight: 16,
  },
});
