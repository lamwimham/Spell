import * as fs from 'react-native-fs';
import SQLite from 'react-native-sqlite-storage';
import { Recording } from '../models/RecordingModel';

export class RecordingService {
  private db: SQLite.SQLiteDatabase | null = null;
  private static instance: RecordingService;

  constructor() {
    this.initDB();
  }

  public static getInstance(): RecordingService {
    if (!RecordingService.instance) {
      RecordingService.instance = new RecordingService();
    }
    return RecordingService.instance;
  }

  private initDB(): void {
    this.db = SQLite.openDatabase(
      {
        name: 'recordings.db',
        location: 'default',
      },
      () => {
        console.log('Database opened successfully');
      },
      (err) => {
        console.error('Error opening database:', err);
      }
    );

    this.db.transaction((tx) => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS recordings (' +
          'id TEXT PRIMARY KEY,' +
          'title TEXT NOT NULL,' +
          'transcript TEXT NOT NULL,' +
          'audioPath TEXT NOT NULL,' +
          'createdAt INTEGER NOT NULL' +
          ')'
      );
    });
  }

  // 保存录音（核心功能之一）
  public async saveRecording(recording: Recording): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 1. 处理语音文件（转换为字符串，如Base64 编码）
        let fileContent: string;
        if (typeof recording.content === 'string') {
          fileContent = recording.content; // 若已经是字符串（如 Base64），直接使用
        } else if (recording.content instanceof Buffer) {
          fileContent = recording.content.toString('base64'); // Buffer 转 Base64
        } else if (recording.content instanceof ArrayBuffer) {
          const buffer = Buffer.from(recording.content);
          fileContent = buffer.toString('base64'); // ArrayBuffer 转 Base64
        } else {
          throw new Error('Invalid recording content type');
        }

        // 2. 写入文件（fs.promises 接受字符串或 Buffer）
        const filePath = `${fs.DocumentDirectoryPath}/recordings/${recording.id}.mp3`;

        fs.writeFile(filePath, fileContent)
          .then(() => {
            // 3. 文件写入成功后，存储元数据到数据库
            this.db?.transaction((tx) => {
              tx.executeSql(
                'INSERT INTO recordings (id, title, transcript, audioPath, createdAt) VALUES (?, ?, ?, ?, ?)',
                [
                  recording.id,
                  recording.title,
                  recording.transcript,
                  filePath,
                  recording.createdAt,
                ]
              )
                .then(() => {
                  resolve(); // 数据库插入成功，保存录音完成
                })
                .catch(reject); // 数据库插入失败，拒绝
            });
          })
          .catch((error) => {
            console.error('Failed to write audio file:', error);
            reject(new Error('Failed to save audio file'));
          });
      } catch (error) {
        console.error('Failed to process recording:', error);
        reject(new Error('Failed to process recording'));
      }
    });
  }

  // 查询所有录音列表（核心功能之二）
  public async getRecordingsList(): Promise<Recording[]> {
    return new Promise((resolve, reject) => {
      this.db?.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM recordings ORDER BY createdAt DESC', // 按创建时间倒序排列
          [],
          (_, { rows }) => {
            const recordings: Recording[] = [];
            for (let i = 0; i < rows.length; i++) {
              recordings.push({
                id: rows.item(i).id,
                title: rows.item(i).title,
                content: rows.item(i).content,
                transcript: rows.item(i).transcript,
                audioPath: rows.item(i).audioPath,
                createdAt: rows.item(i).createdAt,
              });
            }
            resolve(recordings);
          },
          (_, error) => {
            console.error('Failed to load recordings:', error);
            reject(new Error('Failed to load recordings'));
          }
        );
      });
    });
  }

  // 编辑录音信息（核心功能之三）
  public async updateRecording(
    id: string,
    updates: Partial<Recording>
  ): Promise<void> {
    const originalRecording = await this.getSpecificRecording(id);

    if (!originalRecording) {
      console.warn(`Recording with ID ${id} not found, cannot update`);
      return;
    }

    // 合并原始记录与更新内容（过滤掉 undefined）
    const mergedRecording: Recording = {
      ...originalRecording,
      ...(typeof updates.title === 'string' && updates.title
        ? { title: updates.title }
        : {}),
      ...(typeof updates.transcript === 'string' && updates.transcript
        ? { transcript: updates.transcript }
        : {}),
      ...(typeof updates.audioPath === 'string' && updates.audioPath
        ? { audioPath: updates.audioPath }
        : {}),
      ...(typeof updates.content === 'string' ||
      typeof updates.content === 'object'
        ? { content: updates.content }
        : {}),
      ...(typeof updates.createdAt === 'number'
        ? { createdAt: updates.createdAt }
        : {}),
    };

    try {
      this.db?.transaction((tx) => {
        tx.executeSql(
          'UPDATE recordings SET title = ?, transcript = ?, audioPath = ?, createdAt = ? WHERE id = ?',
          [
            mergedRecording.title,
            mergedRecording.transcript,
            mergedRecording.audioPath,
            mergedRecording.createdAt,
            id,
          ]
        );
      });
    } catch (error) {
      console.error('Failed to update recording:', error);
    }
  }

  /**
   * 从数据库中删除指定录音
   */
  private async deleteRecording(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db
        ?.transaction((tx) => {
          tx.executeSql(
            'DELETE FROM recordings WHERE id = ?',
            [id],
            (_, { rowsAffected }) => {
              if (rowsAffected > 0) {
                resolve();
              } else {
                reject(new Error('No record deleted from database'));
              }
            },
            (_, error) => {
              console.error('Database delete failed:', error);
              reject(new Error('Failed to delete recording'));
            }
          );
        })
        .catch((error) => {
          console.error('Transaction error:', error);
          reject(error);
        });
    });
  }

  // 查询单个指定录音（核心功能之五）
  public async getSpecificRecording(id: string): Promise<Recording | null> {
    return new Promise((resolve, reject) => {
      this.db?.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM recordings WHERE id = ?',
          [id],
          (_, { rows }) => {
            if (rows.length > 0) {
              resolve({
                id: rows.item(0).id,
                title: rows.item(0).title,
                transcript: rows.item(0).transcript,
                audioPath: rows.item(0).audioPath,
                createdAt: rows.item(0).createdAt,
              } as Recording);
            } else {
              resolve(null);
            }
          },
          (_, error) => {
            console.error('Failed to load specific recording:', error);
            reject(new Error('Failed to load specific recording'));
          }
        );
      });
    });
  }

  // 辅助方法：通过ID获取录音（内部使用）
  private async getRecordingById(id: string): Promise<Recording | undefined> {
    const list = await this.getRecordingsList();
    return list.find(r => r.id === id)
  }
}
