export interface Specification {
  id: string;
  label: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  unitPrice: number;
  specifications: Specification[];
}

export interface OrderItem {
  specId: string;
  specLabel: string;
  productName: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Member {
  id: string;
  nickname: string;
  phone: string;
  orderItems: OrderItem[];
  subtotal: number;
  joinedAt: number;
}

export interface GroupBuy {
  id: string;
  title: string;
  deadline: string;
  maxMembers: number;
  freight: number;
  creator: string;
  coverGradient: string;
  products: Product[];
  members: Member[];
  createdAt: number;
}

export interface FreightSplitResult {
  nickname: string;
  totalPurchase: number;
  ratio: number;
  freightShare: number;
  memberId: string;
}

export interface NewGroupInput {
  title: string;
  deadline: string;
  maxMembers: number;
  freight: number;
  creator: string;
  products: Array<{
    name: string;
    unitPrice: number;
    specifications: Array<{ label: string; stock: number }>;
  }>;
}

export interface NewMemberInput {
  nickname: string;
  phone: string;
  orderItems: Array<{
    productId: string;
    specId: string;
    specLabel: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
}
