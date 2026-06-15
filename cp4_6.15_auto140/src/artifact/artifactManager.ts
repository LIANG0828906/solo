export interface ArtifactPiece {
  id: string;
  artifactId: string;
  pieceIndex: number;
  totalPieces: number;
  collected: boolean;
  placed: boolean;
  correctPosition: { row: number; col: number; rotation: number };
  workbenchOffset: { x: number; y: number } | null;
  shapeHint: 'corner' | 'edge' | 'center' | 'irregular';
}

export interface ArtifactDefinition {
  id: string;
  name: string;
  era: string;
  description: string;
  baseColor: string;
  restoredColor: string;
  accentColor: string;
  glowColor: string;
  pieceCount: number;
  shape: 'pot' | 'arrow' | 'disc' | 'trilobite' | 'ding' | 'axe' | 'shell' | 'pendant';
  rarity: 'common' | 'rare' | 'legendary';
  points: number;
}

export interface AssembleResult {
  success: boolean;
  snapped: boolean;
  finalPosition: { x: number; y: number };
  message?: string;
  sound?: string;
}

export interface RestoreAnimationState {
  artifactId: string;
  startTime: number;
  duration: number;
  colorProgress: number;
  particleProgress: number;
}

export type PieceCollectedCallback = (piece: ArtifactPiece) => void;
export type ArtifactRestoredCallback = (artifactId: string, def: ArtifactDefinition) => void;
export type WorkbenchChangedCallback = () => void;

export const ARTIFACT_DEFINITIONS: Record<string, ArtifactDefinition> = {
  pottery: {
    id: 'pottery', name: '彩绘陶罐碎片', era: '商代 (约公元前1600年)',
    description: '泥质红陶，饰有绳纹与云雷纹，是当时贵族日常使用的盛器',
    baseColor: '#808080', restoredColor: '#c17f59', accentColor: '#e8a87c', glowColor: '#ffddaa',
    pieceCount: 4, shape: 'pot', rarity: 'common', points: 100
  },
  arrowhead: {
    id: 'arrowhead', name: '青铜箭头', era: '西周 (约公元前1000年)',
    description: '双翼镞形青铜箭镞，铤部完整，为当时军队标准武器',
    baseColor: '#808080', restoredColor: '#8a9a5b', accentColor: '#bdb76b', glowColor: '#e0e08a',
    pieceCount: 3, shape: 'arrow', rarity: 'common', points: 80
  },
  jade_disc: {
    id: 'jade_disc', name: '玉璧残片', era: '良渚文化 (约公元前3000年)',
    description: '青玉质，带有沁色，璧面刻有简化神徽纹',
    baseColor: '#808080', restoredColor: '#5f9ea0', accentColor: '#7ec8e3', glowColor: '#aaddee',
    pieceCount: 5, shape: 'disc', rarity: 'rare', points: 200
  },
  trilobite: {
    id: 'trilobite', name: '三叶虫化石', era: '寒武纪 (约5亿年前)',
    description: '保存完好的三叶虫背甲化石，清晰可见头鞍与轴节',
    baseColor: '#808080', restoredColor: '#6b5b73', accentColor: '#9d8aa8', glowColor: '#c8b8d8',
    pieceCount: 4, shape: 'trilobite', rarity: 'rare', points: 180
  },
  bronze_ding: {
    id: 'bronze_ding', name: '青铜鼎残片', era: '春秋 (约公元前600年)',
    description: '青铜礼器残片，可见饕餮纹的一部分，铸工精湛',
    baseColor: '#808080', restoredColor: '#7d6b4e', accentColor: '#cd853f', glowColor: '#e8b870',
    pieceCount: 5, shape: 'ding', rarity: 'legendary', points: 300
  },
  stone_axe: {
    id: 'stone_axe', name: '磨制石斧', era: '新石器时代 (约公元前5000年)',
    description: '花岗岩磨制石斧，刃部锋利，钻孔技术成熟',
    baseColor: '#808080', restoredColor: '#696969', accentColor: '#a9a9a9', glowColor: '#cccccc',
    pieceCount: 3, shape: 'axe', rarity: 'common', points: 70
  },
  fossil_shell: {
    id: 'fossil_shell', name: '贝壳化石', era: '侏罗纪 (约1.5亿年前)',
    description: '双壳类贝壳化石，珍珠层仍有光彩',
    baseColor: '#808080', restoredColor: '#deb887', accentColor: '#f5deb3', glowColor: '#fff0cc',
    pieceCount: 3, shape: 'shell', rarity: 'common', points: 90
  },
  jade_pendant: {
    id: 'jade_pendant', name: '玉龙佩', era: '战国 (约公元前400年)',
    description: '青白玉透雕龙形佩，线条流畅，为高级贵族饰物',
    baseColor: '#808080', restoredColor: '#6b8e6b', accentColor: '#98d98e', glowColor: '#b8e8a8',
    pieceCount: 4, shape: 'pendant', rarity: 'legendary', points: 350
  }
};

const WORKBENCH_CELL_SIZE = 60;
const WORKBENCH_RADIUS = 150;
const SNAP_DISTANCE = 35;

export class ArtifactManager {
  private pieces: Map<string, ArtifactPiece> = new Map();
  private workbench: Map<string, { x: number; y: number }> = new Map();
  private activeArtifactId: string | null = null;

  private onPieceCollected: Set<PieceCollectedCallback> = new Set();
  private onArtifactRestored: Set<ArtifactRestoredCallback> = new Set();
  private onWorkbenchChanged: Set<WorkbenchChangedCallback> = new Set();
  private onAssembleAttempt: Set<(r: AssembleResult) => void> = new Set();

  private restoreAnimations: Map<string, RestoreAnimationState> = new Map();
  private sounds: string[] = [];

  constructor() {
    this.initializeAllPieces();
  }

  private initializeAllPieces() {
    for (const def of Object.values(ARTIFACT_DEFINITIONS)) {
      const positions = this.computePieceLayout(def.shape, def.pieceCount);
      for (let i = 0; i < def.pieceCount; i++) {
        const id = `${def.id}_piece_${i}`;
        const isCorner = def.pieceCount >= 4 && (i === 0 || i === def.pieceCount - 1 ||
          (def.pieceCount >= 4 && (i === 1 || i === 2)));
        const isCenter = def.pieceCount >= 5 && i === Math.floor(def.pieceCount / 2);
        this.pieces.set(id, {
          id,
          artifactId: def.id,
          pieceIndex: i,
          totalPieces: def.pieceCount,
          collected: false,
          placed: false,
          correctPosition: positions[i],
          workbenchOffset: null,
          shapeHint: isCenter ? 'center' : isCorner ? 'corner' : (i % 2 === 0 ? 'edge' : 'irregular')
        });
      }
    }
  }

  private computePieceLayout(shape: string, count: number): { row: number; col: number; rotation: number }[] {
    const out: { row: number; col: number; rotation: number }[] = [];
    switch (shape) {
      case 'pot': {
        const layout = [[0, 0], [0, 1], [1, 0], [1, 1]];
        for (let i = 0; i < count; i++) {
          const [r, c] = layout[i % 4];
          out.push({ row: r - 0.5, col: c - 0.5, rotation: (i * 23) % 360 });
        }
        break;
      }
      case 'disc': {
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          out.push({
            row: Math.round(Math.sin(angle) * 1.2),
            col: Math.round(Math.cos(angle) * 1.2),
            rotation: (i * 360) / count
          });
        }
        break;
      }
      case 'arrow':
      case 'axe': {
        for (let i = 0; i < count; i++) {
          out.push({ row: 0, col: i - (count - 1) / 2, rotation: 0 });
        }
        break;
      }
      default: {
        const rows = Math.ceil(Math.sqrt(count));
        const cols = Math.ceil(count / rows);
        for (let i = 0; i < count; i++) {
          out.push({
            row: Math.floor(i / cols) - (rows - 1) / 2,
            col: (i % cols) - (cols - 1) / 2,
            rotation: (i * 47) % 360
          });
        }
      }
    }
    return out;
  }

  getDefinition(artifactId: string): ArtifactDefinition | undefined {
    return ARTIFACT_DEFINITIONS[artifactId];
  }

  getAllDefinitions(): ArtifactDefinition[] {
    return Object.values(ARTIFACT_DEFINITIONS);
  }

  getPiece(pieceId: string): ArtifactPiece | undefined {
    return this.pieces.get(pieceId);
  }

  getPiecesByArtifact(artifactId: string): ArtifactPiece[] {
    const def = ARTIFACT_DEFINITIONS[artifactId];
    if (!def) return [];
    const out: ArtifactPiece[] = [];
    for (let i = 0; i < def.pieceCount; i++) {
      const p = this.pieces.get(`${artifactId}_piece_${i}`);
      if (p) out.push(p);
    }
    return out;
  }

  getCollectedPieces(): ArtifactPiece[] {
    return Array.from(this.pieces.values()).filter(p => p.collected);
  }

  getCollectedPiecesByArtifact(artifactId: string): ArtifactPiece[] {
    return this.getPiecesByArtifact(artifactId).filter(p => p.collected);
  }

  getWorkbenchPieces(): ArtifactPiece[] {
    return Array.from(this.workbench.keys()).map(id => this.pieces.get(id)!).filter(Boolean);
  }

  getActiveArtifactId(): string | null { return this.activeArtifactId; }

  setActiveArtifact(artifactId: string | null): boolean {
    if (artifactId && !ARTIFACT_DEFINITIONS[artifactId]) return false;
    this.workbench.forEach((_, id) => {
      const p = this.pieces.get(id);
      if (p) { p.placed = false; p.workbenchOffset = null; }
    });
    this.workbench.clear();
    this.activeArtifactId = artifactId;
    this.fireWorkbenchChanged();
    return true;
  }

  collectPiece(pieceId: string): boolean {
    const piece = this.pieces.get(pieceId);
    if (!piece || piece.collected) return false;
    piece.collected = true;
    this.sounds.push('[碎片入袋声] 沙沙...叮！');
    if (!this.activeArtifactId) {
      this.setActiveArtifact(piece.artifactId);
    }
    this.onPieceCollected.forEach(cb => cb(piece));
    return true;
  }

  collectNextPieceForArtifact(artifactId: string): ArtifactPiece | null {
    const pieces = this.getPiecesByArtifact(artifactId);
    const next = pieces.find(p => !p.collected);
    if (!next) return null;
    this.collectPiece(next.id);
    return next;
  }

  tryPlacePieceOnWorkbench(pieceId: string, x: number, y: number): AssembleResult {
    const piece = this.pieces.get(pieceId);
    if (!piece || !piece.collected) return { success: false, snapped: false, finalPosition: { x, y }, message: '碎片未收集' };
    if (this.activeArtifactId && piece.artifactId !== this.activeArtifactId) {
      return { success: false, snapped: false, finalPosition: { x, y }, message: '当前工作台正在处理其他文物' };
    }

    const correct = this.getCorrectScreenPosition(piece);
    const dx = x - correct.x;
    const dy = y - correct.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const snapped = dist <= SNAP_DISTANCE;
    const finalX = snapped ? correct.x : x;
    const finalY = snapped ? correct.y : y;

    piece.placed = snapped;
    piece.workbenchOffset = { x: finalX, y: finalY };
    this.workbench.set(pieceId, { x: finalX, y: finalY });
    if (!this.activeArtifactId) this.activeArtifactId = piece.artifactId;

    this.fireWorkbenchChanged();

    const result: AssembleResult = {
      success: true,
      snapped,
      finalPosition: { x: finalX, y: finalY },
      sound: snapped ? '[咔嗒声] 咔哒！吸附成功' : '[轻放声] 嗒...'
    };
    if (snapped) result.message = '碎片已吸附到正确位置';

    this.onAssembleAttempt.forEach(cb => cb(result));
    this.sounds.push(result.sound || '');

    if (this.checkArtifactComplete(piece.artifactId)) {
      this.triggerRestoreAnimation(piece.artifactId);
    }

    return result;
  }

  removePieceFromWorkbench(pieceId: string): boolean {
    const piece = this.pieces.get(pieceId);
    if (!piece) return false;
    piece.placed = false;
    piece.workbenchOffset = null;
    this.workbench.delete(pieceId);
    this.fireWorkbenchChanged();
    return true;
  }

  getCorrectScreenPosition(piece: ArtifactPiece): { x: number; y: number } {
    return {
      x: piece.correctPosition.col * WORKBENCH_CELL_SIZE,
      y: piece.correctPosition.row * WORKBENCH_CELL_SIZE
    };
  }

  private checkArtifactComplete(artifactId: string): boolean {
    const pieces = this.getPiecesByArtifact(artifactId);
    if (pieces.length === 0) return false;
    return pieces.every(p => p.placed);
  }

  isArtifactCollected(artifactId: string): boolean {
    const pieces = this.getPiecesByArtifact(artifactId);
    return pieces.length > 0 && pieces.every(p => p.collected);
  }

  isArtifactRestored(artifactId: string): boolean {
    const pieces = this.getPiecesByArtifact(artifactId);
    return pieces.length > 0 && pieces.every(p => p.placed);
  }

  isRestoreAnimating(artifactId: string): boolean {
    const a = this.restoreAnimations.get(artifactId);
    if (!a) return false;
    return (performance.now() - a.startTime) < a.duration;
  }

  getRestoreProgress(artifactId: string): number {
    const a = this.restoreAnimations.get(artifactId);
    if (!a) return 1;
    return Math.min(1, (performance.now() - a.startTime) / a.duration);
  }

  private triggerRestoreAnimation(artifactId: string) {
    const def = ARTIFACT_DEFINITIONS[artifactId];
    if (!def) return;
    this.restoreAnimations.set(artifactId, {
      artifactId,
      startTime: performance.now(),
      duration: 2200,
      colorProgress: 0,
      particleProgress: 0
    });
    this.sounds.push('[庆祝音效] ✨ 叮铃-铃-铃~ ✨ 文物复原成功！');
    setTimeout(() => {
      this.onArtifactRestored.forEach(cb => cb(artifactId, def));
    }, 100);
  }

  addPieceCollectedListener(cb: PieceCollectedCallback): () => void {
    this.onPieceCollected.add(cb);
    return () => this.onPieceCollected.delete(cb);
  }

  addArtifactRestoredListener(cb: ArtifactRestoredCallback): () => void {
    this.onArtifactRestored.add(cb);
    return () => this.onArtifactRestored.delete(cb);
  }

  addWorkbenchChangedListener(cb: WorkbenchChangedCallback): () => void {
    this.onWorkbenchChanged.add(cb);
    return () => this.onWorkbenchChanged.delete(cb);
  }

  addAssembleAttemptListener(cb: (r: AssembleResult) => void): () => void {
    this.onAssembleAttempt.add(cb);
    return () => this.onAssembleAttempt.delete(cb);
  }

  private fireWorkbenchChanged() {
    this.onWorkbenchChanged.forEach(cb => cb());
  }

  getProgress(): {
    totalArtifacts: number;
    discoveredArtifacts: number;
    totalPieces: number;
    collectedPieces: number;
    restoredArtifacts: number;
    totalPoints: number;
  } {
    const allDefs = Object.values(ARTIFACT_DEFINITIONS);
    const allPieces = Array.from(this.pieces.values());
    const restored = allDefs.filter(d => this.isArtifactRestored(d.id)).length;
    const totalPoints = allDefs.filter(d => this.isArtifactRestored(d.id)).reduce((s, d) => s + d.points, 0);
    const discoveredCount = new Set(allPieces.filter(p => p.collected).map(p => p.artifactId)).size;
    return {
      totalArtifacts: allDefs.length,
      discoveredArtifacts: discoveredCount,
      totalPieces: allPieces.length,
      collectedPieces: allPieces.filter(p => p.collected).length,
      restoredArtifacts: restored,
      totalPoints
    };
  }

  consumeSounds(): string[] {
    const out = this.sounds;
    this.sounds = [];
    return out;
  }

  getWorkbenchParams() {
    return { CELL_SIZE: WORKBENCH_CELL_SIZE, RADIUS: WORKBENCH_RADIUS, SNAP_DISTANCE };
  }
}

export const artifactManager = new ArtifactManager();
