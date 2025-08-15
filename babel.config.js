module.exports = function (api) {
  api.cache(true);
  const plugins = ['react-native-worklets/plugin'];

  // 在测试环境下不加载 reanimated 插件
  if (process.env.NODE_ENV === 'test') {
    // 移除 reanimated 插件，或者替换为 mock 插件
    // 这里我们直接移除，因为测试通常不需要动画功能
    const index = plugins.indexOf('react-native-worklets/plugin');
    if (index > -1) {
      plugins.splice(index, 1);
    }
  }

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: plugins,
  };
};
