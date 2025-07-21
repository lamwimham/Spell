import moment from 'moment';
import 'moment/locale/zh-cn';
import React, { useState } from 'react';
import { Alert, Dimensions, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, IconButton, Text, useTheme } from 'react-native-paper';

// Set Chinese locale for moment.js
moment.locale('zh-cn');

// Get window width for responsive sizing
const { width } = Dimensions.get('window');

// Type definitions for check-in data and calendar statistics
type CheckInData = Record<string, boolean>;
type CalendarStats = {
  totalCheckIns: number;
  longestStreak: number;
  currentStreak: number;
};

// Weekday labels in Chinese, starting from Monday
const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六', ];

/**
 * Generates an array of day numbers for a given month and year.
 * @param year The year.
 * @param month The 0-indexed month (e.g., 0 for January, 11 for December).
 * @returns An array of numbers representing days in the month (e.g., [1, 2, ..., 31]).
 */
const getDaysInMonth = (year: number, month: number): number[] => {
  // Create a Date object for the 0th day of the next month, which gives the last day of the current month.
  return Array.from(
    { length: new Date(year, month + 1, 0).getDate() },
    (_, i) => i + 1
  );
};

/**
 * Checks if a given date falls on a weekend (Saturday or Sunday).
 * @param date The date string in 'YYYY-MM-DD' format.
 * @returns True if the date is a weekend, false otherwise.
 */
const isUnReached = (date: string): boolean => {
  // 超过当天的日期都是未到达的日期
  return new Date(date) > new Date();  
};

/**
 * Main CalendarPage component displaying the check-in calendar and statistics.
 */
const CalendarPage = () => {
  const theme = useTheme(); // Access theme colors from react-native-paper
  const today = moment().format('YYYY-MM-DD'); // Get today's date in YYYY-MM-DD format

  // State to manage the currently displayed month and year in the calendar
  const [displayMoment, setDisplayMoment] = useState(moment()); // Initialize with current month/year

  // State to store check-in data. Keys are 'YYYY-MM-DD' strings, values are booleans.
  const [checkInData, setCheckInData] = useState<CheckInData>({});

  // Derive current year and month from the displayMoment state
  const currentYear = displayMoment.year();
  const currentMonth = displayMoment.month(); // 0-indexed month (0-11)

  // Get days in the current displayed month
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);

  // Calculate the weekday of the first day of the month (1 for Monday, 7 for Sunday)
  // Adjusted to be 0-indexed (0 for Monday, 6 for Sunday) to match daysOfWeek array
  const firstDayOfMonthIndex = moment(`${currentYear}-${currentMonth + 1}-01`).day(); // 0=周日
  /**
   * Calculates various check-in statistics for the displayed month and overall.
   * @returns An object containing totalCheckIns, longestStreak (in displayed month), and currentStreak (global).
   */
  const calculateStats = (): CalendarStats => {
    let totalCheckIns = 0;
    let longestStreakInDisplayedMonth = 0;

    const startOfMonth = displayMoment.clone().startOf('month');
    const endOfMonth = displayMoment.clone().endOf('month');

    let tempStreak = 0;
    // Iterate through all days in the displayed month to calculate total check-ins and the longest streak within this month
    let dayIterator = startOfMonth.clone();
    while (dayIterator.isSameOrBefore(endOfMonth, 'day')) {
      const date = dayIterator.format('YYYY-MM-DD');
      if (checkInData[date]) {
        totalCheckIns++;
        tempStreak++;
      } else {
        tempStreak = 0; // Reset streak if a day is not checked in
      }
      longestStreakInDisplayedMonth = Math.max(longestStreakInDisplayedMonth, tempStreak);
      dayIterator.add(1, 'day');
    }

    // Calculate the global current streak (streak ending on today's date)
    let globalCurrentStreak = 0;
    let dayForGlobalStreak = moment().clone(); // Start from today
    // Loop backwards from today, checking if each day is checked in
    while (checkInData[dayForGlobalStreak.format('YYYY-MM-DD')]) {
      globalCurrentStreak++;
      dayForGlobalStreak.subtract(1, 'day'); // Move to the previous day
    }

    return {
      totalCheckIns,
      longestStreak: longestStreakInDisplayedMonth, // Longest streak within the displayed month
      currentStreak: globalCurrentStreak, // Global current streak ending today
    };
  };

  // Calculate stats whenever checkInData or displayMoment changes
  const stats = calculateStats();

  /**
   * Toggles the check-in status for a given date.
   * @param date The date string to toggle (YYYY-MM-DD).
   */
  const handleCheckIn = (date: string) => {
    // 未到达的日期，不允许打卡
    if (date > moment().format('YYYY-MM-DD')) {
      // 弹窗提示
      Alert.alert('提示', '请勿在未到达的日期进行打卡！');
      return;
    }  else if (date < moment().format('YYYY-MM-DD') ){
      Alert.alert('提示', '请勿在已过期的日期进行打卡！');
      return;
    }
    setCheckInData(prev => ({
      ...prev,
      [date]: !prev[date] // Toggle the boolean value for the given date
    }));
  };

  /**
   * Navigates the calendar to the previous month.
   */
  const goToPreviousMonth = () => {
    setDisplayMoment(prev => prev.clone().subtract(1, 'month'));
  };

  /**
   * Navigates the calendar to the next month.
   */
  const goToNextMonth = () => {
    setDisplayMoment(prev => prev.clone().add(1, 'month'));
  };

  /**
   * Renders empty placeholder views for days before the 1st of the month
   * to align the first day with its correct weekday.
   * @returns An array of <View> components for empty days.
   */
  const renderEmptyDays = () => {
    // Use firstDayOfMonthIndex directly as it's already 0-indexed (0 for Monday, 6 for Sunday)
    return Array.from({ length: firstDayOfMonthIndex }, (_, i) => (
      <View key={`empty-${i}`} style={styles.calendarDay} />
    ));
  };

  /**
   * Renders the individual day cells for the calendar.
   * Each day is a TouchableOpacity to allow toggling check-in status.
   * @returns An array of TouchableOpacity components for each day of the month.
   */
  const renderCalendarDays = () => {
    return daysInMonth.map((day, index) => {
      // Format the date string for the current day
      const date = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const isToday = date === today; // Check if it's today's date
      const isCheckedIn = checkInData[date]; // Check if this day is marked as checked in
      const isUnReachedDay = isUnReached(date); // Check if this day is a weekend
      return (
        <TouchableOpacity
          key={index}
          style={[
            styles.calendarDay,
            isToday && styles.todayHighlight, // Highlight today's date
            isCheckedIn && !isUnReachedDay && styles.checkedInDay, // Style for checked-in weekdays
            isUnReachedDay && styles.weekendDay, // Style for weekend days
            !isCheckedIn && !isUnReachedDay && styles.notCheckedInDay, // Style for not-checked-in weekdays
          ]}
          onPress={() => handleCheckIn(date)} // Toggle check-in on press
        >
          <Text
            variant="bodyMedium"
            style={[
              styles.dayText,
              isToday && { fontWeight: 'bold' }, // Make today's text bold
              isUnReachedDay && { color: theme.colors.onSurfaceVariant }, // Dim weekend text color
            ]}
          >
            {day}
          </Text>
          {isCheckedIn && ( // Show a small dot indicator if checked in
            <View style={styles.checkIndicator}>
              <View style={[styles.checkDot, { backgroundColor: theme.colors.primary }]} />
            </View>
          )}
        </TouchableOpacity>
      );
    });
  };

  /**
   * Renders a single statistic card.
   * @param title The title of the statistic (e.g., "累计打卡").
   * @param value The numerical value of the statistic.
   * @returns A Card component displaying the statistic.
   */
  const renderStatCard = (title: string, value: number) => (
    <Card style={[styles.statCard, { backgroundColor: theme.colors.surfaceVariant }]}>
      <Card.Content style={styles.statContent}>
        <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
          {value}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {title}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    // SafeAreaView ensures content is not obscured by device notches/status bars
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* ScrollView allows the content to be scrollable if it exceeds screen height */}
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Header with Month Navigation Buttons */}
        <View style={styles.headerContainer}>
          <IconButton
            icon="chevron-left" // Icon for previous month
            size={30}
            onPress={goToPreviousMonth}
            iconColor={theme.colors.onBackground}
          />
          <Text variant="headlineSmall" style={[styles.header, { color: theme.colors.onBackground }]}>
            {displayMoment.format('YYYY年 M月')} {/* Display current month/year */}
          </Text>
          <IconButton
            icon="chevron-right" // Icon for next month
            size={30}
            onPress={goToNextMonth}
            iconColor={theme.colors.onBackground}
          />
        </View>

        {/* Calendar Card */}
        <Card style={styles.calendarCard}>
          <Card.Content>
            {/* Weekday labels (Mon, Tue, etc.) */}
            <View style={styles.weekdaysContainer}>
              {daysOfWeek.map((day, index) => (
                <View key={index} style={styles.weekday}>
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.weekdayText,
                      // Highlight weekend weekday labels in error color
                      { color: (index >= 6 || index <= 1) ? theme.colors.error : theme.colors.onSurface }
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid: empty days followed by actual day cells */}
            <View style={styles.calendarGrid}>
              {renderEmptyDays()}
              {renderCalendarDays()}
            </View>
          </Card.Content>
        </Card>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          {renderStatCard('累计打卡', stats.totalCheckIns)}
          {renderStatCard('最长连续', stats.longestStreak)}
          {renderStatCard('当前连续', stats.currentStreak)}
        </View>

        {/* Legend for calendar day colors */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.checkedInLegend]} />
            <Text variant="bodySmall">已打卡</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.notCheckedInLegend]} />
            <Text variant="bodySmall">未打卡</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.weekendLegend]} />
            <Text variant="bodySmall">周末</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.todayLegend]} />
            <Text variant="bodySmall">今天</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// StyleSheet for the component's styling
const styles = StyleSheet.create({
  safeArea: {
    flex: 1, // Take up full available space
  },
  scrollViewContent: {
    flexGrow: 1, // Allows content to grow and enable scrolling when needed
    padding: 16, // Overall padding for the content
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    fontWeight: 'bold',
  },
  calendarCard: {
    marginBottom: 24,
    borderRadius: 12,
    elevation: 2, // Shadow for Android
  },
  weekdaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekday: {
    width: (width - 80) / 7,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekdayText: {
    fontWeight: 'bold',
  },
  calendarGrid: {
    // backgroundColor: 'red',
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow days to wrap to the next line
  },
  calendarDay: {
    // Corrected width calculation, same as weekday
    width: (width - 100) / 7,
    aspectRatio: 1, // Make cells square
    margin: 2, // Small margin between day cells
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    position: 'relative', // For positioning the check indicator dot
  },
  dayText: {
    textAlign: 'center',
  },
  checkedInDay: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)', // Light green for checked in days
  },
  notCheckedInDay: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)', // Light red for not checked in days
  },
  weekendDay: {
    backgroundColor: 'rgba(158, 158, 158, 0.1)', // Light grey for weekend days
  },
  todayHighlight: {
    borderWidth: 2,
    borderColor: '#6200ee', // Highlight today with primary color (hardcoded for clarity, but could use theme.colors.primary)
  },
  checkIndicator: {
    position: 'absolute',
    bottom: 4, // Position dot at the bottom
  },
  checkDot: {
    width: 6,
    height: 6,
    borderRadius: 3, // Make it a small circle
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1, // Distribute space equally among stat cards
    marginHorizontal: 4, // Horizontal margin between cards
    borderRadius: 12,
    elevation: 1,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.03)', // Light background for the legend
    borderRadius: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  checkedInLegend: {
    backgroundColor: 'rgba(76, 175, 80, 0.5)',
  },
  notCheckedInLegend: {
    backgroundColor: 'rgba(244, 67, 54, 0.5)',
  },
  weekendLegend: {
    backgroundColor: 'rgba(158, 158, 158, 0.3)',
  },
  todayLegend: {
    backgroundColor: '#6200ee',
  },
});

export default CalendarPage;
