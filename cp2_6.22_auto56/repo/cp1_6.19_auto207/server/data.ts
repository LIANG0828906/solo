import { v4 as uuidv4 } from 'uuid';

export type ChargerStatus = 'available' | 'in-use' | 'reserved' | 'fault';

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
}

export type BookingStatus = 'pending' | 'in-use' | 'completed';

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
}

const stationNames = [
  '阳光花园充电站',
  '绿城社区充电站',
  '中央公园充电站',
  '万达广场充电站',
  '科技园区充电站',
  '市民广场充电站',
  '滨江路充电站',
  '大学城充电站',
  '商业中心充电站',
  '东湖小区充电站',
];

const addresses = [
  '阳光花园A区地下停车场',
  '绿城社区西门',
  '中央公园南广场',
  '万达广场B2停车场',
  '科技园区1号楼',
  '市民广场东侧',
  '滨江路288号',
  '大学城北区',
  '商业中心地下车库',
  '东湖小区东门',
];

const centerLat = 31.2304;
const centerLng = 121.4737;

function randomOffset(): number {
  return (Math.random() - 0.5) * 0.08;
}

function createGuns(): ChargingGun[] {
  const count = 2 + Math.floor(Math.random() * 3);
  const guns: ChargingGun[] = [];
  for (let i = 0; i < count; i++) {
    guns.push({
      id: uuidv4(),
      power: Math.random() > 0.5 ? 22 : 7,
      status: Math.random() < 0.1 ? 'fault' : 'available',
    });
  }
  return guns;
}

export const chargingStations: ChargingStation[] = stationNames.map((name, idx) => ({
  id: uuidv4(),
  name,
  address: addresses[idx],
  lat: centerLat + randomOffset(),
  lng: centerLng + randomOffset(),
  guns: createGuns(),
}));

export const bookings: Booking[] = [];

export function getStationStatus(station: ChargingStation): ChargerStatus {
  const hasFault = station.guns.some((g) => g.status === 'fault');
  const hasInUse = station.guns.some((g) => g.status === 'in-use');
  const hasReserved = station.guns.some((g) => g.status === 'reserved');
  const allFault = station.guns.every((g) => g.status === 'fault');

  if (allFault) return 'fault';
  if (hasInUse) return 'in-use';
  if (hasReserved) return 'reserved';
  if (hasFault) return 'available';
  return 'available';
}

export function getAvailableSlots(stationId: string): { start: number; end: number }[] {
  const now = Date.now();
  const stationBookings = bookings.filter(
    (b) => b.stationId === stationId && (b.status === 'pending' || b.status === 'in-use')
  );

  const slots: { start: number; end: number }[] = [];
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = dayStart.getTime() + 24 * 60 * 60 * 1000;

  let cursor = Math.max(now, dayStart.getTime());
  while (cursor < dayEnd) {
    const slotEnd = cursor + 60 * 60 * 1000;
    const conflict = stationBookings.some(
      (b) => cursor < b.endTime && slotEnd > b.startTime
    );
    if (!conflict) {
      slots.push({ start: cursor, end: Math.min(slotEnd, dayEnd) });
    }
    cursor = slotEnd;
  }

  return slots;
}

export function checkConflict(
  stationId: string,
  gunId: string | null,
  startTime: number,
  endTime: number,
  excludeBookingId?: string
): boolean {
  return bookings.some((b) => {
    if (excludeBookingId && b.id === excludeBookingId) return false;
    if (b.status === 'completed') return false;
    if (b.stationId !== stationId) return false;
    if (gunId && b.gunId !== gunId) return false;
    return startTime < b.endTime && endTime > b.startTime;
  });
}

export function updateStationStatuses(): void {
  const now = Date.now();

  bookings.forEach((booking) => {
    if (booking.status === 'pending' && booking.startTime <= now && booking.endTime > now) {
      booking.status = 'in-use';
      booking.actualStartTime = now;
      const station = chargingStations.find((s) => s.id === booking.stationId);
      if (station) {
        const gun = station.guns.find((g) => g.id === booking.gunId);
        if (gun) gun.status = 'in-use';
      }
    }
    if (booking.status === 'in-use' && booking.endTime <= now) {
      booking.status = 'completed';
      booking.actualEndTime = now;
      const durationMin = (now - (booking.actualStartTime || booking.startTime)) / 60000;
      const station = chargingStations.find((s) => s.id === booking.stationId);
      const gun = station?.guns.find((g) => g.id === booking.gunId);
      const power = gun?.power || 7;
      booking.energyConsumed = (power * durationMin) / 60;
      booking.cost = durationMin * 0.5;
      if (gun) gun.status = 'available';
    }
    if (booking.status === 'pending' && booking.startTime > now) {
      const station = chargingStations.find((s) => s.id === booking.stationId);
      if (station) {
        const gun = station.guns.find((g) => g.id === booking.gunId);
        if (gun && gun.status === 'available') gun.status = 'reserved';
      }
    }
  });

  if (Math.random() < 0.2) {
    const availableGuns: { station: ChargingStation; gun: ChargingGun }[] = [];
    chargingStations.forEach((station) => {
      station.guns.forEach((gun) => {
        if (gun.status === 'available') {
          availableGuns.push({ station, gun });
        }
      });
    });

    if (availableGuns.length > 0 && Math.random() < 0.5) {
      const pick = availableGuns[Math.floor(Math.random() * availableGuns.length)];
      pick.gun.status = 'in-use';
      const duration = 30 + Math.floor(Math.random() * 90);
      bookings.push({
        id: uuidv4(),
        stationId: pick.station.id,
        gunId: pick.gun.id,
        userId: 'sim-user',
        startTime: now,
        endTime: now + duration * 60 * 1000,
        status: 'in-use',
        actualStartTime: now,
      });
    }
  }

  chargingStations.forEach((station) => {
    station.guns.forEach((gun) => {
      if (gun.status === 'in-use' && Math.random() < 0.1) {
        const simBooking = bookings.find(
          (b) => b.gunId === gun.id && b.status === 'in-use' && b.userId === 'sim-user'
        );
        if (simBooking) {
          simBooking.status = 'completed';
          simBooking.actualEndTime = now;
          const durationMin = (now - (simBooking.actualStartTime || simBooking.startTime)) / 60000;
          simBooking.energyConsumed = (gun.power * durationMin) / 60;
          simBooking.cost = durationMin * 0.5;
        }
        gun.status = 'available';
      }
    });
  });
}

setInterval(updateStationStatuses, 1000);
