import type { Booking, NotificationItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

const REMINDER_MINUTES_BEFORE = 15;
const TICK_INTERVAL_MS = 30 * 1000;

type ReminderCallback = (notification: NotificationItem, bookingId: string) => void;
type BookingsProvider = () => Booking[];

export class NotificationScheduler {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private onReminder: ReminderCallback | null = null;
  private getBookings: BookingsProvider | null = null;
  private notifiedBookingIds: Set<string> = new Set();

  public start(getBookings: BookingsProvider, onReminder: ReminderCallback): void {
    this.getBookings = getBookings;
    this.onReminder = onReminder;
    this.notifiedBookingIds = new Set();
    this.scheduleNext();
  }

  public stop(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.onReminder = null;
    this.getBookings = null;
  }

  public markNotified(bookingId: string): void {
    this.notifiedBookingIds.add(bookingId);
  }

  private scheduleNext(): void {
    this.tick();
    this.timeoutId = setTimeout(() => this.scheduleNext(), TICK_INTERVAL_MS);
  }

  private tick(): void {
    if (!this.getBookings || !this.onReminder) return;

    const now = Date.now();
    const bookings = this.getBookings();

    for (const booking of bookings) {
      if (this.notifiedBookingIds.has(booking.id)) continue;
      if (booking.reminderSent) {
        this.notifiedBookingIds.add(booking.id);
        continue;
      }

      const msUntilStart = booking.startTime - now;
      const minutesUntilStart = msUntilStart / (60 * 1000);

      if (minutesUntilStart <= REMINDER_MINUTES_BEFORE && minutesUntilStart > -1) {
        const minutesLeft = Math.max(0, Math.ceil(minutesUntilStart));
        const notification: NotificationItem = {
          id: uuidv4(),
          bookingId: booking.id,
          message: `您的座位将在 ${minutesLeft} 分钟后到期，请尽快入馆`,
          seatInfo: `${booking.zone}区 · ${booking.seatNumber}`,
          minutesLeft,
          createdAt: now,
        };

        this.onReminder(notification, booking.id);
        this.notifiedBookingIds.add(booking.id);
      }
    }
  }
}

export const notificationScheduler = new NotificationScheduler();
