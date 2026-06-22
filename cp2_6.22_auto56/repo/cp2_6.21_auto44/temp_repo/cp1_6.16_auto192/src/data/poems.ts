export interface Poem {
  id: string;
  poet: string;
  title: string;
  content: string;
}

export const poems: Poem[] = [
  {
    id: '1',
    poet: '李白',
    title: '静夜思',
    content: '床前明月光，疑是地上霜。\n举头望明月，低头思故乡。'
  },
  {
    id: '2',
    poet: '李白',
    title: '望庐山瀑布',
    content: '日照香炉生紫烟，遥看瀑布挂前川。\n飞流直下三千尺，疑是银河落九天。'
  },
  {
    id: '3',
    poet: '杜甫',
    title: '春望',
    content: '国破山河在，城春草木深。\n感时花溅泪，恨别鸟惊心。\n烽火连三月，家书抵万金。\n白头搔更短，浑欲不胜簪。'
  },
  {
    id: '4',
    poet: '杜甫',
    title: '登高',
    content: '风急天高猿啸哀，渚清沙白鸟飞回。\n无边落木萧萧下，不尽长江滚滚来。\n万里悲秋常作客，百年多病独登台。\n艰难苦恨繁霜鬓，潦倒新停浊酒杯。'
  },
  {
    id: '5',
    poet: '王维',
    title: '山居秋暝',
    content: '空山新雨后，天气晚来秋。\n明月松间照，清泉石上流。\n竹喧归浣女，莲动下渔舟。\n随意春芳歇，王孙自可留。'
  },
  {
    id: '6',
    poet: '王维',
    title: '相思',
    content: '红豆生南国，春来发几枝。\n愿君多采撷，此物最相思。'
  },
  {
    id: '7',
    poet: '白居易',
    title: '赋得古原草送别',
    content: '离离原上草，一岁一枯荣。\n野火烧不尽，春风吹又生。\n远芳侵古道，晴翠接荒城。\n又送王孙去，萋萋满别情。'
  },
  {
    id: '8',
    poet: '白居易',
    title: '钱塘湖春行',
    content: '孤山寺北贾亭西，水面初平云脚低。\n几处早莺争暖树，谁家新燕啄春泥。\n乱花渐欲迷人眼，浅草才能没马蹄。\n最爱湖东行不足，绿杨阴里白沙堤。'
  },
  {
    id: '9',
    poet: '苏轼',
    title: '水调歌头·明月几时有',
    content: '明月几时有？把酒问青天。\n不知天上宫阙，今夕是何年。\n我欲乘风归去，又恐琼楼玉宇，高处不胜寒。\n起舞弄清影，何似在人间。\n转朱阁，低绮户，照无眠。\n不应有恨，何事长向别时圆？\n人有悲欢离合，月有阴晴圆缺，此事古难全。\n但愿人长久，千里共婵娟。'
  },
  {
    id: '10',
    poet: '苏轼',
    title: '念奴娇·赤壁怀古',
    content: '大江东去，浪淘尽，千古风流人物。\n故垒西边，人道是，三国周郎赤壁。\n乱石穿空，惊涛拍岸，卷起千堆雪。\n江山如画，一时多少豪杰。\n遥想公瑾当年，小乔初嫁了，雄姿英发。\n羽扇纶巾，谈笑间，樯橹灰飞烟灭。\n故国神游，多情应笑我，早生华发。\n人生如梦，一尊还酹江月。'
  }
];

export const getPoemByIndex = (index: number): Poem | undefined => {
  return poems[index];
};

export const getPoemById = (id: string): Poem | undefined => {
  return poems.find(poem => poem.id === id);
};
