export const avatarColors = [
  '#7C3AED',
  '#E11D48',
  '#059669',
  '#D97706',
  '#2563EB',
  '#DB2777',
  '#0891B2',
  '#CA8A04',
];

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getColorFromName(name: string): string {
  if (!name) return avatarColors[0];
  const hash = hashCode(name);
  return avatarColors[hash % avatarColors.length];
}
