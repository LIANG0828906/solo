import { get, set } from 'idb-keyval';
import { DB_KEYS } from '@/shared/utils/db';
import type { ExchangeRequest, Message, CalendarEvent, User } from '@/types';

export async function getAllExchanges(): Promise<ExchangeRequest[]> {
  return (await get<ExchangeRequest[]>(DB_KEYS.exchanges)) ?? [];
}

export async function addExchange(exchange: ExchangeRequest): Promise<void> {
  const exchanges = await getAllExchanges();
  exchanges.push(exchange);
  await set(DB_KEYS.exchanges, exchanges);
}

export async function updateExchange(updated: ExchangeRequest): Promise<void> {
  const exchanges = await getAllExchanges();
  const index = exchanges.findIndex((e) => e.id === updated.id);
  if (index !== -1) {
    exchanges[index] = updated;
    await set(DB_KEYS.exchanges, exchanges);
  }
}

export async function getExchangesForUser(userId: string): Promise<ExchangeRequest[]> {
  const exchanges = await getAllExchanges();
  return exchanges.filter((e) => e.fromUserId === userId || e.toUserId === userId);
}

export async function getAllMessages(): Promise<Message[]> {
  return (await get<Message[]>(DB_KEYS.messages)) ?? [];
}

export async function addMessage(message: Message): Promise<void> {
  const messages = await getAllMessages();
  messages.push(message);
  await set(DB_KEYS.messages, messages);
}

export async function markMessageAsRead(id: string): Promise<void> {
  const messages = await getAllMessages();
  const index = messages.findIndex((m) => m.id === id);
  if (index !== -1) {
    messages[index].isRead = true;
    await set(DB_KEYS.messages, messages);
  }
}

export async function getMessagesForExchange(exchangeId: string): Promise<Message[]> {
  const messages = await getAllMessages();
  return messages.filter((m) => m.exchangeId === exchangeId);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const messages = await getAllMessages();
  return messages.filter((m) => !m.isRead && m.senderId !== userId).length;
}

export async function getAllCalendarEvents(): Promise<CalendarEvent[]> {
  return (await get<CalendarEvent[]>(DB_KEYS.calendarEvents)) ?? [];
}

export async function addCalendarEvent(event: CalendarEvent): Promise<void> {
  const events = await getAllCalendarEvents();
  events.push(event);
  await set(DB_KEYS.calendarEvents, events);
}

export async function getCalendarEventsForUser(userId: string): Promise<CalendarEvent[]> {
  const events = await getAllCalendarEvents();
  return events.filter((e) => e.userId === userId);
}

export async function getAllUsers(): Promise<User[]> {
  return (await get<User[]>(DB_KEYS.users)) ?? [];
}

export async function updateUser(updated: User): Promise<void> {
  const users = await getAllUsers();
  const index = users.findIndex((u) => u.id === updated.id);
  if (index !== -1) {
    users[index] = updated;
    await set(DB_KEYS.users, users);
  }
}
