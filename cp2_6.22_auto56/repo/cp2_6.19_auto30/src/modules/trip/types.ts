export interface Trip {
  id: string;
  destination: string;
  currency: string;
  budget: number;
  startDate: string;
  endDate: string;
}

export type TripFormData = Omit<Trip, 'id'>;
