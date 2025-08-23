import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class Recording extends Model {
  static table = 'recordings';

  static associations: Associations = {
    user: { type: 'belongs_to', key: 'user_id' },
  };

  @field('title') title!: string;
  @field('script') script!: string;
  @field('url') url!: string;
  @field('duration') duration!: number;
  @field('play_count') playCount!: number;
  @field('recording_time') recordingTime!: number;
  @field('user_id') userId!: string; // 新增：关联用户ID
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // 关联关系
  @relation('users', 'user_id') user!: any;
}
