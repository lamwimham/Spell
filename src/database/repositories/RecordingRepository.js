import { database } from '../database';

export const createRecording = async data => {
  const newRecording = await database.write(async () => {
    return await database.get('recordings').create(recording => {
      recording.title = data.title;
      recording.script = data.script;
      recording.url = data.url;
      recording.duration = data.duration;
      recording.playCount = data.playCount || 0;
      recording.recordingTime = data.recordingTime || Date.now();
      recording.createdAt = Date.now();
      recording.updatedAt = Date.now();
    });
  });
  return newRecording;
};

export const getAllRecordings = async () => {
  return await database.get('recordings').query().fetch();
};

export const getRecordingById = async id => {
  return await database.get('recordings').find(id);
};

export const updateRecording = async (id, data) => {
  const recording = await database.get('recordings').find(id);
  await database.write(async () => {
    await recording.update(record => {
      record.title = data.title ?? record.title;
      record.script = data.script ?? record.script;
      record.url = data.url ?? record.url;
      record.duration = data.duration ?? record.duration;
      record.playCount = data.playCount ?? record.playCount;
      record.recordingTime = data.recordingTime ?? record.recordingTime;
      record.updatedAt = Date.now();
    });
  });
};

export const deleteRecording = async id => {
  const recording = await database.get('recordings').find(id);
  await database.write(async () => {
    await recording.markAsDeleted();
  });
};

export const incrementPlayCount = async id => {
  const recording = await database.get('recordings').find(id);
  await database.write(async () => {
    await recording.update(record => {
      record.playCount = record.playCount + 1;
      record.updatedAt = Date.now();
    });
  });
};
