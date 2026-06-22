import { isAfter, parseISO } from 'date-fns';
import { Reservation } from '../types';

export const checkOverdue = (reservation: Reservation): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = parseISO(reservation.endDate);
  endDate.setHours(0, 0, 0, 0);
  return isAfter(today, endDate);
};

export const checkAllOverdue = (reservations: Reservation[]): Reservation[] => {
  return reservations.map(reservation => ({
    ...reservation,
    isOverdue: checkOverdue(reservation),
  }));
};

export const countOverdue = (reservations: Reservation[]): number => {
  return reservations.filter(r => checkOverdue(r)).length;
};

export const startOverdueCheck = (
  reservations: Reservation[],
  onUpdate: (updated: Reservation[]) => void,
  interval: number = 30000
): (() => void) => {
  const check = () => {
    const updated = checkAllOverdue(reservations);
    onUpdate(updated);
  };
  check();
  const timer = setInterval(check, interval);
  return () => clearInterval(timer);
};
