import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { addDays, differenceInDays, isBefore, isWithinInterval, startOfDay } from 'date-fns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = join(__dirname, 'data', 'plants.json');

const WATER_INTERVALS = {
  '多肉': 7,
  '绿萝': 3,
  '兰花': 5,
  '其他': 4
};

const FERTILIZE_INTERVAL = 30;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

function readPlants() {
  if (!existsSync(DATA_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writePlants(plants) {
  writeFileSync(DATA_FILE, JSON.stringify(plants, null, 2), 'utf-8');
}

function getWaterInterval(species) {
  return WATER_INTERVALS[species] || WATER_INTERVALS['其他'];
}

function calculateNextDates(plant) {
  const events = plant.events || [];
  const waterEvents = events.filter(e => e.type === 'water').sort((a, b) => new Date(b.date) - new Date(a.date));
  const fertilizeEvents = events.filter(e => e.type === 'fertilize').sort((a, b) => new Date(b.date) - new Date(a.date));

  const interval = getWaterInterval(plant.species);
  
  let nextWaterDate;
  if (waterEvents.length > 0) {
    nextWaterDate = addDays(new Date(waterEvents[0].date), interval).toISOString();
  } else {
    nextWaterDate = addDays(new Date(plant.purchaseDate), interval).toISOString();
  }

  let nextFertilizeDate;
  if (fertilizeEvents.length > 0) {
    nextFertilizeDate = addDays(new Date(fertilizeEvents[0].date), FERTILIZE_INTERVAL).toISOString();
  } else {
    nextFertilizeDate = addDays(new Date(plant.purchaseDate), FERTILIZE_INTERVAL).toISOString();
  }

  return {
    nextWaterDate,
    nextFertilizeDate
  };
}

function computeReminders(plants) {
  const today = startOfDay(new Date());
  const twoDaysLater = addDays(today, 2);
  const reminders = [];

  for (const plant of plants) {
    const dates = calculateNextDates(plant);

    const waterDue = startOfDay(new Date(dates.nextWaterDate));
    const waterDays = differenceInDays(waterDue, today);
    
    if (waterDays <= 2) {
      reminders.push({
        plantId: plant.id,
        plantName: plant.name,
        careType: 'water',
        dueDate: dates.nextWaterDate,
        daysFromToday: waterDays,
        status: waterDays < 0 ? 'overdue' : 'upcoming'
      });
    }

    const fertilizeDue = startOfDay(new Date(dates.nextFertilizeDate));
    const fertilizeDays = differenceInDays(fertilizeDue, today);
    
    if (fertilizeDays <= 2) {
      reminders.push({
        plantId: plant.id,
        plantName: plant.name,
        careType: 'fertilize',
        dueDate: dates.nextFertilizeDate,
        daysFromToday: fertilizeDays,
        status: fertilizeDays < 0 ? 'overdue' : 'upcoming'
      });
    }
  }

  reminders.sort((a, b) => a.daysFromToday - b.daysFromToday);
  return reminders;
}

app.get('/api/plants', (req, res) => {
  const plants = readPlants();
  const plantsWithDates = plants.map(plant => ({
    ...plant,
    ...calculateNextDates(plant)
  }));
  res.json(plantsWithDates);
});

app.get('/api/plants/:id', (req, res) => {
  const plants = readPlants();
  const plant = plants.find(p => p.id === req.params.id);
  if (!plant) {
    return res.status(404).json({ error: 'Plant not found' });
  }
  const plantWithDates = {
    ...plant,
    ...calculateNextDates(plant)
  };
  res.json(plantWithDates);
});

app.post('/api/plants', (req, res) => {
  const plants = readPlants();
  const newPlant = {
    id: uuidv4(),
    name: req.body.name,
    species: req.body.species,
    purchaseDate: req.body.purchaseDate,
    location: req.body.location,
    image: req.body.image || null,
    events: []
  };
  plants.push(newPlant);
  writePlants(plants);
  
  const plantWithDates = {
    ...newPlant,
    ...calculateNextDates(newPlant)
  };
  res.status(201).json(plantWithDates);
});

app.put('/api/plants/:id', (req, res) => {
  const plants = readPlants();
  const index = plants.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Plant not found' });
  }
  const updated = {
    ...plants[index],
    name: req.body.name ?? plants[index].name,
    species: req.body.species ?? plants[index].species,
    purchaseDate: req.body.purchaseDate ?? plants[index].purchaseDate,
    location: req.body.location ?? plants[index].location,
    image: req.body.image !== undefined ? req.body.image : plants[index].image
  };
  plants[index] = updated;
  writePlants(plants);
  
  const plantWithDates = {
    ...updated,
    ...calculateNextDates(updated)
  };
  res.json(plantWithDates);
});

app.delete('/api/plants/:id', (req, res) => {
  const plants = readPlants();
  const filtered = plants.filter(p => p.id !== req.params.id);
  if (filtered.length === plants.length) {
    return res.status(404).json({ error: 'Plant not found' });
  }
  writePlants(filtered);
  res.status(204).send();
});

app.get('/api/plants/:id/events', (req, res) => {
  const plants = readPlants();
  const plant = plants.find(p => p.id === req.params.id);
  if (!plant) {
    return res.status(404).json({ error: 'Plant not found' });
  }
  const events = [...(plant.events || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(events);
});

app.post('/api/plants/:id/events', (req, res) => {
  const plants = readPlants();
  const index = plants.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Plant not found' });
  }
  const newEvent = {
    id: uuidv4(),
    type: req.body.type,
    date: req.body.date || new Date().toISOString(),
    note: req.body.note || ''
  };
  if (!plants[index].events) {
    plants[index].events = [];
  }
  plants[index].events.push(newEvent);
  writePlants(plants);
  
  const plantWithDates = {
    ...plants[index],
    ...calculateNextDates(plants[index])
  };
  res.status(201).json({ event: newEvent, plant: plantWithDates });
});

app.delete('/api/plants/:id/events/:eventId', (req, res) => {
  const plants = readPlants();
  const index = plants.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Plant not found' });
  }
  const eventIndex = plants[index].events.findIndex(e => e.id === req.params.eventId);
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }
  plants[index].events.splice(eventIndex, 1);
  writePlants(plants);
  
  const plantWithDates = {
    ...plants[index],
    ...calculateNextDates(plants[index])
  };
  res.json({ plant: plantWithDates });
});

app.get('/api/reminders', (req, res) => {
  const plants = readPlants();
  const reminders = computeReminders(plants);
  res.json(reminders);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
