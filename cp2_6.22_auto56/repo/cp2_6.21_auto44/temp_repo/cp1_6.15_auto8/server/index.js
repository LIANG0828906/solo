import express from 'express';
import {
  getDevices,
  addDevice,
  getBookings,
  getBookingsByDevice,
  addBooking,
  deleteBooking,
  checkConflict,
  getBookingsByDate,
} from './data.js';

const app = express();
const PORT = 3001;

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.get('/api/devices', (req, res) => {
  const devices = getDevices();
  res.json(devices);
});

app.post('/api/devices', (req, res) => {
  const { name, icon, status } = req.body;
  if (!name || !icon) {
    return res.status(400).json({ error: '设备名称和图标不能为空' });
  }
  const device = addDevice({
    name,
    icon,
    status: status || 'available',
    nextAvailableDate: null,
  });
  res.status(201).json(device);
});

app.get('/api/bookings', (req, res) => {
  const year = req.query.year ? parseInt(req.query.year) : undefined;
  const month = req.query.month ? parseInt(req.query.month) : undefined;
  const bookings = getBookings(year, month);
  res.json(bookings);
});

app.get('/api/bookings/check', (req, res) => {
  const { deviceId, date } = req.query;
  if (!deviceId || !date) {
    return res.status(400).json({ error: '缺少 deviceId 或 date 参数' });
  }
  const conflict = checkConflict(deviceId, date);
  res.json({
    conflict: !!conflict,
    booking: conflict || null,
  });
});

app.post('/api/bookings', (req, res) => {
  const { deviceId, date, userName, note } = req.body;
  if (!deviceId || !date || !userName) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  const result = addBooking({
    deviceId,
    date,
    userName,
    note: note || '',
  });
  if (!result.success) {
    return res.status(409).json({ error: result.error, conflict: result.conflictBooking });
  }
  res.status(201).json(result.booking);
});

app.delete('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const success = deleteBooking(id);
  if (!success) {
    return res.status(404).json({ error: '预约不存在' });
  }
  res.json({ success: true });
});

app.get('/api/devices/:id/history', (req, res) => {
  const { id } = req.params;
  const history = getBookingsByDevice(id);
  history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(history);
});

app.get('/api/bookings/by-date/:date', (req, res) => {
  const { date } = req.params;
  const bookings = getBookingsByDate(date);
  res.json(bookings);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
