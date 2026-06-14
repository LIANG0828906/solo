import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { Customer } from '../../shared/types/index.js';

interface SearchCacheEntry {
  results: Customer[];
  timestamp: number;
}

export class CustomerService {
  private searchCache: Map<string, SearchCacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000;
  private nameIndex: Map<string, string[]> = new Map();
  private companyIndex: Map<string, string[]> = new Map();

  constructor() {
    this.buildIndexes();
  }

  private buildIndexes(): void {
    this.nameIndex.clear();
    this.companyIndex.clear();

    for (const customer of db.data.customers) {
      const nameKey = customer.name.toLowerCase();
      const companyKey = customer.company.toLowerCase();

      if (!this.nameIndex.has(nameKey)) {
        this.nameIndex.set(nameKey, []);
      }
      this.nameIndex.get(nameKey)!.push(customer.id);

      if (!this.companyIndex.has(companyKey)) {
        this.companyIndex.set(companyKey, []);
      }
      this.companyIndex.get(companyKey)!.push(customer.id);
    }
  }

  private invalidateCache(): void {
    this.searchCache.clear();
    this.buildIndexes();
  }

  private normalizeSearchTerm(term: string): string {
    return term.trim().toLowerCase();
  }

  async searchCustomers(searchTerm?: string): Promise<Customer[]> {
    if (!searchTerm || !searchTerm.trim()) {
      return db.data.customers;
    }

    const normalizedTerm = this.normalizeSearchTerm(searchTerm);
    const cacheKey = normalizedTerm;
    const cachedEntry = this.searchCache.get(cacheKey);

    if (cachedEntry && Date.now() - cachedEntry.timestamp < this.CACHE_TTL) {
      return cachedEntry.results;
    }

    const results = this.performSearch(normalizedTerm);

    this.searchCache.set(cacheKey, {
      results,
      timestamp: Date.now()
    });

    return results;
  }

  private performSearch(term: string): Customer[] {
    const matchedIds = new Set<string>();

    for (const [name, ids] of this.nameIndex.entries()) {
      if (name.includes(term)) {
        ids.forEach(id => matchedIds.add(id));
      }
    }

    for (const [company, ids] of this.companyIndex.entries()) {
      if (company.includes(term)) {
        ids.forEach(id => matchedIds.add(id));
      }
    }

    const results: Customer[] = [];
    const customers = db.data.customers;

    for (const customer of customers) {
      if (matchedIds.has(customer.id)) {
        results.push(customer);
        continue;
      }

      if (customer.email.toLowerCase().includes(term) ||
          customer.phone.toLowerCase().includes(term)) {
        results.push(customer);
      }
    }

    return results;
  }

  async getCustomerById(id: string): Promise<Customer | undefined> {
    return db.data.customers.find((c: Customer) => c.id === id);
  }

  async createCustomer(customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    const newCustomer: Customer = {
      ...customerData,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };

    db.data.customers.push(newCustomer);
    await db.write();
    this.invalidateCache();

    return newCustomer;
  }

  async updateCustomer(id: string, updates: Partial<Omit<Customer, 'id' | 'createdAt'>>): Promise<Customer | undefined> {
    const customerIndex = db.data.customers.findIndex((c: Customer) => c.id === id);

    if (customerIndex === -1) {
      return undefined;
    }

    const updatedCustomer: Customer = {
      ...db.data.customers[customerIndex],
      ...updates
    };

    db.data.customers[customerIndex] = updatedCustomer;
    await db.write();
    this.invalidateCache();

    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const initialLength = db.data.customers.length;
    db.data.customers = db.data.customers.filter((c: Customer) => c.id !== id);

    if (db.data.customers.length === initialLength) {
      return false;
    }

    await db.write();
    this.invalidateCache();

    return true;
  }
}

export const customerService = new CustomerService();
export default customerService;
