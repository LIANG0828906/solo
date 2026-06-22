import { StarData } from '../types';

const generateStars = (): StarData[] => {
  const stars: StarData[] = [];
  const constellationPrefixes = ['角', '亢', '氐', '房', '心', '尾', '箕', 
                                 '斗', '牛', '女', '虚', '危', '室', '壁',
                                 '奎', '娄', '胃', '昴', '毕', '觜', '参',
                                 '井', '鬼', '柳', '星', '张', '翼', '轸'];
  
  const modernConstellations = ['Vir', 'Lib', 'Sco', 'Sgr', 'Cap', 'Aqr', 'Psc',
                                'Ari', 'Tau', 'Gem', 'Cnc', 'Leo', 'Vir', 'Lib',
                                'Sco', 'Sgr', 'Cap', 'Aqr', 'Psc', 'Ari', 'Tau',
                                'Gem', 'Cnc', 'Leo', 'Vir', 'Lib', 'Sco', 'Sgr'];
  
  const starNames = ['天枢', '太一', '天一', '紫微', '天乙', '文昌', '文曲', '武曲',
                     '廉贞', '破军', '禄存', '巨门', '贪狼', '左辅', '右弼', '天相',
                     '天梁', '天机', '太阳', '太阴', '天同', '七杀', '擎羊', '陀罗',
                     '火星', '铃星', '天空', '地劫', '天魁', '天钺', '禄马', '红鸾',
                     '天喜', '咸池', '月德', '天德', '龙德', '凤阁', '鸾喜', '天福',
                     '天厨', '天庙', '天庭', '天牢', '天囚', '天赦', '天官', '天符',
                     '天印', '天剑', '天钺', '天戈', '天矛', '天盾', '天甲', '天盔',
                     '天船', '天车', '天马', '天牛', '天羊', '天猪', '天狗', '天鸡',
                     '天兔', '天龙', '天蛇', '天马', '天猴', '天鸡', '天犬', '天豕'];

  let starId = 0;
  
  for (let c = 0; c < 28; c++) {
    const constellationId = `cons_${c.toString().padStart(2, '0')}`;
    const constellationName = constellationPrefixes[c];
    const modernConst = modernConstellations[c];
    const starsInConst = 40 + Math.floor(Math.random() * 20);
    
    const centerX = (c % 14) * 0.14 - 0.98 + (Math.random() - 0.5) * 0.1;
    const centerY = c < 14 ? 0.3 : -0.3;
    
    for (let s = 0; s < starsInConst; s++) {
      const magnitude = Math.floor(Math.random() * 4) + 1;
      const size = magnitude === 1 ? 8 : magnitude === 2 ? 5 : magnitude === 3 ? 3 : 2;
      const color = magnitude === 1 ? '#cc0000' : '#9999aa';
      
      const angle = (s / starsInConst) * Math.PI * 2;
      const radius = 0.05 + Math.random() * 0.25;
      const x = centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 0.08;
      const y = centerY + Math.sin(angle) * radius * 0.6 + (Math.random() - 0.5) * 0.08;
      
      const starNameIndex = (c * 3 + s) % starNames.length;
      const starNumber = Math.floor(s / 3) + 1;
      
      stars.push({
        id: `star_${starId.toString().padStart(4, '0')}`,
        ancientName: `${constellationName}${starNames[starNameIndex]}${starNumber > 1 ? starNumber : ''}`,
        modernName: `${String.fromCharCode(65 + (s % 26))} ${modernConst}`,
        x: Math.max(-1.4, Math.min(1.4, x)),
        y: Math.max(-0.7, Math.min(0.7, y)),
        magnitude,
        constellationId,
        color,
        size
      });
      starId++;
    }
  }
  
  const additionalStars = 1359 - stars.length;
  for (let i = 0; i < additionalStars; i++) {
    const magnitude = Math.floor(Math.random() * 4) + 1;
    const size = magnitude === 1 ? 8 : magnitude === 2 ? 5 : magnitude === 3 ? 3 : 2;
    const color = magnitude === 1 ? '#cc0000' : '#9999aa';
    const constellationIdx = Math.floor(Math.random() * 28);
    
    stars.push({
      id: `star_${starId.toString().padStart(4, '0')}`,
      ancientName: `星${starNames[i % starNames.length]}${i + 1}`,
      modernName: `${String.fromCharCode(65 + (i % 26))} ${modernConstellations[constellationIdx]}`,
      x: (Math.random() - 0.5) * 2.8,
      y: (Math.random() - 0.5) * 1.4,
      magnitude,
      constellationId: `cons_${constellationIdx.toString().padStart(2, '0')}`,
      color,
      size
    });
    starId++;
  }
  
  return stars;
};

export const starsData = generateStars();

export const getStarById = (id: string): StarData | undefined => {
  return starsData.find(s => s.id === id);
};

export const getStarsByConstellation = (constellationId: string): StarData[] => {
  return starsData.filter(s => s.constellationId === constellationId);
};
