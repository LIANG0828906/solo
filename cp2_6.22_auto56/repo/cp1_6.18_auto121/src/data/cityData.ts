export type Decade = '1980s' | '1990s' | '2000s';

export interface DecadeData {
  decade: Decade;
  color: string;
  label: string;
  clues: string[];
  audioPath: string;
  fragments: { label: string; description: string }[];
}

const decadeDatabase: Record<Decade, DecadeData> = {
  '1980s': {
    decade: '1980s',
    color: '#F4A261',
    label: '1980年代',
    clues: [
      '这个年代流行复古卷发和喇叭裤',
      '自行车是主要代步工具，叮叮铃声满街响',
      '胡同里传来冰糖葫芦的叫卖声',
    ],
    audioPath: '/audio/1980s.mp3',
    fragments: [
      { label: '二八自行车', description: '满街穿梭的黑色凤凰牌' },
      { label: '老胡同', description: '灰瓦青砖的四合院' },
      { label: '冰糖葫芦', description: '酸甜可口的红色记忆' },
    ],
  },
  '1990s': {
    decade: '1990s',
    color: '#E76F51',
    label: '1990年代',
    clues: [
      '第一条地铁线路开通，城市步入轨道交通时代',
      'BP机和大哥大开始出现在街头',
      '老式电车叮叮当当穿过繁华商业街',
    ],
    audioPath: '/audio/1990s.mp3',
    fragments: [
      { label: '老式电车', description: '拖着长辫子的公共汽车' },
      { label: '地铁一号线', description: '城市首条地下长龙' },
      { label: 'BP机', description: '滴滴声唤起的联络时代' },
    ],
  },
  '2000s': {
    decade: '2000s',
    color: '#2A9D8F',
    label: '2000年代',
    clues: [
      '互联网开始普及，网吧遍地开花',
      '摩天大楼拔地而起，城市天际线日新月异',
      '手机短信成为最流行的联系方式',
    ],
    audioPath: '/audio/2000s.mp3',
    fragments: [
      { label: '摩天大楼', description: '玻璃幕墙映照蓝天' },
      { label: '网吧时代', description: '拨号上网的青涩记忆' },
      { label: '功能手机', description: '按键敲击出的青春' },
    ],
  },
};

export function getDecadeData(decade: Decade): DecadeData {
  return decadeDatabase[decade];
}

export function getClueList(decade: Decade): string[] {
  return decadeDatabase[decade].clues;
}

export function getAllDecades(): Decade[] {
  return ['1980s', '1990s', '2000s'];
}

export function getDecadeColor(decade: Decade): string {
  return decadeDatabase[decade].color;
}
