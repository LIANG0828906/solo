export interface Venue {
  id: string;
  name: string;
  city: string;
  capacity: number;
  parkingSpots: number;
  parkingTotal: number;
  lat: number;
  lng: number;
  monthlyData: {
    month: string;
    capacity: number;
    tickets: number;
  }[];
}

export interface TourDate {
  id: string;
  date: string;
  venueId: string;
  venueName: string;
  notes: string;
  city: string;
}

export type ParkingStatus = 'abundant' | 'limited' | 'full';

export type PageType = 'calendar' | 'venues' | 'route' | 'poster';
