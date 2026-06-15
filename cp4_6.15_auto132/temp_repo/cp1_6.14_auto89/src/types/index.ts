// ============================================================
// 类型定义文件
// 数据流向：后端 API 返回数据 → 前端组件使用
// 调用关系：src/utils/styleGenerator.ts、src/pages/*.tsx、src/components/*.tsx
// ============================================================

/** 衣物分类类型 */
export type ClothCategory = 'top' | 'bottom' | 'shoes' | 'accessory';

/** 衣物风格类型 */
export type ClothStyle = '通勤' | '休闲' | '约会' | '运动' | '正式' | '复古' | '街头';

/** 衣物季节类型 */
export type ClothSeason = '春' | '夏' | '秋' | '冬' | '四季';

/**
 * 衣物接口
 * 用于描述用户衣橱中的单件衣物
 */
export interface Cloth {
  /** 衣物唯一标识 */
  id: string;
  /** 所属用户 ID */
  userId: string;
  /** 衣物名称 */
  name: string;
  /** 衣物分类 */
  category: ClothCategory;
  /** 衣物图片 URL */
  imageUrl: string;
  /** 风格标签数组 */
  styles: ClothStyle[];
  /** 适用季节数组 */
  seasons: ClothSeason[];
  /** 排序序号 */
  order: number;
  /** 创建时间 */
  createdAt: string;
}

/**
 * 穿搭接口
 * 用于描述用户创建的一套穿搭组合
 */
export interface Outfit {
  /** 穿搭唯一标识 */
  id: string;
  /** 所属用户 ID */
  userId: string;
  /** 穿搭名称 */
  name: string;
  /** 穿搭描述 */
  description: string;
  /** 上装衣物 ID（可选） */
  topId?: string;
  /** 下装衣物 ID（可选） */
  bottomId?: string;
  /** 鞋履衣物 ID（可选） */
  shoesId?: string;
  /** 配饰衣物 ID（可选） */
  accessoryId?: string;
  /** 风格标签数组 */
  styleTags: string[];
  /** 创建时间 */
  createdAt: string;
}

/**
 * 用户接口（包含敏感信息）
 * 仅在登录、注册等认证场景使用
 */
export interface User {
  /** 用户唯一标识 */
  id: string;
  /** 用户名 */
  username: string;
  /** 密码（加密存储） */
  password: string;
  /** 头像 URL（可选） */
  avatar?: string;
  /** 个人简介（可选） */
  bio?: string;
  /** 创建时间 */
  createdAt: string;
}

/**
 * 公开用户接口（不含敏感信息）
 * 用于用户列表、用户详情等公开场景
 */
export type PublicUser = Omit<User, 'password'>;

/** 交换请求状态类型 */
export type SwapStatus = 'pending' | 'accepted' | 'rejected';

/**
 * 衣物交换请求接口
 * 用于描述用户之间的衣物交换请求
 */
export interface SwapRequest {
  /** 请求唯一标识 */
  id: string;
  /** 发起请求的用户 ID */
  fromUserId: string;
  /** 接收请求的用户 ID */
  toUserId: string;
  /** 发起方提供的衣物 ID */
  offeredClothId: string;
  /** 发起方请求的衣物 ID */
  requestedClothId: string;
  /** 请求状态 */
  status: SwapStatus;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}
