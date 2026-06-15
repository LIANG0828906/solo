import type { Expense, Participant, SettlementItem, DebtRecord, SplitDetail } from '../shared/types';
import { generateId, roundToTwo } from '../shared/utils';

export function calculateDebts(
  expenses: Expense[],
  participants: Participant[]
): DebtRecord[] {
  const debtMap = new Map<string, DebtRecord>();

  participants.forEach((p) => {
    debtMap.set(p.id, {
      participantId: p.id,
      paid: 0,
      shouldPay: 0,
      balance: 0,
    });
  });

  expenses
    .filter((e) => !e.isSettled)
    .forEach((expense) => {
      const payerRecord = debtMap.get(expense.payerId);
      if (payerRecord) {
        payerRecord.paid = roundToTwo(payerRecord.paid + expense.amount);
      }

      expense.splitDetails.forEach((detail: SplitDetail) => {
        if (!detail.included) return;
        const record = debtMap.get(detail.participantId);
        if (record) {
          record.shouldPay = roundToTwo(record.shouldPay + detail.amount);
        }
      });
    });

  const result: DebtRecord[] = [];
  debtMap.forEach((record) => {
    record.balance = roundToTwo(record.paid - record.shouldPay);
    result.push(record);
  });

  return result;
}

export function generateSettlement(debts: DebtRecord[]): SettlementItem[] {
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  debts.forEach((d) => {
    if (d.balance > 0.009) {
      creditors.push({ id: d.participantId, amount: d.balance });
    } else if (d.balance < -0.009) {
      debtors.push({ id: d.participantId, amount: -d.balance });
    }
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const items: SettlementItem[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const transferAmount = Math.min(debtor.amount, creditor.amount);
    const roundedAmount = roundToTwo(transferAmount);

    if (roundedAmount > 0.009) {
      items.push({
        id: generateId(),
        fromParticipantId: debtor.id,
        toParticipantId: creditor.id,
        amount: roundedAmount,
        isIgnored: false,
        isAdjusted: false,
      });
    }

    debtor.amount = roundToTwo(debtor.amount - transferAmount);
    creditor.amount = roundToTwo(creditor.amount - transferAmount);

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return items;
}

export function calculateExpenseSplit(
  totalAmount: number,
  splitType: 'equal' | 'proportion' | 'designated',
  details: Array<{ participantId: string; weight: number; included: boolean }>
): Array<{ participantId: string; weight: number; amount: number; included: boolean }> {
  const includedDetails = details.filter((d) => d.included);

  if (includedDetails.length === 0) {
    return details.map((d) => ({ ...d, amount: 0 }));
  }

  const result = details.map((d) => ({ ...d, amount: 0 }));

  if (splitType === 'equal') {
    const perPerson = roundToTwo(totalAmount / includedDetails.length);
    let assigned = 0;
    includedDetails.forEach((d, idx) => {
      const target = result.find((r) => r.participantId === d.participantId);
      if (target) {
        if (idx === includedDetails.length - 1) {
          target.amount = roundToTwo(totalAmount - assigned);
        } else {
          target.amount = perPerson;
          assigned = roundToTwo(assigned + perPerson);
        }
      }
    });
  } else if (splitType === 'proportion') {
    const totalWeight = includedDetails.reduce((sum, d) => sum + d.weight, 0);
    if (totalWeight <= 0) {
      return result;
    }
    let assigned = 0;
    includedDetails.forEach((d, idx) => {
      const target = result.find((r) => r.participantId === d.participantId);
      if (target) {
        const rawAmount = (totalAmount * d.weight) / totalWeight;
        if (idx === includedDetails.length - 1) {
          target.amount = roundToTwo(totalAmount - assigned);
        } else {
          target.amount = roundToTwo(rawAmount);
          assigned = roundToTwo(assigned + target.amount);
        }
      }
    });
  } else if (splitType === 'designated') {
    includedDetails.forEach((d) => {
      const target = result.find((r) => r.participantId === d.participantId);
      if (target) {
        target.amount = roundToTwo(d.weight);
      }
    });
  }

  return result;
}
