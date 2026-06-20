export type CouponType = 'fixed' | 'discount' | 'gift';

export interface CouponRule {
  minAmount?: number;
  maxDiscount: number;
  applicableProducts: string[];
  userLevel?: number;
}

export interface Coupon {
  id: string;
  name: string;
  type: CouponType;
  rule: CouponRule;
  totalQuantity: number;
  claimedQuantity: number;
  validFrom: string;
  validUntil: string;
  createdAt: string;
}

export interface ClaimedCoupon {
  couponId: string;
  userId: string;
  claimedAt: string;
  used: boolean;
  usedAt?: string;
}

export interface CouponData {
  coupons: Coupon[];
  claims: ClaimedCoupon[];
}

export interface CouponWithClaimed extends Coupon {
  claimed: boolean;
}

export interface ClaimedCouponWithCoupon extends ClaimedCoupon {
  coupon: Coupon;
}
