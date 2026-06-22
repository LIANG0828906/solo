import React from 'react';
import type { Booking, TimeSlot } from '@/types';

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function highlightText(text: string, keyword: string): React.ReactNode {
  if (!keyword.trim()) {
    return text;
  }

  const parts = text.split(new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

  return parts.map((part, index) =>
    part.toLowerCase() === keyword.toLowerCase() ? (
      <mark key={index} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
        {part}
      </mark>
    ) : (
      <React.Fragment key={index}>{part}</React.Fragment>
    )
  );
}

export function generateTimeSlots(
  teacherId: string,
  startDate: Date,
  existingBookings: Booking[]
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const dayStart = 9;
  const dayEnd = 18;
  const slotDuration = 60;

  for (let hour = dayStart; hour < dayEnd; hour++) {
    const startTime = new Date(startDate);
    startTime.setHours(hour, 0, 0, 0);

    const endTime = new Date(startDate);
    endTime.setHours(hour + 1, 0, 0, 0);

    const isOverlapping = existingBookings.some((booking) => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      return (
        (startTime >= bookingStart && startTime < bookingEnd) ||
        (endTime > bookingStart && endTime <= bookingEnd) ||
        (startTime <= bookingStart && endTime >= bookingEnd)
      );
    });

    slots.push({
      id: `${teacherId}-${startTime.getTime()}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      isAvailable: !isOverlapping,
      teacherId,
      skillId: '',
    });
  }

  return slots;
}

export function getAvatarPlaceholder(name: string): string {
  const initials = name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    '3b82f6',
    'ef4444',
    '10b981',
    'f59e0b',
    '8b5cf6',
    'ec4899',
    '06b6d4',
    '84cc16',
    'f97316',
    '6366f1',
  ];

  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const bgColor = colors[colorIndex];

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bgColor}&color=fff&size=128&bold=true`;
}
