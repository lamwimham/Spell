import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Recording extends Model {
  static table = 'recordings';

  @field('title') title;
  @field('script') script;
  @field('url') url;
  @field('duration') duration;
  @field('play_count') playCount;
  @field('recording_time') recordingTime;
  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}
