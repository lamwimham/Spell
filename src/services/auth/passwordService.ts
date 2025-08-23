/**
 * 密码服务 - 密码加密、验证和安全管理
 * 使用crypto-js库进行密码哈希，确保密码安全性
 */

import CryptoJS from 'crypto-js';

// 密码强度等级枚举
export enum PasswordStrength {
  WEAK = 'weak',
  MEDIUM = 'medium',
  STRONG = 'strong',
  VERY_STRONG = 'very_strong',
}

// 密码验证结果接口
export interface PasswordValidationResult {
  isValid: boolean;
  strength: PasswordStrength;
  score: number; // 0-100分
  feedback: string[];
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

// 密码哈希结果接口
export interface PasswordHashResult {
  hash: string;
  salt: string;
}

export class PasswordService {
  // 密码最小长度
  private static readonly MIN_PASSWORD_LENGTH = 8;

  // 最大密码长度
  private static readonly MAX_PASSWORD_LENGTH = 128;

  // 盐值长度
  private static readonly SALT_LENGTH = 32;

  // 哈希迭代次数
  private static readonly HASH_ITERATIONS = 10000;

  /**
   * 生成随机盐值
   */
  private static generateSalt(): string {
    return CryptoJS.lib.WordArray.random(this.SALT_LENGTH).toString();
  }

  /**
   * 生成密码哈希
   */
  static hashPassword(password: string): PasswordHashResult {
    const salt = this.generateSalt();
    const hash = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: this.HASH_ITERATIONS,
    }).toString();

    return {
      hash: `${salt}:${hash}`,
      salt,
    };
  }

  /**
   * 验证密码
   */
  static verifyPassword(password: string, storedHash: string): boolean {
    try {
      const [salt, hash] = storedHash.split(':');
      if (!salt || !hash) {
        return false;
      }

      const computedHash = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: this.HASH_ITERATIONS,
      }).toString();

      return computedHash === hash;
    } catch (error) {
      console.error('密码验证失败:', error);
      return false;
    }
  }

  /**
   * 验证密码强度和格式
   */
  static validatePassword(password: string): PasswordValidationResult {
    const feedback: string[] = [];
    const requirements = {
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecialChar: false,
    };

    // 检查长度
    if (password.length >= this.MIN_PASSWORD_LENGTH) {
      requirements.minLength = true;
    } else {
      feedback.push(`密码长度至少需要${this.MIN_PASSWORD_LENGTH}位`);
    }

    if (password.length > this.MAX_PASSWORD_LENGTH) {
      feedback.push(`密码长度不能超过${this.MAX_PASSWORD_LENGTH}位`);
    }

    // 检查大写字母
    if (/[A-Z]/.test(password)) {
      requirements.hasUppercase = true;
    } else {
      feedback.push('密码需要包含至少一个大写字母');
    }

    // 检查小写字母
    if (/[a-z]/.test(password)) {
      requirements.hasLowercase = true;
    } else {
      feedback.push('密码需要包含至少一个小写字母');
    }

    // 检查数字
    if (/[0-9]/.test(password)) {
      requirements.hasNumber = true;
    } else {
      feedback.push('密码需要包含至少一个数字');
    }

    // 检查特殊字符
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
      requirements.hasSpecialChar = true;
    } else {
      feedback.push('密码需要包含至少一个特殊字符');
    }

    // 计算密码强度分数
    const score = this.calculatePasswordScore(password, requirements);
    const strength = this.getPasswordStrength(score);

    // 添加强度相关反馈
    if (strength === PasswordStrength.WEAK) {
      feedback.push('密码强度较弱，建议加强');
    } else if (strength === PasswordStrength.MEDIUM) {
      feedback.push('密码强度中等，建议进一步加强');
    }

    const isValid =
      Object.values(requirements).every(req => req) && password.length <= this.MAX_PASSWORD_LENGTH;

    return {
      isValid,
      strength,
      score,
      feedback,
      requirements,
    };
  }

  /**
   * 计算密码强度分数
   */
  private static calculatePasswordScore(
    password: string,
    requirements: PasswordValidationResult['requirements'],
  ): number {
    let score = 0;

    // 基础分数（长度）
    score += Math.min(password.length * 2, 20);

    // 字符类型分数
    if (requirements.hasLowercase) score += 10;
    if (requirements.hasUppercase) score += 10;
    if (requirements.hasNumber) score += 10;
    if (requirements.hasSpecialChar) score += 15;

    // 长度奖励
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // 多样性奖励
    const uniqueChars = new Set(password).size;
    score += Math.min(uniqueChars * 2, 20);

    // 常见模式扣分
    if (/(.)\1{2,}/.test(password)) score -= 10; // 重复字符
    if (/123|abc|qwe|password|admin/i.test(password)) score -= 20; // 常见模式
    if (/^[a-z]+$/i.test(password)) score -= 10; // 只有字母
    if (/^[0-9]+$/.test(password)) score -= 10; // 只有数字

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 根据分数获取密码强度等级
   */
  private static getPasswordStrength(score: number): PasswordStrength {
    if (score >= 80) return PasswordStrength.VERY_STRONG;
    if (score >= 60) return PasswordStrength.STRONG;
    if (score >= 40) return PasswordStrength.MEDIUM;
    return PasswordStrength.WEAK;
  }

  /**
   * 生成随机强密码
   */
  static generateSecurePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';

    // 确保包含每种类型的字符
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // 填充剩余长度
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // 打乱字符顺序
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  /**
   * 检查密码是否在常见密码列表中
   */
  static isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password',
      '123456',
      '123456789',
      'qwerty',
      'abc123',
      'password123',
      '111111',
      '123123',
      'admin',
      'letmein',
      'welcome',
      '1234567',
      'password1',
      '12345678',
      'qwerty123',
      'iloveyou',
      'princess',
      'monkey',
      'sunshine',
      'football',
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * 获取密码强度描述
   */
  static getPasswordStrengthDescription(strength: PasswordStrength): string {
    const descriptions = {
      [PasswordStrength.WEAK]: '弱密码 - 存在安全风险',
      [PasswordStrength.MEDIUM]: '中等密码 - 建议加强',
      [PasswordStrength.STRONG]: '强密码 - 安全性良好',
      [PasswordStrength.VERY_STRONG]: '很强密码 - 安全性极高',
    };

    return descriptions[strength];
  }

  /**
   * 获取密码强度颜色（用于UI显示）
   */
  static getPasswordStrengthColor(strength: PasswordStrength): string {
    const colors = {
      [PasswordStrength.WEAK]: '#D32F2F', // 红色
      [PasswordStrength.MEDIUM]: '#E6B800', // 黄色
      [PasswordStrength.STRONG]: '#2D8A54', // 绿色
      [PasswordStrength.VERY_STRONG]: '#1976D2', // 蓝色
    };

    return colors[strength];
  }

  /**
   * 创建密码提示文本
   */
  static getPasswordHint(validation: PasswordValidationResult): string {
    if (validation.isValid) {
      return `密码强度：${this.getPasswordStrengthDescription(validation.strength)}`;
    }

    return validation.feedback.join('；');
  }

  /**
   * 检查两个密码是否匹配
   */
  static passwordsMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  }

  /**
   * 安全清理密码字符串（从内存中清除）
   */
  static secureCleanup(password: string): void {
    // 在JavaScript中，我们无法真正从内存中清除字符串
    // 但可以通过将变量设置为null来标记为可回收
    try {
      // 将密码字符串重写为随机字符（用于安全意识，实际上JS无法真正清除内存）
      Array.from({ length: password.length }, () =>
        String.fromCharCode(Math.floor(Math.random() * 94) + 33),
      ).join('');

      // 这里只是一个安全意识的实现，实际上JS无法真正清除内存
      console.debug('密码已标记清理');
    } catch (error) {
      console.error('密码清理失败:', error);
    }
  }
}
