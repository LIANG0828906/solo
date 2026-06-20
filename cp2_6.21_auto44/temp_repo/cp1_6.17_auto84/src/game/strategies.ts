import type { EffectContext, EffectResult } from './types';

const strategies: Record<string, (ctx: EffectContext) => EffectResult> = {
  damage: (ctx: EffectContext): EffectResult => {
    let dmg = ctx.cardValue;
    if (ctx.cardClass === 'mage' && Math.random() < 0.3) {
      dmg *= 2;
      return { damage: dmg, log: `法师双倍伤害！造成${dmg}点伤害` };
    }
    if (ctx.cardClass === 'rogue') {
      const drawn = ctx.drawFn(1);
      return { damage: dmg, drawnCards: drawn, log: `盗贼造成${dmg}点伤害并抽1张牌` };
    }
    return { damage: dmg, log: `造成${dmg}点伤害` };
  },
  shield: (ctx: EffectContext): EffectResult => {
    return { shield: ctx.cardValue, log: `获得${ctx.cardValue}点护盾` };
  },
  heal: (ctx: EffectContext): EffectResult => {
    return { heal: ctx.cardValue, log: `回复${ctx.cardValue}点生命` };
  },
  draw: (ctx: EffectContext): EffectResult => {
    const drawn = ctx.drawFn(ctx.cardValue);
    return { drawnCards: drawn, log: `抽${ctx.cardValue}张牌` };
  },
};

export function executeEffect(effectType: string, ctx: EffectContext): EffectResult {
  const fn = strategies[effectType];
  if (!fn) return { log: '未知效果' };
  return fn(ctx);
}
