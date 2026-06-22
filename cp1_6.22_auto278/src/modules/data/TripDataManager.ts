export interface Attraction {
  id: string;
  name: string;
  duration: number;
  lat: number;
  lng: number;
  budget: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  tags: string[];
  photoIds: string[];
}

export interface Expense {
  id: string;
  date: string;
  category: 'transport' | 'food' | 'ticket' | 'accommodation';
  amount: number;
  description: string;
}

export interface TripData {
  attractions: Attraction[];
  journalEntries: JournalEntry[];
  expenses: Expense[];
  totalBudget: number;
  startDate: string;
  endDate: string;
}

type Listener = () => void;

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

class TripDataManagerClass {
  private data: TripData;
  private listeners: Set<Listener> = new Set();

  constructor() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 2);

    this.data = {
      attractions: [
        {
          id: generateId(),
          name: '故宫博物院',
          duration: 180,
          lat: 39.9163,
          lng: 116.3972,
          budget: 60,
        },
        {
          id: generateId(),
          name: '天安门广场',
          duration: 60,
          lat: 39.9055,
          lng: 116.3976,
          budget: 0,
        },
        {
          id: generateId(),
          name: '颐和园',
          duration: 150,
          lat: 39.9999,
          lng: 116.2755,
          budget: 30,
        },
      ],
      journalEntries: [
        {
          id: generateId(),
          date: today.toISOString().split('T')[0],
          content: '今天游览了故宫博物院，古建筑群非常壮观，感受到了浓厚的历史文化氛围。',
          tags: ['文化', '历史'],
          photoIds: [],
        },
      ],
      expenses: [
        {
          id: generateId(),
          date: today.toISOString().split('T')[0],
          category: 'ticket',
          amount: 60,
          description: '故宫门票',
        },
        {
          id: generateId(),
          date: today.toISOString().split('T')[0],
          category: 'food',
          amount: 80,
          description: '午餐',
        },
      ],
      totalBudget: 2000,
      startDate: today.toISOString().split('T')[0],
      endDate: tomorrow.toISOString().split('T')[0],
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  getAttractions(): Attraction[] {
    return [...this.data.attractions];
  }

  addAttraction(
    attraction: Omit<Attraction, 'id'>
  ): Attraction {
    const newAttraction: Attraction = {
      ...attraction,
      id: generateId(),
    };
    this.data.attractions.push(newAttraction);
    this.notify();
    return newAttraction;
  }

  removeAttraction(id: string): void {
    this.data.attractions = this.data.attractions.filter(
      (a) => a.id !== id
    );
    this.notify();
  }

  updateAttractionOrder(ids: string[]): void {
    const map = new Map(this.data.attractions.map((a) => [a.id, a]));
    this.data.attractions = ids
      .map((id) => map.get(id))
      .filter((a): a is Attraction => a !== undefined);
    this.notify();
  }

  getTotalDistance(): number {
    let distance = 0;
    for (let i = 0; i < this.data.attractions.length - 1; i++) {
      const a = this.data.attractions[i];
      const b = this.data.attractions[i + 1];
      distance += haversineDistance(a.lat, a.lng, b.lat, b.lng);
    }
    return Math.round(distance * 100) / 100;
  }

  getTotalDuration(): number {
    return this.data.attractions.reduce(
      (sum, a) => sum + a.duration,
      0
    );
  }

  getJournalEntries(): JournalEntry[] {
    return [...this.data.journalEntries].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
  }

  addJournalEntry(
    entry: Omit<JournalEntry, 'id' | 'photoIds'>
  ): JournalEntry {
    const newEntry: JournalEntry = {
      ...entry,
      id: generateId(),
      photoIds: [],
    };
    this.data.journalEntries.push(newEntry);
    this.notify();
    return newEntry;
  }

  removeJournalEntry(id: string): void {
    this.data.journalEntries = this.data.journalEntries.filter(
      (e) => e.id !== id
    );
    this.notify();
  }

  addPhotoToJournal(journalId: string, photoId: string): void {
    const entry = this.data.journalEntries.find(
      (e) => e.id === journalId
    );
    if (entry) {
      entry.photoIds.push(photoId);
      this.notify();
    }
  }

  getExpenses(): Expense[] {
    return [...this.data.expenses];
  }

  getExpensesByDate(date: string): Expense[] {
    return this.data.expenses.filter((e) => e.date === date);
  }

  addExpense(
    expense: Omit<Expense, 'id'>
  ): Expense {
    const newExpense: Expense = {
      ...expense,
      id: generateId(),
    };
    this.data.expenses.push(newExpense);
    this.notify();
    return newExpense;
  }

  removeExpense(id: string): void {
    this.data.expenses = this.data.expenses.filter(
      (e) => e.id !== id
    );
    this.notify();
  }

  getTotalSpent(): number {
    return this.data.expenses.reduce(
      (sum, e) => sum + e.amount,
      0
    );
  }

  getTotalBudget(): number {
    return this.data.totalBudget;
  }

  setTotalBudget(budget: number): void {
    this.data.totalBudget = budget;
    this.notify();
  }

  getTripDates(): string[] {
    const dates: string[] = [];
    const start = new Date(this.data.startDate);
    const end = new Date(this.data.endDate);
    for (
      let d = new Date(start);
      d <= end;
      d.setDate(d.getDate() + 1)
    ) {
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }

  getToday(): string {
    return new Date().toISOString().split('T')[0];
  }
}

export const TripDataManager = new TripDataManagerClass();
