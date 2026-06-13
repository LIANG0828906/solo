export const AVATAR_SVGS: string[] = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#FF6B6B"/><circle cx="50" cy="40" r="18" fill="#FFF"/><path d="M20 85 Q50 55 80 85" fill="#FFF"/></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#4ECDC4"/><circle cx="50" cy="40" r="18" fill="#2D3436"/><path d="M20 85 Q50 55 80 85" fill="#2D3436"/></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#45B7D1"/><circle cx="50" cy="40" r="18" fill="#FFEAA7"/><path d="M20 85 Q50 60 80 85" fill="#FFEAA7"/></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#96CEB4"/><circle cx="50" cy="40" r="18" fill="#5C4033"/><path d="M20 85 Q50 60 80 85" fill="#5C4033"/></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#FFEAA7"/><circle cx="50" cy="40" r="18" fill="#E17055"/><path d="M20 85 Q50 58 80 85" fill="#E17055"/></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#DDA0DD"/><circle cx="50" cy="40" r="18" fill="#FFFFFF"/><path d="M20 85 Q50 58 80 85" fill="#FFFFFF"/></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#98D8C8"/><circle cx="50" cy="40" r="18" fill="#2C3E50"/><path d="M20 85 Q50 55 80 85" fill="#2C3E50"/></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#F7DC6F"/><circle cx="50" cy="40" r="18" fill="#6C5CE7"/><path d="M20 85 Q50 58 80 85" fill="#6C5CE7"/></svg>`
];

export function getAvatarDataUrl(index: number): string {
  const svg = AVATAR_SVGS[index % AVATAR_SVGS.length];
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export function getRandomAvatarIndex(): number {
  return Math.floor(Math.random() * AVATAR_SVGS.length);
}

const USER_NAMES = [
  '张伟', '王芳', '李娜', '刘洋', '陈静', '杨帆', '赵磊', '黄敏',
  '周杰', '吴婷', '徐强', '孙丽', '马超', '朱琳', '郭涛', '何欣'
];

export function getRandomUserName(): string {
  return USER_NAMES[Math.floor(Math.random() * USER_NAMES.length)];
}

export function getAvatar(index: number): string {
  return getAvatarDataUrl(index);
}
