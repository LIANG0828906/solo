import { get, set } from 'idb-keyval';

const DB_KEYS = {
  items: 'items',
  exchanges: 'exchanges',
  messages: 'messages',
  calendarEvents: 'calendarEvents',
  currentUser: 'currentUser',
  users: 'users',
} as const;

export { DB_KEYS };
export { get, set };
