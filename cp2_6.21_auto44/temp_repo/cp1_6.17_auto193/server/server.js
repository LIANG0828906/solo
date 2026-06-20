import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

let markers = [];

const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const euclideanDistance = (s1, s2) => {
  return Math.sqrt(
    Math.pow(s1.low - s2.low, 2) +
    Math.pow(s1.mid - s2.mid, 2) +
    Math.pow(s1.high - s2.high, 2)
  );
};

app.get('/api/markers', (_req, res) => {
  const publicMarkers = markers.filter(m => m.isPublic);
  res.json({ success: true, data: publicMarkers });
});

app.post('/api/markers', (req, res) => {
  const { lat, lng, name, note, audioUrl, styleFeatures, isPublic, isFavorited, creatorId } = req.body;
  const newMarker = {
    id: uuidv4(),
    lat,
    lng,
    name,
    note,
    audioUrl,
    styleFeatures,
    isPublic,
    isFavorited,
    creatorId,
    createdAt: Date.now()
  };
  markers.push(newMarker);
  res.json({ success: true, data: newMarker });
});

app.delete('/api/markers/:id', (req, res) => {
  const { id } = req.params;
  const index = markers.findIndex(m => m.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Marker not found' });
  }
  markers.splice(index, 1);
  res.json({ success: true });
});

app.post('/api/recommend', (req, res) => {
  const { userLat, userLng, recentStyles, radiusKm = 2, maxDistance = 3, limit = 3 } = req.body;
  const t0 = Date.now();

  const avgStyle = recentStyles && recentStyles.length > 0
    ? {
        low: recentStyles.reduce((s, x) => s + x.low, 0) / recentStyles.length,
        mid: recentStyles.reduce((s, x) => s + x.mid, 0) / recentStyles.length,
        high: recentStyles.reduce((s, x) => s + x.high, 0) / recentStyles.length,
      }
    : null;

  const candidates = [];
  for (const m of markers) {
    if (!m.isPublic) continue;
    const distKm = haversineDistance(userLat, userLng, m.lat, m.lng);
    if (distKm > radiusKm) continue;
    let styleDist = 0;
    if (avgStyle) {
      styleDist = euclideanDistance(avgStyle, m.styleFeatures);
      if (styleDist > maxDistance) continue;
    }
    candidates.push({ ...m, distance: Math.round(distKm * 1000), _styleDist: styleDist });
  }

  candidates.sort((a, b) => {
    if (avgStyle) {
      if (Math.abs(a._styleDist - b._styleDist) > 0.1) return a._styleDist - b._styleDist;
    }
    return a.distance - b.distance;
  });

  const result = candidates.slice(0, limit).map(({ _styleDist, ...rest }) => rest);
  console.log(`Recommend computed in ${Date.now() - t0}ms, ${candidates.length} candidates`);
  res.json({ success: true, data: result });
});

app.listen(PORT, () => {
  console.log(`VoiceMap server running on http://localhost:${PORT}`);
});
