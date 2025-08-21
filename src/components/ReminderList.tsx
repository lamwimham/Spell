import React from 'react';
import { View, Text, StyleSheet, FlatList, Switch } from 'react-native';
import { Button } from '../components/ui/Button';

interface Reminder {
  id: string;
  hour: number;
  minute: number;
  enabled: boolean;
}

interface ReminderListProps {
  reminders: Reminder[];
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export default function ReminderList({ reminders, onToggle, onDelete, onAdd }: ReminderListProps) {
  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const renderItem = ({ item }: { item: Reminder }) => (
    <View style={styles.reminderItem}>
      <Text style={styles.reminderTime}>{formatTime(item.hour, item.minute)}</Text>
      <Switch
        value={item.enabled}
        onValueChange={value => onToggle(item.id, value)}
        style={styles.switch}
      />
      <Button
        label="删除"
        variant="outline"
        size="small"
        onPress={() => onDelete(item.id)}
        style={styles.deleteButton}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={reminders}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={styles.list}
      />
      <Button label="添加提醒" onPress={onAdd} style={styles.addButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  list: {
    flex: 1,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  reminderTime: {
    fontSize: 18,
    fontWeight: '500',
  },
  switch: {
    marginHorizontal: 10,
  },
  deleteButton: {
    width: 80,
  },
  addButton: {
    marginVertical: 20,
  },
});
