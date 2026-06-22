export interface ColorItem {
  name: string;
  hex: string;
}

export interface BrandData {
  name: string;
  colors: ColorItem[];
}

export const brandLibrary: BrandData[] = [
  {
    name: '辉柏嘉',
    colors: [
      { name: '101 白色', hex: '#FFFFFF' },
      { name: '102 象牙白', hex: '#FAF3E0' },
      { name: '103 奶油白', hex: '#F5E6C8' },
      { name: '104 浅黄', hex: '#FFE066' },
      { name: '105 柠檬黄', hex: '#FFD700' },
      { name: '106 镉黄', hex: '#FFB800' },
      { name: '107 深黄', hex: '#FFA500' },
      { name: '108 橙黄', hex: '#FF8C00' },
      { name: '109 镉橙', hex: '#FF6B35' },
      { name: '110 朱红', hex: '#FF4500' },
      { name: '111 镉红', hex: '#E63946' },
      { name: '112 深红', hex: '#C1121F' }
    ]
  },
  {
    name: '三菱',
    colors: [
      { name: '01 粉色', hex: '#FFB5C5' },
      { name: '02 桃红', hex: '#FF69B4' },
      { name: '03 玫瑰红', hex: '#FF007F' },
      { name: '04 紫红', hex: '#C71585' },
      { name: '05 浅紫', hex: '#DDA0DD' },
      { name: '06 紫罗兰', hex: '#8A2BE2' },
      { name: '07 深紫', hex: '#4B0082' },
      { name: '08 靛蓝', hex: '#4B0082' },
      { name: '09 群青', hex: '#4169E1' },
      { name: '10 钴蓝', hex: '#0047AB' },
      { name: '11 普蓝', hex: '#003366' },
      { name: '12 深蓝', hex: '#000080' }
    ]
  },
  {
    name: '荷尔拜因',
    colors: [
      { name: 'A01 天蓝', hex: '#87CEEB' },
      { name: 'A02 湖蓝', hex: '#40E0D0' },
      { name: 'A03 翠绿', hex: '#00A86B' },
      { name: 'A04 草绿', hex: '#7CFC00' },
      { name: 'A05 橄榄绿', hex: '#808000' },
      { name: 'A06 深绿', hex: '#006400' },
      { name: 'A07 赭石', hex: '#8B4513' },
      { name: 'A08 生褐', hex: '#6B4423' },
      { name: 'A09 熟褐', hex: '#3E2723' },
      { name: 'A10 灰色', hex: '#808080' },
      { name: 'A11 深灰', hex: '#404040' },
      { name: 'A12 黑色', hex: '#000000' }
    ]
  }
];

export function getColorsByBrand(brandName: string): ColorItem[] {
  const brand = brandLibrary.find(b => b.name === brandName);
  return brand ? brand.colors : [];
}

export function getBrandNames(): string[] {
  return brandLibrary.map(b => b.name);
}
