const AVATAR_COLORS = [
  '#1890ff',
  '#fa8c16',
  '#52c41a',
  '#eb2f96',
  '#722ed1',
  '#13c2c2',
];

export function getAvatarColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function getInitials(username: string): string {
  return username.charAt(0).toUpperCase();
}
