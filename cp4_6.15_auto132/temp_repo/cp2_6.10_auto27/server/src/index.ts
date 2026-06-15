import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { Station, Horse, Document, DocumentLevel, HorseSpeed, GameState, DispatchRequest, FeedRequest } from '../../src/types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const createHorse = (speed: HorseSpeed, index: number): Horse => ({
  id: uuidv4(),
  name: speed === HorseSpeed.THREE_HUNDRED ? `枣红马${index + 1}` :
        speed === HorseSpeed.FIVE_HUNDRED ? `骝色马${index + 1}` : `白马${index + 1}`,
  speed,
  stamina: 100,
  distanceRun: 0,
  isResting: false,
  isExhausted: false
});

const initialStations: Station[] = [
  {
    id: 'station-1',
    name: '京师驿',
    position: 100,
    horses: [
      createHorse(HorseSpeed.THREE_HUNDRED, 0),
      createHorse(HorseSpeed.FIVE_HUNDRED, 0),
      createHorse(HorseSpeed.EIGHT_HUNDRED, 0)
    ],
    maxHorses: 5,
    forage: 400,
    maxForage: 500,
    staff: 6,
    pendingDocuments: []
  },
  {
    id: 'station-2',
    name: '中山驿',
    position: 400,
    horses: [
      createHorse(HorseSpeed.THREE_HUNDRED, 1),
      createHorse(HorseSpeed.FIVE_HUNDRED, 1)
    ],
    maxHorses: 5,
    forage: 350,
    maxForage: 500,
    staff: 5,
    pendingDocuments: []
  },
  {
    id: 'station-3',
    name: '边关驿',
    position: 700,
    horses: [
      createHorse(HorseSpeed.THREE_HUNDRED, 2),
      createHorse(HorseSpeed.FIVE_HUNDRED, 2),
      createHorse(HorseSpeed.EIGHT_HUNDRED, 1)
    ],
    maxHorses: 5,
    forage: 300,
    maxForage: 500,
    staff: 7,
    pendingDocuments: []
  }
];

const initialDocuments: Document[] = [
  {
    id: uuidv4(),
    title: '辽东战报',
    level: DocumentLevel.EXPRESS,
    fromStation: '京师驿',
    toStation: '边关驿',
    currentStationId: 'station-1',
    startTime: Date.now(),
    elapsedHours: 0,
    totalDistance: 600,
    currentDistance: 0,
    status: 'pending',
    sealVerified: false
  },
  {
    id: uuidv4(),
    title: '户部公文',
    level: DocumentLevel.URGENT,
    fromStation: '京师驿',
    toStation: '边关驿',
    currentStationId: 'station-1',
    startTime: Date.now() - 3600000,
    elapsedHours: 2,
    totalDistance: 600,
    currentDistance: 0,
    status: 'pending',
    sealVerified: false
  },
  {
    id: uuidv4(),
    title: '地方县志',
    level: DocumentLevel.NORMAL,
    fromStation: '边关驿',
    toStation: '京师驿',
    currentStationId: 'station-3',
    startTime: Date.now() - 7200000,
    elapsedHours: 4,
    totalDistance: 600,
    currentDistance: 0,
    status: 'pending',
    sealVerified: false
  }
];

let gameState: GameState = {
  stations: JSON.parse(JSON.stringify(initialStations)),
  documents: initialDocuments,
  inTransitDocuments: [],
  score: 100,
  salary: 100,
  currentTime: Date.now()
};

initialStations[0].pendingDocuments.push(initialDocuments[0]);
initialStations[0].pendingDocuments.push(initialDocuments[1]);
initialStations[2].pendingDocuments.push(initialDocuments[2]);
gameState.stations = JSON.parse(JSON.stringify(initialStations));

app.get('/api/stations', (req: Request, res: Response) => {
  const level = req.query.level as string;
  let stations = gameState.stations;
  if (level === '1') {
    stations = stations.map(s => ({
      ...s,
      pendingDocuments: s.pendingDocuments.slice(0, 3)
    }));
  }
  res.json(stations);
});

app.get('/api/documents', (req: Request, res: Response) => {
  res.json({
    pending: gameState.documents.filter(d => d.status === 'pending' || d.status === 'delayed'),
    inTransit: gameState.inTransitDocuments,
    delivered: gameState.documents.filter(d => d.status === 'delivered')
  });
});

app.post('/api/dispatch', (req: Request, res: Response) => {
  const { documentId, fromStationId, toStationId, horseId }: DispatchRequest = req.body;
  
  const fromStation = gameState.stations.find(s => s.id === fromStationId);
  const toStation = gameState.stations.find(s => s.id === toStationId);
  const document = gameState.documents.find(d => d.id === documentId);
  const horse = fromStation?.horses.find(h => h.id === horseId);

  if (!fromStation || !toStation || !document || !horse) {
    return res.status(400).json({ error: '无效的调度请求' });
  }

  if (horse.stamina < 30) {
    return res.status(400).json({ error: '马匹体力不足，请先喂养或换马' });
  }

  if (horse.isExhausted) {
    return res.status(400).json({ error: '马匹已力竭，请更换马匹' });
  }

  fromStation.pendingDocuments = fromStation.pendingDocuments.filter(d => d.id !== documentId);
  fromStation.horses = fromStation.horses.filter(h => h.id !== horseId);

  const distance = Math.abs(toStation.position - fromStation.position);
  const hoursNeeded = (distance / horse.speed) * 12;

  const inTransitDoc = {
    document: { ...document, status: 'in_transit' as const, assignedHorseId: horseId },
    horse: { ...horse },
    fromPosition: fromStation.position,
    toPosition: toStation.position,
    progress: 0,
    startTime: Date.now()
  };

  gameState.inTransitDocuments.push(inTransitDoc);
  gameState.documents = gameState.documents.map(d => 
    d.id === documentId ? { ...d, status: 'in_transit' as const } : d
  );

  res.json({ 
    success: true, 
    inTransitDoc,
    estimatedHours: hoursNeeded,
    message: `公文已发驿，预计${hoursNeeded.toFixed(1)}时辰后到达${toStation.name}`
  });
});

app.post('/api/feed', (req: Request, res: Response) => {
  const { stationId, horseId }: FeedRequest = req.body;
  
  const station = gameState.stations.find(s => s.id === stationId);
  const horse = station?.horses.find(h => h.id === horseId);

  if (!station || !horse) {
    return res.status(400).json({ error: '无效的喂养请求' });
  }

  const forageNeeded = horse.speed === HorseSpeed.THREE_HUNDRED ? 5 :
                       horse.speed === HorseSpeed.FIVE_HUNDRED ? 10 : 15;

  if (station.forage < forageNeeded) {
    return res.status(400).json({ error: '草料不足，请先采购' });
  }

  station.forage -= forageNeeded;
  horse.stamina = Math.min(100, horse.stamina + 40);
  horse.isResting = true;

  setTimeout(() => {
    horse.isResting = false;
  }, 2000);

  res.json({ 
    success: true, 
    horse: { ...horse },
    station: { ...station },
    message: `${horse.name}已喂养，消耗草料${forageNeeded}斤，体力恢复至${horse.stamina}%`
  });
});

app.post('/api/purchase-forage', (req: Request, res: Response) => {
  const { stationId } = req.body;
  
  const station = gameState.stations.find(s => s.id === stationId);
  if (!station) {
    return res.status(400).json({ error: '无效的驿站' });
  }

  const oldForage = station.forage;
  station.forage = Math.min(station.maxForage, station.forage + 200);
  gameState.currentTime += 86400000;

  res.json({
    success: true,
    station: { ...station },
    addedForage: station.forage - oldForage,
    message: `已采购草料${station.forage - oldForage}斤，耗时1天`
  });
});

app.post('/api/verify-seal', (req: Request, res: Response) => {
  const { documentId, stationId } = req.body;
  
  const station = gameState.stations.find(s => s.id === stationId);
  const document = station?.pendingDocuments.find(d => d.id === documentId);

  if (!station || !document) {
    return res.status(400).json({ error: '无效的验证请求' });
  }

  document.sealVerified = true;
  gameState.documents = gameState.documents.map(d =>
    d.id === documentId ? { ...d, sealVerified: true } : d
  );

  res.json({
    success: true,
    document: { ...document },
    message: '火漆封条已验明，公文有效'
  });
});

app.post('/api/arrive-station', (req: Request, res: Response) => {
  const { documentId, horseId, toStationId, staminaUsed, distanceRun } = req.body;
  
  const toStation = gameState.stations.find(s => s.id === toStationId);
  const inTransitIndex = gameState.inTransitDocuments.findIndex(
    d => d.document.id === documentId
  );

  if (!toStation || inTransitIndex === -1) {
    return res.status(400).json({ error: '无效的到达请求' });
  }

  const inTransitDoc = gameState.inTransitDocuments[inTransitIndex];
  const horse = inTransitDoc.horse;
  horse.stamina = Math.max(0, staminaUsed);
  horse.distanceRun += distanceRun;
  
  if (horse.distanceRun >= 300 && horse.stamina < 30) {
    horse.isExhausted = true;
    gameState.salary -= 10;
  }

  toStation.horses.push(horse);

  const document = gameState.documents.find(d => d.id === documentId);
  if (document) {
    document.currentStationId = toStationId;
    document.currentDistance += distanceRun;
    document.elapsedHours += (distanceRun / horse.speed) * 12;

    if (document.toStation === toStation.name) {
      document.status = 'delivered';
      const timeBonus = document.level === DocumentLevel.EXPRESS ? 30 :
                        document.level === DocumentLevel.URGENT ? 20 : 10;
      gameState.score += timeBonus;
      gameState.salary += 5;
    } else {
      document.status = 'pending';
      document.sealVerified = false;
      toStation.pendingDocuments.push(document);
    }
  }

  gameState.inTransitDocuments.splice(inTransitIndex, 1);

  res.json({
    success: true,
    station: toStation,
    document,
    horse,
    isExhausted: horse.isExhausted,
    message: document?.status === 'delivered' 
      ? `${document.title}已送达目的地！`
      : `${document?.title}已到达${toStation.name}`
  });
});

app.get('/api/state', (req: Request, res: Response) => {
  res.json(gameState);
});

app.listen(PORT, () => {
  console.log(`驿站服务运行在 http://localhost:${PORT}`);
});
