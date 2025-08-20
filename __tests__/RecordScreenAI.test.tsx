// 测试 RecordScreen 中的 AI生成脚本功能

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RecordScreen } from '../src/screens/RecordScreen';

// Mock navigation
jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: () => ({
      goBack: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

// Mock safe area context
jest.mock('react-native-safe-area-context', () => {
  return {
    useSafeAreaInsets: () => ({
      bottom: 0,
    }),
  };
});

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/Ionicons', () => {
  return {
    __esModule: true,
    default: () => null,
  };
});

describe('RecordScreen - AI Script Generation', () => {
  it('should render the AI button next to the title input', () => {
    const { getByTestId } = render(<RecordScreen />);

    // Check if the title input exists
    const titleInput = getByTestId('input-text-input');
    expect(titleInput).toBeTruthy();

    // Check if the AI button exists
    const aiButton = getByTestId('ai-generate-button');
    expect(aiButton).toBeTruthy();
  });

  it('should disable the script textarea while generating AI script', async () => {
    const { getByTestId } = render(<RecordScreen />);

    // Fill in a title
    const titleInput = getByTestId('input-text-input');
    fireEvent.changeText(titleInput, 'Test Title');

    // Click the AI button
    const aiButton = getByTestId('ai-generate-button');
    fireEvent.press(aiButton);

    // Check if the script textarea is disabled during generation
    const scriptTextarea = getByTestId('input-textarea-input');
    expect(scriptTextarea.props.editable).toBe(false);
  });
});
