import React, { useState } from 'react';
import { View, Button, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

interface Reminder {
  id: string;
  hour: number;
  minute: number;
  enabled: boolean;
}

interface AddReminderFormProps {
  onAdd: (reminder: Reminder) => Promise<void>;
}

export default function AddReminderForm({ onAdd }: AddReminderFormProps) {
  const [time, setTime] = useState({ hour: 9, minute: 0 });
  const [showPicker, setShowPicker] = useState(false);

  const showTimePicker = async () => {
    if (Platform.OS === 'android') {
      try {
        DateTimePickerAndroid.open({
          mode: 'time',
          value: new Date(2020, 0, 1, time.hour, time.minute),
          onChange: (event, selectedDate) => {
            if (event.type === 'set' && selectedDate) {
              const hours = selectedDate.getHours();
              const minutes = selectedDate.getMinutes();
              setTime({ hour: hours, minute: minutes });
            }
          },
        });
      } catch (e) {
        console.warn('Time picker failed');
      }
    } else {
      setShowPicker(true);
    }
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === 'ios') {
      setShowPicker(false);
    }

    if (selectedTime) {
      const hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();
      setTime({ hour: hours, minute: minutes });
    }
  };

  const save = async () => {
    const newReminder: Reminder = {
      id: Date.now().toString(),
      hour: time.hour,
      minute: time.minute,
      enabled: true,
    };
    await onAdd(newReminder);
  };

  return (
    <View>
      <Button title="选择时间" onPress={showTimePicker} />
      {showPicker && Platform.OS === 'ios' && (
        <DateTimePicker
          value={new Date(2020, 0, 1, time.hour, time.minute)}
          mode="time"
          is24Hour={true}
          onChange={onTimeChange}
        />
      )}
      <Button title="添加提醒" onPress={save} />
    </View>
  );
}
