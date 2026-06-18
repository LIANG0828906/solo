export interface DriftLog {
  id: string;
  readerId: string;
  borrowDate: string;
  returnDate: string | null;
  note: string;
  location: { x: number; y: number };
  cityName: string;
}

export interface Book {
  id: string;
  title: string;
  coverColor: string;
  createdAt: string;
  startLocation: { x: number; y: number };
  startCity: string;
  isDrifting: boolean;
  currentHolderId: string | null;
  driftLogs: DriftLog[];
}

export interface Reader {
  id: string;
  name: string;
  location: { x: number; y: number };
  cityName: string;
}

export interface CityPoint {
  id: string;
  name: string;
  x: number;
  y: number;
}

export type FilterType = 'all' | 'drifting' | 'returned';

export interface AppState {
  books: Book[];
  readers: Reader[];
  cities: CityPoint[];
  searchTerm: string;
  filter: FilterType;
}

export type AppAction =
  | { type: 'ADD_BOOK'; payload: Book }
  | { type: 'BORROW_BOOK'; payload: { bookId: string; readerId: string } }
  | { type: 'RETURN_BOOK'; payload: { bookId: string; readerId: string; note: string } }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_FILTER'; payload: FilterType };
