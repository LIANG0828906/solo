import { differenceInDays, isPast, parseISO } from 'date-fns';
import type { Person } from '@/types';

export function calculateDaysUntilBirthday(birthdayStr: string): number {
  const birthday = parseISO(birthdayStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let nextBirthday = new Date(
    today.getFullYear(),
    birthday.getMonth(),
    birthday.getDate()
  );
  nextBirthday.setHours(0, 0, 0, 0);
  
  if (isPast(nextBirthday)) {
    nextBirthday = new Date(
      today.getFullYear() + 1,
      birthday.getMonth(),
      birthday.getDate()
    );
  }
  
  return differenceInDays(nextBirthday, today);
}

export function isDateInPast(dateStr: string): boolean {
  const date = parseISO(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return isPast(date) && !isSameDay(date, today);
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function formatBirthdayDisplay(birthdayStr: string): string {
  const birthday = parseISO(birthdayStr);
  const month = birthday.getMonth() + 1;
  const day = birthday.getDate();
  return `${month}月${day}日`;
}

export function getCountdownColorClass(days: number): string {
  if (days <= 7) return 'text-orange-400';
  if (days <= 30) return 'text-blue-400';
  return 'text-gray-400';
}

export function getUpcomingBirthdays(people: Person[], days: number = 30): Person[] {
  return people
    .filter(person => {
      const daysUntil = calculateDaysUntilBirthday(person.birthday);
      return daysUntil >= 0 && daysUntil <= days;
    })
    .sort((a, b) => {
      const daysA = calculateDaysUntilBirthday(a.birthday);
      const daysB = calculateDaysUntilBirthday(b.birthday);
      return daysA - daysB;
    });
}

export function sortByBirthday(people: Person[]): Person[] {
  return [...people].sort((a, b) => {
    const daysA = calculateDaysUntilBirthday(a.birthday);
    const daysB = calculateDaysUntilBirthday(b.birthday);
    return daysA - daysB;
  });
}
