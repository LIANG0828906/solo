export type ComponentType = 'banner' | 'product-grid' | 'coupon';

export interface LayoutComponentStyle {
  backgroundColor: string;
  padding: number;
  fontSize: number;
}

export interface BannerProps {
  imageUrl: string;
  link: string;
}

export interface ProductGridProps {
  columns: 2 | 3;
}

export interface CouponProps {
  title: string;
  discountCode: string;
}

export type ComponentProps = BannerProps | ProductGridProps | CouponProps;

export interface LayoutComponent {
  id: string;
  type: ComponentType;
  position: number;
  style: LayoutComponentStyle;
  props: ComponentProps;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

export interface StoreData {
  id: string;
  name: string;
  components: LayoutComponent[];
}
