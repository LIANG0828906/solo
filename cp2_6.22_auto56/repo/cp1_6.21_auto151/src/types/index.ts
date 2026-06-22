export interface Trip {
  id: string;
  date: string;
  title: string;
  location: string;
  duration: number;
  rating: number;
  description: string;
  tag: string;
  note: string;
  order: number;
}

export interface TravelState {
  trips: Trip[];
  selectedDate: string;
  selectedTrip: Trip | null;
  noteModalVisible: boolean;
  sidebarVisible: boolean;
}

export type TravelAction =
  | { type: 'SET_TRIPS'; payload: Trip[] }
  | { type: 'ADD_TRIP'; payload: Trip }
  | { type: 'UPDATE_TRIP'; payload: Trip }
  | { type: 'DELETE_TRIP'; payload: string }
  | { type: 'SET_SELECTED_DATE'; payload: string }
  | { type: 'SET_SELECTED_TRIP'; payload: Trip | null }
  | { type: 'SET_NOTE_MODAL_VISIBLE'; payload: boolean }
  | { type: 'SET_SIDEBAR_VISIBLE'; payload: boolean }
  | { type: 'REORDER_TRIPS'; payload: { date: string; trips: Trip[] } };
