/**
 * Jest测试配置文件
 * 为SpellApp用户管理系统的单元测试提供配置
 */

module.exports = {
  preset: 'react-native',

  // 测试文件匹配模式
  testMatch: ['**/__tests__/**/*.(ts|tsx|js)', '**/*.(test|spec).(ts|tsx|js)'],

  // 测试环境设置
  testEnvironment: 'node',

  // 需要转换的文件
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', { presets: ['@babel/preset-typescript'] }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },

  // 文件扩展名解析
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // 模块名映射（用于路径别名）
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@database/(.*)$': '<rootDir>/src/database/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  },

  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],

  // 覆盖率收集配置
  collectCoverage: false, // 暂时关闭覆盖率
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**',
  ],

  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // 覆盖率报告格式
  coverageReporters: ['text', 'html'],

  // 忽略的模块
  modulePathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/android/', '<rootDir>/ios/'],

  // Mock配置
  automock: false,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // 超时设置
  testTimeout: 10000,

  // 详细输出
  verbose: true,

  // 静默模式（设置为false以查看详细输出）
  silent: false,

  // 错误时继续运行其他测试
  bail: false,

  // 并行运行测试
  maxWorkers: 1, // 减少并行度

  // 额外的设置
  setupFiles: ['<rootDir>/src/__tests__/polyfills.ts'],

  // 转换忽略模式
  transformIgnorePatterns: ['node_modules/(?!(react-native|@react-native|@nozbe/watermelondb)/)'],
};
