export enum Season {
  SPRING = 0,
  SUMMER = 1,
  AUTUMN = 2,
  WINTER = 3
}

export const seasonNames = ['春', '夏', '秋', '冬'];

export const seasonThemeColors = {
  [Season.SPRING]: '#FFB7B2',
  [Season.SUMMER]: '#FFDAC1',
  [Season.AUTUMN]: '#E2F0CB',
  [Season.WINTER]: '#B5EAD7'
};

export const seasonBackgroundColors = {
  [Season.SPRING]: '#F0C5A8',
  [Season.SUMMER]: '#8FBC8F',
  [Season.AUTUMN]: '#D2691E',
  [Season.WINTER]: '#A9A9A9'
};

export enum PlantType {
  CHERRY_BLOSSOM = 'cherry_blossom',
  GINKGO = 'ginkgo',
  SUNFLOWER = 'sunflower',
  MAPLE = 'maple'
}

export const plantNames = {
  [PlantType.CHERRY_BLOSSOM]: '樱花',
  [PlantType.GINKGO]: '银杏',
  [PlantType.SUNFLOWER]: '向日葵',
  [PlantType.MAPLE]: '枫树'
};

export const plantInfo = {
  [PlantType.CHERRY_BLOSSOM]: {
    temperature: '15-25℃',
    humidity: '60-70%',
    description: {
      [Season.SPRING]: '花朵盛开，叶片嫩绿',
      [Season.SUMMER]: '花朵凋谢，叶片茂密翠绿',
      [Season.AUTUMN]: '叶片转黄，逐渐掉落',
      [Season.WINTER]: '叶片落光，进入休眠期'
    }
  },
  [PlantType.GINKGO]: {
    temperature: '10-30℃',
    humidity: '50-80%',
    description: {
      [Season.SPRING]: '嫩芽初发，新叶嫩绿',
      [Season.SUMMER]: '叶片深绿，生长旺盛',
      [Season.AUTUMN]: '叶片金黄，极具观赏性',
      [Season.WINTER]: '叶片落光，枝干挺拔'
    }
  },
  [PlantType.SUNFLOWER]: {
    temperature: '20-35℃',
    humidity: '40-70%',
    description: {
      [Season.SPRING]: '幼苗生长，叶片舒展',
      [Season.SUMMER]: '花朵盛开，向着太阳',
      [Season.AUTUMN]: '花盘成熟，结出果实',
      [Season.WINTER]: '植株枯萎，等待来年'
    }
  },
  [PlantType.MAPLE]: {
    temperature: '5-25℃',
    humidity: '60-80%',
    description: {
      [Season.SPRING]: '新叶萌发，嫩红可爱',
      [Season.SUMMER]: '叶片翠绿，树冠茂盛',
      [Season.AUTUMN]: '叶片变红，层林尽染',
      [Season.WINTER]: '叶片落光，枝干优美'
    }
  }
};

export const plantColors = {
  [PlantType.CHERRY_BLOSSOM]: {
    flower: {
      [Season.SPRING]: '#FFB7C5',
      [Season.SUMMER]: '#E8E8E8',
      [Season.AUTUMN]: '#D3D3D3',
      [Season.WINTER]: '#C0C0C0'
    },
    leaf: {
      [Season.SPRING]: '#8FBC8F',
      [Season.SUMMER]: '#228B22',
      [Season.AUTUMN]: '#DAA520',
      [Season.WINTER]: '#D3D3D3'
    },
    fruit: {
      [Season.SPRING]: '#90EE90',
      [Season.SUMMER]: '#32CD32',
      [Season.AUTUMN]: '#8B4513',
      [Season.WINTER]: '#A9A9A9'
    }
  },
  [PlantType.GINKGO]: {
    flower: {
      [Season.SPRING]: '#98FB98',
      [Season.SUMMER]: '#90EE90',
      [Season.AUTUMN]: '#D3D3D3',
      [Season.WINTER]: '#C0C0C0'
    },
    leaf: {
      [Season.SPRING]: '#90EE90',
      [Season.SUMMER]: '#228B22',
      [Season.AUTUMN]: '#FFD700',
      [Season.WINTER]: '#D3D3D3'
    },
    fruit: {
      [Season.SPRING]: '#90EE90',
      [Season.SUMMER]: '#98FB98',
      [Season.AUTUMN]: '#DAA520',
      [Season.WINTER]: '#A9A9A9'
    }
  },
  [PlantType.SUNFLOWER]: {
    flower: {
      [Season.SPRING]: '#FFD700',
      [Season.SUMMER]: '#FFA500',
      [Season.AUTUMN]: '#CD853F',
      [Season.WINTER]: '#C0C0C0'
    },
    leaf: {
      [Season.SPRING]: '#90EE90',
      [Season.SUMMER]: '#228B22',
      [Season.AUTUMN]: '#8B4513',
      [Season.WINTER]: '#D3D3D3'
    },
    fruit: {
      [Season.SPRING]: '#90EE90',
      [Season.SUMMER]: '#98FB98',
      [Season.AUTUMN]: '#2F4F4F',
      [Season.WINTER]: '#A9A9A9'
    }
  },
  [PlantType.MAPLE]: {
    flower: {
      [Season.SPRING]: '#FF6347',
      [Season.SUMMER]: '#FA8072',
      [Season.AUTUMN]: '#D3D3D3',
      [Season.WINTER]: '#C0C0C0'
    },
    leaf: {
      [Season.SPRING]: '#FF7F50',
      [Season.SUMMER]: '#228B22',
      [Season.AUTUMN]: '#D2691E',
      [Season.WINTER]: '#D3D3D3'
    },
    fruit: {
      [Season.SPRING]: '#90EE90',
      [Season.SUMMER]: '#32CD32',
      [Season.AUTUMN]: '#8B4513',
      [Season.WINTER]: '#A9A9A9'
    }
  }
};

export const lerpColor = (color1: string, color2: string, t: number): string => {
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);
  
  const r1 = (c1 >> 16) & 255;
  const g1 = (c1 >> 8) & 255;
  const b1 = c1 & 255;
  
  const r2 = (c2 >> 16) & 255;
  const g2 = (c2 >> 8) & 255;
  const b2 = c2 & 255;
  
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};
