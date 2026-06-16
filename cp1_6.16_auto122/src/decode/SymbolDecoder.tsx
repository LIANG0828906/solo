import { useEffect, useMemo } from 'react';
import { useDreamStore } from '@/store/dreamStore';
import type { SymbolData, SymbolMatch, Connection } from '@/types';

const SYMBOL_LIBRARY: SymbolData[] = [
  { name: '迷宫', emoji: '🌀', category: 'architecture', keywords: ['迷宫', '迷路', '走不出', '死胡同', '转圈', 'labyrinth', 'maze'] },
  { name: '水', emoji: '💧', category: 'nature', keywords: ['水', '河流', '湖', '泉水', '溪流', '游泳', '溺水', '水淹', 'water', 'river', 'lake'] },
  { name: '坠落', emoji: '⬇️', category: 'action', keywords: ['坠落', '掉落', '跌落', '下坠', '摔', 'fall', 'falling', 'drop'] },
  { name: '飞翔', emoji: '🦅', category: 'action', keywords: ['飞翔', '飞', '飘浮', '腾空', '翱翔', 'fly', 'flying', 'float'] },
  { name: '门', emoji: '🚪', category: 'architecture', keywords: ['门', '门口', '开门', '关门', '推门', 'door', 'gate'] },
  { name: '镜子', emoji: '🪞', category: 'object', keywords: ['镜子', '镜面', '倒影', '照镜', '反射', 'mirror', 'reflection'] },
  { name: '森林', emoji: '🌲', category: 'nature', keywords: ['森林', '树林', '丛林', '密林', '大树', 'forest', 'woods', 'jungle'] },
  { name: '蛇', emoji: '🐍', category: 'nature', keywords: ['蛇', '蟒蛇', '毒蛇', '蛇咬', 'snake', 'serpent'] },
  { name: '房子', emoji: '🏠', category: 'architecture', keywords: ['房子', '房屋', '房间', '屋子', '家', 'house', 'home', 'room'] },
  { name: '牙齿', emoji: '🦷', category: 'object', keywords: ['牙齿', '掉牙', '牙', '拔牙', 'teeth', 'tooth'] },
  { name: '追逐', emoji: '🏃', category: 'action', keywords: ['追逐', '追赶', '被追', '逃跑', '逃', '追', 'chase', 'run', 'pursue'] },
  { name: '桥', emoji: '🌉', category: 'architecture', keywords: ['桥', '桥梁', '过桥', '断桥', '桥下', 'bridge'] },
  { name: '火', emoji: '🔥', category: 'nature', keywords: ['火', '火焰', '燃烧', '着火', '火海', 'fire', 'flame', 'burn'] },
  { name: '眼睛', emoji: '👁️', category: 'object', keywords: ['眼睛', '目光', '注视', '凝视', '看', 'eye', 'gaze', 'stare'] },
  { name: '楼梯', emoji: '🪜', category: 'architecture', keywords: ['楼梯', '台阶', '上楼', '下楼', '阶梯', 'stairs', 'steps'] },
  { name: '雨', emoji: '🌧️', category: 'nature', keywords: ['雨', '下雨', '暴雨', '淋雨', 'rain', 'storm'] },
  { name: '花园', emoji: '🌸', category: 'nature', keywords: ['花园', '花', '草地', '盛开', '花朵', 'garden', 'flower'] },
  { name: '时钟', emoji: '⏰', category: 'object', keywords: ['时钟', '时间', '钟', '倒计时', '迟到', 'clock', 'time'] },
  { name: '海洋', emoji: '🌊', category: 'nature', keywords: ['海洋', '大海', '海', '浪', '潮', 'ocean', 'sea', 'wave'] },
  { name: '山', emoji: '⛰️', category: 'nature', keywords: ['山', '山峰', '登山', '山顶', '山洞', 'mountain', 'climb'] },
  { name: '鸟', emoji: '🐦', category: 'nature', keywords: ['鸟', '鸟飞', '鸟叫', '鸟群', 'bird', 'birds'] },
  { name: '钥匙', emoji: '🔑', category: 'object', keywords: ['钥匙', '开锁', '锁', '钥匙孔', 'key', 'lock', 'unlock'] },
  { name: '月亮', emoji: '🌙', category: 'nature', keywords: ['月亮', '月光', '月', '满月', '新月', 'moon', 'moonlight'] },
  { name: '太阳', emoji: '☀️', category: 'nature', keywords: ['太阳', '阳光', '日出', '日落', 'sun', 'sunlight'] },
  { name: '云', emoji: '☁️', category: 'nature', keywords: ['云', '云朵', '云层', '云雾', 'cloud'] },
  { name: '窗户', emoji: '🪟', category: 'architecture', keywords: ['窗户', '窗', '窗外', '窗台', 'window'] },
  { name: '恐惧', emoji: '😱', category: 'emotion', keywords: ['恐惧', '害怕', '惊恐', '惧怕', 'fear', 'afraid', 'scared'] },
  { name: '孤独', emoji: '🥀', category: 'emotion', keywords: ['孤独', '寂寞', '独自', '一个人', 'lonely', 'alone'] },
  { name: '自由', emoji: '🕊️', category: 'emotion', keywords: ['自由', '释放', '解脱', '解放', 'free', 'freedom'] },
  { name: '变形', emoji: '🦋', category: 'action', keywords: ['变形', '变化', '转变', '变身', '变换', 'transform', 'change'] },
];

function extractContext(text: string, keyword: string): string {
  const idx = text.indexOf(keyword);
  if (idx === -1) return '';
  const start = Math.max(0, idx - 8);
  const end = Math.min(text.length, idx + keyword.length + 8);
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
}

function decodeSymbols(text: string): { symbols: SymbolMatch[]; connections: Connection[] } {
  const lowerText = text.toLowerCase();
  const symbols: SymbolMatch[] = [];
  const matchedMap = new Map<string, SymbolMatch>();

  for (const symbol of SYMBOL_LIBRARY) {
    let matchCount = 0;
    const contexts: string[] = [];
    for (const keyword of symbol.keywords) {
      const regex = new RegExp(keyword, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        matchCount += matches.length;
        const ctx = extractContext(text, keyword);
        if (ctx) contexts.push(ctx);
      }
    }
    if (matchCount > 0) {
      const match: SymbolMatch = {
        symbolName: symbol.name,
        emoji: symbol.emoji,
        category: symbol.category,
        matchCount,
        contexts: contexts.slice(0, 3),
      };
      matchedMap.set(symbol.name, match);
      symbols.push(match);
    }
  }

  const connections: Connection[] = [];
  const sentences = text.split(/[。！？；\.\!\?\;]/);
  for (let i = 0; i < symbols.length; i++) {
    for (let j = i + 1; j < symbols.length; j++) {
      let strength = 0;
      for (const sentence of sentences) {
        const si = SYMBOL_LIBRARY.find(s => s.name === symbols[i].symbolName);
        const sj = SYMBOL_LIBRARY.find(s => s.name === symbols[j].symbolName);
        if (!si || !sj) continue;
        const hasI = si.keywords.some(k => sentence.includes(k));
        const hasJ = sj.keywords.some(k => sentence.includes(k));
        if (hasI && hasJ) strength += 1;
      }
      if (strength > 0) {
        connections.push({
          from: symbols[i].symbolName,
          to: symbols[j].symbolName,
          strength: Math.min(0.8, 0.2 + strength * 0.15),
        });
      }
    }
  }

  return { symbols, connections };
}

export default function SymbolDecoder() {
  const { selectedDream, setDecodedSymbols, setConnections } = useDreamStore();
  const decodedSymbols = useDreamStore((s) => s.decodedSymbols);

  useEffect(() => {
    if (!selectedDream) {
      setDecodedSymbols([]);
      setConnections([]);
      return;
    }
    const startTime = performance.now();
    const { symbols, connections } = decodeSymbols(selectedDream.text);
    const elapsed = performance.now() - startTime;
    if (elapsed > 200) {
      console.warn(`Symbol decoding took ${elapsed.toFixed(1)}ms`);
    }
    setDecodedSymbols(symbols);
    setConnections(connections);
  }, [selectedDream, setDecodedSymbols, setConnections]);

  if (!selectedDream) {
    return (
      <div className="p-4 pt-2">
        <div className="h-px bg-gradient-to-r from-dream-blue-purple/30 to-transparent mb-3" />
        <div className="text-center text-dream-text/20 text-xs py-4">
          选择一条梦境记录以开始解码 🔮
        </div>
      </div>
    );
  }

  if (decodedSymbols.length === 0) {
    return (
      <div className="p-4 pt-2">
        <div className="h-px bg-gradient-to-r from-dream-blue-purple/30 to-transparent mb-3" />
        <h3 className="text-sm font-bold text-dream-blue-purple mb-2 flex items-center gap-1">
          <span>🔮</span> 符号解码
        </h3>
        <div className="text-center text-dream-text/30 text-xs py-4">
          未检测到已知梦境符号
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pt-2">
      <div className="h-px bg-gradient-to-r from-dream-blue-purple/30 to-transparent mb-3" />
      <h3 className="text-sm font-bold text-dream-blue-purple mb-2 flex items-center gap-1">
        <span>🔮</span> 符号解码
        <span className="text-[10px] text-dream-text/30 font-normal ml-2">
          检测到 {decodedSymbols.length} 个符号
        </span>
      </h3>
      <div className="flex flex-wrap gap-2 items-end">
        {decodedSymbols.map((symbol, idx) => (
          <div
            key={symbol.symbolName}
            className="animate-fadeIn"
            style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
          >
            <div className="w-20 h-20 bg-white/10 rounded-xl flex flex-col justify-between p-2 backdrop-blur-sm border border-white/5 hover:bg-white/15 transition-colors duration-200 cursor-default">
              <span className="text-2xl leading-none">{symbol.emoji}</span>
              <div className="flex items-end justify-between">
                <span className="text-[9px] text-dream-text/50 truncate max-w-[40px]">
                  {symbol.symbolName}
                </span>
                <span className="text-[10px] text-dream-purple font-bold">
                  ×{symbol.matchCount}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
