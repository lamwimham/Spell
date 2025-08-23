/**
 * 加密服务 - 本地数据加密和解密功能
 * 使用AES加密算法保护敏感数据，提供密钥管理和安全存储
 */

import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 加密配置
const ENCRYPTION_CONFIG = {
  algorithm: 'AES',
  keySize: 256,
  ivSize: 128,
  iterations: 10000,
  keyPrefix: 'SPELL_ENCRYPTION_KEY_',
  dataPrefix: 'SPELL_ENCRYPTED_DATA_',
};

// 加密结果接口
export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  salt: string;
  success: boolean;
  error?: string;
}

// 解密结果接口
export interface DecryptionResult {
  decryptedData: string;
  success: boolean;
  error?: string;
}

// 密钥信息接口
export interface KeyInfo {
  keyId: string;
  createdAt: number;
  algorithm: string;
  keySize: number;
}

// 敏感数据类型枚举
export enum SensitiveDataType {
  USER_PASSWORD = 'user_password',
  API_KEY = 'api_key',
  PERSONAL_INFO = 'personal_info',
  SETTINGS = 'settings',
  AUTH_TOKEN = 'auth_token',
  BIOMETRIC_DATA = 'biometric_data',
}

export class EncryptionService {
  // 当前使用的密钥ID
  private static currentKeyId: string | null = null;

  // 密钥缓存
  private static keyCache: Map<string, string> = new Map();

  /**
   * 初始化加密服务
   */
  static async initialize(): Promise<void> {
    try {
      // 检查是否存在主密钥
      const masterKeyId = await this.getMasterKeyId();
      if (!masterKeyId) {
        // 首次启动，生成主密钥
        await this.generateMasterKey();
      } else {
        this.currentKeyId = masterKeyId;
      }
    } catch (error) {
      console.error('初始化加密服务失败:', error);
      throw new Error('加密服务初始化失败');
    }
  }

  /**
   * 生成主密钥
   */
  private static async generateMasterKey(): Promise<string> {
    try {
      const keyId = this.generateKeyId();
      const masterKey = CryptoJS.lib.WordArray.random(ENCRYPTION_CONFIG.keySize / 8).toString();

      // 存储密钥
      await AsyncStorage.setItem(`${ENCRYPTION_CONFIG.keyPrefix}${keyId}`, masterKey);

      // 设置为当前密钥
      await AsyncStorage.setItem('SPELL_CURRENT_KEY_ID', keyId);
      this.currentKeyId = keyId;

      // 缓存密钥
      this.keyCache.set(keyId, masterKey);

      console.log('主密钥生成成功:', keyId);
      return keyId;
    } catch (error) {
      console.error('生成主密钥失败:', error);
      throw new Error('生成主密钥失败');
    }
  }

  /**
   * 获取主密钥ID
   */
  private static async getMasterKeyId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('SPELL_CURRENT_KEY_ID');
    } catch (error) {
      console.error('获取主密钥ID失败:', error);
      return null;
    }
  }

  /**
   * 获取密钥
   */
  private static async getKey(keyId?: string): Promise<string> {
    const targetKeyId = keyId || this.currentKeyId;
    if (!targetKeyId) {
      throw new Error('密钥ID不存在');
    }

    // 先从缓存获取
    if (this.keyCache.has(targetKeyId)) {
      return this.keyCache.get(targetKeyId)!;
    }

    // 从存储获取
    try {
      const key = await AsyncStorage.getItem(`${ENCRYPTION_CONFIG.keyPrefix}${targetKeyId}`);
      if (!key) {
        throw new Error('密钥不存在');
      }

      // 缓存密钥
      this.keyCache.set(targetKeyId, key);
      return key;
    } catch (error) {
      console.error('获取密钥失败:', error);
      throw new Error('获取密钥失败');
    }
  }

  /**
   * 生成密钥ID
   */
  private static generateKeyId(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * 加密数据
   */
  static async encryptData(
    data: string,
    dataType: SensitiveDataType,
    keyId?: string,
  ): Promise<EncryptionResult> {
    try {
      // 确保加密服务已初始化
      if (!this.currentKeyId) {
        await this.initialize();
      }

      const key = await this.getKey(keyId);

      // 生成随机盐值和初始向量
      const salt = CryptoJS.lib.WordArray.random(128 / 8);
      const iv = CryptoJS.lib.WordArray.random(ENCRYPTION_CONFIG.ivSize / 8);

      // 使用PBKDF2从主密钥派生加密密钥
      const derivedKey = CryptoJS.PBKDF2(key, salt, {
        keySize: ENCRYPTION_CONFIG.keySize / 32,
        iterations: ENCRYPTION_CONFIG.iterations,
      });

      // 创建包含数据类型的元数据
      const metadata = {
        dataType,
        timestamp: Date.now(),
        version: '1.0',
      };

      const dataWithMeta = JSON.stringify({
        data,
        metadata,
      });

      // 加密数据
      const encrypted = CryptoJS.AES.encrypt(dataWithMeta, derivedKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      return {
        encryptedData: encrypted.toString(),
        iv: iv.toString(),
        salt: salt.toString(),
        success: true,
      };
    } catch (error) {
      console.error('数据加密失败:', error);
      return {
        encryptedData: '',
        iv: '',
        salt: '',
        success: false,
        error: error instanceof Error ? error.message : '加密失败',
      };
    }
  }

  /**
   * 解密数据
   */
  static async decryptData(
    encryptedData: string,
    iv: string,
    salt: string,
    keyId?: string,
  ): Promise<DecryptionResult> {
    try {
      // 确保加密服务已初始化
      if (!this.currentKeyId) {
        await this.initialize();
      }

      const key = await this.getKey(keyId);

      // 重新生成派生密钥
      const saltWordArray = CryptoJS.enc.Hex.parse(salt);
      const derivedKey = CryptoJS.PBKDF2(key, saltWordArray, {
        keySize: ENCRYPTION_CONFIG.keySize / 32,
        iterations: ENCRYPTION_CONFIG.iterations,
      });

      // 解密数据
      const ivWordArray = CryptoJS.enc.Hex.parse(iv);
      const decrypted = CryptoJS.AES.decrypt(encryptedData, derivedKey, {
        iv: ivWordArray,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      if (!decryptedString) {
        throw new Error('解密失败：无效的密钥或数据');
      }

      // 解析元数据
      const dataWithMeta = JSON.parse(decryptedString);

      return {
        decryptedData: dataWithMeta.data,
        success: true,
      };
    } catch (error) {
      console.error('数据解密失败:', error);
      return {
        decryptedData: '',
        success: false,
        error: error instanceof Error ? error.message : '解密失败',
      };
    }
  }

  /**
   * 安全存储加密数据
   */
  static async secureStore(
    key: string,
    data: string,
    dataType: SensitiveDataType,
  ): Promise<boolean> {
    try {
      const encryptionResult = await this.encryptData(data, dataType);
      if (!encryptionResult.success) {
        throw new Error(encryptionResult.error);
      }

      const secureData = {
        encryptedData: encryptionResult.encryptedData,
        iv: encryptionResult.iv,
        salt: encryptionResult.salt,
        keyId: this.currentKeyId,
        dataType,
        createdAt: Date.now(),
      };

      await AsyncStorage.setItem(
        `${ENCRYPTION_CONFIG.dataPrefix}${key}`,
        JSON.stringify(secureData),
      );

      return true;
    } catch (error) {
      console.error('安全存储失败:', error);
      return false;
    }
  }

  /**
   * 安全读取加密数据
   */
  static async secureRetrieve(key: string): Promise<string | null> {
    try {
      const secureDataString = await AsyncStorage.getItem(`${ENCRYPTION_CONFIG.dataPrefix}${key}`);
      if (!secureDataString) {
        return null;
      }

      const secureData = JSON.parse(secureDataString);
      const decryptionResult = await this.decryptData(
        secureData.encryptedData,
        secureData.iv,
        secureData.salt,
        secureData.keyId,
      );

      if (!decryptionResult.success) {
        throw new Error(decryptionResult.error);
      }

      return decryptionResult.decryptedData;
    } catch (error) {
      console.error('安全读取失败:', error);
      return null;
    }
  }

  /**
   * 删除安全存储的数据
   */
  static async secureDelete(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(`${ENCRYPTION_CONFIG.dataPrefix}${key}`);
      return true;
    } catch (error) {
      console.error('安全删除失败:', error);
      return false;
    }
  }

  /**
   * 轮换密钥
   */
  static async rotateKey(): Promise<boolean> {
    try {
      // 生成新密钥
      const newKeyId = await this.generateMasterKey();

      // 获取所有加密数据
      const allKeys = await AsyncStorage.getAllKeys();
      const encryptedDataKeys = allKeys.filter(key => key.startsWith(ENCRYPTION_CONFIG.dataPrefix));

      // 使用新密钥重新加密所有数据
      for (const storageKey of encryptedDataKeys) {
        try {
          const secureDataString = await AsyncStorage.getItem(storageKey);
          if (!secureDataString) continue;

          const secureData = JSON.parse(secureDataString);

          // 使用旧密钥解密
          const decryptionResult = await this.decryptData(
            secureData.encryptedData,
            secureData.iv,
            secureData.salt,
            secureData.keyId,
          );

          if (decryptionResult.success) {
            // 使用新密钥重新加密
            const encryptionResult = await this.encryptData(
              decryptionResult.decryptedData,
              secureData.dataType,
              newKeyId,
            );

            if (encryptionResult.success) {
              const newSecureData = {
                ...secureData,
                encryptedData: encryptionResult.encryptedData,
                iv: encryptionResult.iv,
                salt: encryptionResult.salt,
                keyId: newKeyId,
                rotatedAt: Date.now(),
              };

              await AsyncStorage.setItem(storageKey, JSON.stringify(newSecureData));
            }
          }
        } catch (error) {
          console.error('重新加密数据失败:', storageKey, error);
        }
      }

      console.log('密钥轮换完成');
      return true;
    } catch (error) {
      console.error('密钥轮换失败:', error);
      return false;
    }
  }

  /**
   * 清理旧密钥
   */
  static async cleanupOldKeys(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const keyKeys = allKeys.filter(key => key.startsWith(ENCRYPTION_CONFIG.keyPrefix));

      // 保留当前密钥，删除其他旧密钥
      for (const keyKey of keyKeys) {
        const keyId = keyKey.replace(ENCRYPTION_CONFIG.keyPrefix, '');
        if (keyId !== this.currentKeyId) {
          await AsyncStorage.removeItem(keyKey);
          this.keyCache.delete(keyId);
        }
      }

      console.log('旧密钥清理完成');
    } catch (error) {
      console.error('清理旧密钥失败:', error);
    }
  }

  /**
   * 获取加密统计信息
   */
  static async getEncryptionStats(): Promise<{
    totalEncryptedItems: number;
    keyInfo: KeyInfo | null;
    dataTypes: Record<SensitiveDataType, number>;
  }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const encryptedDataKeys = allKeys.filter(key => key.startsWith(ENCRYPTION_CONFIG.dataPrefix));

      const dataTypes: Record<SensitiveDataType, number> = {
        [SensitiveDataType.USER_PASSWORD]: 0,
        [SensitiveDataType.API_KEY]: 0,
        [SensitiveDataType.PERSONAL_INFO]: 0,
        [SensitiveDataType.SETTINGS]: 0,
        [SensitiveDataType.AUTH_TOKEN]: 0,
        [SensitiveDataType.BIOMETRIC_DATA]: 0,
      };

      // 统计各类型数据数量
      for (const key of encryptedDataKeys) {
        try {
          const secureDataString = await AsyncStorage.getItem(key);
          if (secureDataString) {
            const secureData = JSON.parse(secureDataString);
            if (secureData.dataType && dataTypes.hasOwnProperty(secureData.dataType)) {
              dataTypes[secureData.dataType as SensitiveDataType]++;
            }
          }
        } catch (error) {
          console.error('读取加密数据统计失败:', key, error);
        }
      }

      // 获取当前密钥信息
      let keyInfo: KeyInfo | null = null;
      if (this.currentKeyId) {
        keyInfo = {
          keyId: this.currentKeyId,
          createdAt: parseInt(this.currentKeyId.split('_')[1]) || Date.now(),
          algorithm: ENCRYPTION_CONFIG.algorithm,
          keySize: ENCRYPTION_CONFIG.keySize,
        };
      }

      return {
        totalEncryptedItems: encryptedDataKeys.length,
        keyInfo,
        dataTypes,
      };
    } catch (error) {
      console.error('获取加密统计信息失败:', error);
      return {
        totalEncryptedItems: 0,
        keyInfo: null,
        dataTypes: {
          [SensitiveDataType.USER_PASSWORD]: 0,
          [SensitiveDataType.API_KEY]: 0,
          [SensitiveDataType.PERSONAL_INFO]: 0,
          [SensitiveDataType.SETTINGS]: 0,
          [SensitiveDataType.AUTH_TOKEN]: 0,
          [SensitiveDataType.BIOMETRIC_DATA]: 0,
        },
      };
    }
  }

  /**
   * 验证数据完整性
   */
  static async verifyDataIntegrity(): Promise<{
    valid: boolean;
    errors: string[];
    checkedItems: number;
  }> {
    const errors: string[] = [];
    let checkedItems = 0;

    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const encryptedDataKeys = allKeys.filter(key => key.startsWith(ENCRYPTION_CONFIG.dataPrefix));

      for (const key of encryptedDataKeys) {
        try {
          const secureDataString = await AsyncStorage.getItem(key);
          if (!secureDataString) {
            errors.push(`数据为空: ${key}`);
            continue;
          }

          const secureData = JSON.parse(secureDataString);

          // 尝试解密验证
          const decryptionResult = await this.decryptData(
            secureData.encryptedData,
            secureData.iv,
            secureData.salt,
            secureData.keyId,
          );

          if (!decryptionResult.success) {
            errors.push(`解密失败: ${key} - ${decryptionResult.error}`);
          }

          checkedItems++;
        } catch (error) {
          errors.push(`验证失败: ${key} - ${error}`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        checkedItems,
      };
    } catch (error) {
      console.error('数据完整性验证失败:', error);
      return {
        valid: false,
        errors: ['验证过程失败'],
        checkedItems: 0,
      };
    }
  }

  /**
   * 清除所有加密数据和密钥
   */
  static async clearAllEncryptedData(): Promise<boolean> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const encryptionKeys = allKeys.filter(
        key =>
          key.startsWith(ENCRYPTION_CONFIG.keyPrefix) ||
          key.startsWith(ENCRYPTION_CONFIG.dataPrefix) ||
          key === 'SPELL_CURRENT_KEY_ID',
      );

      await AsyncStorage.multiRemove(encryptionKeys);

      // 清理缓存
      this.keyCache.clear();
      this.currentKeyId = null;

      console.log('所有加密数据已清除');
      return true;
    } catch (error) {
      console.error('清除加密数据失败:', error);
      return false;
    }
  }
}
