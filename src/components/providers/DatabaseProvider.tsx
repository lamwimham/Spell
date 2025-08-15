import { Database } from '@nozbe/watermelondb';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import database from '../../database';

// 创建数据库上下文
const DatabaseContext = createContext<Database | null>(null);

// 数据库提供者组件属性
interface DatabaseProviderProps {
  children: ReactNode;
}

// 数据库提供者组件
export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 初始化数据库
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        // 检查数据库是否可用
        if (!database) {
          throw new Error('数据库实例不可用');
        }

        // 尝试执行一个简单的数据库操作来验证连接
        try {
          // 获取所有表名
          const collections = database.collections.map((c: { name: string }) => c.name);
          console.log('数据库表:', collections);
        } catch (dbError) {
          console.warn('数据库操作测试失败，但继续初始化:', dbError);
        }

        // 标记数据库已准备好
        setIsReady(true);
      } catch (err) {
        console.error('数据库初始化失败:', err);
        setError(err instanceof Error ? err : new Error('数据库初始化失败'));
      }
    };

    // 延迟初始化以确保 React Native 环境完全加载
    const timer = setTimeout(() => {
      initializeDatabase();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 如果数据库尚未准备好，显示加载指示器
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {error ? (
          <Text style={{ color: 'red', textAlign: 'center', padding: 20 }}>
            数据库初始化失败: {error.message}
          </Text>
        ) : (
          <>
            <ActivityIndicator size="large" color="#7572B7" />
            <Text style={{ marginTop: 16, color: '#393640' }}>正在初始化数据库...</Text>
          </>
        )}
      </View>
    );
  }

  // 提供数据库实例给子组件
  return <DatabaseContext.Provider value={database}>{children}</DatabaseContext.Provider>;
};

// 使用数据库的钩子
export const useDatabase = (): Database => {
  const database = useContext(DatabaseContext);
  if (!database) {
    throw new Error('useDatabase 必须在 DatabaseProvider 内部使用');
  }
  return database;
};
