/**
 * 全局类型定义
 *
 * 核心类型说明：
 *   - Person：生日记录的核心数据模型，存储人物基本信息、生日日期、兴趣爱好等
 *   - Reminder：提醒配置模型，用于设置某人生日的提前提醒天数
 *   - GiftIdea：礼物推荐模型，存储单个礼物的详细信息（名称、分类、描述、购买平台等）
 *   - FormErrors：表单校验错误类型，用于新增/编辑表单的错误提示展示
 *   - INTEREST_TAGS：预定义的兴趣标签常量数组，提供给用户选择
 *   - InterestTag：从 INTEREST_TAGS 派生的联合类型，用于类型约束
 */

/**
 * 生日记录 - 核心数据模型
 * 存储一个人的基本信息和生日相关数据
 */
export interface Person {
  /** 唯一标识符，使用 uuidv4 生成 */
  id: string;
  /** 人物姓名，用于展示和生成头像颜色 */
  name: string;
  /** 生日日期，格式为 'YYYY-MM-DD' */
  birthday: string;
  /** 兴趣爱好标签数组，用于智能推荐礼物 */
  interests: string[];
  /** 头像背景颜色，由 hashStringToColor(name) 自动生成 */
  avatarColor: string;
  /** 记录创建时间戳（毫秒），用于排序和新卡片动画 */
  createdAt: number;
}

/**
 * 生日提醒配置
 * 为某个人设置提前多少天提醒
 */
export interface Reminder {
  /** 唯一标识符 */
  id: string;
  /** 关联的 Person 记录ID */
  personId: string;
  /** 提前提醒的天数，例如 7 表示生日前7天提醒 */
  daysBefore: number;
  /** 是否启用该提醒 */
  enabled: boolean;
}

/**
 * 礼物推荐信息
 * 存储单个礼物的详细数据，用于礼物推荐弹窗展示
 */
export interface GiftIdea {
  /** 唯一标识符 */
  id: string;
  /** 礼物名称 */
  name: string;
  /** 礼物分类，如 '数码'、'美妆'、'图书' 等 */
  category: string;
  /** 礼物详细描述 */
  description: string;
  /** 礼物标签，用于匹配人物兴趣 */
  tags: string[];
  /** 推荐购买平台列表，如 '京东'、'淘宝'、'拼多多' */
  platforms: string[];
  /** 卡片背景渐变色 CSS 值，如 'from-pink-500 to-rose-500' */
  gradient: string;
}

/**
 * 表单校验错误信息
 * 用于新增/编辑生日记录表单的错误提示
 * 所有字段均为可选，未出现错误时字段不存在
 */
export interface FormErrors {
  /** 姓名字段错误信息，如 '姓名不能为空' */
  name?: string;
  /** 生日日期字段错误信息，如 '请选择有效的日期' */
  birthday?: string;
  /** 兴趣标签字段错误信息，如 '请至少选择一个兴趣' */
  interests?: string;
}

/**
 * 预定义兴趣标签常量
 * 用户在新增/编辑生日记录时可从中选择兴趣爱好
 * 使用 as const 确保类型为只读元组，用于派生 InterestTag 联合类型
 */
export const INTEREST_TAGS = [
  '阅读', '旅行', '烹饪', '游戏', '运动',
  '音乐', '摄影', '手工', '宠物', '科技'
] as const;

/**
 * 兴趣标签类型 - 从 INTEREST_TAGS 常量派生的字符串联合类型
 * 等价于：'阅读' | '旅行' | '烹饪' | '游戏' | '运动' | '音乐' | '摄影' | '手工' | '宠物' | '科技'
 * 用于类型约束，确保兴趣标签只能是预定义的值
 */
export type InterestTag = typeof INTEREST_TAGS[number];
