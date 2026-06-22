export interface Participant {
  id: string;
  name: string;
  color: string;
  paid: boolean;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sharedBy: string[];
  isSharedByAll: boolean;
  emoji: string;
}

export interface Order {
  id: string;
  name: string;
  maxAmount?: number;
  participants: Participant[];
  items: OrderItem[];
  createdAt: string;
}

export interface SplitDetail {
  itemId: string;
  itemName: string;
  amount: number;
  emoji: string;
}

export interface ParticipantSplit {
  participantId: string;
  participantName: string;
  participantColor: string;
  total: number;
  details: SplitDetail[];
  paid: boolean;
}

export interface SplitResult {
  orderId: string;
  totalAmount: number;
  splits: ParticipantSplit[];
}

export function calculateSplit(order: Order): SplitResult {
  const { participants, items, id } = order;
  const totalParticipants = participants.length;

  const splitMap = new Map<string, SplitDetail[]>();
  participants.forEach((p) => {
    splitMap.set(p.id, []);
  });

  let totalAmount = 0;

  items.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    totalAmount += itemTotal;

    if (item.isSharedByAll) {
      const perPerson = itemTotal / totalParticipants;
      participants.forEach((p) => {
        splitMap.get(p.id)!.push({
          itemId: item.id,
          itemName: item.name,
          amount: Math.round(perPerson * 100) / 100,
          emoji: item.emoji,
        });
      });
    } else if (item.sharedBy.length === 1) {
      const pid = item.sharedBy[0];
      if (splitMap.has(pid)) {
        splitMap.get(pid)!.push({
          itemId: item.id,
          itemName: item.name,
          amount: Math.round(itemTotal * 100) / 100,
          emoji: item.emoji,
        });
      }
    } else if (item.sharedBy.length > 1) {
      const perPerson = itemTotal / item.sharedBy.length;
      item.sharedBy.forEach((pid) => {
        if (splitMap.has(pid)) {
          splitMap.get(pid)!.push({
            itemId: item.id,
            itemName: item.name,
            amount: Math.round(perPerson * 100) / 100,
            emoji: item.emoji,
          });
        }
      });
    }
  });

  const splits: ParticipantSplit[] = participants.map((p) => {
    const details = splitMap.get(p.id) || [];
    const total =
      Math.round(details.reduce((sum, d) => sum + d.amount, 0) * 100) / 100;
    return {
      participantId: p.id,
      participantName: p.name,
      participantColor: p.color,
      total,
      details,
      paid: p.paid,
    };
  });

  return {
    orderId: id,
    totalAmount: Math.round(totalAmount * 100) / 100,
    splits,
  };
}
