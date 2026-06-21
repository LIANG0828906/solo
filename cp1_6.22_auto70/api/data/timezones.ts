export interface TimezoneEntry {
  city: string
  timezone: string
  utcOffset: number
}

export const timezones: TimezoneEntry[] = [
  { city: 'New York', timezone: 'America/New_York', utcOffset: -5 },
  { city: 'Los Angeles', timezone: 'America/Los_Angeles', utcOffset: -8 },
  { city: 'Chicago', timezone: 'America/Chicago', utcOffset: -6 },
  { city: 'Denver', timezone: 'America/Denver', utcOffset: -7 },
  { city: 'Toronto', timezone: 'America/Toronto', utcOffset: -5 },
  { city: 'Vancouver', timezone: 'America/Vancouver', utcOffset: -8 },
  { city: 'Mexico City', timezone: 'America/Mexico_City', utcOffset: -6 },
  { city: 'Sao Paulo', timezone: 'America/Sao_Paulo', utcOffset: -3 },
  { city: 'Buenos Aires', timezone: 'America/Argentina/Buenos_Aires', utcOffset: -3 },
  { city: 'Bogota', timezone: 'America/Bogota', utcOffset: -5 },
  { city: 'Lima', timezone: 'America/Lima', utcOffset: -5 },
  { city: 'Santiago', timezone: 'America/Santiago', utcOffset: -4 },
  { city: 'London', timezone: 'Europe/London', utcOffset: 0 },
  { city: 'Paris', timezone: 'Europe/Paris', utcOffset: 1 },
  { city: 'Berlin', timezone: 'Europe/Berlin', utcOffset: 1 },
  { city: 'Madrid', timezone: 'Europe/Madrid', utcOffset: 1 },
  { city: 'Rome', timezone: 'Europe/Rome', utcOffset: 1 },
  { city: 'Amsterdam', timezone: 'Europe/Amsterdam', utcOffset: 1 },
  { city: 'Brussels', timezone: 'Europe/Brussels', utcOffset: 1 },
  { city: 'Zurich', timezone: 'Europe/Zurich', utcOffset: 1 },
  { city: 'Vienna', timezone: 'Europe/Vienna', utcOffset: 1 },
  { city: 'Stockholm', timezone: 'Europe/Stockholm', utcOffset: 1 },
  { city: 'Oslo', timezone: 'Europe/Oslo', utcOffset: 1 },
  { city: 'Copenhagen', timezone: 'Europe/Copenhagen', utcOffset: 1 },
  { city: 'Helsinki', utcOffset: 2, timezone: 'Europe/Helsinki' },
  { city: 'Warsaw', timezone: 'Europe/Warsaw', utcOffset: 1 },
  { city: 'Prague', timezone: 'Europe/Prague', utcOffset: 1 },
  { city: 'Budapest', timezone: 'Europe/Budapest', utcOffset: 1 },
  { city: 'Athens', timezone: 'Europe/Athens', utcOffset: 2 },
  { city: 'Istanbul', timezone: 'Europe/Istanbul', utcOffset: 3 },
  { city: 'Moscow', timezone: 'Europe/Moscow', utcOffset: 3 },
  { city: 'Dubai', timezone: 'Asia/Dubai', utcOffset: 4 },
  { city: 'Riyadh', timezone: 'Asia/Riyadh', utcOffset: 3 },
  { city: 'Mumbai', timezone: 'Asia/Kolkata', utcOffset: 5.5 },
  { city: 'Delhi', timezone: 'Asia/Kolkata', utcOffset: 5.5 },
  { city: 'Kolkata', timezone: 'Asia/Kolkata', utcOffset: 5.5 },
  { city: 'Dhaka', timezone: 'Asia/Dhaka', utcOffset: 6 },
  { city: 'Bangkok', timezone: 'Asia/Bangkok', utcOffset: 7 },
  { city: 'Jakarta', timezone: 'Asia/Jakarta', utcOffset: 7 },
  { city: 'Singapore', timezone: 'Asia/Singapore', utcOffset: 8 },
  { city: 'Kuala Lumpur', timezone: 'Asia/Kuala_Lumpur', utcOffset: 8 },
  { city: 'Hong Kong', timezone: 'Asia/Hong_Kong', utcOffset: 8 },
  { city: 'Shanghai', timezone: 'Asia/Shanghai', utcOffset: 8 },
  { city: 'Beijing', timezone: 'Asia/Shanghai', utcOffset: 8 },
  { city: 'Taipei', timezone: 'Asia/Taipei', utcOffset: 8 },
  { city: 'Seoul', timezone: 'Asia/Seoul', utcOffset: 9 },
  { city: 'Tokyo', timezone: 'Asia/Tokyo', utcOffset: 9 },
  { city: 'Sydney', timezone: 'Australia/Sydney', utcOffset: 11 },
  { city: 'Melbourne', timezone: 'Australia/Melbourne', utcOffset: 11 },
  { city: 'Auckland', timezone: 'Pacific/Auckland', utcOffset: 13 },
  { city: 'Honolulu', timezone: 'Pacific/Honolulu', utcOffset: -10 },
  { city: 'Anchorage', timezone: 'America/Anchorage', utcOffset: -9 },
  { city: 'Cairo', timezone: 'Africa/Cairo', utcOffset: 2 },
  { city: 'Lagos', timezone: 'Africa/Lagos', utcOffset: 1 },
  { city: 'Nairobi', timezone: 'Africa/Nairobi', utcOffset: 3 },
  { city: 'Johannesburg', timezone: 'Africa/Johannesburg', utcOffset: 2 },
  { city: 'Casablanca', timezone: 'Africa/Casablanca', utcOffset: 1 },
]

export function getCityTimezone(city: string): TimezoneEntry | undefined {
  return timezones.find((t) => t.city.toLowerCase() === city.toLowerCase())
}

export function getCitiesByOffset(offset: number): TimezoneEntry[] {
  return timezones.filter((t) => t.utcOffset === offset)
}
