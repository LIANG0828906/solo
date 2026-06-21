export interface Star {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  magnitude: number;
  brightness: number;
}

export interface Constellation {
  id: string;
  name: string;
  latinName: string;
  brightStars: number;
  myth: string;
  stars: Star[];
  connections: [number, number][];
}

export const constellations: Constellation[] = [
  {
    id: 'aries',
    name: '白羊座',
    latinName: 'Aries',
    brightStars: 4,
    myth: '白羊座的神话源自金羊毛的故事。佛里克索斯和赫勒被继母陷害，宙斯派遣一只金毛公羊前去营救他们。公羊驮着两兄妹飞越海峡时，赫勒不幸坠入海中，而佛里克索斯则安全抵达科尔喀斯。为了感谢宙斯，佛里克索斯将金羊毛献祭给宙斯，这只公羊便被升上天空成为白羊座。',
    stars: [
      { id: 'ari-1', name: '娄宿三', x: -2.5, y: 1.2, z: 0.5, magnitude: 2.0, brightness: 0.9 },
      { id: 'ari-2', name: '娄宿一', x: -1.0, y: 1.8, z: 0.3, magnitude: 2.6, brightness: 0.7 },
      { id: 'ari-3', name: '娄宿二', x: 0.8, y: 1.0, z: 0.2, magnitude: 3.6, brightness: 0.5 },
      { id: 'ari-4', name: '昴宿增十二', x: -1.8, y: -0.5, z: 0.4, magnitude: 4.5, brightness: 0.4 },
      { id: 'ari-5', name: '胃宿一', x: 1.2, y: -0.3, z: 0.1, magnitude: 5.2, brightness: 0.3 },
    ],
    connections: [[0, 1], [1, 2], [2, 4], [4, 3], [3, 0]],
  },
  {
    id: 'taurus',
    name: '金牛座',
    latinName: 'Taurus',
    brightStars: 5,
    myth: '金牛座代表宙斯化身的白牛。宙斯为了接近腓尼基公主欧罗巴，变成一头雪白的公牛混进她父亲的牛群。欧罗巴被公牛的美丽吸引，骑上牛背，宙斯便带着她横渡大海来到克里特岛。后来宙斯将这头牛的形象升上天空，成为金牛座。',
    stars: [
      { id: 'tau-1', name: '毕宿五', x: -0.5, y: 2.5, z: 0.8, magnitude: 0.85, brightness: 1.0 },
      { id: 'tau-2', name: '五车五', x: -2.0, y: 1.5, z: 0.6, magnitude: 1.65, brightness: 0.9 },
      { id: 'tau-3', name: '毕宿一', x: -1.8, y: 0.8, z: 0.4, magnitude: 3.7, brightness: 0.5 },
      { id: 'tau-4', name: '毕宿三', x: 0.2, y: 1.2, z: 0.3, magnitude: 4.3, brightness: 0.4 },
      { id: 'tau-5', name: '毕宿四', x: 1.5, y: 0.5, z: 0.2, magnitude: 3.0, brightness: 0.6 },
      { id: 'tau-6', name: '昴宿六', x: -3.0, y: -0.8, z: 0.7, magnitude: 2.8, brightness: 0.7 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [1, 5]],
  },
  {
    id: 'gemini',
    name: '双子座',
    latinName: 'Gemini',
    brightStars: 4,
    myth: '双子座代表卡斯托耳和波吕丢刻斯这对孪生兄弟。卡斯托耳擅长马术，波吕丢刻斯精通拳击。兄弟二人感情深厚，卡斯托耳战死后，波吕丢刻斯请求宙斯让他们共享永生。宙斯深受感动，将他们一同升上天空，成为双子座，永远相伴。',
    stars: [
      { id: 'gem-1', name: '北河三', x: -1.0, y: 3.0, z: 0.6, magnitude: 1.16, brightness: 1.0 },
      { id: 'gem-2', name: '北河二', x: -1.2, y: 1.8, z: 0.5, magnitude: 1.58, brightness: 0.9 },
      { id: 'gem-3', name: '井宿三', x: 1.5, y: 2.5, z: 0.4, magnitude: 1.93, brightness: 0.8 },
      { id: 'gem-4', name: '井宿一', x: 1.2, y: 1.0, z: 0.3, magnitude: 3.0, brightness: 0.6 },
      { id: 'gem-5', name: '钺', x: 0.2, y: 0.2, z: 0.2, magnitude: 3.5, brightness: 0.5 },
    ],
    connections: [[0, 1], [1, 4], [2, 3], [3, 4], [0, 2]],
  },
  {
    id: 'cancer',
    name: '巨蟹座',
    latinName: 'Cancer',
    brightStars: 2,
    myth: '巨蟹座的故事与赫拉克勒斯的十二功绩有关。当赫拉克勒斯与九头蛇海德拉战斗时，天后赫拉派遣一只巨蟹前去干扰，试图帮助海德拉。巨蟹夹住赫拉克勒斯的脚，但被他一脚踩碎。赫拉为了嘉奖巨蟹的忠诚，将它升上天空成为巨蟹座。',
    stars: [
      { id: 'can-1', name: '柳宿增三', x: -0.8, y: 0.5, z: 0.4, magnitude: 4.0, brightness: 0.4 },
      { id: 'can-2', name: '鬼宿四', x: 0.5, y: 0.8, z: 0.3, magnitude: 3.9, brightness: 0.5 },
      { id: 'can-3', name: '鬼宿三', x: 1.5, y: 0.3, z: 0.2, magnitude: 4.7, brightness: 0.3 },
      { id: 'can-4', name: '鬼宿二', x: 1.0, y: -0.8, z: 0.3, magnitude: 5.5, brightness: 0.2 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 0]],
  },
  {
    id: 'leo',
    name: '狮子座',
    latinName: 'Leo',
    brightStars: 5,
    myth: '狮子座代表尼米亚猛狮。这头狮子拥有刀枪不入的皮毛，在尼米亚山谷为非作歹。赫拉克勒斯的第一项功绩就是制服这头猛狮。他发现普通武器无法伤害狮子，便徒手将其勒死，并剥下它的皮毛作为自己的斗篷。宙斯将这头狮子升上天空以示纪念。',
    stars: [
      { id: 'leo-1', name: '轩辕十四', x: 1.8, y: 2.2, z: 0.7, magnitude: 1.35, brightness: 1.0 },
      { id: 'leo-2', name: '轩辕十二', x: 0.5, y: 2.8, z: 0.5, magnitude: 2.2, brightness: 0.8 },
      { id: 'leo-3', name: '轩辕十三', x: -0.8, y: 1.8, z: 0.4, magnitude: 2.0, brightness: 0.9 },
      { id: 'leo-4', name: '西上相', x: -1.8, y: 1.0, z: 0.3, magnitude: 3.3, brightness: 0.6 },
      { id: 'leo-5', name: '五帝座一', x: 2.5, y: -0.5, z: 0.6, magnitude: 2.1, brightness: 0.8 },
      { id: 'leo-6', name: '太微右垣五', x: 0.8, y: -1.0, z: 0.4, magnitude: 3.4, brightness: 0.5 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [0, 5], [5, 4], [4, 0]],
  },
  {
    id: 'virgo',
    name: '处女座',
    latinName: 'Virgo',
    brightStars: 3,
    myth: '处女座通常被认为是正义女神阿斯特莱亚。在黄金时代，众神与人类和谐共处。但随着人类道德败坏，众神相继离开天庭，只有阿斯特莱亚留到最后，试图劝说人类向善。最终她也不得不离开，升上天空成为处女座，手中的天秤则成为旁边的天秤座。',
    stars: [
      { id: 'vir-1', name: '角宿一', x: 1.0, y: -2.5, z: 0.8, magnitude: 0.98, brightness: 1.0 },
      { id: 'vir-2', name: '角宿二', x: -0.5, y: -1.8, z: 0.5, magnitude: 3.4, brightness: 0.6 },
      { id: 'vir-3', name: '太微左垣一', x: -2.0, y: -0.5, z: 0.4, magnitude: 3.2, brightness: 0.6 },
      { id: 'vir-4', name: '太微左垣二', x: -1.5, y: 0.8, z: 0.3, magnitude: 4.0, brightness: 0.4 },
      { id: 'vir-5', name: '东上相', x: 0.5, y: 1.2, z: 0.2, magnitude: 3.5, brightness: 0.5 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]],
  },
  {
    id: 'libra',
    name: '天秤座',
    latinName: 'Libra',
    brightStars: 3,
    myth: '天秤座象征正义与平衡。它原本是天蝎座的一部分，后来被罗马人独立出来。天秤座代表正义女神阿斯特莱亚手中的天平，用来衡量人间的善恶是非。在希腊神话中，天秤座也与命运三女神有关，她们用天平称量灵魂的善恶。',
    stars: [
      { id: 'lib-1', name: '氐宿一', x: -1.2, y: -1.5, z: 0.5, magnitude: 2.8, brightness: 0.7 },
      { id: 'lib-2', name: '氐宿四', x: 0.5, y: -2.0, z: 0.4, magnitude: 2.6, brightness: 0.8 },
      { id: 'lib-3', name: '氐宿三', x: 1.8, y: -1.2, z: 0.3, magnitude: 3.3, brightness: 0.6 },
      { id: 'lib-4', name: '亢宿二', x: 0.8, y: -0.5, z: 0.2, magnitude: 4.5, brightness: 0.4 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2]],
  },
  {
    id: 'scorpio',
    name: '天蝎座',
    latinName: 'Scorpius',
    brightStars: 6,
    myth: '天蝎座与猎人奥利翁有关。奥利翁夸口自己能杀死世界上所有的野兽，这激怒了大地女神盖亚。盖亚派出一只巨大的蝎子去刺杀奥利翁。在战斗中，蝎子的毒刺刺中了奥利翁的脚跟，导致他死亡。宙斯为了纪念这场战斗，将蝎子和奥利翁都升上天空，但让它们永远相对，永不相见。',
    stars: [
      { id: 'sco-1', name: '心宿二', x: 0.5, y: -2.8, z: 0.9, magnitude: 1.06, brightness: 1.0 },
      { id: 'sco-2', name: '房宿四', x: -1.2, y: -2.0, z: 0.6, magnitude: 2.6, brightness: 0.8 },
      { id: 'sco-3', name: '房宿三', x: -2.0, y: -1.2, z: 0.5, magnitude: 2.3, brightness: 0.8 },
      { id: 'sco-4', name: '尾宿一', x: 2.0, y: -2.2, z: 0.7, magnitude: 2.7, brightness: 0.7 },
      { id: 'sco-5', name: '尾宿二', x: 2.8, y: -1.5, z: 0.5, magnitude: 3.0, brightness: 0.6 },
      { id: 'sco-6', name: '尾宿八', x: 3.2, y: -0.5, z: 0.4, magnitude: 2.4, brightness: 0.8 },
    ],
    connections: [[2, 1], [1, 0], [0, 3], [3, 4], [4, 5]],
  },
  {
    id: 'sagittarius',
    name: '射手座',
    latinName: 'Sagittarius',
    brightStars: 4,
    myth: '射手座代表半人马喀戎，他是希腊神话中最智慧的半人马。喀戎精通医术、音乐、弓箭和预言，是众多英雄的老师，包括阿喀琉斯、伊阿宋和赫拉克勒斯。后来喀戎被赫拉克勒斯的毒箭误伤，甘愿放弃永生代替普罗米修斯受苦。宙斯感念他的善良，将他升上天空成为射手座。',
    stars: [
      { id: 'sag-1', name: '箕宿三', x: 3.0, y: -1.8, z: 0.6, magnitude: 1.85, brightness: 0.9 },
      { id: 'sag-2', name: '斗宿六', x: 2.5, y: -2.5, z: 0.5, magnitude: 2.8, brightness: 0.7 },
      { id: 'sag-3', name: '斗宿五', x: 1.5, y: -2.8, z: 0.4, magnitude: 3.3, brightness: 0.6 },
      { id: 'sag-4', name: '斗宿四', x: 0.8, y: -1.8, z: 0.3, magnitude: 3.1, brightness: 0.6 },
      { id: 'sag-5', name: '建宿一', x: 2.0, y: -0.8, z: 0.5, magnitude: 3.7, brightness: 0.5 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]],
  },
  {
    id: 'capricornus',
    name: '摩羯座',
    latinName: 'Capricornus',
    brightStars: 3,
    myth: '摩羯座的形象是半羊半鱼的怪物。传说中，牧神潘为了躲避怪物提丰，跳入尼罗河变形。他的上半身变成了羊，下半身则变成了鱼。宙斯觉得这个形象很有趣，便将其升上天空成为摩羯座。摩羯座也与农业之神萨图恩有关，象征着丰收与克制。',
    stars: [
      { id: 'cap-1', name: '牛宿一', x: 3.5, y: -0.5, z: 0.5, magnitude: 3.0, brightness: 0.7 },
      { id: 'cap-2', name: '牛宿二', x: 2.8, y: 0.3, z: 0.4, magnitude: 3.0, brightness: 0.7 },
      { id: 'cap-3', name: '女宿一', x: 1.8, y: 0.5, z: 0.3, magnitude: 3.7, brightness: 0.5 },
      { id: 'cap-4', name: '女宿二', x: 1.0, y: -0.2, z: 0.2, magnitude: 4.4, brightness: 0.4 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 0]],
  },
  {
    id: 'aquarius',
    name: '水瓶座',
    latinName: 'Aquarius',
    brightStars: 4,
    myth: '水瓶座代表特洛伊王子伽倪墨得斯。他是世间最美的少年，宙斯化身为老鹰将他掳到奥林匹斯山，让他担任众神的侍酒童子，负责倾倒仙酒。伽倪墨得斯的形象永远定格在手持水瓶倾倒的姿态，被宙斯升上天空成为水瓶座，象征着青春与恩赐。',
    stars: [
      { id: 'aqr-1', name: '虚宿一', x: 3.0, y: 1.0, z: 0.5, magnitude: 2.9, brightness: 0.7 },
      { id: 'aqr-2', name: '危宿一', x: 2.2, y: 2.0, z: 0.4, magnitude: 3.3, brightness: 0.6 },
      { id: 'aqr-3', name: '危宿二', x: 1.0, y: 2.5, z: 0.3, magnitude: 3.8, brightness: 0.5 },
      { id: 'aqr-4', name: '室宿一', x: -0.5, y: 1.8, z: 0.4, magnitude: 2.8, brightness: 0.7 },
      { id: 'aqr-5', name: '室宿二', x: -1.0, y: 0.5, z: 0.5, magnitude: 3.0, brightness: 0.7 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]],
  },
  {
    id: 'pisces',
    name: '双鱼座',
    latinName: 'Pisces',
    brightStars: 2,
    myth: '双鱼座源自爱神阿佛洛狄忒和她的儿子厄洛斯的故事。当怪物提丰袭击众神时，母子二人跳入幼发拉底河，变成两条鱼逃脱。为了避免失散，他们用一根绳子将尾巴系在一起。后来雅典娜将这个形象升上天空，成为双鱼座，两条鱼永远以丝带相连。',
    stars: [
      { id: 'pis-1', name: '外屏七', x: 1.5, y: 1.2, z: 0.4, magnitude: 3.8, brightness: 0.5 },
      { id: 'pis-2', name: '外屏一', x: 0.5, y: 1.8, z: 0.3, magnitude: 4.6, brightness: 0.4 },
      { id: 'pis-3', name: '奎宿九', x: -1.5, y: 2.2, z: 0.5, magnitude: 4.1, brightness: 0.5 },
      { id: 'pis-4', name: '奎宿五', x: -2.5, y: 1.0, z: 0.4, magnitude: 4.4, brightness: 0.4 },
      { id: 'pis-5', name: '娄宿增一', x: -1.8, y: -0.3, z: 0.3, magnitude: 5.2, brightness: 0.3 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]],
  },
];

export const getConstellationById = (id: string): Constellation | undefined => {
  return constellations.find(c => c.id === id);
};

export const searchConstellations = (query: string): Constellation[] => {
  const lowerQuery = query.toLowerCase();
  return constellations.filter(c =>
    c.name.toLowerCase().includes(lowerQuery) ||
    c.latinName.toLowerCase().includes(lowerQuery) ||
    c.id.toLowerCase().includes(lowerQuery)
  );
};
