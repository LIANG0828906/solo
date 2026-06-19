export interface Device {
  id: string;
  name: string;
  model: string;
  type: '显微镜' | '离心机' | '光谱仪';
  stock: number;
  description: string;
}

export interface Reservation {
  id: string;
  deviceId: string;
  deviceName: string;
  userName: string;
  startDate: string;
  endDate: string;
  timeSlots: ('上午' | '下午' | '晚上')[];
  isOverdue?: boolean;
  createdAt: string;
}

export type TimeSlot = '上午' | '下午' | '晚上';
export type DeviceType = '显微镜' | '离心机' | '光谱仪' | '全部';

export interface ReservationFormData {
  deviceId: string;
  userName: string;
  startDate: string;
  endDate: string;
  timeSlots: TimeSlot[];
}
