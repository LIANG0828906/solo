export type ChargerStatus = 'available' | 'in-use' | 'reserved' | 'fault';
export type BookingStatus = 'pending' | 'in-use' | 'completed';

export interface ChargingGun {
  id: string;
  power: 7 | 22;
  status: ChargerStatus;
}

export interface ChargingStation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  guns: ChargingGun[];
  overallStatus: ChargerStatus;
  availableGuns: number;
  totalGuns: number;
}

export interface Booking {
  id: string;
  stationId: string;
  gunId: string;
  userId: string;
  startTime: number;
  endTime: number;
  status: BookingStatus;
  actualStartTime?: number;
  actualEndTime?: number;
  energyConsumed?: number;
  cost?: number;
  stationName?: string;
  gunPower?: number;
}

export const STATUS_COLORS: Record<ChargerStatus, string> = {
  available: '#4CAF50',
  'in-use': '#FF9800',
  reserved: '#2196F3',
  fault: '#F44336',
};

export const STATUS_LABELS: Record<ChargerStatus, string> = {
  available: '空闲',
  'in-use': '使用中',
  reserved: '预约',
  fault: '故障',
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  pending: '#2196F3',
  'in-use': '#FF9800',
  completed: '#4CAF50',
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: '待使用',
  'in-use': '使用中',
  completed: '已完成',
};
