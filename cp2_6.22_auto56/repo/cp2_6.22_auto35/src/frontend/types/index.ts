export type RoutePoint = {
  lat: number;
  lng: number;
  elevation?: number;
};

export type Route = {
  id: string;
  name: string;
  points: RoutePoint[];
  distance: number;
  elevationGain: number;
  elevationLoss: number;
  estimatedTime: number;
  createdAt: Date;
};

export type Teammate = {
  id: string;
  name: string;
  avatar: string;
  lat: number;
  lng: number;
  lastUpdate: Date;
  isOnline: boolean;
};

export type Activity = {
  id: string;
  routeId: string;
  inviteCode: string;
  teammates: Teammate[];
  createdAt: Date;
};

export type GearItem = {
  id: string;
  name: string;
  checked: boolean;
  category: 'essentials' | 'clothing' | 'food' | 'emergency' | 'custom';
  quantity?: number;
  isCustom?: boolean;
};

export type WeatherData = {
  date: string;
  condition: string;
  tempHigh: number;
  tempLow: number;
  rainProbability: number;
};

export type CalorieData = {
  distance: number;
  calories: number;
  slope: number;
  isDifficult: boolean;
};

export type UserProfile = {
  weight: number;
  packWeight: number;
  name: string;
  avatar: string;
};

export type ElevationPoint = {
  distance: number;
  elevation: number;
  slope: number;
};
