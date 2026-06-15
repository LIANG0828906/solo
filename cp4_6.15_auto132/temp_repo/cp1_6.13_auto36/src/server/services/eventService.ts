import {
  createEvent,
  getEventById,
  getEventByCode,
  getAllEvents,
  getEventStatus,
  getCheckInCount,
  getEventCheckIns,
  hasParticipantCheckedIn,
  createCheckIn,
  getAllCheckIns,
} from '../store';
import type { Event, CheckInRecord } from '../store';

export interface CreateEventDTO {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants: number;
}

export interface EventWithStats extends Event {
  checkInCount: number;
  status: 'upcoming' | 'ongoing' | 'ended';
}

export interface EventDetail extends EventWithStats {
  participants: CheckInRecord[];
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export function validateCreateEventData(data: CreateEventDTO): ValidationResult {
  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    return { valid: false, message: '活动标题不能为空' };
  }

  if (!data.description || typeof data.description !== 'string' || !data.description.trim()) {
    return { valid: false, message: '活动描述不能为空' };
  }

  if (!data.startTime || typeof data.startTime !== 'string') {
    return { valid: false, message: '请提供活动开始时间' };
  }

  if (!data.endTime || typeof data.endTime !== 'string') {
    return { valid: false, message: '请提供活动结束时间' };
  }

  if (!data.location || typeof data.location !== 'string' || !data.location.trim()) {
    return { valid: false, message: '活动地点不能为空' };
  }

  const maxParticipantsNum = Number(data.maxParticipants);
  if (
    !data.maxParticipants ||
    typeof data.maxParticipants === 'boolean' ||
    isNaN(maxParticipantsNum) ||
    !Number.isInteger(maxParticipantsNum) ||
    maxParticipantsNum <= 0
  ) {
    return { valid: false, message: '最大参与人数必须为正整数' };
  }

  const startTime = new Date(data.startTime).getTime();
  const endTime = new Date(data.endTime).getTime();
  const now = Date.now();

  if (isNaN(startTime)) {
    return { valid: false, message: '活动开始时间格式无效' };
  }

  if (isNaN(endTime)) {
    return { valid: false, message: '活动结束时间格式无效' };
  }

  if (startTime <= now) {
    return { valid: false, message: '活动开始时间必须晚于当前时间' };
  }

  if (endTime <= startTime) {
    return { valid: false, message: '活动结束时间必须晚于开始时间' };
  }

  return { valid: true };
}

export function createNewEvent(data: CreateEventDTO): EventWithStats {
  const event = createEvent({
    title: data.title.trim(),
    description: data.description.trim(),
    startTime: data.startTime,
    endTime: data.endTime,
    location: data.location.trim(),
    maxParticipants: Number(data.maxParticipants),
  });
  return enrichEventWithStats(event);
}

export function enrichEventWithStats(event: Event): EventWithStats {
  return {
    ...event,
    checkInCount: getCheckInCount(event.id),
    status: getEventStatus(event),
  };
}

export function listEvents(
  page: number = 1,
  pageSize: number = 20,
  status?: string,
  keyword?: string
): { events: EventWithStats[]; total: number; hasMore: boolean } {
  let allEvents = getAllEvents().map(enrichEventWithStats);

  if (status && status !== 'all') {
    allEvents = allEvents.filter(e => e.status === status);
  }

  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase();
    allEvents = allEvents.filter(
      e =>
        e.title.toLowerCase().includes(kw) ||
        e.description.toLowerCase().includes(kw) ||
        e.location.toLowerCase().includes(kw) ||
        e.code.toLowerCase().includes(kw)
    );
  }

  const total = allEvents.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const events = allEvents.slice(start, end);
  const hasMore = end < total;

  return { events, total, hasMore };
}

export function getEventDetail(id: string): EventDetail | null {
  const event = getEventById(id);
  if (!event) return null;
  const stats = enrichEventWithStats(event);
  const participants = getEventCheckIns(id);
  return { ...stats, participants };
}

export function getEventQRCode(id: string): { code: string; qrCode: string } | null {
  const event = getEventById(id);
  if (!event) return null;
  return { code: event.code, qrCode: event.qrCode };
}

export function submitCheckIn(
  eventCode: string,
  participantName: string
): {
  success: boolean;
  alreadyChecked: boolean;
  record?: CheckInRecord;
  message?: string;
} {
  if (!eventCode || typeof eventCode !== 'string') {
    return { success: false, alreadyChecked: false, message: '活动编码不能为空' };
  }

  if (!participantName || typeof participantName !== 'string' || !participantName.trim()) {
    return { success: false, alreadyChecked: false, message: '参与者姓名不能为空' };
  }

  const event = getEventByCode(eventCode.toUpperCase());
  if (!event) {
    return { success: false, alreadyChecked: false, message: '活动编码无效' };
  }

  const status = getEventStatus(event);
  if (status === 'ended') {
    return { success: false, alreadyChecked: false, message: '活动已结束' };
  }

  if (hasParticipantCheckedIn(event.id, participantName)) {
    const existing = getEventCheckIns(event.id).find(
      r => r.participantName.trim().toLowerCase() === participantName.trim().toLowerCase()
    );
    return {
      success: false,
      alreadyChecked: true,
      record: existing,
      message: '已签到，不可重复签到',
    };
  }

  const currentCount = getCheckInCount(event.id);
  if (currentCount >= event.maxParticipants) {
    return { success: false, alreadyChecked: false, message: '活动参与人数已满' };
  }

  const record = createCheckIn(event.id, participantName);
  return { success: true, alreadyChecked: false, record };
}

export function getCheckInList(eventId?: string, limit?: number): CheckInRecord[] {
  if (eventId) {
    let records = getEventCheckIns(eventId);
    if (limit) records = records.slice(0, limit);
    return records;
  }
  return getAllCheckIns(limit);
}

export interface CheckInTrend {
  time: string;
  count: number;
}

export interface DashboardStatsData {
  totalEvents: number;
  ongoingEvents: number;
  totalCheckIns: number;
  averageCheckInRate: number;
  trend: CheckInTrend[];
  recentCheckIns: CheckInRecord[];
}

export function getDashboardStats(): DashboardStatsData {
  const allEvents = getAllEvents();
  const enrichedEvents = allEvents.map(enrichEventWithStats);

  const totalEvents = enrichedEvents.length;
  const ongoingEvents = enrichedEvents.filter(e => e.status === 'ongoing').length;
  const recentCheckIns = getAllCheckIns(10);
  const totalCheckIns = getAllCheckIns().length;

  let averageCheckInRate = 0;
  if (totalEvents > 0) {
    const rates = enrichedEvents.map(e =>
      e.maxParticipants > 0 ? (e.checkInCount / e.maxParticipants) * 100 : 0
    );
    averageCheckInRate = Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
  }

  const trend: CheckInTrend[] = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hourStart = new Date(hour);
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hour);
    hourEnd.setMinutes(59, 59, 999);

    const count = getAllCheckIns().filter(r => {
      const t = new Date(r.checkInTime).getTime();
      return t >= hourStart.getTime() && t <= hourEnd.getTime();
    }).length;

    trend.push({
      time: `${hour.getHours().toString().padStart(2, '0')}:00`,
      count,
    });
  }

  return {
    totalEvents,
    ongoingEvents,
    totalCheckIns,
    averageCheckInRate,
    trend,
    recentCheckIns,
  };
}
