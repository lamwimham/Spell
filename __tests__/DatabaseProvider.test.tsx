// 测试 DatabaseProvider 的基本功能

import { render } from '@testing-library/react-native';
import React from 'react';
import { DatabaseProvider } from '../src/components/providers/DatabaseProvider';

// Mock WatermelonDB
jest.mock('@nozbe/watermelondb', () => {
  return {
    Database: jest.fn().mockImplementation(() => {
      return {
        collections: {
          map: {},
        },
      };
    }),
  };
});

// Mock database module
jest.mock('../src/database', () => {
  return {
    __esModule: true,
    default: {
      collections: {
        map: {},
      },
    },
  };
});

describe('DatabaseProvider', () => {
  it('should render without crashing', () => {
    const { getByText } = render(
      <DatabaseProvider>
        <div>Test Child</div>
      </DatabaseProvider>,
    );

    // Should show loading state initially
    expect(getByText('正在初始化数据库...')).toBeTruthy();
  });
});
