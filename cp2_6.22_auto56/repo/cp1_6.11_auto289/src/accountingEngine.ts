import type { LedgerEntry, AccountState, BillNote } from './types';

const EXCHANGE_RATE = 1000;

export class AccountingEngine {
  private state: AccountState;
  private listeners: Set<() => void> = new Set();
  private historySnapshots: AccountState[] = [];

  constructor() {
    this.state = {
      copperBalance: 5000,
      silverBalance: 100,
      ledger: [],
      currentTimeIndex: 0,
      isPlaying: false
    };
    this.saveSnapshot();
  }

  getState(): Readonly<AccountState> {
    return this.state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(listener => listener());
  }

  exchangeCopperToSilver(copperAmount: number): { success: boolean; silverAmount: number; message: string } {
    if (copperAmount <= 0) {
      return { success: false, silverAmount: 0, message: '兑换数量须大于零' };
    }
    if (this.state.copperBalance < copperAmount) {
      return { success: false, silverAmount: 0, message: '铜钱余额不足' };
    }

    const silverAmount = copperAmount / EXCHANGE_RATE;
    const entry: LedgerEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      date: new Date(),
      summary: `铜钱兑换白银 ${copperAmount}文`,
      copperChange: -copperAmount,
      silverChange: silverAmount
    };

    this.state.copperBalance -= copperAmount;
    this.state.silverBalance += silverAmount;
    this.state.ledger.push(entry);
    this.state.currentTimeIndex = this.state.ledger.length;

    this.saveSnapshot();
    this.notify();

    return { success: true, silverAmount, message: '兑换成功' };
  }

  exchangeSilverToCopper(silverAmount: number): { success: boolean; copperAmount: number; message: string } {
    if (silverAmount <= 0) {
      return { success: false, copperAmount: 0, message: '兑换数量须大于零' };
    }
    if (this.state.silverBalance < silverAmount) {
      return { success: false, copperAmount: 0, message: '白银余额不足' };
    }

    const copperAmount = silverAmount * EXCHANGE_RATE;
    const entry: LedgerEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      date: new Date(),
      summary: `白银兑换铜钱 ${silverAmount}两`,
      copperChange: copperAmount,
      silverChange: -silverAmount
    };

    this.state.copperBalance += copperAmount;
    this.state.silverBalance -= silverAmount;
    this.state.ledger.push(entry);
    this.state.currentTimeIndex = this.state.ledger.length;

    this.saveSnapshot();
    this.notify();

    return { success: true, copperAmount, message: '兑换成功' };
  }

  issueBillNote(amount: number, issuer: '本号' | '他号'): { success: boolean; bill: BillNote | null; message: string } {
    if (amount <= 0 || amount > 1000) {
      return { success: false, bill: null, message: '票据金额须在1两至1000两之间' };
    }
    if (issuer === '本号' && this.state.silverBalance < amount) {
      return { success: false, bill: null, message: '白银储备不足，无法签发本号票据' };
    }

    const bill: BillNote = {
      id: `bill_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      amount,
      issuer,
      date: new Date(),
      sealPosition: { x: 0.75, y: 0.85 },
      isUnrolling: true,
      unrollProgress: 0
    };

    if (issuer === '本号') {
      const entry: LedgerEntry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        date: new Date(),
        summary: `签发本号银票 ${amount}两`,
        copperChange: 0,
        silverChange: -amount
      };
      this.state.silverBalance -= amount;
      this.state.ledger.push(entry);
    } else {
      const entry: LedgerEntry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        date: new Date(),
        summary: `收存他号银票 ${amount}两`,
        copperChange: 0,
        silverChange: amount
      };
      this.state.silverBalance += amount;
      this.state.ledger.push(entry);
    }

    this.state.currentTimeIndex = this.state.ledger.length;
    this.saveSnapshot();
    this.notify();

    return { success: true, bill, message: '票据签发成功' };
  }

  verifyBalance(): { balanced: boolean; difference: number; totalAssets: number } {
    let totalCopper = 0;
    let totalSilver = 0;

    for (let i = 0; i < this.state.currentTimeIndex; i++) {
      const entry = this.state.ledger[i];
      totalCopper += entry.copperChange;
      totalSilver += entry.silverChange;
    }

    const expectedCopper = 5000 + totalCopper;
    const expectedSilver = 100 + totalSilver;

    const copperDiff = this.state.copperBalance - expectedCopper;
    const silverDiff = this.state.silverBalance - expectedSilver;
    const totalDiff = copperDiff + silverDiff * EXCHANGE_RATE;

    const totalAssets = this.state.copperBalance + this.state.silverBalance * EXCHANGE_RATE;

    return {
      balanced: Math.abs(totalDiff) < 0.01,
      difference: totalDiff,
      totalAssets
    };
  }

  private saveSnapshot(): void {
    const snapshot: AccountState = {
      copperBalance: this.state.copperBalance,
      silverBalance: this.state.silverBalance,
      ledger: [...this.state.ledger],
      currentTimeIndex: this.state.currentTimeIndex,
      isPlaying: this.state.isPlaying
    };
    this.historySnapshots.push(snapshot);
  }

  goToTime(index: number): void {
    if (index < 0 || index > this.state.ledger.length) return;

    this.state.currentTimeIndex = index;

    let copperBal = 5000;
    let silverBal = 100;

    for (let i = 0; i < index; i++) {
      copperBal += this.state.ledger[i].copperChange;
      silverBal += this.state.ledger[i].silverChange;
    }

    this.state.copperBalance = copperBal;
    this.state.silverBalance = silverBal;

    this.notify();
  }

  getLedgerLength(): number {
    return this.state.ledger.length;
  }

  getCurrentTimeIndex(): number {
    return this.state.currentTimeIndex;
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  formatNumber(num: number): string {
    if (Number.isInteger(num)) {
      return num.toLocaleString('zh-CN');
    }
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}
