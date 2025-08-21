import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Recording extends Model {
  static table = 'recordings';

  @field('title') title!: string;
  @field('script') script!: string;
  @field('url') url!: string;
  @field('duration') duration!: number;
  @field('play_count') playCount!: number;
  @field('recording_time') recordingTime!: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
