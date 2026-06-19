import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  chargingStations,
  bookings,
  checkConflict,
  Booking,
  getStationStatus,
} from './data';

const app = express();
app.use(cors());
app.use(express.json());

const USER_ID = 'default-user';

app.get('/api/stations', (_req, res) => {
  const data = chargingStations.map((s) => ({
    ...s,
    overallStatus: getStationStatus(s),
    availableGuns: s.guns.filter((g) => g.status === 'available').length,
    totalGuns: s.guns.length,
  }));
  res.json(data);
});

app.get('/api/stations/:id', (req, res) => {
  const station = chargingStations.find((s) => s.id === req.params.id);
  if (!station) {
    res.status(404).json({ error: 'Station not found' });
    return;
  }
  res.json({
    ...station,
    overallStatus: getStationStatus(station),
    availableGuns: station.guns.filter((g) => g.status === 'available').length,
    totalGuns: station.guns.length,
  });
});

app.get('/api/bookings', (_req, res) => {
  const userBookings = bookings
    .filter((b) => b.userId === USER_ID)
    .sort((a, b) => b.startTime - a.startTime);
  res.json(userBookings);
});

app.get('/api/bookings/:id', (req, res) => {
  const booking = bookings.find((b) => b.id === req.params.id);
  if (!booking) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }
  const station = chargingStations.find((s) => s.id === booking.stationId);
  res.json({
    ...booking,
    stationName: station?.name,
    gunPower: station?.guns.find((g) => g.id === booking.gunId)?.power,
  });
});

app.post('/api/bookings/check', (req, res) => {
  const { stationId, gunId, startTime, endTime } = req.body;
  const conflict = checkConflict(stationId, gunId || null, startTime, endTime);
  res.json({ conflict });
});

app.post('/api/bookings', (req, res) => {
  const { stationId, gunId, startTime, endTime } = req.body;

  if (!stationId || !startTime || !endTime) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  if (endTime - startTime > 120 * 60 * 1000) {
    res.status(400).json({ error: 'Maximum booking duration is 120 minutes' });
    return;
  }

  if (checkConflict(stationId, gunId || null, startTime, endTime)) {
    res.status(409).json({ error: 'Time slot conflicts with existing booking' });
    return;
  }

  const station = chargingStations.find((s) => s.id === stationId);
  if (!station) {
    res.status(404).json({ error: 'Station not found' });
    return;
  }

  let targetGunId = gunId;
  if (!targetGunId) {
    const availableGun = station.guns.find((g) => g.status === 'available');
    if (!availableGun) {
      res.status(400).json({ error: 'No available guns at this station' });
      return;
    }
    targetGunId = availableGun.id;
  }

  const gun = station.guns.find((g) => g.id === targetGunId);
  if (!gun) {
    res.status(404).json({ error: 'Gun not found' });
    return;
  }

  const booking: Booking = {
    id: uuidv4(),
    stationId,
    gunId: targetGunId,
    userId: USER_ID,
    startTime,
    endTime,
    status: 'pending',
  };

  bookings.push(booking);
  gun.status = 'reserved';

  res.status(201).json(booking);
});

app.delete('/api/bookings/:id', (req, res) => {
  const idx = bookings.findIndex((b) => b.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }
  const booking = bookings[idx];
  const station = chargingStations.find((s) => s.id === booking.stationId);
  const gun = station?.guns.find((g) => g.id === booking.gunId);
  if (gun && booking.status === 'pending') {
    gun.status = 'available';
  }
  bookings.splice(idx, 1);
  res.json({ success: true });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
