export type PasswordMode = 'random' | 'phrase' | 'readable';

export interface PasswordConfig {
  mode: PasswordMode;
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  keywordFilter: string;
  phraseWords?: number;
  phraseSeparator?: string;
  readableWords?: number;
}

export interface StrengthResult {
  score: number;
  entropy: number;
  level: 'weak' | 'medium' | 'strong' | 'very-strong';
  label: string;
  suggestions: { text: string; success: boolean }[];
  crackTime: string;
}

export interface HistoryItem {
  id: string;
  password: string;
  mode: PasswordMode;
  createdAt: number;
  isFavorite: boolean;
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const SIMILAR = '0O1lI|';

const COMMON_WORDS = [
  'apple', 'banana', 'cherry', 'dragon', 'eagle', 'forest', 'galaxy', 'horizon',
  'island', 'jungle', 'kingdom', 'lemon', 'mountain', 'nebula', 'ocean', 'phoenix',
  'quantum', 'river', 'sunset', 'thunder', 'umbrella', 'valley', 'whisper', 'xenon',
  'yellow', 'zephyr', 'amber', 'blizzard', 'crystal', 'diamond', 'emerald', 'falcon',
  'golden', 'harbor', 'ivory', 'jasmine', 'knight', 'lotus', 'meadow', 'nebula',
  'olive', 'pioneer', 'quicksilver', 'raven', 'sapphire', 'titan', 'utopia', 'vortex',
  'willow', 'zenith', 'arcane', 'breeze', 'cascade', 'dusk', 'ethereal', 'frost',
  'glacier', 'haven', 'ignite', 'jubilee', 'karma', 'lunar', 'mirage', 'nova'
];

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getRandomChar(charset: string): string {
  return charset[Math.floor(Math.random() * charset.length)];
}

function excludeSimilarChars(charset: string): string {
  return charset.split('').filter(c => !SIMILAR.includes(c)).join('');
}

function filterKeywords(password: string, keywords: string[]): string {
  let result = password;
  keywords.forEach(keyword => {
    if (keyword && result.toLowerCase().includes(keyword.toLowerCase())) {
      const regex = new RegExp(keyword, 'gi');
      result = result.replace(regex, (match) => {
        return match.split('').map(c => {
          const replacements = {
            'a': '@', 'A': '4', 'e': '3', 'E': '€',
            'i': '!', 'I': '1', 'o': '0', 'O': '0',
            's': '$', 'S': '5', 't': '7', 'T': '+'
          };
          return (replacements as Record<string, string>)[c] || c;
        }).join('');
      });
    }
  });
  return result;
}

export function generateRandomPassword(config: PasswordConfig): string {
  let charset = '';
  
  if (config.includeUppercase) charset += UPPERCASE;
  if (config.includeLowercase) charset += LOWERCASE;
  if (config.includeNumbers) charset += NUMBERS;
  if (config.includeSymbols) charset += SYMBOLS;
  
  if (!charset) charset = LOWERCASE;
  if (config.excludeSimilar) charset = excludeSimilarChars(charset);
  
  if (charset.length < 2) charset = LOWERCASE;
  
  const chars: string[] = [];
  const required: string[] = [];
  
  if (config.includeUppercase) {
    const uc = config.excludeSimilar ? excludeSimilarChars(UPPERCASE) : UPPERCASE;
    required.push(getRandomChar(uc));
  }
  if (config.includeLowercase) {
    const lc = config.excludeSimilar ? excludeSimilarChars(LOWERCASE) : LOWERCASE;
    required.push(getRandomChar(lc));
  }
  if (config.includeNumbers) {
    const nums = config.excludeSimilar ? excludeSimilarChars(NUMBERS) : NUMBERS;
    required.push(getRandomChar(nums));
  }
  if (config.includeSymbols) {
    const syms = config.excludeSimilar ? excludeSimilarChars(SYMBOLS) : SYMBOLS;
    required.push(getRandomChar(syms));
  }
  
  const remaining = Math.max(config.length - required.length, 0);
  for (let i = 0; i < remaining; i++) {
    chars.push(getRandomChar(charset));
  }
  
  const allChars = shuffleArray([...chars, ...required]).slice(0, config.length);
  
  let password = allChars.join('');
  
  if (config.keywordFilter) {
    const keywords = config.keywordFilter.split(/[,，\s]+/).filter(Boolean);
    password = filterKeywords(password, keywords);
  }
  
  return password;
}

export function generatePhrasePassword(config: PasswordConfig): string {
  const wordCount = config.phraseWords || 4;
  const separator = config.phraseSeparator || '-';
  
  const selectedWords = shuffleArray(COMMON_WORDS).slice(0, wordCount);
  const processedWords = selectedWords.map((word, index) => {
    let processed = word;
    if (config.includeUppercase && index % 2 === 0) {
      processed = processed.charAt(0).toUpperCase() + processed.slice(1);
    }
    return processed;
  });
  
  let password = processedWords.join(separator);
  
  if (config.includeNumbers) {
    password += separator + Math.floor(100 + Math.random() * 900);
  }
  if (config.includeSymbols) {
    password += getRandomChar(SYMBOLS);
  }
  
  if (config.keywordFilter) {
    const keywords = config.keywordFilter.split(/[,，\s]+/).filter(Boolean);
    password = filterKeywords(password, keywords);
  }
  
  if (password.length < config.length) {
    let extra = '';
    while (password.length + extra.length < config.length) {
      extra += getRandomChar(config.excludeSimilar ? excludeSimilarChars(LOWERCASE + NUMBERS) : LOWERCASE + NUMBERS);
    }
    password += separator + extra;
  }
  
  return password.slice(0, 64);
}

export function generateReadablePassword(config: PasswordConfig): string {
  const wordCount = config.readableWords || 3;
  const selectedWords = shuffleArray(COMMON_WORDS).slice(0, wordCount);
  
  let password = selectedWords.map((word, index) => {
    if (index === 0 && config.includeUppercase) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  }).join('');
  
  if (config.includeNumbers) {
    password += Math.floor(100 + Math.random() * 9000);
  }
  if (config.includeSymbols) {
    password += getRandomChar(SYMBOLS);
    password += Math.floor(10 + Math.random() * 90);
  }
  
  if (config.excludeSimilar) {
    password = password.split('').filter(c => !SIMILAR.includes(c)).join('');
  }
  
  if (config.keywordFilter) {
    const keywords = config.keywordFilter.split(/[,，\s]+/).filter(Boolean);
    password = filterKeywords(password, keywords);
  }
  
  if (password.length < config.length) {
    let extra = '';
    const charset = config.excludeSimilar 
      ? excludeSimilarChars(LOWERCASE + NUMBERS) 
      : LOWERCASE + NUMBERS;
    while (password.length + extra.length < config.length) {
      extra += getRandomChar(charset);
    }
    password += extra;
  }
  
  return password.slice(0, 64);
}

export function generatePassword(config: PasswordConfig): string {
  switch (config.mode) {
    case 'phrase':
      return generatePhrasePassword(config);
    case 'readable':
      return generateReadablePassword(config);
    case 'random':
    default:
      return generateRandomPassword(config);
  }
}

export function calculateStrength(password: string): StrengthResult {
  if (!password) {
    return {
      score: 0,
      entropy: 0,
      level: 'weak',
      label: '无效',
      suggestions: [],
      crackTime: '立刻'
    };
  }

  let poolSize = 0;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasNumber) poolSize += 10;
  if (hasSymbol) poolSize += 32;

  if (poolSize === 0) poolSize = 1;

  const length = password.length;
  const entropy = length * Math.log2(poolSize);

  const uniqueChars = new Set(password.split('')).size;
  const repeatedRatio = 1 - (uniqueChars / length);
  const adjustedEntropy = entropy * (1 - repeatedRatio * 0.3);

  const commonPatterns = ['123', 'abc', 'qwerty', 'password', 'admin', 'welcome', '123456'];
  const hasCommonPattern = commonPatterns.some(p => 
    password.toLowerCase().includes(p)
  );

  let finalEntropy = adjustedEntropy;
  if (hasCommonPattern) finalEntropy *= 0.7;

  const suggestions: { text: string; success: boolean }[] = [];

  suggestions.push({
    text: length >= 16 ? '密码长度足够（≥16位）' : '建议增加密码长度到16位以上',
    success: length >= 16
  });

  suggestions.push({
    text: hasLower && hasUpper ? '包含大小写字母组合' : '建议同时使用大写和小写字母',
    success: hasLower && hasUpper
  });

  suggestions.push({
    text: hasNumber ? '包含数字字符' : '建议添加数字字符（0-9）',
    success: hasNumber
  });

  suggestions.push({
    text: hasSymbol ? '包含特殊符号' : '建议添加特殊符号（!@#$%^&*等）',
    success: hasSymbol
  });

  suggestions.push({
    text: !hasCommonPattern ? '避免了常见模式' : '检测到常见序列或词汇，建议移除',
    success: !hasCommonPattern
  });

  const uniqueRatio = uniqueChars / length;
  suggestions.push({
    text: uniqueRatio >= 0.6 ? '字符多样性良好' : '字符重复度过高，建议增加字符多样性',
    success: uniqueRatio >= 0.6
  });

  let score: number;
  let level: StrengthResult['level'];
  let label: string;

  if (finalEntropy < 40) {
    score = Math.min(25, (finalEntropy / 40) * 25);
    level = 'weak';
    label = '弱';
  } else if (finalEntropy < 60) {
    score = 25 + ((finalEntropy - 40) / 20) * 25;
    level = 'medium';
    label = '中';
  } else if (finalEntropy < 80) {
    score = 50 + ((finalEntropy - 60) / 20) * 25;
    level = 'strong';
    label = '强';
  } else {
    score = Math.min(100, 75 + ((finalEntropy - 80) / 40) * 25);
    level = 'very-strong';
    label = '极强';
  }

  const guessesPerSecond = 1e12;
  const totalCombinations = Math.pow(poolSize, length);
  const seconds = totalCombinations / guessesPerSecond / 2;

  let crackTime: string;
  if (seconds < 1) crackTime = '立刻';
  else if (seconds < 60) crackTime = `${Math.ceil(seconds)} 秒`;
  else if (seconds < 3600) crackTime = `${Math.ceil(seconds / 60)} 分钟`;
  else if (seconds < 86400) crackTime = `${Math.ceil(seconds / 3600)} 小时`;
  else if (seconds < 2592000) crackTime = `${Math.ceil(seconds / 86400)} 天`;
  else if (seconds < 31536000) crackTime = `${Math.ceil(seconds / 2592000)} 个月`;
  else if (seconds < 31536000 * 100) crackTime = `${Math.ceil(seconds / 31536000)} 年`;
  else if (seconds < 31536000 * 1e6) crackTime = `${(seconds / 31536000 / 1000).toFixed(1)} 千年`;
  else crackTime = '数亿年以上';

  return {
    score: Math.round(score),
    entropy: Math.round(finalEntropy),
    level,
    label,
    suggestions,
    crackTime
  };
}

export function getStrengthGradient(score: number): string {
  if (score < 25) {
    return `linear-gradient(90deg, #ff4757 ${score}%, #ff6b7a ${score}%)`;
  } else if (score < 50) {
    return `linear-gradient(90deg, #ff4757, #ffa502 ${score}%, #ffb732 ${score}%)`;
  } else if (score < 75) {
    return `linear-gradient(90deg, #ffa502, #1e90ff ${score}%, #4da3ff ${score}%)`;
  } else {
    return `linear-gradient(90deg, #1e90ff, #2ed573 ${score}%, #5ae68a ${score}%)`;
  }
}
