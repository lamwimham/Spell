import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'recordings',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'script', type: 'string' },
        { name: 'url', type: 'string' },
        { name: 'duration', type: 'number' },
        { name: 'play_count', type: 'number' },
        { name: 'recording_time', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
