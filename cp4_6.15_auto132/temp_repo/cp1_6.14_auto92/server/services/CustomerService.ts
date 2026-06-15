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
  private readonly INDEX_CHUNK = 100;

  private nameIndex: Map<string, string[]> = new Map();
  private companyIndex: Map<string, string[]> = new Map();
  private emailIndex: Map<string, string[]> = new Map();
  private phoneIndex: Map<string, string[]> = new Map();
  private customerIdMap: Map<string, Customer> = new Map();
  private indexesBuilt = false;

  constructor() {
    this.buildIndexes();
  }

  private buildIndexes(): void {
    this.nameIndex.clear();
    this.companyIndex.clear();
    this.emailIndex.clear();
    this.phoneIndex.clear();
    this.customerIdMap.clear();

    const customers = db.data.customers;
    for (let i = 0; i < customers.length; i += this.INDEX_CHUNK) {
      const chunk = customers.slice(i, i + this.INDEX_CHUNK);
      for (const customer of chunk) {
        this.customerIdMap.set(customer.id, customer);

        this.insertToIndex(this.nameIndex, customer.name.toLowerCase(), customer.id);
        this.insertToIndex(this.companyIndex, customer.company.toLowerCase(), customer.id);
        this.insertToIndex(this.emailIndex, customer.email.toLowerCase(), customer.id);
        this.insertToIndex(this.phoneIndex, customer.phone.toLowerCase(), customer.id);
      }
    }
    this.indexesBuilt = true;
  }

  private insertToIndex(index: Map<string, string[]>, key: string, id: string): void {
    if (!key) return;
    if (!index.has(key)) {
      index.set(key, []);
    }
    index.get(key)!.push(id);
  }

  invalidateCache(): void {
    this.searchCache.clear();
    this.indexesBuilt = false;
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

    if (!this.indexesBuilt) {
      this.buildIndexes();
    }

    const results = this.performSearchOptimized(normalizedTerm);

    this.searchCache.set(cacheKey, {
      results,
      timestamp: Date.now()
    });

    return results;
  }

  private searchIndex(index: Map<string, string[]>, term: string, matched: Set<string>): void {
    for (const [key, ids] of index.entries()) {
      if (key.includes(term)) {
        for (const id of ids) {
          matched.add(id);
        }
      }
    }
  }

  private performSearchOptimized(term: string): Customer[] {
    const matchedIds = new Set<string>();

    this.searchIndex(this.nameIndex, term, matchedIds);
    this.searchIndex(this.companyIndex, term, matchedIds);
    this.searchIndex(this.emailIndex, term, matchedIds);
    this.searchIndex(this.phoneIndex, term, matchedIds);

    const results: Customer[] = [];
    for (const id of matchedIds) {
      const customer = this.customerIdMap.get(id);
      if (customer) {
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
