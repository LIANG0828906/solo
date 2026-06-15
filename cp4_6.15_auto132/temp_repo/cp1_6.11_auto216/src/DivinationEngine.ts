import { getHexagramByPattern, getChangedLines, type HexagramInfo } from './IChingData';

export interface YaoResult {
  type: 'oldYang' | 'oldYin' | 'youngYang' | 'youngYin';
  label: string;
  isChanging: boolean;
  value: number;
  shells: [boolean, boolean, boolean];
}

export interface HexagramResult {
  yaoList: YaoResult[];
  hexagram: HexagramInfo | null;
  changingYaoIndices: number[];
  changedHexagram: HexagramInfo | null;
  complete: boolean;
}

export class DivinationEngine {
  private yaoList: YaoResult[] = [];
  private maxYaos = 6;

  reset(): void {
    this.yaoList = [];
  }

  throwShells(): [boolean, boolean, boolean] {
    return [
      Math.random() < 0.5,
      Math.random() < 0.5,
      Math.random() < 0.5
    ];
  }

  calculateYao(shells: [boolean, boolean, boolean]): YaoResult {
    const yangCount = shells.filter(s => s).length;

    switch (yangCount) {
      case 3:
        return { type: 'oldYang', label: '老阳 ⚊', isChanging: true, value: 1, shells };
      case 2:
        return { type: 'youngYin', label: '少阴 ⚋', isChanging: false, value: 0, shells };
      case 1:
        return { type: 'youngYang', label: '少阳 ⚊', isChanging: false, value: 1, shells };
      case 0:
        return { type: 'oldYin', label: '老阴 ⚋', isChanging: true, value: 0, shells };
      default:
        throw new Error('Invalid shell count');
    }
  }

  addYao(yao: YaoResult): void {
    if (this.yaoList.length >= this.maxYaos) {
      throw new Error('Six yaos already complete');
    }
    this.yaoList.push(yao);
  }

  isComplete(): boolean {
    return this.yaoList.length >= this.maxYaos;
  }

  getCurrentYaoCount(): number {
    return this.yaoList.length;
  }

  getResult(): HexagramResult {
    const changingYaoIndices = this.yaoList
      .map((yao, idx) => yao.isChanging ? idx : -1)
      .filter(idx => idx !== -1);

    const lines = this.yaoList.map(yao => yao.value);

    let hexagram: HexagramInfo | null = null;
    let changedHexagram: HexagramInfo | null = null;

    if (this.isComplete()) {
      hexagram = getHexagramByPattern(lines);

      if (changingYaoIndices.length > 0) {
        const changedLines = getChangedLines(lines, changingYaoIndices);
        changedHexagram = getHexagramByPattern(changedLines);
      }
    }

    return {
      yaoList: [...this.yaoList],
      hexagram,
      changingYaoIndices,
      changedHexagram,
      complete: this.isComplete()
    };
  }

  throwAndAdd(): YaoResult {
    const shells = this.throwShells();
    const yao = this.calculateYao(shells);
    this.addYao(yao);
    return yao;
  }
}
