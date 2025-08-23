/**
 * Jest测试环境设置
 * 配置全局mock和测试工具
 */

import 'react-native-gesture-handler/jestSetup';

// Mock React Native modules
jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Reanimated = require('react-native-reanimated/mock');
  // @ts-expect-error: Mocking the call method for testing purposes
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock WatermelonDB
jest.mock('@nozbe/watermelondb', () => ({
  Database: jest.fn(),
  Model: class MockModel {},
  Q: {
    where: jest.fn(),
    and: jest.fn(),
    or: jest.fn(),
    like: jest.fn(),
    eq: jest.fn(),
    gt: jest.fn(),
    lt: jest.fn(),
    gte: jest.fn(),
    lte: jest.fn(),
    between: jest.fn(),
    oneOf: jest.fn(),
    notIn: jest.fn(),
    sortBy: jest.fn(),
    take: jest.fn(),
    skip: jest.fn(),
  },
}));

jest.mock('@nozbe/watermelondb/adapters/sqlite', () => ({
  default: jest.fn(),
}));

jest.mock('@nozbe/watermelondb/decorators', () => ({
  action: jest.fn(),
  date: jest.fn(),
  field: jest.fn(),
  text: jest.fn(),
  readonly: jest.fn(),
  relation: jest.fn(),
  children: jest.fn(),
  lazy: jest.fn(),
  json: jest.fn(),
}));

// Mock Redux
jest.mock('@reduxjs/toolkit', () => ({
  ...jest.requireActual('@reduxjs/toolkit'),
  configureStore: jest.fn(() => ({
    dispatch: jest.fn(),
    getState: jest.fn(),
    subscribe: jest.fn(),
    replaceReducer: jest.fn(),
  })),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(() => jest.fn()),
  Provider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  })),
  useRoute: jest.fn(() => ({
    params: {},
  })),
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: jest.fn(() => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: ({ children }: { children: React.ReactNode }) => children,
  })),
}));

// Mock crypto functions
jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn(() => ({ toString: () => 'encrypted_data' })),
    decrypt: jest.fn(() => ({ toString: () => 'decrypted_data' })),
  },
  PBKDF2: jest.fn(() => 'derived_key'),
  lib: {
    WordArray: {
      random: jest.fn(() => ({ toString: () => 'random_string' })),
    },
  },
  mode: {
    CBC: 'CBC',
  },
  pad: {
    Pkcs7: 'Pkcs7',
  },
  enc: {
    Hex: {
      parse: jest.fn(() => 'parsed_hex'),
    },
    Utf8: 'utf8',
  },
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn((password, rounds) => Promise.resolve(`hashed_${password}_${rounds}`)),
  compare: jest.fn((password, hash) => Promise.resolve(hash.includes(password))),
  genSalt: jest.fn(() => Promise.resolve('generated_salt')),
}));

// Mock React Native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');

  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 667 })),
    },
    Platform: {
      OS: 'ios',
      select: jest.fn(obj => obj.ios),
    },
  };
});

// Global test utilities
global.mockUser = {
  id: 'test_user_123',
  username: 'testuser',
  email: 'test@example.com',
  role: 'user',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
};

global.mockSession = {
  userId: 'test_user_123',
  username: 'testuser',
  role: 'user',
  loginAt: Date.now(),
};

global.mockQuota = {
  id: 'test_quota_123',
  userId: 'test_user_123',
  quotaType: 'calls',
  limitValue: 100,
  usedValue: 0,
  resetPeriod: 'daily',
  lastResetAt: Date.now(),
  isActive: true,
};

// Custom matchers
expect.extend({
  toBeValidPassword(received) {
    const pass = received && received.length >= 8;
    return {
      message: () => `expected ${received} to be a valid password`,
      pass,
    };
  },

  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid email`,
      pass,
    };
  },

  toBeValidUserId(received) {
    const pass = received && typeof received === 'string' && received.length > 0;
    return {
      message: () => `expected ${received} to be a valid user ID`,
      pass,
    };
  },
});

// Suppress console warnings during tests
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  // Suppress specific warnings that are not relevant to tests
  if (
    args[0] &&
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: React.createFactory') ||
      args[0].includes('Warning: componentWillMount') ||
      args[0].includes('Warning: componentWillReceiveProps'))
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Set up test environment
beforeAll(() => {
  // Initialize any global test setup here
});

afterAll(() => {
  // Clean up any global test resources here
});
