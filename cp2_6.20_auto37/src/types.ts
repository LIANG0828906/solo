export type PromotionType = 'DISCOUNT' | 'FULL_REDUCTION' | 'GIFT';

export type PromotionStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

export interface DiscountConfig {
  discountRate: number;
  minAmount?: number;
}

export interface FullReductionConfig {
  fullAmount: number;
  reductionAmount: number;
}

export interface GiftConfig {
  giftName: string;
  giftImage?: string;
  minAmount?: number;
}

export interface Promotion {
  id: string;
  name: string;
  type: PromotionType;
  description?: string;
  config: DiscountConfig | FullReductionConfig | GiftConfig;
  startTime: string;
  endTime: string;
  status: PromotionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TargetingConfig {
  userTags?: string[];
  minUserLevel?: number;
  regions?: string[];
}

export interface TestGroup {
  id: string;
  name: string;
  weight: number;
  promotionId?: string;
  config?: Record<string, any>;
}

export interface GroupStats {
  groupId: string;
  groupName: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  clickRate: number;
  conversionRate: number;
}

export interface RealtimeStats {
  timestamp: string;
  groups: GroupStats[];
}

export interface HistoryData {
  date: string;
  groups: GroupStats[];
}

export interface ABTest {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'ENDED';
  groups: TestGroup[];
  targeting?: TargetingConfig;
  startTime: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromotionDto {
  name: string;
  type: PromotionType;
  description?: string;
  config: DiscountConfig | FullReductionConfig | GiftConfig;
  startTime: string;
  endTime: string;
}

export interface UpdatePromotionDto {
  name?: string;
  description?: string;
  config?: DiscountConfig | FullReductionConfig | GiftConfig;
  startTime?: string;
  endTime?: string;
  status?: PromotionStatus;
}

export interface CreateABTestDto {
  name: string;
  description?: string;
  groups: Omit<TestGroup, 'id'>[];
  targeting?: TargetingConfig;
  startTime: string;
  endTime?: string;
}

export interface UserGroup {
  id: string;
  name: string;
  userCount: number;
  description?: string;
  criteria: Record<string, any>;
  createdAt: string;
}
