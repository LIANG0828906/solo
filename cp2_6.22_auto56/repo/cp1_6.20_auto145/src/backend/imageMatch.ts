import type { ImageMatchResult } from '../shared/types';

interface PresetImage {
  id: string;
  category: '山水' | '花鸟' | '月色' | '江雪' | '边塞' | '田园';
  base64: string;
  gradient: string;
  tags: string[];
}

const createSvgImage = (content: string, width: number, height: number): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${content}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

const generatePresetImages = (): PresetImage[] => {
  const images: PresetImage[] = [];
  const categories: Array<{ name: '山水' | '花鸟' | '月色' | '江雪' | '边塞' | '田园'; gradients: string[]; tags: string[][] }> = [
    {
      name: '山水',
      gradients: [
        'linear-gradient(180deg, #87CEEB 0%, #98D8C8 50%, #2E8B57 100%)',
        'linear-gradient(180deg, #B0C4DE 0%, #708090 50%, #2F4F4F 100%)',
        'linear-gradient(135deg, #E0F7FA 0%, #80DEEA 50%, #00ACC1 100%)',
        'linear-gradient(135deg, #FFF8E1 0%, #FFE082 50%, #FFA000 100%)',
        'linear-gradient(180deg, #ECEFF1 0%, #B0BEC5 50%, #607D8B 100%)',
        'linear-gradient(135deg, #E8F5E9 0%, #A5D6A7 50%, #43A047 100%)',
        'linear-gradient(180deg, #E3F2FD 0%, #90CAF9 50%, #1E88E5 100%)',
        'linear-gradient(135deg, #FCE4EC 0%, #F48FB1 50%, #D81B60 100%)',
      ],
      tags: [['山', '水', '自然', '瀑布'], ['峰', '岭', '云', '雾'], ['江', '河', '湖', '海'], ['谷', '崖', '壁', '石']],
    },
    {
      name: '花鸟',
      gradients: [
        'linear-gradient(135deg, #FCE4EC 0%, #F8BBD9 50%, #F06292 100%)',
        'linear-gradient(135deg, #F1F8E9 0%, #DCEDC8 50%, #9CCC65 100%)',
        'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 50%, #FFB74D 100%)',
        'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 50%, #4DD0E1 100%)',
        'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 50%, #AB47BC 100%)',
        'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 50%, #FFD54F 100%)',
        'linear-gradient(135deg, #ECEFF1 0%, #CFD8DC 50%, #90A4AE 100%)',
        'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 50%, #81C784 100%)',
      ],
      tags: [['花', '鸟', '蝶', '春'], ['梅', '兰', '竹', '菊'], ['桃', '杏', '梨', '荷'], ['莺', '燕', '雁', '雀']],
    },
    {
      name: '月色',
      gradients: [
        'linear-gradient(180deg, #1A237E 0%, #3949AB 50%, #7986CB 100%)',
        'linear-gradient(180deg, #0D47A1 0%, #1976D2 50%, #64B5F6 100%)',
        'linear-gradient(180deg, #263238 0%, #455A64 50%, #90A4AE 100%)',
        'linear-gradient(135deg, #1A237E 0%, #283593 30%, #5C6BC0 70%, #C5CAE9 100%)',
        'linear-gradient(180deg, #212121 0%, #424242 50%, #757575 100%)',
        'linear-gradient(135deg, #0D47A1 0%, #1565C0 40%, #42A5F5 80%, #BBDEFB 100%)',
        'linear-gradient(180deg, #263238 0%, #37474F 50%, #78909C 100%)',
        'linear-gradient(135deg, #1A237E 0%, #303F9F 50%, #7986CB 100%)',
      ],
      tags: [['月', '明月', '月光', '霜'], ['夜', '星', '空', '银'], ['寒', '冷', '清', '静'], ['圆', '光', '辉', '影']],
    },
    {
      name: '江雪',
      gradients: [
        'linear-gradient(180deg, #ECEFF1 0%, #B0BEC5 50%, #78909C 100%)',
        'linear-gradient(180deg, #F5F5F5 0%, #EEEEEE 50%, #BDBDBD 100%)',
        'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 50%, #90CAF9 100%)',
        'linear-gradient(180deg, #ECEFF1 0%, #CFD8DC 50%, #90A4AE 100%)',
        'linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 50%, #9E9E9E 100%)',
        'linear-gradient(180deg, #E3F2FD 0%, #90CAF9 50%, #42A5F5 100%)',
        'linear-gradient(135deg, #ECEFF1 0%, #B0BEC5 50%, #607D8B 100%)',
        'linear-gradient(180deg, #F5F5F5 0%, #E0E0E0 50%, #BDBDBD 100%)',
      ],
      tags: [['雪', '冰', '寒', '冷'], ['江', '河', '湖', '舟'], ['白', '银', '素', '洁'], ['冬', '凛', '冽', '冻']],
    },
    {
      name: '边塞',
      gradients: [
        'linear-gradient(180deg, #E65100 0%, #FB8C00 50%, #FFB74D 100%)',
        'linear-gradient(180deg, #BF360C 0%, #E64A19 50%, #FF8A65 100%)',
        'linear-gradient(135deg, #FFE0B2 0%, #FFCC80 50%, #FF9800 100%)',
        'linear-gradient(180deg, #3E2723 0%, #5D4037 50%, #8D6E63 100%)',
        'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 50%, #FFB74D 100%)',
        'linear-gradient(180deg, #E65100 0%, #F57C00 50%, #FFB74D 100%)',
        'linear-gradient(135deg, #4E342E 0%, #6D4C41 50%, #A1887F 100%)',
        'linear-gradient(180deg, #BF360C 0%, #F4511E 50%, #FFAB91 100%)',
      ],
      tags: [['边塞', '关', '城', '沙'], ['征', '战', '军', '马'], ['风', '烟', '尘', '火'], ['漠', '戈', '壁', '荒']],
    },
    {
      name: '田园',
      gradients: [
        'linear-gradient(180deg, #81C784 0%, #4CAF50 50%, #2E7D32 100%)',
        'linear-gradient(135deg, #F1F8E9 0%, #C5E1A5 50%, #7CB342 100%)',
        'linear-gradient(180deg, #FFF9C4 0%, #FFF59D 50%, #FDD835 100%)',
        'linear-gradient(135deg, #E8F5E9 0%, #A5D6A7 50%, #43A047 100%)',
        'linear-gradient(180deg, #FFE0B2 0%, #FFCC80 50%, #FF9800 100%)',
        'linear-gradient(135deg, #F1F8E9 0%, #DCEDC8 50%, #9CCC65 100%)',
        'linear-gradient(180deg, #8BC34A 0%, #689F38 50%, #33691E 100%)',
        'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 50%, #FFC107 100%)',
      ],
      tags: [['田', '园', '农', '耕'], ['禾', '苗', '麦', '稻'], ['村', '舍', '家', '归'], ['春', '夏', '秋', '冬']],
    },
  ];

  let idCounter = 1;
  for (const category of categories) {
    for (let i = 0; i < 8; i++) {
      const gradient = category.gradients[i % category.gradients.length];
      const tagSet = category.tags[i % category.tags.length];
      const colorStops = gradient.match(/#[A-Fa-f0-9]{6}/g) || ['#87CEEB', '#2E8B57'];
      
      let svgContent = '';
      
      if (category.name === '山水') {
        svgContent = `
          <defs>
            <linearGradient id="g${idCounter}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:${colorStops[0]};stop-opacity:1" />
              <stop offset="50%" style="stop-color:${colorStops[1] || colorStops[0]};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${colorStops[2] || colorStops[0]};stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#g${idCounter})"/>
          <path d="M0,${300 + i * 20} Q${100 + i * 30},${200 - i * 10} ${200 + i * 20},${250 + i * 15} T${500},${280 + i * 10} L500,300 L0,300 Z" fill="${colorStops[2] || colorStops[0]}" opacity="0.6"/>
          <path d="M0,${320 + i * 15} Q${150 + i * 20},${220 + i * 5} ${300 + i * 25},${280 + i * 10} T${500},${300 + i * 5} L500,300 L0,300 Z" fill="${colorStops[1] || colorStops[0]}" opacity="0.5"/>
          <ellipse cx="${350 + i * 10}" cy="${100 + i * 5}" rx="${40 + i * 5}" ry="${20 + i * 3}" fill="white" opacity="0.3"/>
        `;
      } else if (category.name === '花鸟') {
        svgContent = `
          <defs>
            <linearGradient id="g${idCounter}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${colorStops[0]};stop-opacity:1" />
              <stop offset="50%" style="stop-color:${colorStops[1] || colorStops[0]};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${colorStops[2] || colorStops[0]};stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#g${idCounter})"/>
          <circle cx="${100 + i * 40}" cy="${150 + i * 20}" r="${15 + i * 3}" fill="${colorStops[1] || colorStops[0]}" opacity="0.8"/>
          <circle cx="${200 + i * 30}" cy="${100 + i * 15}" r="${12 + i * 2}" fill="${colorStops[2] || colorStops[0]}" opacity="0.7"/>
          <circle cx="${300 + i * 35}" cy="${180 + i * 10}" r="${18 + i * 2}" fill="${colorStops[1] || colorStops[0]}" opacity="0.9"/>
          <circle cx="${400 + i * 20}" cy="${120 + i * 25}" r="${10 + i * 2}" fill="${colorStops[2] || colorStops[0]}" opacity="0.8"/>
          <path d="M${50 + i * 60},${250} Q${80 + i * 60},${220} ${100 + i * 60},${250}" stroke="#333" stroke-width="2" fill="none"/>
        `;
      } else if (category.name === '月色') {
        svgContent = `
          <defs>
            <linearGradient id="g${idCounter}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:${colorStops[0]};stop-opacity:1" />
              <stop offset="50%" style="stop-color:${colorStops[1] || colorStops[0]};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${colorStops[2] || colorStops[0]};stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#g${idCounter})"/>
          <circle cx="${350 + i * 10}" cy="${80 + i * 10}" r="${50 + i * 5}" fill="#FFF9C4" opacity="0.9"/>
          <circle cx="${340 + i * 10}" cy="${70 + i * 10}" r="${45 + i * 5}" fill="${colorStops[0]}" opacity="0.3"/>
          <circle cx="${100 + i * 20}" cy="${60 + i * 15}" r="2" fill="white" opacity="0.8"/>
          <circle cx="${180 + i * 15}" cy="${100 + i * 10}" r="1.5" fill="white" opacity="0.7"/>
          <circle cx="${250 + i * 25}" cy="${50 + i * 20}" r="2" fill="white" opacity="0.9"/>
          <circle cx="${450 + i * 10}" cy="${150 + i * 15}" r="1.5" fill="white" opacity="0.6"/>
        `;
      } else if (category.name === '江雪') {
        svgContent = `
          <defs>
            <linearGradient id="g${idCounter}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:${colorStops[0]};stop-opacity:1" />
              <stop offset="50%" style="stop-color:${colorStops[1] || colorStops[0]};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${colorStops[2] || colorStops[0]};stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#g${idCounter})"/>
          <path d="M0,${200 + i * 15} L${100 + i * 20},${150 + i * 10} L${200 + i * 15},${200 + i * 15} L${300 + i * 25},${160 + i * 10} L${400 + i * 20},${210 + i * 15} L${500},${180 + i * 10} L500,300 L0,300 Z" fill="white" opacity="0.9"/>
          <path d="M${150 + i * 30},${220 + i * 10} Q${200 + i * 30},${200 + i * 5} ${250 + i * 30},${220 + i * 10}" stroke="#333" stroke-width="2" fill="none"/>
          <rect x="${180 + i * 30}" y="${205 + i * 10}" width="40" height="${20 + i * 3}" fill="${colorStops[2] || colorStops[0]}" opacity="0.5"/>
          <circle cx="${80 + i * 40}" cy="${80 + i * 20}" r="3" fill="white" opacity="0.8"/>
          <circle cx="${150 + i * 35}" cy="${100 + i * 15}" r="2" fill="white" opacity="0.7"/>
          <circle cx="${300 + i * 25}" cy="${60 + i * 25}" r="3" fill="white" opacity="0.9"/>
        `;
      } else if (category.name === '边塞') {
        svgContent = `
          <defs>
            <linearGradient id="g${idCounter}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:${colorStops[0]};stop-opacity:1" />
              <stop offset="50%" style="stop-color:${colorStops[1] || colorStops[0]};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${colorStops[2] || colorStops[0]};stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#g${idCounter})"/>
          <rect x="${100 + i * 50}" y="${180 + i * 10}" width="${80 + i * 10}" height="${100 + i * 10}" fill="${colorStops[2] || colorStops[0]}" opacity="0.7"/>
          <rect x="${250 + i * 30}" y="${200 + i * 15}" width="${60 + i * 15}" height="${80 + i * 10}" fill="${colorStops[1] || colorStops[0]}" opacity="0.6"/>
          <path d="M0,${280} Q${200},${250 + i * 10} ${400},${270 + i * 5} T${500},${280} L500,300 L0,300 Z" fill="${colorStops[2] || colorStops[0]}" opacity="0.8"/>
          <rect x="${120 + i * 50}" y="${150 + i * 10}" width="${40 + i * 5}" height="${30 + i * 5}" fill="${colorStops[2] || colorStops[0]}" opacity="0.9"/>
        `;
      } else {
        svgContent = `
          <defs>
            <linearGradient id="g${idCounter}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:${colorStops[0]};stop-opacity:1" />
              <stop offset="50%" style="stop-color:${colorStops[1] || colorStops[0]};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${colorStops[2] || colorStops[0]};stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#g${idCounter})"/>
          <path d="M0,${260} Q${150},${240 + i * 10} ${300},${250 + i * 5} T${500},${260} L500,300 L0,300 Z" fill="${colorStops[1] || colorStops[0]}" opacity="0.7"/>
          <rect x="${50 + i * 40}" y="${220 + i * 10}" width="${30 + i * 5}" height="${40 + i * 5}" fill="${colorStops[2] || colorStops[0]}" opacity="0.8"/>
          <rect x="${150 + i * 35}" y="${210 + i * 15}" width="${25 + i * 3}" height="${50 + i * 5}" fill="${colorStops[2] || colorStops[0]}" opacity="0.7"/>
          <rect x="${280 + i * 30}" y="${230 + i * 10}" width="${35 + i * 4}" height="${30 + i * 5}" fill="${colorStops[1] || colorStops[0]}" opacity="0.8"/>
          <rect x="${380 + i * 25}" y="${215 + i * 15}" width="${28 + i * 3}" height="${45 + i * 5}" fill="${colorStops[2] || colorStops[0]}" opacity="0.7"/>
          <ellipse cx="${100 + i * 30}" cy="${120 + i * 10}" rx="${30 + i * 5}" ry="${15 + i * 3}" fill="white" opacity="0.4"/>
        `;
      }
      
      images.push({
        id: `img_${idCounter}`,
        category: category.name,
        base64: createSvgImage(svgContent, 500, 300),
        gradient: category.gradients[i % category.gradients.length],
        tags: tagSet,
      });
      
      idCounter++;
    }
  }
  
  return images;
};

const presetImages = generatePresetImages();

const categoryKeywordMap: Record<string, string[]> = {
  '山水': ['山', '水', '江', '河', '湖', '海', '峰', '岭', '云', '雾', '谷', '崖', '瀑布', '溪'],
  '花鸟': ['花', '鸟', '蝶', '春', '梅', '兰', '竹', '菊', '桃', '杏', '梨', '荷', '莺', '燕'],
  '月色': ['月', '明月', '月光', '霜', '夜', '星', '空', '银', '寒', '冷', '清', '静', '圆', '光'],
  '江雪': ['雪', '冰', '寒', '冷', '江', '河', '湖', '舟', '白', '银', '素', '洁', '冬', '冻'],
  '边塞': ['边塞', '关', '城', '沙', '征', '战', '军', '马', '风', '烟', '尘', '火', '漠', '戈'],
  '田园': ['田', '园', '农', '耕', '禾', '苗', '麦', '稻', '村', '舍', '家', '归', '春', '夏', '秋'],
};

const extractKeywords = (text: string): string[] => {
  const keywords: string[] = [];
  for (const categoryKeywords of Object.values(categoryKeywordMap)) {
    for (const kw of categoryKeywords) {
      if (text.includes(kw)) {
        keywords.push(kw);
      }
    }
  }
  return keywords;
};

const calculateCategoryMatch = (keywords: string[], poemStyles: string[]): Record<string, number> => {
  const scores: Record<string, number> = {};
  
  for (const [category, categoryKeywords] of Object.entries(categoryKeywordMap)) {
    let score = 0;
    for (const kw of keywords) {
      if (categoryKeywords.includes(kw)) {
        score += 2;
      }
    }
    if (poemStyles.includes(category)) {
      score += 3;
    }
    scores[category] = score;
  }
  
  return scores;
};

const getBestMatchingCategory = (scores: Record<string, number>): string | null => {
  let bestCategory: string | null = null;
  let maxScore = 0;
  
  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }
  
  return bestCategory;
};

const getRandomImage = (category?: string): PresetImage => {
  let candidates = presetImages;
  if (category) {
    candidates = presetImages.filter(img => img.category === category);
    if (candidates.length === 0) {
      candidates = presetImages;
    }
  }
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
};

const getBestMatchingImage = (keywords: string[], category: string): PresetImage => {
  const categoryImages = presetImages.filter(img => img.category === category);
  if (categoryImages.length === 0) {
    return getRandomImage();
  }
  
  let bestImage = categoryImages[0];
  let maxMatchCount = 0;
  
  for (const img of categoryImages) {
    let matchCount = 0;
    for (const kw of keywords) {
      if (img.tags.includes(kw)) {
        matchCount++;
      }
    }
    if (matchCount > maxMatchCount) {
      maxMatchCount = matchCount;
      bestImage = img;
    }
  }
  
  if (maxMatchCount === 0) {
    const randomIndex = Math.floor(Math.random() * categoryImages.length);
    bestImage = categoryImages[randomIndex];
  }
  
  return bestImage;
};

export const matchImage = (poemText: string, poemKeywords: string[], poemStyles: string[]): ImageMatchResult => {
  const allText = poemText + ' ' + poemKeywords.join(' ');
  const keywords = extractKeywords(allText);
  
  const categoryScores = calculateCategoryMatch(keywords, poemStyles);
  const bestCategory = getBestMatchingCategory(categoryScores);
  
  let matchedImage: PresetImage;
  if (bestCategory) {
    matchedImage = getBestMatchingImage(keywords, bestCategory);
  } else {
    matchedImage = getRandomImage();
  }
  
  const watermarkText = poemKeywords.length > 0 ? poemKeywords[0] : poemText.slice(0, 7);
  
  return {
    imageUrl: matchedImage.base64,
    category: matchedImage.category,
    gradient: matchedImage.gradient,
    watermarkText,
  };
};

export const matchThumbnail = (poemText: string, poemKeywords: string[], poemStyles: string[]): ImageMatchResult => {
  return matchImage(poemText, poemKeywords, poemStyles);
};
