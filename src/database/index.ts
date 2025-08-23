// 数据库配置文件
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import schema from './schema';
import Recording from './models/Recording';
import User from './models/User';
import UserSetting from './models/UserSetting';
import CheckIn from './models/CheckIn';
import AiUsageLog from './models/AiUsageLog';
import UserQuota from './models/UserQuota';

// 创建适配器
const adapter = new SQLiteAdapter({
  schema,
});

// 创建数据库实例
const database = new Database({
  adapter,
  modelClasses: [Recording, User, UserSetting, CheckIn, AiUsageLog, UserQuota],
});

export default database;
