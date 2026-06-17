import { eventBus } from './EventBus';

export interface AssetItem {
  id: string;
  name: string;
  category: 'sprite' | 'prop' | 'bubble';
  width: number;
  height: number;
  pixels: string[];
  palette: Record<string, string>;
}

const SPRITE_PALETTE: Record<string, string> = {
  '.': 'transparent',
  '0': '#1a1a2e',
  '1': '#ffffff',
  '2': '#f5a623',
  '3': '#4a90d9',
  '4': '#bb86fc',
  '5': '#e74c3c',
  '6': '#2ecc71',
  '7': '#8b4513',
  '8': '#ffd700',
  '9': '#ff9f43',
  'a': '#6bb5ff',
  'b': '#a0a0a0',
  'c': '#5d4037',
  'd': '#ffb6c1',
  'e': '#ff6b6b',
  'f': '#3a3d42',
};

const SPRITES: AssetItem[] = [
  {
    id: 'knight',
    name: '骑士',
    category: 'sprite',
    width: 14,
    height: 14,
    palette: SPRITE_PALETTE,
    pixels: [
      '......3333......',
      '.....3a3a3a3....',
      '.....3a1a1a3....',
      '.....31a1a13....',
      '......3113......',
      '......1dd1......',
      '.....3b33b3.....',
      '....3bbbbbb3....',
      '....3b3bb3b3....',
      '....3b3bb3b3....',
      '.....3bbbb3.....',
      '......3bb3......',
      '.....77..77.....',
      '.....77..77.....',
    ],
  },
  {
    id: 'mage',
    name: '法师',
    category: 'sprite',
    width: 14,
    height: 14,
    palette: SPRITE_PALETTE,
    pixels: [
      '.......4........',
      '......444.......',
      '.....44444......',
      '....4444444.....',
      '.....4d1d4......',
      '.....41d14......',
      '......111.......',
      '.....4b1b4......',
      '....4441444.....',
      '....4441444.....',
      '.....44144......',
      '......414.......',
      '.....44.44......',
      '.....77..77.....',
    ],
  },
  {
    id: 'archer',
    name: '弓箭手',
    category: 'sprite',
    width: 14,
    height: 14,
    palette: SPRITE_PALETTE,
    pixels: [
      '......666.......',
      '.....6d1d6......',
      '.....61d16......',
      '......111.......',
      '......1d1.......',
      '.....6b1b6......',
      '....6bb1bb6.....',
      '....6bbbbbb6....',
      '....6bbbbbb6....',
      '.....6bbbb6.....',
      '......6bb6......',
      '......6..6......',
      '.....77..77.....',
      '.....77..77.....',
    ],
  },
  {
    id: 'slime',
    name: '史莱姆',
    category: 'sprite',
    width: 14,
    height: 14,
    palette: SPRITE_PALETTE,
    pixels: [
      '................',
      '.....aaaaaa.....',
      '....aaaaaaaa....',
      '...aa1aa1aaa....',
      '...a0a00a0aa....',
      '...aaaaaaaaa....',
      '...adaaaaada....',
      '....aaaaaaaa....',
      '....aaaaaaaa....',
      '....aaaaaaaa....',
      '.....aaaaaa.....',
      '......aaaa......',
      '................',
      '................',
    ],
  },
  {
    id: 'villager',
    name: '村民',
    category: 'sprite',
    width: 14,
    height: 14,
    palette: SPRITE_PALETTE,
    pixels: [
      '......777.......',
      '.....7d1d7......',
      '.....71d17......',
      '......111.......',
      '......1d1.......',
      '.....c717c......',
      '....cc711cc.....',
      '....cc711cc.....',
      '.....c7117c.....',
      '......7117......',
      '......7117......',
      '......7..7......',
      '.....77..77.....',
      '.....77..77.....',
    ],
  },
  {
    id: 'cat',
    name: '猫咪',
    category: 'sprite',
    width: 14,
    height: 14,
    palette: SPRITE_PALETTE,
    pixels: [
      '................',
      '....9.....9.....',
      '...999...999....',
      '...9d9...9d9....',
      '...999999999....',
      '...91991999.....',
      '...9d9999d9.....',
      '....9999999.....',
      '....9999999.....',
      '.....99999......',
      '.....99.99......',
      '.....99.99......',
      '................',
      '................',
    ],
  },
];

const PROPS: AssetItem[] = [
  {
    id: 'torch',
    name: '火把',
    category: 'prop',
    width: 8,
    height: 8,
    palette: SPRITE_PALETTE,
    pixels: [
      '...9....',
      '..9e9...',
      '..eee...',
      '..9e9...',
      '...7....',
      '...7....',
      '...7....',
      '...7....',
    ],
  },
  {
    id: 'chest',
    name: '箱子',
    category: 'prop',
    width: 8,
    height: 8,
    palette: SPRITE_PALETTE,
    pixels: [
      'cccccccc',
      'c8c8c8cc',
      'cccccccc',
      'c7c7c7cc',
      '77727777',
      '77727777',
      '77727777',
      '77777777',
    ],
  },
  {
    id: 'bucket',
    name: '水桶',
    category: 'prop',
    width: 8,
    height: 8,
    palette: SPRITE_PALETTE,
    pixels: [
      '.bbbbbb.',
      '.baaaaab',
      '.baaaaab',
      '.baaaaab',
      '.bbbbbb.',
      '..bbbb..',
      '...bb...',
      '........',
    ],
  },
  {
    id: 'tree',
    name: '树',
    category: 'prop',
    width: 8,
    height: 8,
    palette: SPRITE_PALETTE,
    pixels: [
      '..6666..',
      '.666666.',
      '66666666',
      '66666666',
      '.666666.',
      '..7777..',
      '..7777..',
      '..7777..',
    ],
  },
  {
    id: 'rock',
    name: '石头',
    category: 'prop',
    width: 8,
    height: 8,
    palette: SPRITE_PALETTE,
    pixels: [
      '........',
      '........',
      '..bbbb..',
      '.bbbbbb.',
      '.bbbbbb.',
      '..bbbb..',
      '........',
      '........',
    ],
  },
  {
    id: 'potion',
    name: '药水',
    category: 'prop',
    width: 8,
    height: 8,
    palette: SPRITE_PALETTE,
    pixels: [
      '...bb...',
      '...bb...',
      '..bbbb..',
      '.bddbdb.',
      '.bddddb.',
      '.bddddb.',
      '..bddb..',
      '........',
    ],
  },
  {
    id: 'sword',
    name: '宝剑',
    category: 'prop',
    width: 8,
    height: 8,
    palette: SPRITE_PALETTE,
    pixels: [
      '........',
      '......1.',
      '.....1..',
      '....1...',
      '...2....',
      '..2.....',
      '.7......',
      '7.......',
    ],
  },
  {
    id: 'key',
    name: '钥匙',
    category: 'prop',
    width: 8,
    height: 8,
    palette: SPRITE_PALETTE,
    pixels: [
      '........',
      '..8888..',
      '..8..8..',
      '..8888..',
      '....8...',
      '....8...',
      '...88...',
      '........',
    ],
  },
];

const BUBBLES: AssetItem[] = [
  {
    id: 'speech',
    name: '对话气泡',
    category: 'bubble',
    width: 16,
    height: 8,
    palette: SPRITE_PALETTE,
    pixels: [
      '................',
      '..111111111111..',
      '.1dddddddddddd1.',
      '1dddddddddddddd1',
      '1dddddddddddddd1',
      '.1dddddddddddd1.',
      '..1111.111111...',
      '......1.........',
    ],
  },
  {
    id: 'thought',
    name: '思考气泡',
    category: 'bubble',
    width: 16,
    height: 8,
    palette: SPRITE_PALETTE,
    pixels: [
      '................',
      '..111111111111..',
      '.1dddddddddddd1.',
      '1dddddddddddddd1',
      '1dddddddddddddd1',
      '.1dddddddddddd1.',
      '..111111111111..',
      '..........1.....',
    ],
  },
  {
    id: 'exclaim',
    name: '感叹',
    category: 'bubble',
    width: 16,
    height: 8,
    palette: SPRITE_PALETTE,
    pixels: [
      '................',
      '..111111111111..',
      '.1dddddddddddd1.',
      '1ddddddeedddddd1',
      '1ddddddee5edddd1',
      '.1dddddd5edddd1.',
      '..1111.111111...',
      '......1.........',
    ],
  },
  {
    id: 'question',
    name: '疑问',
    category: 'bubble',
    width: 16,
    height: 8,
    palette: SPRITE_PALETTE,
    pixels: [
      '................',
      '..111111111111..',
      '.1dddddddddddd1.',
      '1ddddddee5edddd1',
      '1ddddddd5edddddd1',
      '.1dddddd5edddd1.',
      '..1111.111111...',
      '......1.........',
    ],
  },
  {
    id: 'heart',
    name: '爱心',
    category: 'bubble',
    width: 16,
    height: 8,
    palette: SPRITE_PALETTE,
    pixels: [
      '................',
      '..5ee5..5ee5...',
      '.5eee555eee5...',
      '5eeeeeeeeeee5..',
      '5eeeeeeeeeee5..',
      '.5eeeeeeeee5...',
      '..5eeeeeee5....',
      '....55555......',
    ],
  },
  {
    id: 'star',
    name: '星星',
    category: 'bubble',
    width: 16,
    height: 8,
    palette: SPRITE_PALETTE,
    pixels: [
      '................',
      '......88.......',
      '.....8888......',
      '888888888888...',
      '.8888888888....',
      '..88888888.....',
      '..888....88....',
      '.888......888..',
    ],
  },
];

class AssetManagerClass {
  private assets: Map<string, AssetItem> = new Map();
  private textureCache: Map<string, string> = new Map();
  private loaded = false;

  init(): void {
    const allAssets = [...SPRITES, ...PROPS, ...BUBBLES];
    allAssets.forEach(asset => {
      this.assets.set(asset.id, asset);
    });
    this.loaded = true;
    eventBus.emit('assets:loaded', undefined);
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  getAsset(id: string): AssetItem | undefined {
    return this.assets.get(id);
  }

  getSprites(): AssetItem[] {
    return SPRITES;
  }

  getProps(): AssetItem[] {
    return PROPS;
  }

  getBubbles(): AssetItem[] {
    return BUBBLES;
  }

  getByCategory(category: 'sprite' | 'prop' | 'bubble'): AssetItem[] {
    switch (category) {
      case 'sprite': return this.getSprites();
      case 'prop': return this.getProps();
      case 'bubble': return this.getBubbles();
    }
  }

  getTextureUrl(assetId: string): string {
    const cached = this.textureCache.get(assetId);
    if (cached) return cached;

    const asset = this.assets.get(assetId);
    if (!asset) return '';

    const url = this.renderToDataUrl(asset);
    this.textureCache.set(assetId, url);
    return url;
  }

  private renderToDataUrl(asset: AssetItem): string {
    const pixelSize = asset.category === 'sprite' ? 3 : 4;
    const canvas = document.createElement('canvas');
    canvas.width = asset.width * pixelSize;
    canvas.height = asset.height * pixelSize;
    const ctx = canvas.getContext('2d')!;

    for (let row = 0; row < asset.pixels.length; row++) {
      const line = asset.pixels[row];
      for (let col = 0; col < line.length && col < asset.width; col++) {
        const char = line[col];
        const color = asset.palette[char];
        if (!color || color === 'transparent') continue;
        ctx.fillStyle = color;
        ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
      }
    }

    return canvas.toDataURL();
  }
}

export const assetManager = new AssetManagerClass();
