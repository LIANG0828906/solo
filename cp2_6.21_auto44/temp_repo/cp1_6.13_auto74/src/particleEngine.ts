import type {
  Particle,
  Word,
  HSLA,
  CanvasDimensions,
  AppState,
  EngineFrameOutput,
  ParticleFrameState
} from './types';

const STROKE_COUNTS: Record<string, number> = {
  '一':1,'乙':1,
  '二':2,'十':2,'丁':2,'七':2,'人':2,'入':2,'八':2,'九':2,'了':2,'儿':2,'力':2,'乃':2,'刀':2,'又':2,'卜':2,'几':2,
  '三':3,'于':3,'干':3,'士':3,'工':3,'土':3,'才':3,'寸':3,'下':3,'大':3,'丈':3,'与':3,'万':3,'上':3,'小':3,'口':3,'山':3,'千':3,'乞':3,'川':3,'亿':3,'个':3,'久':3,'凡':3,'及':3,'夕':3,'么':3,'广':3,'亡':3,'门':3,'义':3,'之':3,'尸':3,'弓':3,'己':3,'已':3,'子':3,'卫':3,'也':3,'女':3,'飞':3,'习':3,'马':3,'乡':3,
  '王':4,'井':4,'开':4,'夫':4,'天':4,'无':4,'元':4,'专':4,'云':4,'木':4,'五':4,'支':4,'不':4,'太':4,'犬':4,'区':4,'历':4,'友':4,'车':4,'比':4,'切':4,'瓦':4,'止':4,'少':4,'日':4,'中':4,'冈':4,'贝':4,'内':4,'水':4,'见':4,'午':4,'牛':4,'手':4,'毛':4,'气':4,'升':4,'长':4,'什':4,'片':4,'化':4,'币':4,'仍':4,'斤':4,'爪':4,'反':4,'介':4,'父':4,'从':4,'今':4,'分':4,'乏':4,'公':4,'月':4,'勿':4,'欠':4,'风':4,'匀':4,'乌':4,'文':4,'方':4,'火':4,'为':4,'斗':4,'计':4,'户':4,'认':4,'心':4,'尺':4,'引':4,'丑':4,'巴':4,'孔':4,'队':4,'办':4,'以':4,'双':4,'书':4,'幻':4,
  '四':5,'击':5,'末':5,'未':5,'示':5,'甘':5,'世':5,'古':5,'节':5,'本':5,'术':5,'可':5,'丙':5,'左':5,'右':5,'石':5,'布':5,'龙':5,'平':5,'灭':5,'东':5,'北':5,'占':5,'业':5,'旧':5,'归':5,'旦':5,'目':5,'且':5,'甲':5,'申':5,'电':5,'号':5,'田':5,'由':5,'史':5,'只':5,'央':5,'兄':5,'叫':5,'另':5,'叹':5,'生':5,'失':5,'付':5,'代':5,'们':5,'仪':5,'白':5,'仔':5,'他':5,'斥':5,'瓜':5,'乎':5,'令':5,'用':5,'甩':5,'印':5,'乐':5,'册':5,'句':5,'召':5,'对':5,'台':5,'矛':5,'母':5,'幼':5,'丝':5,'式':5,'刑':5,'扛':5,'寺':5,'吉':5,'扣':5,'执':5,'托':5,'扫':5,'角':5,'伍':5,'军':5,'舟':5,'年':5,'农':5,'主':5,'出':5,'发':5,'外':5,'处':5,'打':5,'边':5,'半':5,'去':5,'写':5,'必':5,'记':5,'加':5,'头':5,'正':5,'目':5,'务':5,'包':5,
  '级':6,'权':6,'战':6,'找':6,'拉':6,'推':6,'收':6,'改':6,'攻':6,'放':6,'政':6,'故':6,'效':6,'早':6,'旬':6,'时':6,'旺':6,'明':6,'易':6,'星':6,'显':6,'景':6,'晴':6,'智':6,'曲':6,'更':6,'曾':6,'有':6,'朋':6,'服':6,'期':6,'行':6,'全':6,'会':6,'合':6,'旨':6,'负':6,'各':6,'名':6,'多':6,'争':6,'色':6,'壮':6,'冲':6,'冰':6,'庄':6,'庆':6,'齐':6,'交':6,'产':6,'决':6,'充':6,'闭':6,'问':6,'闯':6,'羊':6,'并':6,'米':6,'灯':6,'州':6,'江':6,'池':6,'忙':6,'兴':6,'宇':6,'守':6,'宅':6,'字':6,'安':6,'考':6,'夺':6,'灰':6,'达':6,'死':6,'成':6,'迈':6,'师':6,'尘':6,'尖':6,'光':6,'当':6,'虫':6,'团':6,'同':6,'肉':6,'吊':6,'吃':6,'因':6,'吸':6,'岁':6,'回':6,'刚':6,'则':6,'网':6,'朱':6,'先':6,'伟':6,'任':6,'伤':6,'价':6,'份':6,'华':6,'仿':6,'伙':6,'自':6,'血':6,'向':6,'似':6,'后':6,'地':6,'在':6,'她':6,'好':6,'观':6,'欢':6,'买':6,'红':6,'动':6,'存':6,'而':6,'尽':6,'机':6,'协':6,'压':6,'厌':6,'页':6,'匠':6,'邪':6,'轨':6,'至':6,'劣':6,'吐':6,'帆':6,'岂':6,'廷':6,'舌':6,'竹':6,'迁':6,'仰':6,'伪':6,
  '我':7,'你':7,'来':7,'还':7,'没':7,'说':7,'这':7,'进':7,'走':7,'把':7,'作':7,'听':7,'告':7,'完':7,'让':7,'形':7,'运':7,'志':7,'张':7,'何':7,'位':7,'伸':7,'住':7,'低':7,'伴':7,'身':7,'系':7,'际':7,'识':7,'评':7,'证':7,'诉':7,'词':7,'译':7,'试':7,'诚':7,'话':7,'诞':7,'询':7,'详':7,'责':7,'账':7,'货':7,'质':7,'贩':7,'贫':7,'购':7,'软':7,'设':7,'医':7,'声':7,'快':7,'西':7,'极':7,'始':7,'束':7,'两':7,'却':7,'冷':7,'别':7,'条':7,'每':7,'利':7,'究':7,'证':7,'层':7,'局':7,'岛':7,'迟':7,'步':7,'坚':7,'坛':7,'坝':7,'址':7,'均':7,'坊':7,'坐':7,'坑':8,'坛':7,'坡':7,'坡':7,'坤':7,'坪':7,'坠':7,'奋':7,'套':7,'奁':7,'努':7,'励':7,'劲':7,'劳':7,'男':7,'町':7,'画':7,'畅':7,'角':7,'体':7,'作':7,'伯':7,'伴':7,'伶':7,'伸':7,'伺':7,'似':7,'伽':7,'但':7,'位':7,'低':7,'住':7,'伴':7,'佑':7,'体':7,'作':7,'伯':7,'伶':7,
  '的':8,'和':8,'国':8,'到':8,'经':8,'知':8,'所':8,'前':8,'学':8,'现':8,'些':8,'命':8,'间':8,'物':8,'使':8,'定':8,'法':8,'表':8,'青':8,'城':8,'果':8,'被':8,'金':8,'信':8,'教':8,'相':8,'组':8,'建':8,'持':8,'指':8,'毒':8,'标':8,'查':8,'树':8,'类':8,'种':8,'看':8,'重':8,'选':8,'适':8,'便':8,'修':8,'信':8,'倍':8,'值':8,'倾':8,'储':8,'健':8,'偶':8,'像':8,'党':8,'典':8,'养':8,'兼':8,'其':8,'具':8,'凯':8,'减':8,'况':8,'刻':8,'制':8,'刷':8,'刺':8,'剂':8,'刻':8,'券':8,'到':8,'刷':8,'制':8,'刻':8,'刺':8,'剂':8,'前':8,'创':8,'别':8,'到':8,'刮':8,'制':8,'剂':8,'刮':8,'到':8,'制':8,'刻':8,'刺':8,'前':8,'剂':8,'功':8,'务':8,'助':8,'努':8,'劳':8,'势':8,'勃':8,'勇':8,'勉':8,'勒':8,'动':8,'勘':8,'务':8,'助':8,'劲':8,'劳':8,'势':8,'勇':8,'勉':8,'勒':8,'勘':8,'务':8,'包':8,'化':8,'北':8,'医':8,'匹':8,'区':8,'十':8,'千':8,'升':8,'半':8,'协':8,'南':8,'博':8,'印':8,'危':8,'即':8,'卷':8,'却':8,'县':8,'参':8,'双':8,'发':8,'变':8,'叠':8,'口':8,'只':8,'另':8,'叫':8,'叹':8,'古':8,'另':8,'叫':8,'叹':8,'古':8,'叩':8,'只':8,'叫':8,'叹':8,'另':8,'叩':8,'召':8,'叫':8,'叹':8,'叽':8,'叼':8,'叩':8,'叫':8,'叹':8,'叽':8,'叼':8,
  '是':9,'说':9,'想':9,'要':9,'很':9,'点':9,'面':9,'道':9,'种':9,'复':9,'段':9,'怎':9,'春':9,'珍':9,'甚':9,'皆':9,'盈':9,'省':9,'看':9,'真':9,'着':9,'砂':9,'破':9,'确':9,'神':9,'祝':9,'祭':9,'禁':9,'福':9,'离':9,'秀':9,'私':9,'秋':9,'科':9,'秒':9,'秩':9,'称':9,'移':9,'程':9,'稍':9,'税':9,'管':9,'箭':9,'粉':9,'粒':9,'精':9,'糖':9,'系':9,'素':9,'紧':9,'繁':9,'红':9,'约':9,'纪':9,'纬':9,'纯':9,'纱':9,'纲':9,'纳':9,'纵':9,'纹':9,'纺':9,'线':9,'练':9,'组':9,'细':9,'织':9,'终':9,'结':9,'绕':9,'绘':9,'给':9,'络':9,'绝':9,'统':9,'继':9,'绩':9,'绪':9,'续':9,'维':9,'绿':9,'编':9,'缘':9,'缩':9,'给':9,'绝':9,'绘':9,'统':9,'绿':9,'绩':9,'续':9,'维':9,'编':9,'缘':9,'缩':9,
  '得':11,'都':10,'高':10,'特':10,'通':10,'真':10,'起':10,'原':10,'造':10,'消':10,'流':10,'持':10,'落':12,'温':12,'照':13,'被':10,'等':12,'理':11,'期':12,'集':12,'整':16,'算':14,'管':14,'题':14,'增':15,'装':12,'属':12,'随':11,'望':11,'费':9,'配':10,'排':11,'领':11,'响':9,'济':9,'越':12,'效':10,'置':13,'格':10,'推':11,'确':11,'酸':14,'积':10,'调':10,'保':9,'拿':10,'食':9,'施':9,'候':10,'传':6,'量':12,'联':12,'供':8,'竟':11,'织':8,'投':7,'述':8,'苏':7,
};

const MAX_STROKE_COUNT = 20;

function getStrokeCount(char: string): number {
  if (STROKE_COUNTS[char] !== undefined) return STROKE_COUNTS[char];
  const code = char.codePointAt(0);
  if (code !== undefined && code >= 0x4e00 && code <= 0x9fff) {
    return estimateStrokeByPixelDensity(char);
  }
  if (/[a-zA-Z0-9]/.test(char)) return 3;
  return 5;
}

function estimateStrokeByPixelDensity(char: string): number {
  const size = 64;
  const off = document.createElement('canvas');
  off.width = size;
  off.height = size;
  const ctx = off.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 5;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.floor(size * 0.75)}px "PingFang SC","Microsoft YaHei","SimHei",sans-serif`;
  ctx.fillText(char, size / 2, size / 2);
  const img = ctx.getImageData(0, 0, size, size).data;
  let transitions = 0;
  for (let y = 0; y < size; y++) {
    let prev = false;
    for (let x = 0; x < size; x++) {
      const curr = img[(y * size + x) * 4 + 3] > 128;
      if (curr && !prev) transitions++;
      prev = curr;
    }
  }
  for (let x = 0; x < size; x++) {
    let prev = false;
    for (let y = 0; y < size; y++) {
      const curr = img[(y * size + x) * 4 + 3] > 128;
      if (curr && !prev) transitions++;
      prev = curr;
    }
  }
  const avg = transitions / (size * 2);
  const estimated = Math.round(avg * 2);
  return Math.max(1, Math.min(MAX_STROKE_COUNT, estimated));
}

function strokeCountToParticleCount(strokeCount: number): number {
  const ratio = Math.min(1, strokeCount / MAX_STROKE_COUNT);
  return Math.round(80 + (120 - 80) * ratio);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function hexToHSLA(hex: string): HSLA {
  const hx = hex.replace('#', '');
  const r = parseInt(hx.substring(0, 2), 16) / 255;
  const g = parseInt(hx.substring(2, 4), 16) / 255;
  const b = parseInt(hx.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100, a: 1 };
}

export function hslaToString(c: HSLA): string {
  return `hsla(${c.h.toFixed(1)},${c.s.toFixed(1)}%,${c.l.toFixed(1)}%,${c.a.toFixed(3)})`;
}

export function lerpHSLA(a: HSLA, b: HSLA, t: number): HSLA {
  let dh = b.h - a.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return {
    h: (a.h + dh * t + 360) % 360,
    s: a.s + (b.s - a.s) * t,
    l: a.l + (b.l - a.l) * t,
    a: a.a + (b.a - a.a) * t
  };
}

export function generateRandomBrightColor(): HSLA {
  return { h: Math.floor(Math.random() * 360), s: 80, l: 90, a: 1 };
}

export function cubicBezierPoint(
  t: number,
  p0: number, p1: number, p2: number, p3: number
): number {
  const mt = 1 - t;
  return mt * mt * mt * p0
       + 3 * mt * mt * t * p1
       + 3 * mt * t * t * p2
       + t * t * t * p3;
}

interface PixelPoint { x: number; y: number }

function sampleCharacterPixels(
  char: string, canvasSize: number, targetCount: number
): PixelPoint[] {
  const off = document.createElement('canvas');
  off.width = canvasSize;
  off.height = canvasSize;
  const ctx = off.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fs = Math.floor(canvasSize * 0.8);
  ctx.font = `bold ${fs}px "PingFang SC","Microsoft YaHei","SimHei",sans-serif`;
  ctx.fillText(char, canvasSize / 2, canvasSize / 2);
  const img = ctx.getImageData(0, 0, canvasSize, canvasSize).data;
  const allPx: PixelPoint[] = [];
  const step = 2;
  for (let y = 0; y < canvasSize; y += step) {
    for (let x = 0; x < canvasSize; x += step) {
      if (img[(y * canvasSize + x) * 4 + 3] > 128) allPx.push({ x, y });
    }
  }
  if (allPx.length === 0) return [];
  if (allPx.length <= targetCount) return allPx;
  const result: PixelPoint[] = [];
  const ratio = targetCount / allPx.length;
  let acc = 0;
  for (let i = 0; i < allPx.length; i++) {
    acc += ratio;
    if (acc >= 1) { result.push(allPx[i]); acc -= 1; }
  }
  while (result.length < targetCount) {
    result.push(allPx[Math.floor(Math.random() * allPx.length)]);
  }
  return result.slice(0, targetCount);
}

function getCornerStartPoint(ci: number, cw: number, ch: number) {
  const p = 60;
  switch (ci) {
    case 0: return { x: -p, y: -p };
    case 1: return { x: cw + p, y: -p };
    case 2: return { x: -p, y: ch + p };
    default: return { x: cw + p, y: ch + p };
  }
}

function generateCubicBezierControlPoints(
  sx: number, sy: number, tx: number, ty: number,
  cw: number, ch: number, cornerIndex: number
) {
  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const dirX = dx / dist;
  const dirY = dy / dist;
  const perpX = -dirY;
  const perpY = dirX;
  const sign = (cornerIndex % 2 === 0) ? 1 : -1;
  const arcAmt = (0.15 + Math.random() * 0.2) * Math.min(cw, ch) * sign;
  const cp1Frac = 0.25 + Math.random() * 0.15;
  const cp2Frac = 0.65 + Math.random() * 0.15;
  return {
    cp1x: sx + dirX * dist * cp1Frac + perpX * arcAmt,
    cp1y: sy + dirY * dist * cp1Frac + perpY * arcAmt,
    cp2x: sx + dirX * dist * cp2Frac + perpX * arcAmt * 0.6,
    cp2y: sy + dirY * dist * cp2Frac + perpY * arcAmt * 0.6
  };
}

export interface EngineContext {
  particles: Particle[];
  words: Word[];
  state: AppState;
  phaseStartTime: number;
  dims: CanvasDimensions;
  targetColor: HSLA;
  tremorAccumTime: number;
  lastFrameTimeMs: number;
}

export function createInitialContext(dims: CanvasDimensions): EngineContext {
  return {
    particles: [], words: [], state: 'idle' as AppState,
    phaseStartTime: 0, dims, targetColor: hexToHSLA('#FFD700'),
    tremorAccumTime: 0, lastFrameTimeMs: 0
  };
}

export function setTargetColor(ctx: EngineContext, hex: string): void {
  ctx.targetColor = hexToHSLA(hex);
  if (ctx.state === 'stable' || ctx.state === 'flying_in') {
    const t = { ...ctx.targetColor, a: 1 };
    for (const p of ctx.particles) p.targetColor = t;
  }
}

export function parseTextToParticles(ctx: EngineContext, text: string, nowMs: number): void {
  const chars = Array.from(text).slice(0, 40);
  const { width: cw, height: ch } = ctx.dims;
  const n = chars.length;
  if (n === 0) return;
  const maxFS = Math.min(cw / (n * 1.3), ch * 0.65);
  const fontSize = Math.max(32, Math.min(maxFS, 120));
  const totalW = fontSize * 1.1 * n;
  const startX = (cw - totalW) / 2 + fontSize * 0.55;
  const baseY = ch / 2;
  const sz = 64;
  const scale = fontSize / sz;
  const allP: Particle[] = [];
  const words: Word[] = [];
  let id = 0;
  chars.forEach((char, ci) => {
    const cx = startX + ci * fontSize * 1.1;
    const cy = baseY;
    const strokes = getStrokeCount(char);
    const pCount = strokeCountToParticleCount(strokes);
    const pixels = sampleCharacterPixels(char, sz, pCount);
    const parts: Particle[] = pixels.map((px) => {
      const tx = cx + (px.x - sz / 2) * scale;
      const ty = cy + (px.y - sz / 2) * scale;
      const corner = Math.floor(Math.random() * 4);
      const { x: sx, y: sy } = getCornerStartPoint(corner, cw, ch);
      const cp = generateCubicBezierControlPoints(sx, sy, tx, ty, cw, ch, corner);
      const sc = generateRandomBrightColor();
      const tc = { ...ctx.targetColor, a: 1 };
      const dx = tx - cx;
      const dy = ty - cy;
      return {
        id: id++, x: sx, y: sy, targetX: tx, targetY: ty,
        startX: sx, startY: sy, cp1x: cp.cp1x, cp1y: cp.cp1y,
        cp2x: cp.cp2x, cp2y: cp.cp2y, currentColor: { ...sc },
        startColor: sc, targetColor: tc, opacity: 0,
        delay: Math.random() * 0.6, startTime: nowMs, duration: 1.2,
        spiralStartAngle: Math.atan2(dy, dx),
        initialDistance: Math.sqrt(dx * dx + dy * dy) || 20,
        size: 3, tremorPhase: Math.random() * Math.PI * 2
      };
    });
    allP.push(...parts);
    words.push({ char, particles: parts, centerX: cx, centerY: cy, strokeComplexity: strokes });
  });
  ctx.particles = allP;
  ctx.words = words;
  ctx.state = 'flying_in';
  ctx.phaseStartTime = nowMs;
  ctx.tremorAccumTime = 0;
}

const TWO_PI = Math.PI * 2;
const TREMOR_HZ = 1.5;
const TREMOR_AMP = 2;
const SPIRAL_GROWTH = 0.3;
const SPIRAL_ROTATIONS = 2;
const DISPERSE_DUR = 2.0;

function getTextCenter(ctx: EngineContext) {
  const w = ctx.words;
  if (w.length === 0) return { x: ctx.dims.width / 2, y: ctx.dims.height / 2 };
  let sx = 0, sy = 0;
  for (const v of w) { sx += v.centerX; sy += v.centerY; }
  return { x: sx / w.length, y: sy / w.length };
}

function updateFlyingIn(particles: Particle[], nowMs: number): boolean {
  let allDone = true;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const elapsed = (nowMs - p.startTime) / 1000 - p.delay;
    if (elapsed <= 0) {
      p.x = p.startX; p.y = p.startY;
      p.currentColor = { ...p.startColor }; p.opacity = 0;
      allDone = false; continue;
    }
    const rawT = Math.min(1, elapsed / p.duration);
    const t = easeInOutCubic(rawT);
    p.x = cubicBezierPoint(t, p.startX, p.cp1x, p.cp2x, p.targetX);
    p.y = cubicBezierPoint(t, p.startY, p.cp1y, p.cp2y, p.targetY);
    p.currentColor = lerpHSLA(p.startColor, p.targetColor, t);
    p.currentColor.a = 1;
    p.opacity = t;
    if (rawT < 1) allDone = false;
  }
  return allDone;
}

function updateStable(particles: Particle[], dtSec: number, accumTime: number): void {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const phase = accumTime * TREMOR_HZ * TWO_PI + p.tremorPhase;
    p.x = p.targetX + Math.sin(phase) * TREMOR_AMP;
    p.y = p.targetY + Math.cos(phase) * TREMOR_AMP * 0.7;
    p.currentColor = { ...p.targetColor, a: 1 };
    p.opacity = 1;
  }
}

function updateDispersing(ctx: EngineContext, phaseStartMs: number, nowMs: number): boolean {
  const particles = ctx.particles;
  const elapsed = (nowMs - phaseStartMs) / 1000;
  const rawT = Math.min(1, elapsed / DISPERSE_DUR);
  const easedT = easeInOutCubic(rawT);
  const center = getTextCenter(ctx);
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const angleDelta = easedT * TWO_PI * SPIRAL_ROTATIONS;
    const angle = p.spiralStartAngle + angleDelta;
    const radius = p.initialDistance * Math.exp(SPIRAL_GROWTH * angleDelta);
    p.x = center.x + Math.cos(angle) * radius;
    p.y = center.y + Math.sin(angle) * radius;
    p.opacity = 1 - easedT;
    p.currentColor = { ...p.targetColor, a: 1 };
  }
  return rawT >= 1;
}

export function updateEngine(ctx: EngineContext, nowMs: number): EngineFrameOutput {
  const dtMs = ctx.lastFrameTimeMs > 0 ? nowMs - ctx.lastFrameTimeMs : 16;
  ctx.lastFrameTimeMs = nowMs;
  const dtSec = Math.min(dtMs / 1000, 0.1);

  if (ctx.state === 'flying_in') {
    const done = updateFlyingIn(ctx.particles, nowMs);
    if (done) {
      ctx.state = 'stable';
      ctx.phaseStartTime = nowMs;
      ctx.tremorAccumTime = 0;
    }
  } else if (ctx.state === 'stable') {
    ctx.tremorAccumTime += dtSec;
    updateStable(ctx.particles, dtSec, ctx.tremorAccumTime);
  } else if (ctx.state === 'dispersing') {
    const done = updateDispersing(ctx, ctx.phaseStartTime, nowMs);
    if (done) {
      ctx.state = 'idle';
      ctx.particles = [];
      ctx.words = [];
    }
  }

  const out: ParticleFrameState[] = [];
  for (let i = 0; i < ctx.particles.length; i++) {
    const p = ctx.particles[i];
    if (p.opacity > 0.005) {
      out.push({ x: p.x, y: p.y, color: p.currentColor, size: p.size, opacity: p.opacity });
    }
  }
  return { particles: out, state: ctx.state, particleCount: out.length };
}

export function startDispersing(ctx: EngineContext, nowMs: number): void {
  if (ctx.state !== 'flying_in' && ctx.state !== 'stable') return;
  ctx.state = 'dispersing';
  ctx.phaseStartTime = nowMs;
  const center = getTextCenter(ctx);
  const tc = { ...ctx.targetColor, a: 1 };
  for (const p of ctx.particles) {
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    p.spiralStartAngle = Math.atan2(dy, dx);
    p.initialDistance = Math.sqrt(dx * dx + dy * dy) || 20;
    p.targetColor = { ...tc };
  }
}
