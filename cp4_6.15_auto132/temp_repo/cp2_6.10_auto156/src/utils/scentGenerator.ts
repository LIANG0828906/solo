import type { MixedSpice, Spice } from '../types';
import { getSpiceById } from './spiceData';

interface ScentContext {
  dominant: Spice;
  secondary: Spice[];
  allTags: string[];
}

const buildContext = (mixture: MixedSpice[], spices: Spice[]): ScentContext | null => {
  if (mixture.length === 0) return null;

  const sorted = [...mixture].sort((a, b) => b.amount - a.amount);
  const dominant = getSpiceById(sorted[0].spiceId);
  if (!dominant) return null;

  const secondary: Spice[] = [];
  const allTags: string[] = [...dominant.scentTags];

  for (let i = 1; i < sorted.length && i < 3; i++) {
    const spice = getSpiceById(sorted[i].spiceId);
    if (spice) {
      secondary.push(spice);
      allTags.push(...spice.scentTags);
    }
  }

  return { dominant, secondary, allTags: [...new Set(allTags)] };
};

const scentPatterns = [
  (ctx: ScentContext) =>
    `${ctx.dominant.scentTags[0]}的${ctx.dominant.nameCN}为主调${ctx.secondary.length > 0 ? '，辅以' + ctx.secondary.map(s => `${s.nameCN}的${s.scentTags[0]}`).join('、') : ''}${ctx.secondary.length > 1 ? '，余韵中' + ctx.secondary[ctx.secondary.length - 1].scentTags[1] + '若隐若现' : ''}`,
  (ctx: ScentContext) =>
    `初闻是${ctx.dominant.scentTags[0]}的${ctx.dominant.nameCN}气息${ctx.secondary.length > 0 ? '，继而' + ctx.secondary[0].scentTags[0] + '的' + ctx.secondary[0].nameCN + '缓缓展开' : ''}，层次丰富，回味悠长`,
  (ctx: ScentContext) =>
    `${ctx.dominant.nameCN}的${ctx.dominant.scentTags.join('、')}扑面而来${ctx.secondary.length > 0 ? '，混着' + ctx.secondary.map(s => s.nameCN + '的' + s.scentTags[0]).join('与') : ''}，自成一格`,
  (ctx: ScentContext) =>
    `辛烈中带着${ctx.secondary.length > 0 ? ctx.secondary[0].scentTags.includes('甘甜') || ctx.secondary[0].scentTags.includes('花香') ? '一丝甜腻' : '一缕清香' : '醇厚底蕴'}，${ctx.dominant.nameCN}与${ctx.secondary.length > 0 ? ctx.secondary.map(s => s.nameCN).join('、') : '诸多香料'}交融，犹如丝路商旅带来的神秘馈赠`,
  (ctx: ScentContext) =>
    `前调是${ctx.dominant.scentTags[0]}的${ctx.dominant.nameCN}，中调透出${ctx.secondary.length > 0 ? ctx.secondary.map(s => `${s.scentTags[0]}的${s.nameCN}`).join('、') : '温润气息'}，尾调${ctx.allTags.includes('温暖') ? '温暖绵长' : '清新悠远'}，堪称合香佳品`
];

const reviewPatterns = [
  (ctx: ScentContext) =>
    `此香${ctx.dominant.scentTags[0]}而不刺激，${ctx.secondary.length > 0 ? ctx.secondary[0].scentTags[0] + '而不寡淡' : '醇厚而不厚重'}，实为西市罕见的调和妙品。胡商定当视若珍宝，寻常人家难得一见。`,
  (ctx: ScentContext) =>
    `一闻便知是西域远道而来的珍奇。${ctx.dominant.nameCN}的${ctx.dominant.scentTags[0]}与${ctx.secondary.length > 0 ? ctx.secondary.map(s => s.nameCN).join('、') : '诸香'}完美融合，若非经验丰富的香师，绝难调配出如此层次分明的合香。`,
  (ctx: ScentContext) =>
    `妙哉！此香初闻${ctx.dominant.scentTags[0]}，再品${ctx.secondary.length > 0 ? ctx.secondary[0].scentTags[0] : '醇厚'}，细辨之下竟有${ctx.allTags.slice(0, 3).join('、')}多重层次。以千金易之，亦不为过。`,
  (ctx: ScentContext) =>
    `盛唐气象，尽在此香。${ctx.dominant.nameCN}来自${ctx.dominant.origin}${ctx.secondary.length > 0 ? '，' + ctx.secondary.map(s => `${s.nameCN}出自${s.origin}`).join('，') : ''}，诸多异域珍奇汇于一炉，香气袭人，闻之仿佛置身西市繁华。`,
  (ctx: ScentContext) =>
    `此香${ctx.allTags.includes('温暖') ? '温厚和顺' : '清奇雅致'}，${ctx.dominant.scentTags[0]}与${ctx.secondary.length > 0 ? ctx.secondary.map(s => s.scentTags[0]).join('、') : '诸香'}相得益彰。置于闺中可怡情，佩于身上可避秽，诚为上品。`
];

export function generateScentDescription(mixture: MixedSpice[], spices: Spice[]): string {
  const ctx = buildContext(mixture, spices);
  if (!ctx) return '秤盘空空，香气全无。请从香料架选取香料...';

  const pattern = scentPatterns[Math.floor(Math.random() * scentPatterns.length)];
  return pattern(ctx);
}

export function generateScentReview(mixture: MixedSpice[], spices: Spice[]): string {
  const ctx = buildContext(mixture, spices);
  if (!ctx) return '请先调配香料，再闻香品鉴...';

  const pattern = reviewPatterns[Math.floor(Math.random() * reviewPatterns.length)];
  return pattern(ctx);
}

export function generateRandomRecipe(spices: Spice[]): MixedSpice[] {
  const count = Math.floor(Math.random() * 3) + 3;
  const shuffled = [...spices].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  let remaining = 100;
  const result: MixedSpice[] = [];

  for (let i = 0; i < selected.length; i++) {
    if (i === selected.length - 1) {
      result.push({ spiceId: selected[i].id, amount: remaining });
    } else {
      const maxAmount = Math.floor(remaining * 0.6) + 10;
      const minAmount = Math.floor(remaining * 0.15) + 5;
      const amount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
      result.push({ spiceId: selected[i].id, amount });
      remaining -= amount;
    }
  }

  return result.sort((a, b) => b.amount - a.amount);
}
