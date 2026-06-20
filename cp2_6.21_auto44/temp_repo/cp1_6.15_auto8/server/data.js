import { v4 as uuidv4 } from 'uuid';

const today = new Date();
const formatDate = (d) => d.toISOString().split('T')[0];
const addDays = (d, days) => {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
};

const devices = [
  {
    id: uuidv4(),
    name: '吸尘器',
    icon: '🧹',
    status: 'available',
    nextAvailableDate: null,
    createdAt: formatDate(today),
  },
  {
    id: uuidv4(),
    name: '电钻',
    icon: '🔩',
    status: 'borrowed',
    nextAvailableDate: formatDate(addDays(today, 3)),
    createdAt: formatDate(today),
  },
  {
    id: uuidv4(),
    name: '烧烤架',
    icon: '🔥',
    status: 'available',
    nextAvailableDate: null,
    createdAt: formatDate(today),
  },
  {
    id: uuidv4(),
    name: '投影仪',
    icon: '📽️',
    status: 'maintenance',
    nextAvailableDate: formatDate(addDays(today, 5)),
    createdAt: formatDate(today),
  },
  {
    id: uuidv4(),
    name: '咖啡机',
    icon: '☕',
    status: 'available',
    nextAvailableDate: null,
    createdAt: formatDate(today),
  },
  {
    id: uuidv4(),
    name: '电动螺丝刀',
    icon: '🪛',
    status: 'available',
    nextAvailableDate: null,
    createdAt: formatDate(today),
  },
];

const bookings = [
  {
    id: uuidv4(),
    deviceId: devices[0].id,
    date: formatDate(addDays(today, 1)),
    userName: '爸爸',
    note: '清理客厅地毯',
    createdAt: formatDate(today),
  },
  {
    id: uuidv4(),
    deviceId: devices[1].id,
    date: formatDate(addDays(today, 2)),
    userName: '妈妈',
    note: '组装新柜子',
    createdAt: formatDate(today),
  },
  {
    id: uuidv4(),
    deviceId: devices[2].id,
    date: formatDate(addDays(today, 3)),
    userName: '小明',
    note: '周末花园烧烤派对',
    createdAt: formatDate(today),
  },
  {
    id: uuidv4(),
    deviceId: devices[0].id,
    date: formatDate(addDays(today, 4)),
    userName: '小红',
    note: '打扫卧室',
    createdAt: formatDate(today),
  },
  {
    id: uuidv4(),
    deviceId: devices[4].id,
    date: formatDate(addDays(today, 1)),
    userName: '爷爷',
    note: '早上喝咖啡',
    createdAt: formatDate(today),
  },
  {
    id: uuidv4(),
    deviceId: devices[2].id,
    date: formatDate(addDays(today, 6)),
    userName: '爸爸',
    note: '家庭聚餐烧烤',
    createdAt: formatDate(today),
  },
  {
    id: uuidv4(),
    deviceId: devices[5].id,
    date: formatDate(addDays(today, 2)),
    userName: '小明',
    note: '修理自行车',
    createdAt: formatDate(today),
  },
  {
    id: uuidv4(),
    deviceId: devices[0].id,
    date: formatDate(addDays(today, -2)),
    userName: '妈妈',
    note: '大扫除',
    createdAt: formatDate(addDays(today, -3)),
  },
  {
    id: uuidv4(),
    deviceId: devices[1].id,
    date: formatDate(addDays(today, -1)),
    userName: '爸爸',
    note: '安装书架',
    createdAt: formatDate(addDays(today, -2)),
  },
];

export function getDevices() {
  return JSON.parse(JSON.stringify(devices));
}

export function getDeviceById(id) {
  return devices.find((d) => d.id === id);
}

export function addDevice(data) {
  const newDevice = {
    ...data,
    id: uuidv4(),
    createdAt: formatDate(new Date()),
  };
  devices.push(newDevice);
  return JSON.parse(JSON.stringify(newDevice));
}

export function getBookings(year, month) {
  let result = JSON.parse(JSON.stringify(bookings));
  if (year !== undefined && month !== undefined) {
    result = result.filter((b) => {
      const d = new Date(b.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }
  return result;
}

export function getBookingsByDevice(deviceId) {
  return JSON.parse(JSON.stringify(bookings.filter((b) => b.deviceId === deviceId)));
}

export function checkConflict(deviceId, date) {
  const booking = bookings.find((b) => b.deviceId === deviceId && b.date === date);
  return booking ? JSON.parse(JSON.stringify(booking)) : null;
}

export function addBooking(data) {
  const conflict = checkConflict(data.deviceId, data.date);
  if (conflict) {
    return { success: false, error: '该设备在该日期已被预约', conflictBooking: conflict };
  }
  const newBooking = {
    ...data,
    id: uuidv4(),
    createdAt: formatDate(new Date()),
  };
  bookings.push(newBooking);

  const device = devices.find((d) => d.id === data.deviceId);
  if (device) {
    const bookingDates = bookings
      .filter((b) => b.deviceId === data.deviceId && b.date >= formatDate(new Date()))
      .map((b) => b.date)
      .sort();
    if (bookingDates.length > 0) {
      const lastDate = new Date(bookingDates[bookingDates.length - 1]);
      lastDate.setDate(lastDate.getDate() + 1);
      device.nextAvailableDate = formatDate(lastDate);
    }
  }

  return { success: true, booking: JSON.parse(JSON.stringify(newBooking)) };
}

export function deleteBooking(id) {
  const index = bookings.findIndex((b) => b.id === id);
  if (index === -1) return false;
  const booking = bookings[index];
  bookings.splice(index, 1);

  if (booking) {
    const device = devices.find((d) => d.id === booking.deviceId);
    if (device) {
      const futureBookings = bookings
        .filter((b) => b.deviceId === device.id && b.date >= formatDate(new Date()))
        .map((b) => b.date)
        .sort();
      if (futureBookings.length > 0) {
        const lastDate = new Date(futureBookings[futureBookings.length - 1]);
        lastDate.setDate(lastDate.getDate() + 1);
        device.nextAvailableDate = formatDate(lastDate);
      } else {
        device.nextAvailableDate = null;
      }
    }
  }

  return true;
}

export function getBookingsByDate(date) {
  return JSON.parse(JSON.stringify(bookings.filter((b) => b.date === date)));
}
