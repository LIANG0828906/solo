export interface ZodiacSign {
  name: string;
  symbol: string;
  color: string;
  glowColor: string;
  startAngle: number;
  endAngle: number;
  predictions: string[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

export interface StarTwinkle {
  x: number;
  y: number;
  radius: number;
  phase: number;
  period: number;
}

export interface HighlightState {
  signIndex: number;
  startTime: number;
  duration: number;
}

const ZODIAC_COLORS: Record<string, { fill: string; glow: string }> = {
  aries:    { fill: '#FF6B6B', glow: 'rgba(255, 107, 107, 0.6)' },
  taurus:   { fill: '#4A9E6B', glow: 'rgba(74, 158, 107, 0.6)' },
  gemini:   { fill: '#64B5F6', glow: 'rgba(100, 181, 246, 0.6)' },
  cancer:   { fill: '#E8A0BF', glow: 'rgba(232, 160, 191, 0.6)' },
  leo:      { fill: '#FFB347', glow: 'rgba(255, 179, 71, 0.6)' },
  virgo:    { fill: '#9CCC65', glow: 'rgba(156, 204, 101, 0.6)' },
  libra:    { fill: '#CE93D8', glow: 'rgba(206, 147, 216, 0.6)' },
  scorpio:  { fill: '#BA68C8', glow: 'rgba(186, 104, 200, 0.6)' },
  sagittarius: { fill: '#FF8A65', glow: 'rgba(255, 138, 101, 0.6)' },
  capricorn:   { fill: '#90A4AE', glow: 'rgba(144, 164, 174, 0.6)' },
  aquarius:    { fill: '#4FC3F7', glow: 'rgba(79, 195, 247, 0.6)' },
  pisces:      { fill: '#B39DDB', glow: 'rgba(179, 157, 219, 0.6)' },
};

const SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const NAMES = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
const KEYS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];

const PREDICTIONS: Record<string, string[]> = {
  aries: [
    '火花初现，新的旅程即将启航，勇敢迈出第一步！',
    '冲动是天使亦是魔鬼，三思而后行方能化险为夷。',
    '炽热勇气，全新的冒险在等待，曙光就在前方。',
    '战斗的号角已吹响，你的决心将征服一切阻碍。',
    '今日吉星高照，果断出手必能收获意想不到的惊喜。',
    '火星之力灌注全身，你就是自己命运的主宰者！'
  ],
  taurus: [
    '耕耘终有收获，耐心是你最珍贵的财富。',
    '稳如磐石，脚踏实地方能行稳致远。',
    '感官觉醒，美好事物将环绕你左右。',
    '固执有时是美德，但也要学会灵活变通。',
    '金星眷顾，爱情与财富正在悄悄靠近。',
    '大地之力赋予你坚韧，坚持就是胜利的彼岸！'
  ],
  gemini: [
    '思绪纷飞，灵感如泉涌，抓住转瞬即逝的火花。',
    '沟通是钥匙，一次对话可能改变命运的轨迹。',
    '双子之光闪耀，多变的你将遇见更多可能。',
    '好奇心驱动冒险，未知的领域等你探索。',
    '水星加持智慧，复杂问题将迎刃而解。',
    '灵活应变是你的天赋，拥抱变化创造奇迹！'
  ],
  cancer: [
    '温柔的月光笼罩，内心深处的声音值得聆听。',
    '家是避风港，亲人的爱是你最坚实的后盾。',
    '情感的潮水涌动，真诚表达让心更近一步。',
    '回忆是珍贵的宝藏，但也别忘了向前看。',
    '月亮守护你，直觉将指引正确的方向。',
    '柔软并非软弱，巨蟹的壳下藏着无限力量！'
  ],
  leo: [
    '光芒万丈的时刻到了，舞台中央就是你的位置。',
    '自信是最强的武器，不要隐藏你的才华。',
    '狮子之心熊熊燃烧，慷慨之举将赢得尊重。',
    '领导力觉醒，团队因你而变得更加强大。',
    '太阳赐予荣耀，你的付出将得到丰厚回报。',
    '骄傲的王者，用你的光芒照亮整个世界！'
  ],
  virgo: [
    '细节决定成败，专注是你无往不利的法宝。',
    '完美主义是优点，但也要学会接纳不完美。',
    '分析能力达到顶峰，难题将被你一一拆解。',
    '默默耕耘终将结果，你的努力有人看见。',
    '处女座的智慧之光，照亮前行的每一步。',
    '精益求精的你，终将成就非凡的人生！'
  ],
  libra: [
    '天平两端寻找平衡，和谐是你永恒的追求。',
    '优雅的气质吸引美好，友谊之花盛开。',
    '犹豫不决的时候，倾听内心最真实的声音。',
    '合作共赢，与他人携手将创造更大价值。',
    '维纳斯的祝福降临，爱情的天平向你倾斜。',
    '公正与美的化身，你让世界更加和谐！'
  ],
  scorpio: [
    '深渊之中藏着真相，勇气探索将获得重生。',
    '直觉敏锐如刀锋，谎言无法逃过你的眼睛。',
    '蜕变的时刻到来，放下过去才能拥抱新生。',
    '热情如火焰燃烧，深刻的情感将改变一切。',
    '冥王星赋予力量，你拥有改变命运的能力。',
    '神秘的天蝎，你的深度无人能及！'
  ],
  sagittarius: [
    '自由的灵魂在呼唤，远方的风景等着你去探索。',
    '乐观是你的超能力，再困难的事也能一笑而过。',
    '哲学的光芒照耀，你将找到人生的新答案。',
    '冒险精神大爆发，说走就走的旅行就在眼前。',
    '木星带来好运，机会出现在你意想不到的地方。',
    '箭已在弦上，瞄准目标勇敢地发射吧！'
  ],
  capricorn: [
    '攀登永无止境，每一步都在接近山顶的风光。',
    '自律是你最强大的武器，坚持终将带来成就。',
    '责任感让你值得信赖，重要的任务将交到你手中。',
    '务实的态度让梦想不再遥远，计划稳步推进。',
    '土星的考验即将过去，荣耀在前方等候。',
    '沉稳如山的摩羯，你终将登上巅峰！'
  ],
  aquarius: [
    '灵感如闪电划过，创新的想法将颠覆传统。',
    '特立独行不是异类，你是时代的先驱者。',
    '人道主义精神闪耀，帮助他人让你更快乐。',
    '友谊的网络拓展，志同道合的伙伴正在聚集。',
    '天王星带来惊喜，意外的改变将是天赐良机。',
    '未来的使者，用你的智慧点亮新时代！'
  ],
  pisces: [
    '梦境与现实交织，灵感如星河般璀璨。',
    '同情心无限放大，你的善意将改变他人命运。',
    '艺术细胞全面觉醒，创作的激情无法阻挡。',
    '直觉如海洋深邃，相信自己的第六感。',
    '海王星的浪漫笼罩，爱情将如童话般美好。',
    '梦幻的双鱼，你的想象力是无尽的宝藏！'
  ]
};

export class ZodiacWheel {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private centerX: number = 0;
  private centerY: number = 0;
  private outerRadius: number = 200;
  private zodiacRingWidth: number = 40;
  private zodiacRingInnerRadius: number = 160;
  private haloWidth: number = 20;
  private haloInnerRadius: number = 140;
  private coreRadius: number = 40;
  private signs: ZodiacSign[] = [];
  private particles: Particle[] = [];
  private maxParticles: number = 200;
  private boundaryStars: StarTwinkle[] = [];
  private currentTime: number = 0;
  private rotationAngle: number = 0;
  private haloRotation: number = 0;
  private highlightState: HighlightState | null = null;
  private selectedSignName: string = '';
  private selectedSignIndex: number = -1;
  private onSignSelected: ((sign: ZodiacSign, index: number) => void) | null = null;
  private coreText: string = '';
  private coreTextAlpha: number = 0;
  private coreTextStartTime: number = 0;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.initSigns();
    this.initBoundaryStars();
  }

  setCenter(x: number, y: number): void {
    this.centerX = x;
    this.centerY = y;
    this.initBoundaryStars();
  }

  setOnSignSelected(callback: (sign: ZodiacSign, index: number) => void): void {
    this.onSignSelected = callback;
  }

  getSelectedSign(): ZodiacSign | null {
    if (this.selectedSignIndex >= 0 && this.selectedSignIndex < this.signs.length) {
      return this.signs[this.selectedSignIndex];
    }
    return null;
  }

  getSelectedSignIndex(): number {
    return this.selectedSignIndex;
  }

  getSigns(): ZodiacSign[] {
    return this.signs;
  }

  setCoreText(text: string, duration: number = 3000): void {
    this.coreText = text;
    this.coreTextStartTime = performance.now();
    this.coreTextAlpha = 0;
    setTimeout(() => {
      if (this.coreText === text) {
        this.coreTextAlpha = 0;
      }
    }, duration);
  }

  clearCoreText(): void {
    this.coreText = '';
    this.coreTextAlpha = 0;
  }

  private initSigns(): void {
    this.signs = [];
    for (let i = 0; i < 12; i++) {
      const startAngle = (i * 30 - 90) * Math.PI / 180;
      const endAngle = ((i + 1) * 30 - 90) * Math.PI / 180;
      const key = KEYS[i];
      const colors = ZODIAC_COLORS[key];
      this.signs.push({
        name: NAMES[i],
        symbol: SYMBOLS[i],
        color: colors.fill,
        glowColor: colors.glow,
        startAngle,
        endAngle,
        predictions: PREDICTIONS[key] || ['星辰闪烁，命运正在书写中...']
      });
    }
  }

  private initBoundaryStars(): void {
    this.boundaryStars = [];
    const r = this.outerRadius;
    for (let i = 0; i < 12; i++) {
      const angle = ((i * 30 - 90) * Math.PI / 180);
      this.boundaryStars.push({
        x: this.centerX + Math.cos(angle) * r,
        y: this.centerY + Math.sin(angle) * r,
        radius: 2 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        period: 3 + Math.random() * 0.5
      });
    }
    const innerR = this.zodiacRingInnerRadius;
    for (let i = 0; i < 12; i++) {
      const angle = ((i * 30 - 90) * Math.PI / 180);
      this.boundaryStars.push({
        x: this.centerX + Math.cos(angle) * innerR,
        y: this.centerY + Math.sin(angle) * innerR,
        radius: 1.5 + Math.random() * 1,
        phase: Math.random() * Math.PI * 2,
        period: 3 + Math.random() * 0.5
      });
    }
  }

  handleClick(mx: number, my: number): boolean {
    const dx = mx - this.centerX;
    const dy = my - this.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist >= this.zodiacRingInnerRadius && dist <= this.outerRadius) {
      let angle = Math.atan2(dy, dx) * 180 / Math.PI;
      if (angle < 0) angle += 360;
      const normalizedAngle = (angle + 90) % 360;
      const index = Math.floor(normalizedAngle / 30);

      if (index >= 0 && index < 12) {
        this.selectSign(index);
        return true;
      }
    }
    return false;
  }

  isPointInWheel(mx: number, my: number): boolean {
    const dx = mx - this.centerX;
    const dy = my - this.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist <= this.outerRadius;
  }

  private selectSign(index: number): void {
    const sign = this.signs[index];
    this.selectedSignIndex = index;
    this.selectedSignName = sign.name;

    this.highlightState = {
      signIndex: index,
      startTime: performance.now(),
      duration: 1500
    };

    this.emitLightBeam(index);

    this.coreText = sign.name;
    this.coreTextStartTime = performance.now();
    this.coreTextAlpha = 1;

    if (this.onSignSelected) {
      this.onSignSelected(sign, index);
    }
  }

  private emitLightBeam(index: number): void {
    const sign = this.signs[index];
    const midAngle = (sign.startAngle + sign.endAngle) / 2;
    const startR = this.zodiacRingInnerRadius;
    const startX = this.centerX + Math.cos(midAngle) * startR;
    const startY = this.centerY + Math.sin(midAngle) * startR;

    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const t = i / particleCount;
      const angle = midAngle + (Math.random() - 0.5) * 0.3;
      const speed = (0.5 + Math.random() * 0.5) * 0.6;
      const travelDist = startR - this.coreRadius - 5;

      this.particles.push({
        x: startX + (Math.random() - 0.5) * 8,
        y: startY + (Math.random() - 0.5) * 8,
        vx: -Math.cos(angle) * speed * (1 + t * 0.5),
        vy: -Math.sin(angle) * speed * (1 + t * 0.5),
        life: 0,
        maxLife: 1000 + Math.random() * 200,
        size: 2 + Math.random() * 2,
        color: sign.color,
        alpha: 1
      });
    }
  }

  update(deltaTime: number, currentTime: number): void {
    this.currentTime = currentTime;
    this.rotationAngle += deltaTime * 0.005;
    this.haloRotation += deltaTime * 0.05;

    this.updateParticles(deltaTime);
    this.updateHighlightState(currentTime);
    this.updateCoreText(currentTime);
  }

  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life += deltaTime;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      const dx = p.x - this.centerX;
      const dy = p.y - this.centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.coreRadius + 2) {
        p.alpha = 0;
      }

      if (p.life >= p.maxLife || p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateHighlightState(currentTime: number): void {
    if (this.highlightState) {
      const elapsed = currentTime - this.highlightState.startTime;
      if (elapsed >= this.highlightState.duration) {
        this.highlightState = null;
      }
    }
  }

  private updateCoreText(currentTime: number): void {
    const elapsed = currentTime - this.coreTextStartTime;
    if (this.coreText) {
      if (elapsed < 500) {
        this.coreTextAlpha = elapsed / 500;
      } else if (elapsed < 2500) {
        this.coreTextAlpha = 1;
      } else if (elapsed < 3000) {
        this.coreTextAlpha = 1 - (elapsed - 2500) / 500;
      } else {
        this.coreTextAlpha = 0;
      }
    }
  }

  draw(): void {
    const ctx = this.ctx;

    this.drawZodiacRing();
    this.drawHalo();
    this.drawCore();
    this.drawBoundaryStars();
    this.drawHighlight();
    this.drawParticles();
    this.drawCoreText();
    this.drawZodiacSymbols();
  }

  private drawZodiacRing(): void {
    const ctx = this.ctx;
    const innerR = this.zodiacRingInnerRadius;
    const outerR = this.outerRadius;

    for (let i = 0; i < 12; i++) {
      const sign = this.signs[i];
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, outerR, sign.startAngle, sign.endAngle);
      ctx.arc(this.centerX, this.centerY, innerR, sign.endAngle, sign.startAngle, true);
      ctx.closePath();

      const gradient = ctx.createRadialGradient(
        this.centerX, this.centerY, innerR,
        this.centerX, this.centerY, outerR
      );
      gradient.addColorStop(0, this.hexToRgba(sign.color, 0.4));
      gradient.addColorStop(1, this.hexToRgba(sign.color, 0.7));
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawHalo(): void {
    const ctx = this.ctx;
    const innerR = this.haloInnerRadius;
    const outerR = innerR + this.haloWidth;

    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.rotate(this.haloRotation * 0.001);

    for (let i = 0; i < 24; i++) {
      const startA = (i * 15) * Math.PI / 180;
      const endA = ((i + 1) * 15) * Math.PI / 180;
      const phase = (Math.sin(this.currentTime * 0.003 + i * 0.5) + 1) / 2;

      ctx.beginPath();
      ctx.arc(0, 0, outerR, startA, endA);
      ctx.arc(0, 0, innerR, endA, startA, true);
      ctx.closePath();

      const gradient = ctx.createRadialGradient(0, 0, innerR, 0, 0, outerR);
      const c1 = this.interpolateColor('#FF8C00', '#FFD700', phase);
      const c2 = this.interpolateColor('#FFD700', '#FF8C00', phase);
      gradient.addColorStop(0, this.hexToRgba(c1, 0.8));
      gradient.addColorStop(1, this.hexToRgba(c2, 0.95));
      ctx.fillStyle = gradient;
      ctx.fill();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, outerR + 2, 0, Math.PI * 2);
    ctx.arc(this.centerX, this.centerY, innerR - 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private drawCore(): void {
    const ctx = this.ctx;
    const breathe = (Math.sin(this.currentTime * 0.00157) + 1) / 2;
    const pulseR = this.coreRadius + breathe * 6;

    const outerGlow = ctx.createRadialGradient(
      this.centerX, this.centerY, this.coreRadius * 0.5,
      this.centerX, this.centerY, this.coreRadius * 3
    );
    outerGlow.addColorStop(0, `rgba(255, 255, 255, ${0.3 + breathe * 0.2})`);
    outerGlow.addColorStop(0.3, `rgba(255, 215, 0, ${0.15 + breathe * 0.1})`);
    outerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.coreRadius * 3, 0, Math.PI * 2);
    ctx.fill();

    const coreGradient = ctx.createRadialGradient(
      this.centerX - 5, this.centerY - 5, 0,
      this.centerX, this.centerY, pulseR
    );
    coreGradient.addColorStop(0, '#FFFFFF');
    coreGradient.addColorStop(0.7, '#FFF8E7');
    coreGradient.addColorStop(1, '#FFE4B5');
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, pulseR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 215, 0, ${0.6 + breathe * 0.4})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawBoundaryStars(): void {
    const ctx = this.ctx;
    for (const star of this.boundaryStars) {
      const twinkle = (Math.sin(this.currentTime * 0.001 * (Math.PI * 2 / star.period) + star.phase) + 1) / 2;
      const alpha = 0.4 + twinkle * 0.6;
      const r = star.radius * (0.8 + twinkle * 0.4);

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, r, 0, Math.PI * 2);
      ctx.fill();

      const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, r * 3);
      glow.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.5})`);
      glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(star.x, star.y, r * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawHighlight(): void {
    if (!this.highlightState) return;
    const ctx = this.ctx;
    const sign = this.signs[this.highlightState.signIndex];
    const elapsed = this.currentTime - this.highlightState.startTime;
    const progress = elapsed / this.highlightState.duration;
    const intensity = Math.sin(progress * Math.PI);

    ctx.save();
    ctx.shadowColor = sign.color;
    ctx.shadowBlur = 15 * intensity;

    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.outerRadius + 2, sign.startAngle, sign.endAngle);
    ctx.arc(this.centerX, this.centerY, this.zodiacRingInnerRadius - 2, sign.endAngle, sign.startAngle, true);
    ctx.closePath();

    ctx.fillStyle = this.hexToRgba(sign.color, 0.25 * intensity);
    ctx.fill();

    ctx.strokeStyle = this.hexToRgba(sign.color, 0.9 * intensity);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  private drawParticles(): void {
    const ctx = this.ctx;
    for (const p of this.particles) {
      const alpha = p.alpha;
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
      glow.addColorStop(0, this.hexToRgba(p.color, alpha));
      glow.addColorStop(1, this.hexToRgba(p.color, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = this.hexToRgba('#FFFFFF', alpha * 0.9);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawZodiacSymbols(): void {
    const ctx = this.ctx;
    const midR = (this.zodiacRingInnerRadius + this.outerRadius) / 2;

    for (let i = 0; i < 12; i++) {
      const sign = this.signs[i];
      const midAngle = (sign.startAngle + sign.endAngle) / 2;
      const x = this.centerX + Math.cos(midAngle) * midR;
      const y = this.centerY + Math.sin(midAngle) * midR;

      const isSelected = i === this.selectedSignIndex;
      const breathe = (Math.sin(this.currentTime * 0.002 + i) + 1) / 2;
      const scale = isSelected ? 1.3 + breathe * 0.1 : 1 + breathe * 0.05;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(midAngle + Math.PI / 2);
      ctx.scale(scale, scale);
      ctx.translate(-x, -y);

      if (isSelected) {
        ctx.shadowColor = sign.color;
        ctx.shadowBlur = 12;
      }

      ctx.font = 'bold 18px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)';
      ctx.fillText(sign.symbol, x, y);
      ctx.restore();
    }
  }

  private drawCoreText(): void {
    if (!this.coreText || this.coreTextAlpha <= 0) return;
    const ctx = this.ctx;

    ctx.save();
    ctx.globalAlpha = this.coreTextAlpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;

    const fontSize = this.coreText.length > 8 ? 11 : 14;
    ctx.font = `bold ${fontSize}px "Microsoft YaHei", "PingFang SC", serif`;

    if (this.coreText.length > 8) {
      const lineHeight = fontSize + 2;
      const midY = this.centerY - (lineHeight / 2);
      const half = Math.ceil(this.coreText.length / 2);
      ctx.fillStyle = '#3D2914';
      ctx.fillText(this.coreText.slice(0, half), this.centerX, midY);
      ctx.fillText(this.coreText.slice(half), this.centerX, midY + lineHeight);
    } else {
      ctx.fillStyle = '#3D2914';
      ctx.fillText(this.coreText, this.centerX, this.centerY);
    }
    ctx.restore();
  }

  getCenter(): { x: number; y: number } {
    return { x: this.centerX, y: this.centerY };
  }

  getCoreRadius(): number {
    return this.coreRadius;
  }

  getOuterRadius(): number {
    return this.outerRadius;
  }

  private hexToRgba(hex: string, alpha: number): string {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private interpolateColor(c1: string, c2: string, t: number): string {
    const h1 = c1.replace('#', '');
    const h2 = c2.replace('#', '');
    const r1 = parseInt(h1.substring(0, 2), 16);
    const g1 = parseInt(h1.substring(2, 4), 16);
    const b1 = parseInt(h1.substring(4, 6), 16);
    const r2 = parseInt(h2.substring(0, 2), 16);
    const g2 = parseInt(h2.substring(2, 4), 16);
    const b2 = parseInt(h2.substring(4, 6), 16);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}
