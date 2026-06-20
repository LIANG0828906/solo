export type DeviceStatus = 'available' | 'borrowed' | 'maintenance';

export interface Device {
  id: string;
  name: string;
  icon: string;
  status: DeviceStatus;
  nextAvailableDate: string | null;
  createdAt: string;
}

export interface Booking {
  id: string;
  deviceId: string;
  date: string;
  userName: string;
  note: string;
  createdAt: string;
}

export interface BookingWithDevice extends Booking {
  device: Device;
}
