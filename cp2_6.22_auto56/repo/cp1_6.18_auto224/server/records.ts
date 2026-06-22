import type { ChatMessage } from '../src/store'

class RecordsStore {
  private records: ChatMessage[] = []

  addRecord(record: ChatMessage): void {
    this.records.push(record)
    if (this.records.length > 100) {
      this.records = this.records.slice(-100)
    }
  }

  getAllRecords(): ChatMessage[] {
    return this.records
  }

  getRecords(limit?: number): ChatMessage[] {
    if (limit) return this.records.slice(-limit)
    return this.records
  }

  deleteRecord(id: string): boolean {
    const idx = this.records.findIndex((r) => r.id === id)
    if (idx !== -1) {
      this.records.splice(idx, 1)
      return true
    }
    return false
  }

  clearAll(): void {
    this.records = []
  }
}

export const recordsStore = new RecordsStore()
