export interface SampleArtifact {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

const generateSvgDataUrl = (color: string, label: string): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="${color}" rx="4"/>
      <text x="100" y="90" text-anchor="middle" fill="#FFFFFF" font-family="DengXian, Microsoft YaHei, sans-serif" font-size="16" font-weight="bold">${label}</text>
      <text x="100" y="120" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="DengXian, Microsoft YaHei, sans-serif" font-size="12">文物图像</text>
      <rect x="30" y="140" width="140" height="40" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1" rx="2"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

export const sampleArtifacts: SampleArtifact[] = [
  {
    id: 'artifact-1',
    name: '青铜方鼎',
    description: '商代晚期青铜礼器，鼎身饰有精美的饕餮纹，是古代祭祀活动中的重要器物。',
    imageUrl: generateSvgDataUrl('#8B6914', '青铜方鼎'),
  },
  {
    id: 'artifact-2',
    name: '玉璧',
    description: '新石器时代良渚文化玉璧，玉质温润，刻有神秘的神人兽面纹。',
    imageUrl: generateSvgDataUrl('#6B8E23', '玉璧'),
  },
  {
    id: 'artifact-3',
    name: '唐三彩骆驼',
    description: '唐代三彩釉陶器，骆驼造型生动，釉色艳丽，展现盛唐气象。',
    imageUrl: generateSvgDataUrl('#CD853F', '唐三彩'),
  },
  {
    id: 'artifact-4',
    name: '青花瓷瓶',
    description: '明代永乐年间青花瓷，瓶身绘缠枝莲纹，青花发色纯正典雅。',
    imageUrl: generateSvgDataUrl('#4169E1', '青花瓷'),
  },
  {
    id: 'artifact-5',
    name: '金缕玉衣',
    description: '汉代皇室墓葬殓服，由数千片玉片和金线编缀而成，工艺精湛。',
    imageUrl: generateSvgDataUrl('#DAA520', '金缕玉衣'),
  },
  {
    id: 'artifact-6',
    name: '敦煌壁画',
    description: '唐代敦煌莫高窟壁画残片，描绘飞天形象，色彩历经千年依然绚丽。',
    imageUrl: generateSvgDataUrl('#B22222', '敦煌壁画'),
  },
];
