export interface ArtifactPiece {
  id: string;
  artifactId: string;
  pieceIndex: number;
  collected: boolean;
  placed: boolean;
  gridPosition: { row: number; col: number };
}

export interface ArtifactDefinition {
  id: string;
  name: string;
  era: string;
  description: string;
  color: string;
  accentColor: string;
  pieceCount: number;
  shape: 'pot' | 'arrow' | 'disc' | 'trilobite' | 'ding' | 'axe' | 'shell' | 'pendant';
}

export const ARTIFACT_DEFINITIONS: Record<string, ArtifactDefinition> = {
  pottery: {
    id: 'pottery',
    name: '彩绘陶罐碎片',
    era: '商代 (约公元前1600年)',
    description: '泥质红陶，饰有绳纹与云雷纹，是当时贵族日常使用的盛器',
    color: '#c17f59',
    accentColor: '#e8a87c',
    pieceCount: 4,
    shape: 'pot'
  },
  arrowhead: {
    id: 'arrowhead',
    name: '青铜箭头',
    era: '西周 (约公元前1000年)',
    description: '双翼镞形青铜箭镞，铤部完整，为当时军队标准武器',
    color: '#8a9a5b',
    accentColor: '#bdb76b',
    pieceCount: 3,
    shape: 'arrow'
  },
  jade_disc: {
    id: 'jade_disc',
    name: '玉璧残片',
    era: '良渚文化 (约公元前3000年)',
    description: '青玉质，带有沁色，璧面刻有简化神徽纹',
    color: '#5f9ea0',
    accentColor: '#7ec8e3',
    pieceCount: 5,
    shape: 'disc'
  },
  trilobite: {
    id: 'trilobite',
    name: '三叶虫化石',
    era: '寒武纪 (约5亿年前)',
    description: '保存完好的三叶虫背甲化石，清晰可见头鞍与轴节',
    color: '#6b5b73',
    accentColor: '#9d8aa8',
    pieceCount: 4,
    shape: 'trilobite'
  },
  bronze_ding: {
    id: 'bronze_ding',
    name: '青铜鼎残片',
    era: '春秋 (约公元前600年)',
    description: '青铜礼器残片，可见饕餮纹的一部分，铸工精湛',
    color: '#7d6b4e',
    accentColor: '#cd853f',
    pieceCount: 5,
    shape: 'ding'
  },
  stone_axe: {
    id: 'stone_axe',
    name: '磨制石斧',
    era: '新石器时代 (约公元前5000年)',
    description: '花岗岩磨制石斧，刃部锋利，钻孔技术成熟',
    color: '#696969',
    accentColor: '#a9a9a9',
    pieceCount: 3,
    shape: 'axe'
  },
  fossil_shell: {
    id: 'fossil_shell',
    name: '贝壳化石',
    era: '侏罗纪 (约1.5亿年前)',
    description: '双壳类贝壳化石，珍珠层仍有光彩',
    color: '#deb887',
    accentColor: '#f5deb3',
    pieceCount: 3,
    shape: 'shell'
  },
  jade_pendant: {
    id: 'jade_pendant',
    name: '玉龙佩',
    era: '战国 (约公元前400年)',
    description: '青白玉透雕龙形佩，线条流畅，为高级贵族饰物',
    color: '#6b8e6b',
    accentColor: '#98d98e',
    pieceCount: 4,
    shape: 'pendant'
  }
};

export class ArtifactManager {
  private pieces: Map<string, ArtifactPiece> = new Map();
  private onPieceCollected: ((piece: ArtifactPiece) => void) | null = null;
  private onArtifactRestored: ((artifactId: string) => void) | null = null;
  private workbenchPieces: string[] = [];

  constructor() {
    this.initializePieces();
  }

  private initializePieces() {
    for (const def of Object.values(ARTIFACT_DEFINITIONS)) {
      const layout = this.getPieceLayout(def.shape, def.pieceCount);
      for (let i = 0; i < def.pieceCount; i++) {
        const id = `${def.id}_piece_${i}`;
        this.pieces.set(id, {
          id,
          artifactId: def.id,
          pieceIndex: i,
          collected: false,
          placed: false,
          gridPosition: layout[i]
        });
      }
    }
  }

  private getPieceLayout(shape: string, count: number): { row: number; col: number }[] {
    const positions: { row: number; col: number }[] = [];
    const rows = Math.ceil(Math.sqrt(count));
    const cols = Math.ceil(count / rows);
    for (let i = 0; i < count; i++) {
      positions.push({
        row: Math.floor(i / cols) - (rows - 1) / 2,
        col: (i % cols) - (cols - 1) / 2
      });
    }
    return positions;
  }

  collectPiece(pieceId: string): boolean {
    const piece = this.pieces.get(pieceId);
    if (!piece || piece.collected) return false;
    piece.collected = true;
    if (this.onPieceCollected) this.onPieceCollected(piece);
    return true;
  }

  placePieceOnWorkbench(pieceId: string): { placed: boolean; isComplete: boolean; artifactId?: string } {
    const piece = this.pieces.get(pieceId);
    if (!piece || !piece.collected || piece.placed) return { placed: false, isComplete: false };
    
    piece.placed = true;
    this.workbenchPieces.push(pieceId);
    
    const isComplete = this.checkArtifactComplete(piece.artifactId);
    if (isComplete && this.onArtifactRestored) {
      this.onArtifactRestored(piece.artifactId);
    }
    
    return { placed: true, isComplete, artifactId: piece.artifactId };
  }

  removePieceFromWorkbench(pieceId: string): boolean {
    const piece = this.pieces.get(pieceId);
    if (!piece || !piece.placed) return false;
    piece.placed = false;
    this.workbenchPieces = this.workbenchPieces.filter(id => id !== pieceId);
    return true;
  }

  private checkArtifactComplete(artifactId: string): boolean {
    const def = ARTIFACT_DEFINITIONS[artifactId];
    if (!def) return false;
    for (let i = 0; i < def.pieceCount; i++) {
      const p = this.pieces.get(`${artifactId}_piece_${i}`);
      if (!p || !p.placed) return false;
    }
    return true;
  }

  getPiece(pieceId: string): ArtifactPiece | undefined {
    return this.pieces.get(pieceId);
  }

  getPiecesByArtifact(artifactId: string): ArtifactPiece[] {
    const result: ArtifactPiece[] = [];
    for (let i = 0; i < (ARTIFACT_DEFINITIONS[artifactId]?.pieceCount || 0); i++) {
      const p = this.pieces.get(`${artifactId}_piece_${i}`);
      if (p) result.push(p);
    }
    return result;
  }

  getCollectedPieces(): ArtifactPiece[] {
    return Array.from(this.pieces.values()).filter(p => p.collected);
  }

  getWorkbenchPieces(): ArtifactPiece[] {
    return this.workbenchPieces.map(id => this.pieces.get(id)!).filter(Boolean);
  }

  isArtifactCollected(artifactId: string): boolean {
    const pieces = this.getPiecesByArtifact(artifactId);
    return pieces.length > 0 && pieces.every(p => p.collected);
  }

  isArtifactRestored(artifactId: string): boolean {
    const pieces = this.getPiecesByArtifact(artifactId);
    return pieces.length > 0 && pieces.every(p => p.placed);
  }

  setOnPieceCollected(callback: (piece: ArtifactPiece) => void) {
    this.onPieceCollected = callback;
  }

  setOnArtifactRestored(callback: (artifactId: string) => void) {
    this.onArtifactRestored = callback;
  }

  getArtifactDefinition(artifactId: string): ArtifactDefinition | undefined {
    return ARTIFACT_DEFINITIONS[artifactId];
  }

  getProgress(): { total: number; collected: number; restored: number } {
    const allPieces = Array.from(this.pieces.values());
    return {
      total: allPieces.length,
      collected: allPieces.filter(p => p.collected).length,
      restored: allPieces.filter(p => p.placed).length
    };
  }
}

export const artifactManager = new ArtifactManager();
