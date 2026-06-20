import type { PromotionType } from './types';

export const PROMOTION_TYPE_CONFIG: Record<PromotionType, {
  label: string;
  color: string;
  bgColor: string;
  className: string;
}> = {
  DISCOUNT: {
    label: '折扣',
    color: '#2962ff',
    bgColor: 'rgba(41, 98, 255, 0.15)',
    className: 'promotion-type-discount',
  },
  FULL_REDUCTION: {
    label: '满减',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    className: 'promotion-type-full-reduction',
  },
  GIFT: {
    label: '赠品',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    className: 'promotion-type-gift',
  },
};

export type TimeStatus = 'NOT_STARTED' | 'ONGOING' | 'ENDED';

export const TIME_STATUS_CONFIG: Record<TimeStatus, {
  label: string;
  color: string;
  bgColor: string;
  dotColor: string;
  className: string;
}> = {
  ONGOING: {
    label: '进行中',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    dotColor: '#10b981',
    className: 'status-ongoing',
  },
  NOT_STARTED: {
    label: '未开始',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.15)',
    dotColor: '#6b7280',
    className: 'status-not-started',
  },
  ENDED: {
    label: '已结束',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    dotColor: '#ef4444',
    className: 'status-ended',
  },
};

export const CATEGORIES = [
  '电子产品',
  '服装',
  '食品',
  '家居',
  '美妆',
  '图书',
  '运动',
  '其他',
];

export const DATE_FORMAT = {
  DATETIME: 'yyyy-MM-dd HH:mm',
  DATE: 'yyyy-MM-dd',
  TIME: 'HH:mm',
  DATETIME_DISPLAY: 'yyyy年MM月dd日 HH:mm',
};
