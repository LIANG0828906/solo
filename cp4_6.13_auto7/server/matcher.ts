import { WebSocket } from 'ws';

interface User {
  id: string;
  username: string;
  password: string;
  avatar: string;
  bio: string;
  location: { lat: number; lng: number };
  tastePrefs: {
    spiciness: 0 | 1 | 2 | 3;
    cuisines: string[];
    restrictions: string[];
  };
  availableSlots: ('breakfast' | 'lunch' | 'dinner' | 'supper')[];
  deliveryRadius: number;
  createdAt: number;
}

interface Meal {
  id: string;
  publisherId: string;
  name: string;
  description: string;
  tags: string[];
  images: string[];
  servings: number;
  remainingServings: number;
  location: { lat: number; lng: number };
  address: string;
  mealTime: 'breakfast' | 'lunch' | 'dinner' | 'supper';
  expiresAt: number;
  createdAt: number;
  likes: string[];
  comments: any[];
}

interface Stores {
  users: Map<string, User>;
  meals: Map<string, Meal>;
  chats: Map<string, any>;
  matchRequests: Map<string, any>;
  wsConnections: Map<string, WebSocket>;
}

interface WSHandler {
  sendToUser: (userId: string, messageObj: any) => void;
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function jaccardSimilarity(setA: string[], setB: string[]): number {
  if (setA.length === 0 && setB.length === 0) return 1;
  const a = new Set(setA.map((s) => s.toLowerCase()));
  const b = new Set(setB.map((s) => s.toLowerCase()));
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

export function getCurrentMealSlot(): 'breakfast' | 'lunch' | 'dinner' | 'supper' {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return 'breakfast';
  if (hour >= 11 && hour < 14) return 'lunch';
  if (hour >= 17 && hour < 20) return 'dinner';
  if (hour >= 21 && hour < 24) return 'supper';
  const slots: ('breakfast' | 'lunch' | 'dinner' | 'supper')[] = ['breakfast', 'lunch', 'dinner', 'supper'];
  const distances = [
    { slot: 'breakfast' as const, dist: Math.min(Math.abs(hour - 7), Math.abs(hour - 9)) },
    { slot: 'lunch' as const, dist: Math.min(Math.abs(hour - 12), Math.abs(hour - 13)) },
    { slot: 'dinner' as const, dist: Math.min(Math.abs(hour - 18), Math.abs(hour - 19)) },
    { slot: 'supper' as const, dist: Math.min(Math.abs(hour - 22), Math.abs(hour - 23)) },
  ];
  distances.sort((a, b) => a.dist - b.dist);
  return distances[0].slot;
}

function buildMealWithUser(meal: Meal, publisher: User | undefined): any {
  const { password, ...safePublisher } = publisher || {
    id: '', username: '', password: '', avatar: '', bio: '',
    location: { lat: 0, lng: 0 },
    tastePrefs: { spiciness: 0 as 0, cuisines: [], restrictions: [] },
    availableSlots: [] as ('breakfast' | 'lunch' | 'dinner' | 'supper')[],
    deliveryRadius: 0, createdAt: 0,
  };
  return {
    ...meal,
    publisher: safePublisher,
  };
}

export function startMatcher(stores: Stores, wsHandler: WSHandler) {
  const PUSHED_MEALS_KEY_PREFIX = '__pushed_';

  function runMatching() {
    const now = Date.now();
    const currentSlot = getCurrentMealSlot();
    const validMeals: Meal[] = [];

    for (const meal of stores.meals.values()) {
      if (meal.expiresAt > now && meal.remainingServings > 0) {
        validMeals.push(meal);
      }
    }

    for (const meal of validMeals) {
      const publisher = stores.users.get(meal.publisherId);

      for (const user of stores.users.values()) {
        if (user.id === meal.publisherId) continue;

        const pushedKey = PUSHED_MEALS_KEY_PREFIX + user.id;
        const pushedSet: Set<string> = (stores as any)[pushedKey] || new Set();
        if (pushedSet.has(meal.id)) continue;

        const distance = haversineDistance(
          user.location.lat,
          user.location.lng,
          meal.location.lat,
          meal.location.lng
        );

        if (distance > user.deliveryRadius) continue;

        const tasteSimilarity = jaccardSimilarity(meal.tags, user.tastePrefs.cuisines);
        if (tasteSimilarity < 0.6) continue;

        const mealSlot = meal.mealTime || currentSlot;
        if (!user.availableSlots.includes(mealSlot)) continue;

        const matchScore = Math.round((1 - distance / Math.max(user.deliveryRadius, 1)) * 50 + tasteSimilarity * 50);

        const mealWithUser = buildMealWithUser(meal, publisher);
        wsHandler.sendToUser(user.id, {
          type: 'MEAL_PUSH',
          meal: mealWithUser,
          matchScore,
        });

        pushedSet.add(meal.id);
        (stores as any)[pushedKey] = pushedSet;
      }
    }
  }

  setInterval(runMatching, 15000);
  runMatching();

  return {
    runMatching,
  };
}
