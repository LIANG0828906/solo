import { Order, SavedCustomization } from '../types';

export class OrderService {
  private static instance: OrderService;
  private orders: Order[] = [];

  private constructor() {}

  static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  validateOrder(order: Omit<Order, 'id'>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!order.customerName || order.customerName.trim().length < 2) {
      errors.push('请输入有效的姓名');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!order.email || !emailRegex.test(order.email)) {
      errors.push('请输入有效的邮箱地址');
    }

    if (!order.deliveryDate) {
      errors.push('请选择期望收货日期');
    } else {
      const deliveryDate = new Date(order.deliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const minDate = new Date(today);
      minDate.setDate(today.getDate() + 14);

      if (deliveryDate < minDate) {
        errors.push('定制周期需要至少14天，请选择更晚的日期');
      }
    }

    if (!order.customizationId) {
      errors.push('未找到定制方案信息');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async submitOrder(
    orderData: Omit<Order, 'id'>,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; orderId: string; errors?: string[] }> {
    const validation = this.validateOrder(orderData);
    if (!validation.valid) {
      return {
        success: false,
        orderId: '',
        errors: validation.errors
      };
    }

    for (let i = 0; i <= 100; i += 25) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      onProgress?.(i);
    }

    const order: Order = {
      ...orderData,
      id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };

    this.orders.push(order);

    return {
      success: true,
      orderId: order.id
    };
  }

  generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `ECO-${year}${month}${day}-${random}`;
  }

  getEstimatedProductionDays(complexity: number): number {
    const baseDays = 7;
    const complexityDays = Math.round(complexity * 5);
    return baseDays + complexityDays;
  }

  getShippingDays(destination: string = 'domestic'): number {
    return destination === 'domestic' ? 3 : 7;
  }

  calculateDeliveryDate(
    orderDate: Date,
    complexity: number,
    destination?: string
  ): Date {
    const productionDays = this.getEstimatedProductionDays(complexity);
    const shippingDays = this.getShippingDays(destination);
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + productionDays + shippingDays);
    return deliveryDate;
  }

  createCustomizationThumbnail(
    savedCustomization: SavedCustomization,
    width: number = 400,
    height: number = 600
  ): string {
    const colors = Object.values(savedCustomization.customization.colors);
    const primaryColor = colors[0] || '#2E8B57';
    const secondaryColor = colors[1] || primaryColor;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 400 600">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:0.1" />
          </linearGradient>
          <linearGradient id="dress" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${primaryColor}" />
            <stop offset="100%" style="stop-color:${secondaryColor}" />
          </linearGradient>
        </defs>
        <rect width="400" height="600" fill="url(#bg)" rx="16" />
        <path d="M200,80 Q150,120 140,200 L120,500 Q200,550 280,500 L260,200 Q250,120 200,80" 
              fill="url(#dress)" 
              stroke="rgba(255,255,255,0.3)" 
              stroke-width="2" />
        <circle cx="200" cy="70" r="30" fill="rgba(255,255,255,0.5)" />
        <text x="200" y="570" text-anchor="middle" fill="#666" font-family="serif" font-size="14">
          ${savedCustomization.clothingName || 'Eco Fashion'}
        </text>
      </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }
}

export const orderService = OrderService.getInstance();
