import { addHours, differenceInSeconds, isBefore } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { Plant, WateringReminder } from '@/types/plant';

const REMINDER_CHECK_INTERVAL = 60 * 1000;

interface RegisteredTimer {
  timerId: number;
  checkFn: () => void;
}

const registeredTimers = new Map<string, RegisteredTimer>();
const activeReminders = new Map<string, { plant: Plant; triggered: boolean }>();

export function getFrequencyHours(frequency: Plant['wateringFrequency'], customDays?: number): number {
  switch (frequency) {
    case 'daily':
      return 24;
    case 'every2days':
      return 48;
    case 'weekly':
      return 168;
    case 'custom':
      return (customDays || 7) * 24;
    default:
      return 48;
  }
}

export function calculateNextWatering(plant: Plant, weatherCoefficient: number): Date {
  const baseHours = getFrequencyHours(plant.wateringFrequency, plant.customDays);
  const adjustedHours = baseHours / weatherCoefficient;
  
  const lastWatered = plant.lastWateredAt 
    ? new Date(plant.lastWateredAt) 
    : new Date(plant.createdAt);

  return addHours(lastWatered, adjustedHours);
}

export function getWateringProgress(plant: Plant, weatherCoefficient: number): number {
  const baseHours = getFrequencyHours(plant.wateringFrequency, plant.customDays);
  
  const lastWatered = plant.lastWateredAt 
    ? new Date(plant.lastWateredAt) 
    : new Date(plant.createdAt);

  const adjustedHours = baseHours / weatherCoefficient;
  const totalSeconds = adjustedHours * 3600;
  const elapsedSeconds = differenceInSeconds(new Date(), lastWatered);
  
  return Math.min(100, Math.max(0, (elapsedSeconds / totalSeconds) * 100));
}

export function getTimeUntilWatering(plant: Plant, weatherCoefficient: number): { hours: number; minutes: number; seconds: number } {
  const nextWatering = calculateNextWatering(plant, weatherCoefficient);
  const now = new Date();
  
  if (isBefore(nextWatering, now)) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }
  
  const totalSeconds = differenceInSeconds(nextWatering, now);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return { hours, minutes, seconds };
}

export function checkDueReminders(plants: Plant[], weatherCoefficient: number): WateringReminder[] {
  const due: WateringReminder[] = [];
  const now = new Date();

  for (const plant of plants) {
    const nextWatering = calculateNextWatering(plant, weatherCoefficient);
    
    if (isBefore(nextWatering, now)) {
      const reminder = activeReminders.get(plant.id);
      if (!reminder || !reminder.triggered) {
        due.push({ plantId: plant.id, plantName: plant.name });
        activeReminders.set(plant.id, { plant, triggered: true });
      }
    }
  }

  return due;
}

export interface ReminderHandle {
  id: string;
  cancel: () => void;
  isActive: () => boolean;
}

export function registerReminder(
  plants: Plant[],
  weatherCoefficient: number,
  callback: (reminders: WateringReminder[]) => void
): ReminderHandle {
  const id = uuidv4();

  plants.forEach(plant => {
    if (!activeReminders.has(plant.id)) {
      activeReminders.set(plant.id, { plant, triggered: false });
    }
  });

  const checkFn = () => {
    const currentPlants = Array.from(activeReminders.values()).map(r => r.plant);
    const due = checkDueReminders(currentPlants, weatherCoefficient);
    if (due.length > 0) {
      callback(due);
    }
  };

  checkFn();
  const timerId = window.setInterval(checkFn, REMINDER_CHECK_INTERVAL);
  registeredTimers.set(id, { timerId, checkFn });

  return {
    id,
    cancel: () => {
      const entry = registeredTimers.get(id);
      if (entry) {
        clearInterval(entry.timerId);
        registeredTimers.delete(id);
      }
    },
    isActive: () => registeredTimers.has(id),
  };
}

export function cancelAllReminders(): void {
  registeredTimers.forEach((entry) => {
    clearInterval(entry.timerId);
  });
  registeredTimers.clear();
}

export function getActiveTimerCount(): number {
  return registeredTimers.size;
}

export function resetReminder(plantId: string): void {
  const reminder = activeReminders.get(plantId);
  if (reminder) {
    activeReminders.set(plantId, { ...reminder, triggered: false });
  }
}

export function registerPlantReminder(plant: Plant): void {
  if (!activeReminders.has(plant.id)) {
    activeReminders.set(plant.id, { plant, triggered: false });
  }
}

export function cancelPlantReminder(plantId: string): void {
  activeReminders.delete(plantId);
}

export function updatePlantInReminder(plant: Plant): void {
  const reminder = activeReminders.get(plant.id);
  if (reminder) {
    activeReminders.set(plant.id, { plant, triggered: false });
  }
}
