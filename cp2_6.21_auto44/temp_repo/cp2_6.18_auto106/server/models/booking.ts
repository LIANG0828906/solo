export interface Booking {
  id: string;
  resourceType: 'desk' | 'room';
  resourceId: string;
  userName: string;
  startTime: Date;
  endTime: Date;
  purpose: string;
}

export interface CreateBookingData {
  resourceType: 'desk' | 'room';
  resourceId: string;
  userName: string;
  startTime: string;
  endTime: string;
  purpose: string;
}

class BookingService {
  private bookings: Booking[] = [];

  create(data: CreateBookingData): { success: boolean; booking?: Booking; conflict?: Booking; message?: string } {
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (startTime >= endTime) {
      return { success: false, message: '结束时间必须晚于开始时间' };
    }

    const conflict = this.bookings.find((b) => {
      if (b.resourceType !== data.resourceType || b.resourceId !== data.resourceId) {
        return false;
      }
      return startTime < b.endTime && endTime > b.startTime;
    });

    if (conflict) {
      return {
        success: false,
        conflict,
        message: `资源已被占用：${this.formatDate(conflict.startTime)} ${this.formatTime(conflict.startTime)}-${this.formatTime(conflict.endTime)}`,
      };
    }

    const booking: Booking = {
      id: this.generateId(),
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      userName: data.userName,
      startTime,
      endTime,
      purpose: data.purpose,
    };

    this.bookings.push(booking);
    return { success: true, booking };
  }

  list(): Booking[] {
    return [...this.bookings].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  remove(id: string): boolean {
    const index = this.bookings.findIndex((b) => b.id === id);
    if (index === -1) {
      return false;
    }
    this.bookings.splice(index, 1);
    return true;
  }

  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private formatDate(date: Date): string {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }

  private formatTime(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
}

export const bookingService = new BookingService();
