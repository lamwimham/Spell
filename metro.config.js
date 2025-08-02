const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 添加路径别名解析
config.resolver.alias = {
  '^@/(.*)$': './\\1', // 匹配 '@/xxx' 到项目根目录
};

// 确保图片等静态资源能被处理
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'jpg', 'jpeg', 'png', 'gif', 'svg' // 添加需要的扩展名
];

module.exports = config;