import React from 'react';
// import { Text } from 'react-native';

export function FontLoader({ children }: { children: React.ReactNode }) {
  // 假设字体已通过原生方式链接到项目
  // 如果字体未加载，可以显示加载指示器或回退文本
  // 在实际应用中，你可能需要一个更复杂的字体加载状态管理
  // 例如，通过原生模块检查字体是否可用

  // 这里的简单实现假设字体总是可用的，因为它们是原生链接的
  return <>{children}</>;
}
