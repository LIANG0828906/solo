export interface Station {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  contact?: string;
  createdAt: string;
  bookCount: number;
}

export type BookStatus = 'in_station' | 'drifting' | 'lost';

export interface Book {
  id: string;
  driftId: string;
  isbn: string;
  title: string;
  author: string;
  coverUrl?: string;
  description?: string;
  currentStationId: string | null;
  status: BookStatus;
  totalReadingMinutes: number;
  readCount: number;
  heatScore: number;
  createdAt: string;
}

export type RecordType = 'check_in' | 'check_out' | 'register' | 'lost';

export interface DriftRecord {
  id: string;
  bookId: string;
  stationId?: string;
  type: RecordType;
  timestamp: string;
  readingMinutes?: number;
  note?: string;
}

export interface PagedBooks {
  books: Book[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ISBNInfo {
  title: string;
  author: string;
  coverUrl: string;
  description?: string;
}
