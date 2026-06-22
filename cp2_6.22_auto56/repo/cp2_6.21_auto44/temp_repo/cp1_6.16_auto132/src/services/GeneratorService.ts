import type { GeneFragment, Abilities, FusionResult, MorphologyGene, Creature } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface CreatureLookup {
  [id: string]: Creature;
}

const FUSION_NAME_PREFIXES = ['圣', '神', '幻', '虚', '星', '渊', '煌', '暗', '灵', '玄'];
const FUSION_NAME_SUFFIXES = ['兽', '灵', '龙', '君', '皇', '尊', '帝', '王', '使', '主'];

const CULTURE_TEMPLATES = [
  '来自{regionA}的{featureA}与{regionB}的{featureB}交织',
  '诞生于{contextA}与{contextB}的裂隙之间',
  '继承了{nameA}的{abilityA}与{nameB}的{abilityB}',
  '融汇{elementA}与{elementB}之力于一身',
];

const CONTEXT_MAP: { [key: string]: string[] } = {
  东方: ['九霄云海', '昆仑神山', '东方古老秘境'],
  西方: ['奥林匹斯圣山', '骑士圣殿', '西方古老森林'],
  北欧: ['阿斯加德神域', '极寒冰原', '世界之树根须'],
  希腊: ['爱琴海碧波', '众神居所', '德尔斐神谕之地'],
  埃及: ['尼罗河畔', '金字塔深处', '撒哈拉沙漠之眼'],
  印度: ['恒河圣水', '须弥山巅', '婆罗多神域'],
  东亚: ['富士山雪顶', '神道神社', '东海龙宫'],
  中美洲: ['玛雅金字塔', '热带雨林秘境', '太阳神庙'],
  非洲: ['撒哈拉星空', '塞伦盖蒂草原', '维多利亚瀑布'],
};

const ELEMENT_POOL = ['雷霆', '烈焰', '寒冰', '深渊', '星尘', '圣光', '虚空', '时间', '生命', '死亡'];

export class GeneratorService {
  static async generateFusion(
    geneA: GeneFragment,
    geneB: GeneFragment,
    creatures: Creature[]
  ): Promise<FusionResult> {
    return new Promise((resolve) => {
      const totalSteps = 10;
      let step = 0;
      const interval = setInterval(() => {
        step++;
        if (step >= totalSteps) {
          clearInterval(interval);
          resolve(GeneratorService.doGenerate(geneA, geneB, creatures));
        }
      }, 300);
    });
  }

  private static doGenerate(
    geneA: GeneFragment,
    geneB: GeneFragment,
    creatures: Creature[]
  ): FusionResult {
    const lookup: CreatureLookup = {};
    creatures.forEach((c) => (lookup[c.id] = c));
    const creatureA = lookup[geneA.creatureId];
    const creatureB = lookup[geneB.creatureId];

    const name = GeneratorService.generateName(creatureA?.name, creatureB?.name);
    const abilities = GeneratorService.mergeAbilities(creatureA?.abilities, creatureB?.abilities);
    const morphology = GeneratorService.mergeMorphology(creatureA?.morphology, creatureB?.morphology);
    const colorPalette = [
      creatureA?.primaryColor || '#6A5ACD',
      creatureA?.secondaryColor || '#FFD700',
      creatureB?.primaryColor || '#0F0F23',
      creatureB?.secondaryColor || '#FF4500',
    ];
    const description = GeneratorService.generateDescription(
      geneA,
      geneB,
      creatureA,
      creatureB,
      morphology,
      abilities
    );

    return {
      id: uuidv4(),
      timestamp: Date.now(),
      name,
      description,
      abilities,
      parentGenes: [geneA, geneB],
      parentCreatures: [creatureA?.name || geneA.creatureName, creatureB?.name || geneB.creatureName],
      morphology,
      colorPalette,
    };
  }

  static generateName(nameA?: string, nameB?: string): string {
    const prefix = FUSION_NAME_PREFIXES[Math.floor(Math.random() * FUSION_NAME_PREFIXES.length)];
    const suffix = FUSION_NAME_SUFFIXES[Math.floor(Math.random() * FUSION_NAME_SUFFIXES.length)];
    const a = nameA || '神';
    const b = nameB || '灵';
    const partA = a.slice(0, Math.ceil(a.length / 2));
    const partB = b.slice(Math.floor(b.length / 2));
    if (Math.random() > 0.5) {
      return prefix + partA + partB;
    } else {
      return partA + partB + suffix;
    }
  }

  static mergeAbilities(a?: Abilities, b?: Abilities): Abilities {
    const baseA: Abilities = a || { strength: 50, agility: 50, wisdom: 50, mystery: 50, charm: 50, longevity: 50 };
    const baseB: Abilities = b || { strength: 50, agility: 50, wisdom: 50, mystery: 50, charm: 50, longevity: 50 };
    const keys = Object.keys(baseA) as (keyof Abilities)[];
    const result: Partial<Abilities> = {};
    keys.forEach((k) => {
      const v = (baseA[k] + baseB[k]) / 2 + (Math.random() * 10 - 5);
      result[k] = Math.max(1, Math.min(100, Math.round(v)));
    });
    return result as Abilities;
  }

  static mergeMorphology(a?: MorphologyGene[], b?: MorphologyGene[]): MorphologyGene[] {
    const set = new Set<MorphologyGene>();
    (a || []).forEach((g) => set.add(g));
    (b || []).forEach((g) => set.add(g));
    const arr = Array.from(set);
    return arr.slice(0, 4);
  }

  static generateDescription(
    geneA: GeneFragment,
    geneB: GeneFragment,
    creatureA?: Creature,
    creatureB?: Creature,
    morphology: MorphologyGene[] = [],
    abilities?: Abilities
  ): string {
    const regionA = creatureA?.region || '未知';
    const regionB = creatureB?.region || '未知';
    const nameA = creatureA?.name || geneA.creatureName;
    const nameB = creatureB?.name || geneB.creatureName;
    const featureA = geneA.value;
    const featureB = geneB.value;

    const template = CULTURE_TEMPLATES[Math.floor(Math.random() * CULTURE_TEMPLATES.length)];
    const ctxA = (CONTEXT_MAP[regionA] || CONTEXT_MAP['东方'])[Math.floor(Math.random() * 3)];
    const ctxB = (CONTEXT_MAP[regionB] || CONTEXT_MAP['西方'])[Math.floor(Math.random() * 3)];
    const elemA = ELEMENT_POOL[Math.floor(Math.random() * ELEMENT_POOL.length)];
    const elemB = ELEMENT_POOL[Math.floor(Math.random() * ELEMENT_POOL.length)];
    const abilityKeys: (keyof Abilities)[] = ['strength', 'agility', 'wisdom', 'mystery', 'charm', 'longevity'];
    const abilityNames: { [k in keyof Abilities]: string } = {
      strength: '蛮力',
      agility: '神速',
      wisdom: '睿智',
      mystery: '玄奥',
      charm: '风华',
      longevity: '寿元',
    };
    const maxKey = abilityKeys.reduce(
      (p, c) => (abilities && abilities[c] > (abilities[p] || 0) ? c : p),
      'strength'
    );
    const abilityA = abilityNames[maxKey];
    const abilityB = abilityNames[abilityKeys[Math.floor(Math.random() * 6)]];

    let main = template
      .replace('{regionA}', regionA)
      .replace('{regionB}', regionB)
      .replace('{featureA}', String(featureA))
      .replace('{featureB}', String(featureB))
      .replace('{nameA}', nameA)
      .replace('{nameB}', nameB)
      .replace('{contextA}', ctxA)
      .replace('{contextB}', ctxB)
      .replace('{abilityA}', abilityA)
      .replace('{abilityB}', abilityB)
      .replace('{elementA}', elemA)
      .replace('{elementB}', elemB);

    if (morphology.length > 0) {
      main += `，${morphology.slice(0, 2).join('与')}彰显其不凡血脉`;
    }
    main += '。';
    return main;
  }

  static drawFusionCreature(
    canvas: HTMLCanvasElement,
    morphology: MorphologyGene[],
    colors: string[],
    size = 400
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const bodyR = size * 0.26;
    const c1 = colors[0] || '#6A5ACD';
    const c2 = colors[1] || '#FFD700';
    const c3 = colors[2] || '#FF4500';
    const c4 = colors[3] || '#4169E1';

    ctx.save();
    ctx.shadowColor = c1;
    ctx.shadowBlur = 25;

    const bodyGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, bodyR * 1.2);
    bodyGrad.addColorStop(0, GeneratorService.lighten(c1, 40));
    bodyGrad.addColorStop(0.35, c2);
    bodyGrad.addColorStop(0.7, c3);
    bodyGrad.addColorStop(1, c4);

    ctx.beginPath();
    const pts = 16;
    for (let i = 0; i < pts; i++) {
      const angle = (i * Math.PI * 2) / pts - Math.PI / 2;
      const r = bodyR + Math.sin(i * 1.7 + morphology.length) * (bodyR * 0.2);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else {
        const prev = i - 1;
        const prevAngle = (prev * Math.PI * 2) / pts - Math.PI / 2;
        const prevR = bodyR + Math.sin(prev * 1.7 + morphology.length) * (bodyR * 0.2);
        const px = cx + Math.cos(prevAngle) * prevR;
        const py = cy + Math.sin(prevAngle) * prevR;
        const cpx = (px + x) / 2 + Math.cos(angle + 0.5) * 10;
        const cpy = (py + y) / 2 + Math.sin(angle + 0.5) * 10;
        ctx.quadraticCurveTo(cpx, cpy, x, y);
      }
    }
    ctx.closePath();
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = GeneratorService.lighten(c1, 50);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    morphology.forEach((m) => GeneratorService.drawFeature(ctx, m, cx, cy, bodyR, c1, c2, c3, c4));
    GeneratorService.drawFusionEyes(ctx, cx, cy, bodyR, c3);
  }

  private static drawFeature(
    ctx: CanvasRenderingContext2D,
    m: MorphologyGene,
    cx: number,
    cy: number,
    bodyR: number,
    c1: string,
    c2: string,
    _c3: string,
    c4: string
  ): void {
    switch (m) {
      case '翅膀':
        GeneratorService.drawWings(ctx, cx, cy, bodyR, c1, c2);
        break;
      case '鳞片':
        GeneratorService.drawScales(ctx, cx, cy, bodyR, c2, c4);
        break;
      case '触须':
      case '触手':
        GeneratorService.drawTentacles(ctx, cx, cy, bodyR, c1);
        break;
      case '犄角':
        GeneratorService.drawHorns(ctx, cx, cy, bodyR, c2);
        break;
      case '尾巴':
        GeneratorService.drawTail(ctx, cx, cy, bodyR, c1, c4);
        break;
      case '爪子':
        GeneratorService.drawClaws(ctx, cx, cy, bodyR, c2);
        break;
      case '毛皮':
        GeneratorService.drawFur(ctx, cx, cy, bodyR, c1, c4);
        break;
      case '甲壳':
        GeneratorService.drawShell(ctx, cx, cy, bodyR, c1, c2);
        break;
      case '尖刺':
        GeneratorService.drawSpikes(ctx, cx, cy, bodyR, c4);
        break;
    }
  }

  private static drawWings(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    bodyR: number,
    c1: string,
    c2: string
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.8;
    [-1, 1].forEach((side, idx) => {
      const grad = ctx.createLinearGradient(cx + side * bodyR * 2, cy, cx, cy);
      grad.addColorStop(0, idx === 0 ? c1 : c2);
      grad.addColorStop(1, GeneratorService.lighten(idx === 0 ? c2 : c1, 30));
      ctx.beginPath();
      ctx.moveTo(cx + side * bodyR * 0.4, cy - bodyR * 0.2);
      ctx.bezierCurveTo(
        cx + side * bodyR * 2.2,
        cy - bodyR * 1.5,
        cx + side * bodyR * 1.9,
        cy + bodyR * 0.4,
        cx + side * bodyR * 0.5,
        cy + bodyR * 0.4
      );
      ctx.quadraticCurveTo(
        cx + side * bodyR * 1.3,
        cy - bodyR * 0.1,
        cx + side * bodyR * 0.4,
        cy - bodyR * 0.2
      );
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = GeneratorService.lighten(c1, 40);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
    ctx.restore();
  }

  private static drawScales(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    bodyR: number,
    c1: string,
    c2: string
  ): void {
    ctx.save();
    const scaleR = bodyR * 0.13;
    for (let ring = 0; ring < 4; ring++) {
      const count = 10 + ring * 4;
      for (let j = 0; j < count; j++) {
        const angle = (j * Math.PI * 2) / count + ring * 0.25;
        const r = bodyR * (0.5 + ring * 0.12);
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        ctx.beginPath();
        ctx.arc(x, y, scaleR, 0, Math.PI * 2);
        ctx.fillStyle = (ring + j) % 2 === 0 ? c1 : c2;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,215,0,0.6)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private static drawTentacles(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    bodyR: number,
    color: string
  ): void {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;
    for (let t = 0; t < 5; t++) {
      const startAngle = (t * Math.PI * 2) / 5 + Math.PI / 6;
      const sx = cx + Math.cos(startAngle) * bodyR * 0.8;
      const sy = cy + Math.sin(startAngle) * bodyR * 0.8;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      const len = bodyR * 1.5;
      const cp1x = sx + Math.cos(startAngle + 0.4) * len * 0.5;
      const cp1y = sy + Math.sin(startAngle + 0.4) * len * 0.5 + Math.sin(t * 2) * 12;
      const cp2x = sx + Math.cos(startAngle - 0.4) * len * 0.9;
      const cp2y = sy + Math.sin(startAngle - 0.4) * len * 0.9 + Math.cos(t * 2) * 15;
      const ex = sx + Math.cos(startAngle + 0.1) * len;
      const ey = sy + Math.sin(startAngle + 0.1) * len;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, ey);
      ctx.stroke();
    }
    ctx.restore();
  }

  private static drawHorns(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    bodyR: number,
    color: string
  ): void {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    [-1, 1].forEach((side) => {
      ctx.beginPath();
      const hx = cx + side * bodyR * 0.35;
      const hy = cy - bodyR * 0.8;
      ctx.moveTo(hx, hy);
      ctx.quadraticCurveTo(cx + side * bodyR * 0.7, cy - bodyR * 1.5, cx + side * bodyR * 0.2, cy - bodyR * 1.8);
      ctx.quadraticCurveTo(cx + side * bodyR * 0.1, cy - bodyR * 1.2, hx, hy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  }

  private static drawTail(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    bodyR: number,
    c1: string,
    c2: string
  ): void {
    ctx.save();
    const tailGrad = ctx.createLinearGradient(cx, cy + bodyR, cx - bodyR * 2, cy - bodyR);
    tailGrad.addColorStop(0, c1);
    tailGrad.addColorStop(1, c2);
    ctx.strokeStyle = tailGrad;
    ctx.lineWidth = bodyR * 0.22;
    ctx.lineCap = 'round';
    ctx.shadowColor = c1;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(cx - bodyR * 0.7, cy + bodyR * 0.5);
    ctx.bezierCurveTo(
      cx - bodyR * 2,
      cy + bodyR * 1.3,
      cx - bodyR * 1.7,
      cy - bodyR * 0.4,
      cx - bodyR * 2.4,
      cy - bodyR * 0.9
    );
    ctx.stroke();
    ctx.restore();
  }

  private static drawClaws(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    bodyR: number,
    color: string
  ): void {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    for (let c = 0; c < 4; c++) {
      const angle = (c * Math.PI) / 2 + Math.PI / 4;
      const baseX = cx + Math.cos(angle) * bodyR * 0.95;
      const baseY = cy + Math.sin(angle) * bodyR * 0.95;
      for (let n = -1; n <= 1; n++) {
        const clawAngle = angle + n * 0.22;
        const tipX = baseX + Math.cos(clawAngle) * bodyR * 0.35;
        const tipY = baseY + Math.sin(clawAngle) * bodyR * 0.35;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private static drawFur(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    bodyR: number,
    c1: string,
    c2: string
  ): void {
    ctx.save();
    for (let f = 0; f < 80; f++) {
      const angle = Math.random() * Math.PI * 2;
      const r1 = bodyR * (0.7 + Math.random() * 0.22);
      const r2 = r1 + bodyR * (0.09 + Math.random() * 0.15);
      ctx.beginPath();
      ctx.strokeStyle = Math.random() > 0.5 ? GeneratorService.lighten(c1, 35) : GeneratorService.lighten(c2, 35);
      ctx.lineWidth = 1.3;
      ctx.lineCap = 'round';
      ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
      ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private static drawShell(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    bodyR: number,
    c1: string,
    c2: string
  ): void {
    ctx.save();
    for (let seg = 0; seg < 4; seg++) {
      const grad = ctx.createLinearGradient(cx, cy - bodyR, cx, cy + bodyR);
      grad.addColorStop(0, seg % 2 === 0 ? c1 : c2);
      grad.addColorStop(1, seg % 2 === 0 ? c2 : c1);
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const r = bodyR * (0.62 - seg * 0.13);
      ctx.ellipse(cx, cy - bodyR * 0.1, r, r * 0.82, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  private static drawSpikes(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    bodyR: number,
    color: string
  ): void {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1.2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    for (let s = 0; s < 14; s++) {
      const angle = (s * Math.PI * 2) / 14;
      const b1x = cx + Math.cos(angle - 0.09) * bodyR * 0.97;
      const b1y = cy + Math.sin(angle - 0.09) * bodyR * 0.97;
      const b2x = cx + Math.cos(angle + 0.09) * bodyR * 0.97;
      const b2y = cy + Math.sin(angle + 0.09) * bodyR * 0.97;
      const tx = cx + Math.cos(angle) * bodyR * 1.45;
      const ty = cy + Math.sin(angle) * bodyR * 1.45;
      ctx.beginPath();
      ctx.moveTo(b1x, b1y);
      ctx.lineTo(tx, ty);
      ctx.lineTo(b2x, b2y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  private static drawFusionEyes(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    bodyR: number,
    color: string
  ): void {
    ctx.save();
    const eyeOffset = bodyR * 0.32;
    const eyeY = cy - bodyR * 0.18;
    const eyeR = bodyR * 0.09;
    [-1, 1].forEach((side) => {
      const ex = cx + side * eyeOffset;
      const eyeGrad = ctx.createRadialGradient(ex, eyeY, 1, ex, eyeY, eyeR);
      eyeGrad.addColorStop(0, '#FFFFFF');
      eyeGrad.addColorStop(0.6, GeneratorService.lighten(color, 20));
      eyeGrad.addColorStop(1, color);
      ctx.beginPath();
      ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
      ctx.fillStyle = eyeGrad;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + side * eyeR * 0.3, eyeY, eyeR * 0.52, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.shadowBlur = 0;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + side * eyeR * 0.18, eyeY - eyeR * 0.22, eyeR * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fill();
    });
    ctx.restore();
  }

  private static lighten(hex: string, percent: number): string {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const num = parseInt(full, 16);
    let r = (num >> 16) & 255;
    let g = (num >> 8) & 255;
    let b = num & 255;
    const amt = Math.round(2.55 * percent);
    r = Math.min(255, r + amt);
    g = Math.min(255, g + amt);
    b = Math.min(255, b + amt);
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
  }
}
