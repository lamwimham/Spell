import { Recording } from '@/src/models/RecordingModel';
import { useEffect, useState } from 'react';
import * as fs from 'react-native-fs';
import { DocumentDirectoryPath } from 'react-native-fs';
import SQLite from 'react-native-sqlite-storage';

// Hook 返回的类型
interface UseRecordingServiceReturn {
  recordings: Recording[];
  loading: boolean;
  error: string | null;
  saveRecording: (recording: Recording) => Promise<void>;
  getRecordingById: (id: string) => Promise<Recording | null>;
  updateRecording: (id: string, updates: Partial<Recording>) => Promise<void>;
  deleteRecording: (id: string) => Promise<void>;
}

const RECORDINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS recordings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    transcript TEXT NOT NULL,
    audioPath TEXT NOT NULL,
    createdAt INTEGER NOT NULL
  )
`;

export const useRecordingService = (): UseRecordingServiceReturn => {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化数据库
  useEffect(() => {
    const initializeDB = async () => {
      try {
        const database = SQLite.openDatabase(
          {
            name: 'recordings.db',
            location: 'default',
          },
          () => console.log('Database opened successfully'),
          (err) => console.error('Error opening database:', err)
        );

        database.transaction((tx) => {
          tx.executeSql(RECORDINGS_TABLE);
        });

        setDb(database);
        await loadRecordings(); // 加载录音列表
      } catch (err) {
        setError('Failed to initialize database');
      } finally {
        setLoading(false);
      }
    };

    initializeDB();
  }, []);

  // 加载录音列表
  const loadRecordings = async () => {
    if (!db) return;

    try {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM recordings ORDER BY createdAt DESC',
          [],
          (_, { rows }) => {
            const list: Recording[] = [];
            for (let i = 0; i < rows.length; i++) {
              list.push(rows.item(i));
            }
            setRecordings(list);
          },
          (_, err) => {
            console.error('Failed to load recordings:', err);
            return false;
          }
        );
      });
    } catch (err) {
      setError('Failed to load recordings');
    }
  };

  // 保存录音
  const saveRecording = async (recording: Recording): Promise<void> => {
    if (!db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      try {
        let fileContent: string;
        if (typeof recording.content === 'string') {
          fileContent = recording.content;
        } else if (recording.content instanceof Buffer) {
          fileContent = recording.content.toString('base64');
        } else if (recording.content instanceof ArrayBuffer) {
          const buffer = Buffer.from(recording.content);
          fileContent = buffer.toString('base64');
        } else {
          throw new Error('Invalid recording content type');
        }

        const filePath = `${DocumentDirectoryPath}/recordings/${recording.id}.mp3`;

        fs.mkdir(`${DocumentDirectoryPath}/recordings`)
          .catch(() => {}); // 如果目录存在，忽略错误

        fs.writeFile(filePath, fileContent)
          .then(() => {
            db.transaction((tx) => {
              tx.executeSql(
                'INSERT INTO recordings (id, title, transcript, audioPath, createdAt) VALUES (?, ?, ?, ?, ?)',
                [
                  recording.id,
                  recording.title,
                  recording.transcript,
                  filePath,
                  recording.createdAt,
                ],
                () => {
                  loadRecordings(); // 刷新录音列表
                  resolve();
                },
                (_, err) => {
                  reject(err);
                  return false;
                }
              );
            });
          })
          .catch((err) => {
            console.error('Failed to write audio file:', err);
            reject(new Error('Failed to save audio file'));
          });
      } catch (err) {
        console.error('Failed to process recording:', err);
        reject(new Error('Failed to process recording'));
      }
    });
  };

  // 获取单个录音
  const getRecordingById = async (id: string): Promise<Recording | null> => {
    if (!db) return null;

    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM recordings WHERE id = ?',
          [id],
          (_, { rows }) => {
            resolve(rows.length > 0 ? rows.item(0) : null);
          },
          (_, err) => {
            reject(err);
            return false;
          }
        );
      });
    });
  };

  // 更新录音
  const updateRecording = async (
    id: string,
    updates: Partial<Recording>
  ): Promise<void> => {
    if (!db) throw new Error('Database not initialized');

    const original = await getRecordingById(id);
    if (!original) throw new Error(`Recording with ID ${id} not found`);

    const merged: Recording = {
      ...original,
      ...updates,
    };

    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'UPDATE recordings SET title = ?, transcript = ?, audioPath = ?, createdAt = ? WHERE id = ?',
          [
            merged.title,
            merged.transcript,
            merged.audioPath,
            merged.createdAt,
            id,
          ],
          () => {
            loadRecordings();
            resolve();
          },
          (_, err) => {
            reject(err);
            return false;
          }
        );
      });
    });
  };

  // 删除录音
  const deleteRecording = async (id: string): Promise<void> => {
    if (!db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'DELETE FROM recordings WHERE id = ?',
          [id],
          (_, { rowsAffected }) => {
            if (rowsAffected > 0) {
              loadRecordings();
              resolve();
            } else {
              reject(new Error('No record deleted'));
            }
          },
          (_, err) => {
            reject(err);
          }
        );
      });
    });
  };

  return {
    recordings,
    loading,
    error,
    saveRecording,
    getRecordingById,
    updateRecording,
    deleteRecording,
  };
};