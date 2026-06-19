export function generateActivityId(): string {
  const min = 100000;
  const max = 999999;
  const id = Math.floor(Math.random() * (max - min + 1)) + min;
  return String(id);
}

export function generateUniqueActivityId(existingIds: string[]): string {
  let id: string;
  do {
    id = generateActivityId();
  } while (existingIds.includes(id));
  return id;
}

export function isValidActivityId(id: string): boolean {
  return /^\d{6}$/.test(id);
}

export function generateParticipantId(): string {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
