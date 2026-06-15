import type { MemeTemplate } from '@/types';

const createTemplateSvg = (bgColor: string, text: string, textColor: string = '#ffffff'): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${bgColor}cc;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#bg)"/>
      <text x="200" y="150" text-anchor="middle" dominant-baseline="middle" 
        font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="${textColor}">
        ${text}
      </text>
      <text x="200" y="200" text-anchor="middle" dominant-baseline="middle" 
        font-family="Arial, sans-serif" font-size="14" fill="${textColor}80">
        点击使用此模板
      </text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const memeTemplates: MemeTemplate[] = [
  {
    id: 'template-1',
    name: '黑人问号',
    thumbnail: createTemplateSvg('#ff6b6b', '？？？'),
    imageUrl: createTemplateSvg('#ff6b6b', '？？？'),
  },
  {
    id: 'template-2',
    name: '熊猫头',
    thumbnail: createTemplateSvg('#2d3436', '🐼'),
    imageUrl: createTemplateSvg('#2d3436', '🐼'),
  },
  {
    id: 'template-3',
    name: '狗头',
    thumbnail: createTemplateSvg('#fdcb6e', '🐶'),
    imageUrl: createTemplateSvg('#fdcb6e', '🐶'),
  },
  {
    id: 'template-4',
    name: '柴犬',
    thumbnail: createTemplateSvg('#e17055', '🐕'),
    imageUrl: createTemplateSvg('#e17055', '🐕'),
  },
  {
    id: 'template-5',
    name: '惊讶猫',
    thumbnail: createTemplateSvg('#a29bfe', '😱'),
    imageUrl: createTemplateSvg('#a29bfe', '😱'),
  },
  {
    id: 'template-6',
    name: '嫌弃脸',
    thumbnail: createTemplateSvg('#74b9ff', '🙄'),
    imageUrl: createTemplateSvg('#74b9ff', '🙄'),
  },
  {
    id: 'template-7',
    name: '点赞',
    thumbnail: createTemplateSvg('#00b894', '👍'),
    imageUrl: createTemplateSvg('#00b894', '👍'),
  },
  {
    id: 'template-8',
    name: '捂脸',
    thumbnail: createTemplateSvg('#e84393', '🤦'),
    imageUrl: createTemplateSvg('#e84393', '🤦'),
  },
  {
    id: 'template-9',
    name: '思考',
    thumbnail: createTemplateSvg('#6c5ce7', '🤔'),
    imageUrl: createTemplateSvg('#6c5ce7', '🤔'),
  },
  {
    id: 'template-10',
    name: '庆祝',
    thumbnail: createTemplateSvg('#00cec9', '🎉'),
    imageUrl: createTemplateSvg('#00cec9', '🎉'),
  },
  {
    id: 'template-11',
    name: '生气',
    thumbnail: createTemplateSvg('#d63031', '😤'),
    imageUrl: createTemplateSvg('#d63031', '😤'),
  },
  {
    id: 'template-12',
    name: '开心',
    thumbnail: createTemplateSvg('#fdcb6e', '😄'),
    imageUrl: createTemplateSvg('#fdcb6e', '😄'),
  },
];
