import { addHours, differenceInSeconds, isBefore } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { Plant, WateringReminder } from '@/types/plant';

const REMINDER_CHECK_INTERVAL = 60 * 1000;

const reminderTimers = new Map<string, number>();
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

export function getTimeUntilWatering(plant: Plant, weatherCoefficient: number): { hours: number; minutes: number } {
  const nextWatering = calculateNextWatering(plant, weatherCoefficient);
  const now = new Date();
  
  if (isBefore(nextWatering, now)) {
    return { hours: 0, minutes: 0 };
  }
  
  const totalSeconds = differenceInSeconds(nextWatering, now);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  return { hours, minutes };
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

  const check = () => {
    const currentPlants = Array.from(activeReminders.values()).map(r => r.plant);
    const due = checkDueReminders(currentPlants, weatherCoefficient);
    if (due.length > 0) {
      callback(due);
    }
  };

  check();
  const timerId = window.setInterval(check, REMINDER_CHECK_INTERVAL);
  reminderTimers.set(id, timerId);

  return {
    id,
    cancel: () => {
      const timer = reminderTimers.get(id);
      if (timer) {
        clearInterval(timer);
        reminderTimers.delete(id);
      }
    },
  };
}

export function cancelAllReminders(): void {
  reminderTimers.forEach((timerId) => {
    clearInterval(timerId);
  });
  reminderTimers.clear();
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

export function updateReminderWeatherCoefficient(
  handleId: string,
  _plants: Plant[],
  weatherCoefficient: number,
  callback: (reminders: WateringReminder[]) => void
): void {
  const timer = reminderTimers.get(handleId);
  if (!timer) return;

  clearInterval(timer);

  const check = () => {
    const currentPlants = Array.from(activeReminders.values()).map(r => r.plant);
    const due = checkDueReminders(currentPlants, weatherCoefficient);
    if (due.length > 0) {
      callback(due);
    }
  };

  const newTimerId = window.setInterval(check, REMINDER_CHECK_INTERVAL);
  reminderTimers.set(handleId, newTimerId);
}
