import type { StrengthLevel, DimensionScores, CharFrequency, CrackTimeEstimate, PasswordResult } from '../types';

export const COMMON_PASSWORDS: string[] = [
  '123456', 'password', '12345678', 'qwerty', '123456789',
  '12345', '1234', '111111', '1234567', 'dragon',
  'P@ssw0rd', 'Admin123!', 'Welcome@2024', 'Qwerty123!',
  'MyP@ssw0rd2024', 'Str0ng!Pass#2024', 'C0rr3ctH0rs3BatteryStaple!'
];

const ATTACK_TYPES = [
  { name: '字典攻击', guessesPerSecond: 1e10 },
  { name: '彩虹表攻击', guessesPerSecond: 1e11 },
  { name: '暴力破解(小写)', guessesPerSecond: 1e9 },
  { name: '暴力破解(混合)', guessesPerSecond: 1e8 },
  { name: '暴力破解(全字符)', guessesPerSecond: 1e7 }
];

export function calculateEntropy(password: string): number {
  if (!password) return 0;

  let poolSize = 0;

  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

  if (poolSize === 0) return 0;

  const entropy = password.length * Math.log2(poolSize);
  return Math.round(entropy * 100) / 100;
}

export function getStrengthLevel(entropy: number): StrengthLevel {
  if (entropy < 28) return 'weak';
  if (entropy < 56) return 'medium';
  if (entropy < 80) return 'strong';
  return 'very-strong';
}

export function getStrengthText(level: StrengthLevel): string {
  const map: Record<StrengthLevel, string> = {
    'weak': '弱',
    'medium': '中',
    'strong': '强',
    'very-strong': '极强'
  };
  return map[level];
}

export function getDimensionScores(password: string): DimensionScores {
  const uppercase = /[A-Z]/.test(password) ? 100 : 0;
  const lowercase = /[a-z]/.test(password) ? 100 : 0;
  const numbers = /[0-9]/.test(password) ? 100 : 0;
  const specialChars = /[^a-zA-Z0-9]/.test(password) ? 100 : 0;
  const length = Math.min(100, Math.round((password.length / 16) * 100));

  return { uppercase, lowercase, numbers, specialChars, length };
}

export function getCharFrequency(password: string): CharFrequency[] {
  if (!password) return [];

  const frequencyMap = new Map<string, number>();
  for (const char of password) {
    frequencyMap.set(char, (frequencyMap.get(char) || 0) + 1);
  }

  const total = password.length;
  return Array.from(frequencyMap.entries())
    .map(([char, count]) => ({
      char,
      count,
      percentage: Math.round((count / total) * 10000) / 100
    }))
    .sort((a, b) => b.count - a.count);
}

export function formatTime(seconds: number): string {
  if (seconds < 1) return '< 1秒';
  if (seconds < 60) return `${Math.round(seconds)}秒`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}小时`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)}天`;

  const years = seconds / 31536000;
  if (years < 1000) return `${Math.round(years)}年`;
  if (years < 1e6) return `${(years / 1000).toFixed(1)}千年`;
  if (years < 1e9) return `${(years / 1e6).toFixed(1)}百万年`;
  if (years < 1e12) return `${(years / 1e9).toFixed(1)}十亿年`;
  return `${(years / 1e12).toFixed(1)}万亿年`;
}

export function estimateCrackTime(entropy: number): CrackTimeEstimate[] {
  if (entropy === 0) {
    return ATTACK_TYPES.map(attack => ({
      attackType: attack.name,
      timeSeconds: 0,
      formattedTime: '即时'
    }));
  }

  const combinations = Math.pow(2, entropy);

  return ATTACK_TYPES.map(attack => {
    const timeSeconds = combinations / attack.guessesPerSecond;
    return {
      attackType: attack.name,
      timeSeconds,
      formattedTime: formatTime(timeSeconds)
    };
  });
}

export function analyzePassword(password: string): PasswordResult {
  const startTime = performance.now();
  const entropy = calculateEntropy(password);
  const strengthLevel = getStrengthLevel(entropy);
  const strengthText = getStrengthText(strengthLevel);
  const dimensionScores = getDimensionScores(password);
  const charFrequencies = getCharFrequency(password);
  const crackTimes = estimateCrackTime(entropy);

  return {
    password,
    entropy,
    strengthLevel,
    strengthText,
    dimensionScores,
    charFrequencies,
    crackTimes,
    calculatedAt: startTime
  };
}
