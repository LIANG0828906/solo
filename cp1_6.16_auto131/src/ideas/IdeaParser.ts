export interface ParsedIdea {
  bpm: number;
  waveform: 'sine' | 'square' | 'sawtooth' | 'triangle';
  effects: {
    reverb: number;
    distortion: number;
    delay: number;
  };
  lang: 'zh' | 'en' | 'ja' | 'es';
}

const KEYWORDS: Record<string, Record<string, string[]>> = {
  zh: {
    fast: ['快节奏', '激昂', '激烈', '欢快', '动感', '快速', '高能量'],
    soft: ['柔和', '缓慢', '轻柔', '温柔', '安静', '悠扬', '舒缓'],
    metal: ['金属', '失真', '重型', '硬核', '电音', '摇滚'],
    rhythm: ['节奏', '律动', '鼓点', '打击'],
    melody: ['旋律', '歌唱', '吟唱', '曲调', '主音'],
    harmony: ['和声', '和弦', '伴奏', '合声']
  },
  en: {
    fast: ['fast', 'intense', 'energetic', 'upbeat', 'driving', 'powerful'],
    soft: ['soft', 'slow', 'gentle', 'calm', 'peaceful', 'mellow', 'ambient'],
    metal: ['metal', 'distortion', 'heavy', 'hardcore', 'aggressive', 'rock'],
    rhythm: ['rhythm', 'groove', 'beat', 'percussion', 'drum'],
    melody: ['melody', 'singing', 'tune', 'vocal', 'lead'],
    harmony: ['harmony', 'chord', 'accompaniment', 'backing']
  },
  ja: {
    fast: ['速い', '激しい', '元気', 'アップテンポ', 'パワフル'],
    soft: ['柔らかい', '遅い', '穏やか', '静か', 'ゆったり'],
    metal: ['メタル', 'ディストーション', 'ヘヴィ', 'ロック'],
    rhythm: ['リズム', 'ビート', 'ドラム', 'グルーヴ'],
    melody: ['メロディ', '歌', '旋律', 'ボーカル'],
    harmony: ['ハーモニー', 'コード', '伴奏', 'バッキング']
  },
  es: {
    fast: ['rápido', 'intenso', 'energético', 'animado', 'potente'],
    soft: ['suave', 'lento', 'tranquilo', 'calmado', 'dulce'],
    metal: ['metal', 'distorsión', 'pesado', 'duro', 'rock'],
    rhythm: ['ritmo', 'groove', 'batería', 'percusión'],
    melody: ['melodía', 'canto', 'tonada', 'voz'],
    harmony: ['armonía', 'acorde', 'acompañamiento', 'coro']
  }
};

function detectLang(text: string): 'zh' | 'en' | 'ja' | 'es' {
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
  if (/[áéíóúñ¿¡]/i.test(text)) return 'es';
  return 'en';
}

export function parseIdea(text: string): ParsedIdea {
  const lang = detectLang(text);
  const kw = KEYWORDS[lang];
  const lower = text.toLowerCase();

  let bpm = 120;
  let waveform: ParsedIdea['waveform'] = 'triangle';
  let reverb = 0.3;
  let distortion = 0;
  let delay = 0.2;

  const fastMatch = kw.fast.some(k => lower.includes(k.toLowerCase()));
  const softMatch = kw.soft.some(k => lower.includes(k.toLowerCase()));
  const metalMatch = kw.metal.some(k => lower.includes(k.toLowerCase()));

  if (fastMatch) {
    bpm += 20;
    waveform = 'square';
    delay = 0.15;
  }
  if (softMatch) {
    bpm = Math.max(60, bpm - 20);
    waveform = 'sine';
    reverb = 0.5;
    delay = 0.3;
  }
  if (metalMatch) {
    waveform = 'sawtooth';
    distortion = 0.6;
    bpm += 10;
  }

  return { bpm, waveform, effects: { reverb, distortion, delay }, lang };
}

export function generateNotes(bpm: number, count: number = 16): number[] {
  const scales: Record<string, number[]> = {
    major: [60, 62, 64, 65, 67, 69, 71, 72, 74, 76],
    minor: [60, 62, 63, 65, 67, 68, 70, 72, 74, 75],
    pentatonic: [60, 62, 64, 67, 69, 72, 74, 76, 79, 81],
    blues: [60, 63, 65, 66, 67, 70, 72, 75, 77, 78],
  };

  const scaleNames = Object.keys(scales);
  const scale = scales[scaleNames[Math.floor(Math.random() * scaleNames.length)]];
  const notes: number[] = [];

  let prevIdx = Math.floor(Math.random() * scale.length);

  for (let i = 0; i < count; i++) {
    const step = Math.floor(Math.random() * 5) - 2;
    prevIdx = Math.max(0, Math.min(scale.length - 1, prevIdx + step));
    notes.push(scale[prevIdx]);
  }

  return notes;
}

export function getScaleForBpm(bpm: number): string {
  if (bpm >= 140) return 'blues';
  if (bpm >= 120) return 'pentatonic';
  if (bpm >= 100) return 'major';
  return 'minor';
}
