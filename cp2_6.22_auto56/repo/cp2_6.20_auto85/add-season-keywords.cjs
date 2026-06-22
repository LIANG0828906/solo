const fs = require('fs');
const path = 'src/data/regionData.ts';
let content = fs.readFileSync(path, 'utf-8');

const map = {
  lichun: { season: 'spring', keywords: ['春耕', '迎春'] },
  yushui: { season: 'spring', keywords: ['播种', '润物'] },
  jingzhe: { season: 'spring', keywords: ['春播', '虫醒'] },
  chunfen: { season: 'spring', keywords: ['踏青', '均衡'] },
  qingming: { season: 'spring', keywords: ['采茶', '祭祖'] },
  guyu: { season: 'spring', keywords: ['播种', '采茶'] },
  lixia: { season: 'summer', keywords: ['夏收', '插秧'] },
  xiaoman: { season: 'summer', keywords: ['麦黄', '蚕桑'] },
  mangzhong: { season: 'summer', keywords: ['收麦', '插秧'] },
  xiazhi: { season: 'summer', keywords: ['最长日', '夏种'] },
  xiaoshu: { season: 'summer', keywords: ['伏天', '防暑'] },
  dashu: { season: 'summer', keywords: ['酷暑', '伏天'] },
  liqiu: { season: 'autumn', keywords: ['秋收', '贴秋膘'] },
  chushu: { season: 'autumn', keywords: ['消暑', '秋灌'] },
  bailu: { season: 'autumn', keywords: ['秋收', '凝露'] },
  qiufen: { season: 'autumn', keywords: ['收获', '均衡'] },
  hanlu: { season: 'autumn', keywords: ['秋种', '凉意'] },
  shuangjiang: { season: 'autumn', keywords: ['霜冻', '晚秋'] },
  lidong: { season: 'winter', keywords: ['冬藏', '防寒'] },
  xiaoxue: { season: 'winter', keywords: ['初雪', '腌菜'] },
  daxue: { season: 'winter', keywords: ['大雪', '保暖'] },
  dongzhi: { season: 'winter', keywords: ['数九', '饺子'] },
  xiaohan: { season: 'winter', keywords: ['严寒', '腊八'] },
  dahan: { season: 'winter', keywords: ['最冷', '岁末'] },
};

for (const [id, data] of Object.entries(map)) {
  const regex = new RegExp(`(id: '${id}',[\\s\\S]*?regions: \\[[^\\]]*\\]),\\s*\\}`,);
  const replacement = `$1,\n    season: '${data.season}',\n    keywords: ${JSON.stringify(data.keywords)},\n  }`;
  content = content.replace(regex, replacement);
}

fs.writeFileSync(path, content, 'utf-8');
console.log('Done!');
