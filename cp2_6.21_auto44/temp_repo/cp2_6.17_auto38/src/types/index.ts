export interface Property {
  id: string;
  name: string;
  address: string;
  roomType: string;
  maxGuests: number;
  pricePerNight: number;
}

export type BookingStatus = 'booked' | 'available' | 'pending';

export interface Booking {
  id: string;
  propertyId: string;
  customerName: string;
  date: string;
  status: BookingStatus;
  nights: number;
  totalPrice: number;
}

export interface MonthlyStats {
  month: string;
  revenue: number;
  occupancyRate: number;
}

export interface DashboardStats {
  totalProperties: number;
  monthlyRevenue: number;
  averageOccupancy: number;
  pendingBookings: number;
}
