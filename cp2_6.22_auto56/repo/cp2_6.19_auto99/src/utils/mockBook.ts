const sampleTexts = [
  '那是最好的时代，那是最坏的时代，那是智慧的时代，那是愚蠢的时代，那是信仰的时期，那是怀疑的时期，那是光明的季节，那是黑暗的季节，那是希望的春天，那是失望的冬天。',
  '我们面前有一切，我们面前什么也没有，我们全都在直奔天堂，我们全都在直奔相反的方向——简而言之，那个时代跟现在这个时代非常相像，某些最喧嚣的权威坚持要用形容词的最高级来形容它。',
  '说它好，是最高级的；说它不好，也是最高级的。',
  '那是一个晴朗的下午，阳光透过窗户洒在书桌上，照在摊开的书页上，形成一片金黄的光斑。',
  '主人公独自坐在窗前，手里端着一杯热茶，思绪随着茶香飘散到了远方。',
  '他想起了童年的时光，那时的天空总是那么蓝，云总是那么白。',
  '记忆中的院子里有一棵老槐树，每到春天就开满了白色的花朵，香气四溢。',
  '奶奶总是坐在树下的竹椅上，摇着蒲扇，给他讲那些古老的故事。',
  '那些故事里有神仙，有妖怪，有英雄，也有平凡人的悲欢离合。',
  '他总是听得入迷，忘记了时间，忘记了玩耍，直到奶奶轻轻拍着他的肩膀说该吃饭了。',
  '后来，他长大了，离开了家乡，去了远方的城市读书。',
  '城市里没有老槐树，没有奶奶的蒲扇，也没有那些古老的故事。',
  '只有高楼大厦，车水马龙，和无尽的喧嚣。',
  '他常常在深夜里醒来，想起那棵老槐树，想起奶奶，想起那些故事。',
  '他知道，那些日子已经一去不复返了。',
  '但那些记忆，却永远刻在了他的心里，永不褪色。',
  '有一天，他收到了一封信，是家乡来的信。',
  '信上说，老槐树还在，奶奶也还在，只是院子已经长满了杂草。',
  '他放下信，收拾行囊，踏上了归途。',
  '火车隆隆地响着，载着他驶向那个熟悉又陌生的地方。',
];

export const generateBookParagraphs = (count: number = 500): string[] => {
  const paragraphs: string[] = [];
  for (let i = 0; i < count; i++) {
    const baseText = sampleTexts[i % sampleTexts.length];
    const variation = Math.floor(i / sampleTexts.length);
    if (variation === 0) {
      paragraphs.push(`第${i + 1}章：${baseText}`);
    } else {
      paragraphs.push(`第${i + 1}段：${baseText}（续${variation}）`);
    }
  }
  return paragraphs;
};

export const bookParagraphs = generateBookParagraphs(500);

export const USER_COLORS = [
  '#ef9a9a',
  '#90caf9',
  '#a5d6a7',
  '#fff59d',
  '#ce93d8',
  '#80cbc4',
];

export const getRandomColor = (): string => {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
};
