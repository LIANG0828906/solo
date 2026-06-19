export function generateShortUUID(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let group = 0; group < 2; group++) {
    if (group > 0) result += '-';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return result;
}

export function generateLongId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 10)
  ).toUpperCase();
}
