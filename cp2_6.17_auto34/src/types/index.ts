export interface SignRecord {
  id: string
  trackingNumber: string
  recipient: string
  courier: string
  signatureBase64: string
  photoBase64: string
  timestamp: string
}

export interface QueryFilters {
  trackingNumber?: string
  startDate?: string
  endDate?: string
  courier?: string
}

export interface SignStoreState {
  records: SignRecord[]
  initialized: boolean
  initStore: () => Promise<void>
  addRecord: (record: Omit<SignRecord, 'id' | 'timestamp'>) => SignRecord
  queryRecords: (filters: QueryFilters) => SignRecord[]
  getCouriers: () => string[]
}
