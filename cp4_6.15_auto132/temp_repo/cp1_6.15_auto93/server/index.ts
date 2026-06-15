import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import type { Venue, TourDate } from '../src/types';

const app = express();
const PORT = 3010;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const venues: Venue[] = [
  {
    id: 'venue-1',
    name: 'MAO Livehouse',
    city: '北京',
    capacity: 800,
    parkingSpots: 120,
    parkingTotal: 150,
    lat: 39.9042,
    lng: 116.4074,
    monthlyData: [
      { month: '1月', capacity: 800, tickets: 720 },
      { month: '2月', capacity: 800, tickets: 680 },
      { month: '3月', capacity: 800, tickets: 750 },
      { month: '4月', capacity: 800, tickets: 800 },
      { month: '5月', capacity: 800, tickets: 780 },
      { month: '6月', capacity: 800, tickets: 760 }
    ]
  },
  {
    id: 'venue-2',
    name: '育音堂',
    city: '上海',
    capacity: 600,
    parkingSpots: 20,
    parkingTotal: 80,
    lat: 31.2304,
    lng: 121.4737,
    monthlyData: [
      { month: '1月', capacity: 600, tickets: 550 },
      { month: '2月', capacity: 600, tickets: 520 },
      { month: '3月', capacity: 600, tickets: 580 },
      { month: '4月', capacity: 600, tickets: 600 },
      { month: '5月', capacity: 600, tickets: 590 },
      { month: '6月', capacity: 600, tickets: 570 }
    ]
  },
  {
    id: 'venue-3',
    name: 'TU凸空间',
    city: '广州',
    capacity: 500,
    parkingSpots: 5,
    parkingTotal: 60,
    lat: 23.1291,
    lng: 113.2644,
    monthlyData: [
      { month: '1月', capacity: 500, tickets: 450 },
      { month: '2月', capacity: 500, tickets: 420 },
      { month: '3月', capacity: 500, tickets: 480 },
      { month: '4月', capacity: 500, tickets: 500 },
      { month: '5月', capacity: 500, tickets: 490 },
      { month: '6月', capacity: 500, tickets: 470 }
    ]
  },
  {
    id: 'venue-4',
    name: '小酒馆',
    city: '成都',
    capacity: 400,
    parkingSpots: 80,
    parkingTotal: 100,
    lat: 30.5728,
    lng: 104.0668,
    monthlyData: [
      { month: '1月', capacity: 400, tickets: 360 },
      { month: '2月', capacity: 400, tickets: 340 },
      { month: '3月', capacity: 400, tickets: 380 },
      { month: '4月', capacity: 400, tickets: 400 },
      { month: '5月', capacity: 400, tickets: 395 },
      { month: '6月', capacity: 400, tickets: 385 }
    ]
  },
  {
    id: 'venue-5',
    name: 'VOX Livehouse',
    city: '武汉',
    capacity: 450,
    parkingSpots: 35,
    parkingTotal: 70,
    lat: 30.5928,
    lng: 114.3055,
    monthlyData: [
      { month: '1月', capacity: 450, tickets: 400 },
      { month: '2月', capacity: 450, tickets: 380 },
      { month: '3月', capacity: 450, tickets: 420 },
      { month: '4月', capacity: 450, tickets: 450 },
      { month: '5月', capacity: 450, tickets: 440 },
      { month: '6月', capacity: 450, tickets: 430 }
    ]
  },
  {
    id: 'venue-6',
    name: '酒球会',
    city: '杭州',
    capacity: 350,
    parkingSpots: 0,
    parkingTotal: 50,
    lat: 30.2741,
    lng: 120.1551,
    monthlyData: [
      { month: '1月', capacity: 350, tickets: 310 },
      { month: '2月', capacity: 350, tickets: 290 },
      { month: '3月', capacity: 350, tickets: 330 },
      { month: '4月', capacity: 350, tickets: 350 },
      { month: '5月', capacity: 350, tickets: 345 },
      { month: '6月', capacity: 350, tickets: 335 }
    ]
  }
];

const tourDates: TourDate[] = [
  { id: 'tour-1', date: '2026-06-05', venueId: 'venue-1', venueName: 'MAO Livehouse', notes: '开场嘉宾：回声乐队', city: '北京' },
  { id: 'tour-2', date: '2026-06-12', venueId: 'venue-2', venueName: '育音堂', notes: 'VIP提前入场 18:30', city: '上海' },
  { id: 'tour-3', date: '2026-06-19', venueId: 'venue-3', venueName: 'TU凸空间', notes: '签售会：演出结束后', city: '广州' },
  { id: 'tour-4', date: '2026-06-26', venueId: 'venue-4', venueName: '小酒馆', notes: '本地电台现场直播', city: '成都' },
  { id: 'tour-5', date: '2026-07-03', venueId: 'venue-5', venueName: 'VOX Livehouse', notes: '专场 2 小时超长演出', city: '武汉' },
  { id: 'tour-6', date: '2026-07-10', venueId: 'venue-6', venueName: '酒球会', notes: '巡演收官站', city: '杭州' },
];

app.get('/api/venues', (_req, res) => {
  res.json(venues);
});

app.get('/api/venues/:id', (req, res) => {
  const venue = venues.find(v => v.id === req.params.id);
  if (!venue) return res.status(404).json({ error: 'Venue not found' });
  res.json(venue);
});

app.post('/api/venues', (req, res) => {
  const newVenue: Venue = {
    id: uuidv4(),
    ...req.body,
    monthlyData: [
      { month: '1月', capacity: req.body.capacity, tickets: Math.floor(req.body.capacity * 0.8) },
      { month: '2月', capacity: req.body.capacity, tickets: Math.floor(req.body.capacity * 0.75) },
      { month: '3月', capacity: req.body.capacity, tickets: Math.floor(req.body.capacity * 0.85) },
      { month: '4月', capacity: req.body.capacity, tickets: req.body.capacity },
      { month: '5月', capacity: req.body.capacity, tickets: Math.floor(req.body.capacity * 0.95) },
      { month: '6月', capacity: req.body.capacity, tickets: Math.floor(req.body.capacity * 0.9) }
    ]
  };
  venues.push(newVenue);
  res.status(201).json(newVenue);
});

app.put('/api/venues/:id', (req, res) => {
  const idx = venues.findIndex(v => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Venue not found' });
  venues[idx] = { ...venues[idx], ...req.body };
  res.json(venues[idx]);
});

app.delete('/api/venues/:id', (req, res) => {
  const idx = venues.findIndex(v => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Venue not found' });
  venues.splice(idx, 1);
  res.json({ success: true });
});

app.get('/api/tour-dates', (_req, res) => {
  res.json(tourDates);
});

app.post('/api/tour-dates', (req, res) => {
  const newDate: TourDate = {
    id: uuidv4(),
    ...req.body
  };
  tourDates.push(newDate);
  res.status(201).json(newDate);
});

app.delete('/api/tour-dates/:id', (req, res) => {
  const idx = tourDates.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Tour date not found' });
  tourDates.splice(idx, 1);
  res.json({ success: true });
});

app.post('/api/qrcode', async (req, res) => {
  try {
    const { url } = req.body;
    const dataUrl = await QRCode.toDataURL(url, {
      width: 120,
      margin: 1,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff'
      }
    });
    res.json({ qrcode: dataUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

app.listen(PORT, () => {
  console.log(`Tour Manager API server running on http://localhost:${PORT}`);
});
