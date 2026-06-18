export interface MythInfo {
  name: string;
  meaning: string;
  summary: string;
  color: string;
}

const mythDatabase: MythInfo[] = [
  {
    name: '天鹅座',
    meaning: '忠诚',
    summary: '宙斯化身天鹅亲近斯巴达王后勒达，天鹅之翼象征跨越身份的深情，在银河中永恒展翅，守护不渝的忠诚与真挚的爱。',
    color: '#5B8CDB',
  },
  {
    name: '武仙座',
    meaning: '勇气',
    summary: '赫拉克勒斯十二试炼铸就不朽英名，从扼杀猛狮到擒获地狱三头犬，每道伤痕皆为勇气的勋章，永耀星空。',
    color: '#E07040',
  },
  {
    name: '仙女座',
    meaning: '美丽',
    summary: '公主安德洛墨达因绝世容颜被锁海岸，珀尔修斯策马从天而降斩海怪救佳人，她的美成为星穹最柔的注脚。',
    color: '#C878DB',
  },
  {
    name: '天琴座',
    meaning: '才华',
    summary: '俄耳甫斯琴声能令顽石落泪、河水驻足，为寻亡妻只身入冥府，其琴弦化为星座，奏响永恒的艺术之音。',
    color: '#6EC8A0',
  },
  {
    name: '猎户座',
    meaning: '力量',
    summary: '猎人俄里翁手持棍棒追逐昴宿星团，脚踏大海搏击巨浪，其雄壮身姿被众神升上星空，成为冬夜最亮标志。',
    color: '#D4A840',
  },
  {
    name: '双子座',
    meaning: '友爱',
    summary: '卡斯托尔与波吕丢刻斯一凡一神，兄亡弟求宙斯共享不朽，双子从此永不分离，象征世间最深的兄弟情谊。',
    color: '#40B8D4',
  },
  {
    name: '天蝎座',
    meaning: '守护',
    summary: '女神赫拉遣巨蝎遏制猎人俄里翁的傲慢，毒尾一击令不可一世者陨落，蝎子升上星空成为正义的永恒守护。',
    color: '#D44060',
  },
  {
    name: '天鹰座',
    meaning: '自由',
    summary: '宙斯之鹰曾衔走美少年甘尼米德至奥林匹斯，雄鹰展翅千里不羁，象征冲破桎梏、翱翔天际的自由精神。',
    color: '#8B70D4',
  },
  {
    name: '飞马座',
    meaning: '灵感',
    summary: '珀尔修斯斩美杜莎时飞马珀伽索斯自血泊中腾空，蹄踏处涌出灵感之泉，成为诗人与创造者永恒的灵感源泉。',
    color: '#D4D440',
  },
  {
    name: '南十字座',
    meaning: '指引',
    summary: '南半球航海者以十字定方向，四颗明灯指引归途，象征在黑暗中永不迷失的希望之光和坚定信念。',
    color: '#40D4A0',
  },
];

export function matchMyth(
  starCount: number,
  edgeCount: number,
  symmetryScore: number
): MythInfo {
  let bestIndex = 0;
  let bestFit = Infinity;

  mythDatabase.forEach((myth, index) => {
    let fit = 0;
    if (symmetryScore < 0.2 && edgeCount > 5) {
      fit = index === 2 ? 0 : 3;
    } else if (symmetryScore < 0.3 && starCount >= 6) {
      fit = index === 3 ? 0 : 2.5;
    } else if (starCount <= 4) {
      fit = index === 8 ? 0 : 2;
    } else if (edgeCount <= 3) {
      fit = index === 6 ? 0 : 2;
    } else if (starCount > 8) {
      fit = index === 4 ? 0 : 1.5;
    } else {
      fit = Math.abs(index - (starCount % mythDatabase.length));
    }
    if (fit < bestFit) {
      bestFit = fit;
      bestIndex = index;
    }
  });

  return mythDatabase[bestIndex];
}

export function getAllMyths(): MythInfo[] {
  return mythDatabase;
}
