import { BlockInfoPanel } from './types';

export class UIController {
  private hoveredBlockId: string | null = null;
  private selectedBlock: BlockInfoPanel | null = null;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  setHoveredBlock(blockId: string | null): void {
    this.hoveredBlockId = blockId;
  }

  setSelectedBlock(block: BlockInfoPanel | null): void {
    this.selectedBlock = block;
  }

  getHoveredBlock(): string | null {
    return this.hoveredBlockId;
  }

  getSelectedBlock(): BlockInfoPanel | null {
    return this.selectedBlock;
  }
}
