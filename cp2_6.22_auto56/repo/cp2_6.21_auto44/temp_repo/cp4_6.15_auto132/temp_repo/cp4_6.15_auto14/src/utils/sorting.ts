import type { Order, CommunityGroup, ProductSummary, CustomerDetail } from '../types';

export function groupOrdersByCommunity(orders: Order[]): CommunityGroup[] {
  const communityMap = new Map<string, Order[]>();

  for (const order of orders) {
    if (!communityMap.has(order.community)) {
      communityMap.set(order.community, []);
    }
    communityMap.get(order.community)!.push(order);
  }

  const result: CommunityGroup[] = [];

  for (const [community, communityOrders] of communityMap) {
    const productMap = new Map<string, ProductSummary>();

    for (const order of communityOrders) {
      if (!productMap.has(order.productName)) {
        productMap.set(order.productName, {
          productName: order.productName,
          totalQuantity: 0,
          customers: [],
        });
      }
      const summary = productMap.get(order.productName)!;
      summary.totalQuantity += order.quantity;
      summary.customers.push({
        customerName: order.customerName,
        phone: order.phone,
        quantity: order.quantity,
      });
    }

    result.push({
      community,
      products: Array.from(productMap.values()),
      orders: communityOrders,
    });
  }

  result.sort((a, b) => a.community.localeCompare(b.community, 'zh-CN'));
  return result;
}

export function getCommunityCustomers(orders: Order[]): CustomerDetail[] {
  const customerMap = new Map<string, CustomerDetail>();

  for (const order of orders) {
    const key = `${order.customerName}-${order.phone}`;
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        customerName: order.customerName,
        phone: order.phone,
        quantity: 0,
      });
    }
    customerMap.get(key)!.quantity += order.quantity;
  }

  return Array.from(customerMap.values());
}
