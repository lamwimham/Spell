/**
 * 权限服务 - 角色权限检查与访问控制
 * 基于RBAC（基于角色的访问控制）模式实现精细化权限管理
 */

import { UserRole } from '../../database/models/User';
import { AuthService } from '../auth/authService';

// 权限枚举
export enum Permission {
  // 基础权限
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',

  // 录音相关权限
  RECORDING_CREATE = 'recording:create',
  RECORDING_EDIT = 'recording:edit',
  RECORDING_DELETE = 'recording:delete',
  RECORDING_SHARE = 'recording:share',

  // AI功能权限
  AI_BASIC = 'ai:basic',
  AI_ENHANCED = 'ai:enhanced',
  AI_UNLIMITED = 'ai:unlimited',

  // 数据管理权限
  DATA_EXPORT = 'data:export',
  DATA_IMPORT = 'data:import',
  DATA_BACKUP = 'data:backup',

  // 用户管理权限
  USER_VIEW = 'user:view',
  USER_EDIT = 'user:edit',
  USER_DELETE = 'user:delete',
  USER_MANAGE = 'user:manage',

  // 系统管理权限
  SYSTEM_SETTINGS = 'system:settings',
  SYSTEM_LOGS = 'system:logs',
  SYSTEM_ADMIN = 'system:admin',

  // 打卡相关权限
  CHECKIN_VIEW = 'checkin:view',
  CHECKIN_CREATE = 'checkin:create',
  CHECKIN_STATS = 'checkin:stats',

  // 统计分析权限
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',
}

// 资源类型枚举
export enum ResourceType {
  RECORDING = 'recording',
  USER = 'user',
  CHECKIN = 'checkin',
  AI_USAGE = 'ai_usage',
  QUOTA = 'quota',
  SYSTEM = 'system',
}

// 权限上下文接口
export interface PermissionContext {
  userId?: string;
  resourceId?: string;
  resourceType?: ResourceType;
  resourceOwnerId?: string;
  additionalData?: Record<string, any>;
}

// 权限检查结果接口
export interface PermissionResult {
  granted: boolean;
  reason?: string;
  suggestions?: string[];
}

// 角色权限映射
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  guest: [
    Permission.READ,
    Permission.RECORDING_CREATE,
    Permission.AI_BASIC,
    Permission.CHECKIN_VIEW,
    Permission.CHECKIN_CREATE,
  ],

  user: [
    Permission.READ,
    Permission.WRITE,
    Permission.RECORDING_CREATE,
    Permission.RECORDING_EDIT,
    Permission.RECORDING_DELETE,
    Permission.AI_BASIC,
    Permission.AI_ENHANCED,
    Permission.CHECKIN_VIEW,
    Permission.CHECKIN_CREATE,
    Permission.CHECKIN_STATS,
    Permission.DATA_EXPORT,
    Permission.USER_VIEW,
    Permission.USER_EDIT,
    Permission.ANALYTICS_VIEW,
  ],

  premium: [
    Permission.READ,
    Permission.WRITE,
    Permission.DELETE,
    Permission.RECORDING_CREATE,
    Permission.RECORDING_EDIT,
    Permission.RECORDING_DELETE,
    Permission.RECORDING_SHARE,
    Permission.AI_BASIC,
    Permission.AI_ENHANCED,
    Permission.AI_UNLIMITED,
    Permission.CHECKIN_VIEW,
    Permission.CHECKIN_CREATE,
    Permission.CHECKIN_STATS,
    Permission.DATA_EXPORT,
    Permission.DATA_IMPORT,
    Permission.DATA_BACKUP,
    Permission.USER_VIEW,
    Permission.USER_EDIT,
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
  ],

  admin: Object.values(Permission), // 管理员拥有所有权限
};

// 权限层级定义
const PERMISSION_HIERARCHY: Record<Permission, Permission[]> = {
  [Permission.AI_UNLIMITED]: [Permission.AI_ENHANCED, Permission.AI_BASIC],
  [Permission.AI_ENHANCED]: [Permission.AI_BASIC],
  [Permission.WRITE]: [Permission.READ],
  [Permission.DELETE]: [Permission.WRITE, Permission.READ],
  [Permission.USER_MANAGE]: [Permission.USER_DELETE, Permission.USER_EDIT, Permission.USER_VIEW],
  [Permission.USER_DELETE]: [Permission.USER_EDIT, Permission.USER_VIEW],
  [Permission.USER_EDIT]: [Permission.USER_VIEW],
  [Permission.SYSTEM_ADMIN]: [Permission.SYSTEM_SETTINGS, Permission.SYSTEM_LOGS],
  [Permission.SYSTEM_SETTINGS]: [Permission.SYSTEM_LOGS],
  [Permission.DATA_BACKUP]: [Permission.DATA_EXPORT, Permission.DATA_IMPORT],
  [Permission.ANALYTICS_EXPORT]: [Permission.ANALYTICS_VIEW],
  [Permission.CHECKIN_STATS]: [Permission.CHECKIN_VIEW],
};

export class PermissionService {
  /**
   * 检查用户是否具有指定权限
   */
  static async hasPermission(
    permission: Permission,
    context?: PermissionContext,
  ): Promise<PermissionResult> {
    try {
      const currentUser = await AuthService.getCurrentUser();

      if (!currentUser) {
        return {
          granted: false,
          reason: '用户未登录',
          suggestions: ['请先登录账户'],
        };
      }

      // 检查用户状态
      if (currentUser.status !== 'active') {
        return {
          granted: false,
          reason: '账户状态异常',
          suggestions: ['请联系管理员检查账户状态'],
        };
      }

      // 获取用户角色权限
      const rolePermissions = this.getRolePermissions(currentUser.role);

      // 检查直接权限
      if (rolePermissions.includes(permission)) {
        // 检查资源所有权（如果需要）
        const ownershipCheck = await this.checkResourceOwnership(
          currentUser.id,
          permission,
          context,
        );

        if (!ownershipCheck.granted) {
          return ownershipCheck;
        }

        return { granted: true };
      }

      // 检查继承权限
      const inheritedPermissions = this.getInheritedPermissions(rolePermissions);
      if (inheritedPermissions.includes(permission)) {
        const ownershipCheck = await this.checkResourceOwnership(
          currentUser.id,
          permission,
          context,
        );

        if (!ownershipCheck.granted) {
          return ownershipCheck;
        }

        return { granted: true };
      }

      // 权限不足
      return {
        granted: false,
        reason: '权限不足',
        suggestions: this.getPermissionSuggestions(currentUser.role, permission),
      };
    } catch (error) {
      console.error('权限检查失败:', error);
      return {
        granted: false,
        reason: '权限检查失败',
        suggestions: ['请稍后重试或联系技术支持'],
      };
    }
  }

  /**
   * 批量检查权限
   */
  static async hasPermissions(
    permissions: Permission[],
    context?: PermissionContext,
  ): Promise<Record<Permission, PermissionResult>> {
    const results: Record<Permission, PermissionResult> = {} as any;

    for (const permission of permissions) {
      results[permission] = await this.hasPermission(permission, context);
    }

    return results;
  }

  /**
   * 检查用户是否具有访问资源的权限
   */
  static async canAccessResource(
    resourceType: ResourceType,
    resourceId: string,
    action: 'read' | 'write' | 'delete' = 'read',
  ): Promise<PermissionResult> {
    const permissionMap: Record<string, Permission> = {
      [`${resourceType}:read`]: Permission.READ,
      [`${resourceType}:write`]: Permission.WRITE,
      [`${resourceType}:delete`]: Permission.DELETE,
      'recording:read': Permission.READ,
      'recording:write': Permission.RECORDING_EDIT,
      'recording:delete': Permission.RECORDING_DELETE,
      'user:read': Permission.USER_VIEW,
      'user:write': Permission.USER_EDIT,
      'user:delete': Permission.USER_DELETE,
    };

    const permission = permissionMap[`${resourceType}:${action}`] || Permission.READ;

    return await this.hasPermission(permission, {
      resourceType,
      resourceId,
    });
  }

  /**
   * 获取角色的所有权限
   */
  static getRolePermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * 获取权限的详细信息
   */
  static getPermissionInfo(permission: Permission): {
    name: string;
    description: string;
    category: string;
  } {
    const permissionInfo: Record<
      Permission,
      { name: string; description: string; category: string }
    > = {
      [Permission.READ]: { name: '读取', description: '查看内容', category: '基础' },
      [Permission.WRITE]: { name: '写入', description: '创建和编辑内容', category: '基础' },
      [Permission.DELETE]: { name: '删除', description: '删除内容', category: '基础' },

      [Permission.RECORDING_CREATE]: {
        name: '创建录音',
        description: '创建新的录音',
        category: '录音',
      },
      [Permission.RECORDING_EDIT]: {
        name: '编辑录音',
        description: '编辑录音内容',
        category: '录音',
      },
      [Permission.RECORDING_DELETE]: {
        name: '删除录音',
        description: '删除录音文件',
        category: '录音',
      },
      [Permission.RECORDING_SHARE]: {
        name: '分享录音',
        description: '分享录音给其他用户',
        category: '录音',
      },

      [Permission.AI_BASIC]: { name: 'AI基础功能', description: '使用基础AI功能', category: 'AI' },
      [Permission.AI_ENHANCED]: {
        name: 'AI增强功能',
        description: '使用增强AI功能',
        category: 'AI',
      },
      [Permission.AI_UNLIMITED]: {
        name: 'AI无限制',
        description: '无限制使用AI功能',
        category: 'AI',
      },

      [Permission.DATA_EXPORT]: { name: '数据导出', description: '导出个人数据', category: '数据' },
      [Permission.DATA_IMPORT]: { name: '数据导入', description: '导入数据', category: '数据' },
      [Permission.DATA_BACKUP]: {
        name: '数据备份',
        description: '备份和恢复数据',
        category: '数据',
      },

      [Permission.USER_VIEW]: { name: '查看用户', description: '查看用户信息', category: '用户' },
      [Permission.USER_EDIT]: { name: '编辑用户', description: '编辑用户信息', category: '用户' },
      [Permission.USER_DELETE]: { name: '删除用户', description: '删除用户账户', category: '用户' },
      [Permission.USER_MANAGE]: {
        name: '用户管理',
        description: '完整的用户管理权限',
        category: '用户',
      },

      [Permission.SYSTEM_SETTINGS]: {
        name: '系统设置',
        description: '修改系统设置',
        category: '系统',
      },
      [Permission.SYSTEM_LOGS]: { name: '系统日志', description: '查看系统日志', category: '系统' },
      [Permission.SYSTEM_ADMIN]: {
        name: '系统管理',
        description: '完整的系统管理权限',
        category: '系统',
      },

      [Permission.CHECKIN_VIEW]: {
        name: '查看打卡',
        description: '查看打卡记录',
        category: '打卡',
      },
      [Permission.CHECKIN_CREATE]: {
        name: '创建打卡',
        description: '进行打卡操作',
        category: '打卡',
      },
      [Permission.CHECKIN_STATS]: {
        name: '打卡统计',
        description: '查看打卡统计数据',
        category: '打卡',
      },

      [Permission.ANALYTICS_VIEW]: {
        name: '查看分析',
        description: '查看数据分析',
        category: '分析',
      },
      [Permission.ANALYTICS_EXPORT]: {
        name: '导出分析',
        description: '导出分析报告',
        category: '分析',
      },
    };

    return permissionInfo[permission] || { name: '未知权限', description: '', category: '其他' };
  }

  /**
   * 获取用户可用的权限列表
   */
  static async getUserPermissions(): Promise<Permission[]> {
    const currentUser = await AuthService.getCurrentUser();
    if (!currentUser) return [];

    const rolePermissions = this.getRolePermissions(currentUser.role);
    return this.getInheritedPermissions(rolePermissions);
  }

  /**
   * 检查资源所有权
   */
  private static async checkResourceOwnership(
    userId: string,
    permission: Permission,
    context?: PermissionContext,
  ): Promise<PermissionResult> {
    if (!context?.resourceId || !context?.resourceType) {
      return { granted: true }; // 无需检查所有权
    }

    // 对于某些权限，需要检查资源所有权
    const ownershipRequiredPermissions = [
      Permission.RECORDING_EDIT,
      Permission.RECORDING_DELETE,
      Permission.USER_EDIT,
    ];

    if (!ownershipRequiredPermissions.includes(permission)) {
      return { granted: true };
    }

    // 管理员可以访问所有资源
    const currentUser = await AuthService.getCurrentUser();
    if (currentUser?.role === 'admin') {
      return { granted: true };
    }

    // 检查资源所有权
    if (context.resourceOwnerId && context.resourceOwnerId !== userId) {
      return {
        granted: false,
        reason: '只能操作自己的资源',
        suggestions: ['您只能编辑自己创建的内容'],
      };
    }

    return { granted: true };
  }

  /**
   * 获取继承的权限（基于权限层级）
   */
  private static getInheritedPermissions(basePermissions: Permission[]): Permission[] {
    const allPermissions = new Set(basePermissions);

    for (const permission of basePermissions) {
      const inherited = PERMISSION_HIERARCHY[permission] || [];
      inherited.forEach(p => allPermissions.add(p));
    }

    return Array.from(allPermissions);
  }

  /**
   * 获取权限建议
   */
  private static getPermissionSuggestions(role: UserRole, permission: Permission): string[] {
    const suggestions: string[] = [];

    if (role === 'guest') {
      suggestions.push('注册账户以获得更多权限');
    } else if (role === 'user') {
      if ([Permission.AI_UNLIMITED, Permission.DATA_BACKUP].includes(permission)) {
        suggestions.push('升级到高级用户以解锁此功能');
      }
    }

    if ([Permission.SYSTEM_ADMIN, Permission.USER_MANAGE].includes(permission)) {
      suggestions.push('此功能仅限管理员使用');
    }

    if (suggestions.length === 0) {
      suggestions.push('联系管理员了解如何获取此权限');
    }

    return suggestions;
  }
}
