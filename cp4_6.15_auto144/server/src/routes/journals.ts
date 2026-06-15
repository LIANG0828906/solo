import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { FoodJournal } from '../types';
import { readJournals, writeJournals } from '../data/db';
import { calculateRadarData, calculateCalendarData } from '../utils/aggregator';

const router = Router();

router.get('/api/journals', (_req: Request, res: Response) => {
  const journals = readJournals();
  res.json(journals);
});

router.get('/api/journals/:id', (req: Request, res: Response) => {
  const journals = readJournals();
  const journal = journals.find((j) => j.id === req.params.id);
  if (!journal) {
    res.status(404).json({ error: 'Journal not found' });
    return;
  }
  res.json(journal);
});

router.post('/api/journals', (req: Request, res: Response) => {
  const journals = readJournals();
  const newJournal: FoodJournal = {
    id: uuidv4(),
    restaurantName: req.body.restaurantName,
    photos: req.body.photos || [],
    cuisineTags: req.body.cuisineTags || [],
    rating: Math.max(0, Math.min(10, req.body.rating)),
    review: req.body.review || '',
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    tasteProfile: {
      sour: Math.max(0, Math.min(10, req.body.tasteProfile?.sour || 0)),
      sweet: Math.max(0, Math.min(10, req.body.tasteProfile?.sweet || 0)),
      spicy: Math.max(0, Math.min(10, req.body.tasteProfile?.spicy || 0)),
      salty: Math.max(0, Math.min(10, req.body.tasteProfile?.salty || 0)),
      umami: Math.max(0, Math.min(10, req.body.tasteProfile?.umami || 0)),
    },
    createdAt: new Date().toISOString(),
  };
  journals.push(newJournal);
  writeJournals(journals);
  res.status(201).json(newJournal);
});

router.put('/api/journals/:id', (req: Request, res: Response) => {
  const journals = readJournals();
  const index = journals.findIndex((j) => j.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Journal not found' });
    return;
  }
  const updatedJournal: FoodJournal = {
    ...journals[index],
    restaurantName: req.body.restaurantName ?? journals[index].restaurantName,
    photos: req.body.photos ?? journals[index].photos,
    cuisineTags: req.body.cuisineTags ?? journals[index].cuisineTags,
    rating:
      req.body.rating !== undefined
        ? Math.max(0, Math.min(10, req.body.rating))
        : journals[index].rating,
    review: req.body.review ?? journals[index].review,
    latitude: req.body.latitude ?? journals[index].latitude,
    longitude: req.body.longitude ?? journals[index].longitude,
    tasteProfile: req.body.tasteProfile
      ? {
          sour: Math.max(
            0,
            Math.min(10, req.body.tasteProfile.sour ?? journals[index].tasteProfile.sour)
          ),
          sweet: Math.max(
            0,
            Math.min(10, req.body.tasteProfile.sweet ?? journals[index].tasteProfile.sweet)
          ),
          spicy: Math.max(
            0,
            Math.min(10, req.body.tasteProfile.spicy ?? journals[index].tasteProfile.spicy)
          ),
          salty: Math.max(
            0,
            Math.min(10, req.body.tasteProfile.salty ?? journals[index].tasteProfile.salty)
          ),
          umami: Math.max(
            0,
            Math.min(10, req.body.tasteProfile.umami ?? journals[index].tasteProfile.umami)
          ),
        }
      : journals[index].tasteProfile,
  };
  journals[index] = updatedJournal;
  writeJournals(journals);
  res.json(updatedJournal);
});

router.delete('/api/journals/:id', (req: Request, res: Response) => {
  const journals = readJournals();
  const index = journals.findIndex((j) => j.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Journal not found' });
    return;
  }
  journals.splice(index, 1);
  writeJournals(journals);
  res.status(204).send();
});

router.get('/api/analytics/radar', (_req: Request, res: Response) => {
  const journals = readJournals();
  const radarData = calculateRadarData(journals);
  res.json(radarData);
});

router.get('/api/analytics/calendar', (req: Request, res: Response) => {
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const journals = readJournals();
  const calendarData = calculateCalendarData(journals, year);
  res.json(calendarData);
});

export default router;
