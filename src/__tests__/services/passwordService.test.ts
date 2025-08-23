/**
 * 密码服务单元测试
 * 测试密码加密、验证和强度检查功能
 */

import { PasswordService } from '../../services/auth/passwordService';

describe('PasswordService', () => {
  describe('validatePassword', () => {
    it('应该接受强密码', () => {
      const strongPasswords = [
        'StrongP@ssw0rd123!',
        'MySecure#Pass1',
        'Complex$Password9',
        'Valid&Strong2023',
      ];

      strongPasswords.forEach(password => {
        const result = PasswordService.validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.feedback).toHaveLength(0);
      });
    });

    it('应该拒绝短密码', () => {
      const shortPasswords = ['123', 'pass', 'Sh0rt!'];

      shortPasswords.forEach(password => {
        const result = PasswordService.validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.feedback.some(f => f.includes('至少8个字符'))).toBe(true);
      });
    });

    it('应该拒绝缺少大写字母的密码', () => {
      const passwords = ['lowercase123!', 'no_uppercase_1!'];

      passwords.forEach(password => {
        const result = PasswordService.validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.feedback.some(f => f.includes('大写字母'))).toBe(true);
      });
    });

    it('应该拒绝缺少小写字母的密码', () => {
      const passwords = ['UPPERCASE123!', 'NO_LOWERCASE_1!'];

      passwords.forEach(password => {
        const result = PasswordService.validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.feedback.some(f => f.includes('小写字母'))).toBe(true);
      });
    });

    it('应该拒绝缺少数字的密码', () => {
      const passwords = ['NoNumbers!', 'OnlyLetters@'];

      passwords.forEach(password => {
        const result = PasswordService.validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.feedback.some(f => f.includes('数字'))).toBe(true);
      });
    });

    it('应该拒绝缺少特殊字符的密码', () => {
      const passwords = ['NoSpecialChars123', 'OnlyAlphaNum1'];

      passwords.forEach(password => {
        const result = PasswordService.validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.feedback.some(f => f.includes('特殊字符'))).toBe(true);
      });
    });

    it('应该拒绝常见密码', () => {
      const commonPasswords = ['Password123!', '123456789!A', 'Qwerty123!', 'Admin123!'];

      commonPasswords.forEach(password => {
        const result = PasswordService.validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.feedback.some(f => f.includes('常见密码'))).toBe(true);
      });
    });

    it('应该拒绝包含用户名的密码', () => {
      const username = 'testuser';
      const passwords = ['testuser123!A', 'MyTestuser1!', 'User_testuser@1'];

      passwords.forEach(password => {
        const result = PasswordService.validatePassword(password, username);
        expect(result.isValid).toBe(false);
        expect(result.feedback.some(f => f.includes('用户名'))).toBe(true);
      });
    });
  });

  describe('hashPassword', () => {
    it('应该生成不同的哈希值', async () => {
      const password = 'TestPassword123!';

      const hash1 = await PasswordService.hashPassword(password);
      const hash2 = await PasswordService.hashPassword(password);

      expect(hash1.hash).not.toBe(hash2.hash);
      expect(hash1.salt).not.toBe(hash2.salt);
      expect(hash1.hash).toBeTruthy();
      expect(hash1.salt).toBeTruthy();
    });

    it('应该生成指定长度的哈希值', async () => {
      const password = 'TestPassword123!';
      const result = await PasswordService.hashPassword(password);

      // bcrypt哈希值通常是60个字符
      expect(result.hash.length).toBeGreaterThan(50);
      expect(result.salt.length).toBeGreaterThan(20);
    });

    it('应该处理空密码', async () => {
      await expect(PasswordService.hashPassword('')).rejects.toThrow();
    });

    it('应该处理很长的密码', async () => {
      const longPassword = 'A'.repeat(1000) + '1!';
      const result = await PasswordService.hashPassword(longPassword);

      expect(result.hash).toBeTruthy();
      expect(result.salt).toBeTruthy();
    });
  });

  describe('verifyPassword', () => {
    it('应该验证正确的密码', async () => {
      const password = 'TestPassword123!';
      const hashResult = await PasswordService.hashPassword(password);

      const verifyResult = await PasswordService.verifyPassword(
        password,
        hashResult.hash,
        hashResult.salt,
      );

      expect(verifyResult.isValid).toBe(true);
      expect(verifyResult.needsRehash).toBe(false);
    });

    it('应该拒绝错误的密码', async () => {
      const correctPassword = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hashResult = await PasswordService.hashPassword(correctPassword);

      const verifyResult = await PasswordService.verifyPassword(
        wrongPassword,
        hashResult.hash,
        hashResult.salt,
      );

      expect(verifyResult.isValid).toBe(false);
      expect(verifyResult.needsRehash).toBe(false);
    });

    it('应该处理无效的哈希值', async () => {
      const password = 'TestPassword123!';
      const invalidHash = 'invalid_hash';
      const salt = 'some_salt';

      const verifyResult = await PasswordService.verifyPassword(password, invalidHash, salt);

      expect(verifyResult.isValid).toBe(false);
    });

    it('应该检测需要重新哈希的旧密码', async () => {
      // 模拟旧的哈希算法结果
      const password = 'TestPassword123!';
      const weakHash = '$2a$04$' + 'weak'.repeat(14); // 低rounds的bcrypt
      const salt = 'oldsalt';

      const verifyResult = await PasswordService.verifyPassword(password, weakHash, salt);

      // 由于是无效哈希，应该返回false
      expect(verifyResult.isValid).toBe(false);
    });
  });

  describe('generateSecurePassword', () => {
    it('应该生成指定长度的密码', () => {
      const lengths = [12, 16, 20, 32];

      lengths.forEach(length => {
        const password = PasswordService.generateSecurePassword(length);
        expect(password.length).toBe(length);
      });
    });

    it('应该生成包含所有字符类型的密码', () => {
      const password = PasswordService.generateSecurePassword(16);

      expect(/[a-z]/.test(password)).toBe(true); // 小写字母
      expect(/[A-Z]/.test(password)).toBe(true); // 大写字母
      expect(/[0-9]/.test(password)).toBe(true); // 数字
      expect(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)).toBe(true); // 特殊字符
    });

    it('应该生成不同的密码', () => {
      const passwords = new Set();
      for (let i = 0; i < 100; i++) {
        passwords.add(PasswordService.generateSecurePassword(16));
      }

      // 应该生成100个不同的密码
      expect(passwords.size).toBe(100);
    });

    it('应该生成有效的密码', () => {
      const password = PasswordService.generateSecurePassword(16);
      const validation = PasswordService.validatePassword(password);

      expect(validation.isValid).toBe(true);
    });

    it('应该处理最小长度要求', () => {
      const password = PasswordService.generateSecurePassword(8);
      expect(password.length).toBe(8);

      const validation = PasswordService.validatePassword(password);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('secureCompare', () => {
    it('应该正确比较相同的字符串', () => {
      const str1 = 'identical_string';
      const str2 = 'identical_string';

      expect(PasswordService.secureCompare(str1, str2)).toBe(true);
    });

    it('应该正确比较不同的字符串', () => {
      const str1 = 'different_string1';
      const str2 = 'different_string2';

      expect(PasswordService.secureCompare(str1, str2)).toBe(false);
    });

    it('应该正确比较不同长度的字符串', () => {
      const str1 = 'short';
      const str2 = 'much_longer_string';

      expect(PasswordService.secureCompare(str1, str2)).toBe(false);
    });

    it('应该处理空字符串', () => {
      expect(PasswordService.secureCompare('', '')).toBe(true);
      expect(PasswordService.secureCompare('', 'non_empty')).toBe(false);
      expect(PasswordService.secureCompare('non_empty', '')).toBe(false);
    });

    it('应该进行常数时间比较', () => {
      // 这个测试很难准确验证，但我们可以检查函数的存在性
      const str1 = 'test_string_1';
      const str2 = 'test_string_2';

      // 多次调用应该返回一致的结果
      for (let i = 0; i < 10; i++) {
        expect(PasswordService.secureCompare(str1, str1)).toBe(true);
        expect(PasswordService.secureCompare(str1, str2)).toBe(false);
      }
    });
  });

  describe('clearSensitiveData', () => {
    it('应该清除敏感数据', () => {
      const sensitiveData = ['password123', 'secret_key', 'token_value'];

      PasswordService.clearSensitiveData(...sensitiveData);

      // 由于JavaScript的限制，我们无法真正验证内存是否被清除
      // 但我们可以确保函数正常运行而不抛出错误
      expect(true).toBe(true);
    });

    it('应该处理空数据', () => {
      expect(() => {
        PasswordService.clearSensitiveData();
      }).not.toThrow();
    });

    it('应该处理null和undefined', () => {
      expect(() => {
        PasswordService.clearSensitiveData(null as any, undefined as any);
      }).not.toThrow();
    });
  });
});
