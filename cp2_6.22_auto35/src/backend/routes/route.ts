import express, { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  calculateDistance,
  calculateElevationStats,
  estimateTime,
  generateElevationData,
  generateWeatherData,
  generateInviteCode,
  calculateCalories,
  getDefaultGearList,
  Route,
  Activity,
  RoutePoint,
  ElevationPoint,
  WeatherData,
  CalorieData,
  GearItem
} from '../utils/healthModel.js';

const router: Router = Router();

declare global {
  namespace Express {
    interface Locals {
      routes: Map<string, Route>;
      activities: Map<string, Activity>;
      inviteCodeToActivityId: Map<string, string>;
    }
  }
}

router.post('/api/routes', (req: Request, res: Response): void => {
  const { name, description, points } = req.body as { name: string; description: string; points: RoutePoint[] };
  
  if (!name || !points || points.length < 2) {
    res.status(400).json({ error: 'Invalid route data' });
    return;
  }

  const distance = calculateDistance(points);
  const elevationStats = calculateElevationStats(points);
  const estimatedTime = estimateTime(distance, elevationStats.gain);

  const route: Route = {
    id: uuidv4(),
    name,
    description: description || '',
    points,
    distance,
    elevationGain: elevationStats.gain,
    elevationLoss: elevationStats.loss,
    maxElevation: elevationStats.max,
    minElevation: elevationStats.min,
    estimatedTime,
    createdAt: new Date()
  };

  req.app.locals.routes.set(route.id, route);

  res.status(201).json(route);
});

router.get('/api/routes/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const route = req.app.locals.routes.get(id);
  
  if (!route) {
    res.status(404).json({ error: 'Route not found' });
    return;
  }

  res.json(route);
});

router.get('/api/routes/:id/elevation', (req: Request, res: Response): void => {
  const { id } = req.params;
  const route = req.app.locals.routes.get(id);
  
  if (!route) {
    res.status(404).json({ error: 'Route not found' });
    return;
  }

  const elevationData: ElevationPoint[] = generateElevationData(route.points, route.distance);
  res.json(elevationData);
});

router.get('/api/routes/:id/weather', (req: Request, res: Response): void => {
  const { id } = req.params;
  const route = req.app.locals.routes.get(id);
  
  if (!route) {
    res.status(404).json({ error: 'Route not found' });
    return;
  }

  const weatherData: WeatherData[] = generateWeatherData();
  res.json(weatherData);
});

router.post('/api/activities', (req: Request, res: Response): void => {
  const { routeId, name, date, participants } = req.body as { routeId: string; name: string; date: string; participants?: string[] };
  
  if (!routeId || !name || !date) {
    res.status(400).json({ error: 'Invalid activity data' });
    return;
  }

  const route = req.app.locals.routes.get(routeId);
  if (!route) {
    res.status(404).json({ error: 'Route not found' });
    return;
  }

  const inviteCode = generateInviteCode();
  
  const activity: Activity = {
    id: uuidv4(),
    routeId,
    name,
    date: new Date(date),
    inviteCode,
    participants: participants || [],
    createdAt: new Date()
  };

  req.app.locals.activities.set(activity.id, activity);
  req.app.locals.inviteCodeToActivityId.set(inviteCode, activity.id);

  res.status(201).json(activity);
});

router.get('/api/activities/:code', (req: Request, res: Response): void => {
  const { code } = req.params;
  const activityId = req.app.locals.inviteCodeToActivityId.get(code);
  const activity = activityId ? req.app.locals.activities.get(activityId) : null;
  
  if (!activity) {
    res.status(404).json({ error: 'Activity not found' });
    return;
  }

  res.json(activity);
});

router.post('/api/routes/:id/calories', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { weight, packWeight } = req.body as { weight: number; packWeight: number };
  
  const route = req.app.locals.routes.get(id);
  if (!route) {
    res.status(404).json({ error: 'Route not found' });
    return;
  }

  if (!weight || weight <= 0) {
    res.status(400).json({ error: 'Invalid weight' });
    return;
  }

  const calorieData: CalorieData[] = calculateCalories(
    route.distance,
    route.elevationGain,
    weight,
    packWeight || 0
  );

  res.json(calorieData);
});

router.get('/api/gear/default', (req: Request, res: Response): void => {
  const gearList: GearItem[] = getDefaultGearList();
  res.json(gearList);
});

export default router;
