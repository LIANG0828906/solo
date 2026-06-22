export interface Attraction {
  id: string;
  name: string;
  description: string;
  duration: string;
  type: string;
  time: string;
}

export interface DailyPlan {
  day: number;
  date: string;
  weather: string;
  weatherAlert?: string;
  attractions: Attraction[];
  transport: string;
  dailyCost: number;
}

export interface Route {
  id: string;
  title: string;
  theme: string;
  totalDays: number;
  fitScore: number;
  costRange: { min: number; max: number };
  foodScore: number;
  transportScore: number;
  attractionTypes: number;
  weatherSuitability: number;
  dailyItinerary: DailyPlan[];
}

export interface Dimension {
  key: keyof Pick<Route, 'fitScore' | 'foodScore' | 'transportScore' | 'attractionTypes' | 'weatherSuitability'> | 'avgCost';
  label: string;
  unit?: string;
  higherIsBetter: boolean;
}
