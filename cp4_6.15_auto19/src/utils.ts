import {
  TripRecord,
  TransportMode,
  TRANSPORT_OPTIONS,
  Achievement,
  ACHIEVEMENTS,
  DailyStats,
  LeaderboardUser,
  MOCK_USERS,
  CURRENT_USER_NAME,
} from './Types';

const STORAGE_KEY = 'low_carbon_trip_data';
const CAR_EMISSION_FACTOR = 180;

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function calculateEmission(mode: TransportMode, distance: number): number {
  const option = TRANSPORT_OPTIONS.find((o) => o.mode === mode);
  if (!option) return 0;
  return Math.round(option.emissionFactor * distance * 100) / 100;
}

export function calculateCarbonSaved(mode: TransportMode, distance: number): number {
  const actualEmission = calculateEmission(mode, distance);
  const carEmission = CAR_EMISSION_FACTOR * distance;
  return Math.round((carEmission - actualEmission) * 100) / 100;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getToday(): string {
  return formatDate(new Date());
}

export function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(formatDate(d));
  }
  return dates;
}

export function saveTrips(trips: TripRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch (e) {
    console.error('Failed to save trips:', e);
  }
}

export function loadTrips(): TripRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load trips:', e);
    return [];
  }
}

export function aggregateDailyStats(trips: TripRecord[], days: number = 7): DailyStats[] {
  const dateRange = getLastNDays(days);
  const statsMap = new Map<string, DailyStats>();

  dateRange.forEach((date) => {
    statsMap.set(date, {
      date,
      totalEmission: 0,
      totalSaved: 0,
      tripCount: 0,
    });
  });

  trips.forEach((trip) => {
    const stat = statsMap.get(trip.date);
    if (stat) {
      stat.totalEmission += trip.carbonEmission;
      stat.totalSaved += trip.carbonSaved;
      stat.tripCount++;
    }
  });

  return dateRange.map((date) => statsMap.get(date)!);
}

export function calculateTotalSaved(trips: TripRecord[]): number {
  return trips.reduce((sum, t) => sum + t.carbonSaved, 0);
}

export function calculateTotalEmission(trips: TripRecord[]): number {
  return trips.reduce((sum, t) => sum + t.carbonEmission, 0);
}

export function getTripsByMode(trips: TripRecord[]): Record<TransportMode, number> {
  const result: Record<TransportMode, number> = {
    walk: 0,
    bike: 0,
    bus: 0,
    subway: 0,
    car: 0,
    plane: 0,
  };
  trips.forEach((t) => {
    result[t.mode] += t.distance;
  });
  return result;
}

export function calculateGreenTripRatio(trips: TripRecord[]): number {
  if (trips.length === 0) return 0;
  const greenTrips = trips.filter((t) => {
    const opt = TRANSPORT_OPTIONS.find((o) => o.mode === t.mode);
    return opt?.isGreen;
  });
  return Math.round((greenTrips.length / trips.length) * 100);
}

export function calculateAchievements(trips: TripRecord[]): Achievement[] {
  const totalSaved = calculateTotalSaved(trips) / 1000;
  return ACHIEVEMENTS.map((a) => {
    const unlocked = totalSaved >= a.threshold;
    return {
      ...a,
      unlocked,
      unlockedAt: unlocked ? Date.now() : undefined,
    };
  });
}

export function calculateMaxGreenStreak(trips: TripRecord[]): number {
  const sortedTrips = [...trips].sort((a, b) => a.date.localeCompare(b.date));
  const greenDates = new Set<string>();

  sortedTrips.forEach((trip) => {
    const opt = TRANSPORT_OPTIONS.find((o) => o.mode === trip.mode);
    if (opt?.isGreen) {
      greenDates.add(trip.date);
    }
  });

  if (greenDates.size === 0) return 0;

  let maxStreak = 0;
  let currentStreak = 0;
  const sortedDates = Array.from(greenDates).sort();

  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      currentStreak = 1;
    } else {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
    }
    maxStreak = Math.max(maxStreak, currentStreak);
  }

  return maxStreak;
}

export function calculateMonthlySaved(trips: TripRecord[]): number {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return trips
    .filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + t.carbonSaved, 0);
}

export function calculateWeeklySaved(trips: TripRecord[]): number {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  return trips
    .filter((t) => new Date(t.date) >= weekStart)
    .reduce((sum, t) => sum + t.carbonSaved, 0);
}

export function generateLeaderboard(trips: TripRecord[], period: 'weekly' | 'monthly'): LeaderboardUser[] {
  const userSaved = period === 'weekly' ? calculateWeeklySaved(trips) : calculateMonthlySaved(trips);

  const currentUser: LeaderboardUser = {
    id: 'current',
    name: CURRENT_USER_NAME,
    avatar: '😊',
    weeklySaved: calculateWeeklySaved(trips) / 1000,
    monthlySaved: calculateMonthlySaved(trips) / 1000,
    isCurrentUser: true,
  };

  const users: LeaderboardUser[] = MOCK_USERS.map((u) => ({
    ...u,
    weeklySaved: u.weeklySaved + (Math.random() - 0.5) * 2,
    monthlySaved: u.monthlySaved + (Math.random() - 0.5) * 5,
    isCurrentUser: false,
  }));

  users.push(currentUser);

  users.sort((a, b) => {
    const aVal = period === 'weekly' ? a.weeklySaved : a.monthlySaved;
    const bVal = period === 'weekly' ? b.weeklySaved : b.monthlySaved;
    return bVal - aVal;
  });

  return users;
}

export function animateNumber(from: number, to: number, duration: number, onUpdate: (value: number) => void): () => void {
  const startTime = performance.now();
  let animationId: number;

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentValue = from + (to - from) * easeProgress;
    onUpdate(currentValue);

    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    }
  };

  animationId = requestAnimationFrame(animate);

  return () => cancelAnimationFrame(animationId);
}
