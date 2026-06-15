import { FoodJournal } from '../types';

export function calculateRadarData(journals: FoodJournal[]): {
  sour: number;
  sweet: number;
  spicy: number;
  salty: number;
  umami: number;
} {
  if (journals.length === 0) {
    return { sour: 0, sweet: 0, spicy: 0, salty: 0, umami: 0 };
  }

  const totals = journals.reduce(
    (acc, journal) => {
      acc.sour += journal.tasteProfile.sour;
      acc.sweet += journal.tasteProfile.sweet;
      acc.spicy += journal.tasteProfile.spicy;
      acc.salty += journal.tasteProfile.salty;
      acc.umami += journal.tasteProfile.umami;
      return acc;
    },
    { sour: 0, sweet: 0, spicy: 0, salty: 0, umami: 0 }
  );

  return {
    sour: Math.round(totals.sour / journals.length),
    sweet: Math.round(totals.sweet / journals.length),
    spicy: Math.round(totals.spicy / journals.length),
    salty: Math.round(totals.salty / journals.length),
    umami: Math.round(totals.umami / journals.length),
  };
}

export function calculateCalendarData(
  journals: FoodJournal[],
  year: number
): { date: string; count: number }[] {
  const dateMap = new Map<string, number>();

  journals.forEach((journal) => {
    const date = new Date(journal.createdAt);
    if (date.getFullYear() === year) {
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
    }
  });

  return Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
