module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setupTests.ts'], // 确保路径正确
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-reanimated|react-native-vector-icons|react-redux)/)', // 添加 react-redux
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', // 添加路径别名映射
  },
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/setupTests.ts', // 忽略 setupTests.ts 作为测试文件
  ],
};
