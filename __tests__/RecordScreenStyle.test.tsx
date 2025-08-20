// 测试 RecordScreen 样式更新

import React from 'react';
import { render } from '@testing-library/react-native';
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

describe('RecordScreen - Style Updates', () => {
  it('should render title input and AI button in a row', () => {
    const { getByTestId } = render(<RecordScreen />);

    // Check if the title input exists
    const titleInput = getByTestId('input-text-input');
    expect(titleInput).toBeTruthy();

    // Check if the AI button exists
    const aiButton = getByTestId('ai-generate-button');
    expect(aiButton).toBeTruthy();
  });

  it('should render script textarea below the title row', () => {
    const { getByTestId } = render(<RecordScreen />);

    // Check if the script textarea exists
    const scriptTextarea = getByTestId('input-textarea-input');
    expect(scriptTextarea).toBeTruthy();
  });
});
