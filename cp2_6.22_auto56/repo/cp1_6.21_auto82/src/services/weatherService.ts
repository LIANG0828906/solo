import axios from "axios";

export interface WeatherAlert {
  id: string;
  type: string;
  level: "yellow" | "red";
  areaName: string;
  coordinates: {
    sw: { lat: number; lng: number };
    ne: { lat: number; lng: number };
  };
  description: string;
}

interface CacheEntry {
  timestamp: number;
  data: WeatherAlert[];
}

let cache: CacheEntry | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function fetchWeatherAlerts(
  routeIds: string[]
): Promise<WeatherAlert[]> {
  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_TTL_MS) {
    return cache.data;
  }

  const params = new URLSearchParams();
  routeIds.forEach((id) => params.append("routeIds", id));

  const response = await axios.get<WeatherAlert[]>("/api/weather-alerts", {
    params,
  });

  cache = { timestamp: now, data: response.data };
  return response.data;
}
