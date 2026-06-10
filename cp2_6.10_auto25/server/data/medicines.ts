export interface Medicine {
  id: string;
  name: string;
  description: string;
  color: string;
  nature: string;
  flavor: string;
  meridian: string;
  processing: '生' | '炙' | '煅';
}

export const medicines: Medicine[] = [
  {
    id: 'gancao',
    name: '甘草',
    description: '根呈圆柱形，外皮松紧不一，表面红棕色或灰棕色，具显著的纵皱纹、沟纹、皮孔及稀疏的细根痕。质坚实，断面略显纤维性，黄白色，粉性，形成层环明显，射线放射状，有的有裂隙。',
    color: '#c2a06e',
    nature: '平',
    flavor: '甘',
    meridian: '心、肺、脾、胃经',
    processing: '生'
  },
  {
    id: 'mahuang',
    name: '麻黄',
    description: '呈细长圆柱形，少分枝，直径1～2mm。表面淡绿色至黄绿色，有细纵脊线，触之微有粗糙感。节明显，节上有膜质鳞叶，裂片2（稀3），锐三角形，先端灰白色，反曲，基部联合成筒状，红棕色。',
    color: '#8ba888',
    nature: '温',
    flavor: '辛、微苦',
    meridian: '肺、膀胱经',
    processing: '生'
  },
  {
    id: 'fuzi',
    name: '附子',
    description: '呈圆锥形，顶端有凹陷的芽痕，周围有瘤状突起的支根或支根痕。表面灰黑色，被盐霜，顶端有凹陷的芽痕，周围有瘤状突起的支根或支根痕。体重，横切面灰褐色，可见充满盐霜的小空隙和多角形形成层环纹。',
    color: '#4a3728',
    nature: '大热',
    flavor: '辛、甘',
    meridian: '心、肾、脾经',
    processing: '炙'
  },
  {
    id: 'dahuang',
    name: '大黄',
    description: '呈类圆柱形、圆锥形、卵圆形或不规则块状。除尽外皮者表面黄棕色至红棕色，有的可见类白色网状纹理及星点（异型维管束）散在，残留的外皮棕褐色，多具绳孔及粗皱纹。质坚实，断面淡红棕色或黄棕色，显颗粒性。',
    color: '#c2a06e',
    nature: '寒',
    flavor: '苦',
    meridian: '脾、胃、大肠、肝、心包经',
    processing: '生'
  },
  {
    id: 'renshen',
    name: '人参',
    description: '主根呈纺锤形或圆柱形，长3～15cm，直径1～2cm。表面灰黄色，上部或全体有疏浅断续的粗横纹及明显的纵皱，下部有支根2～3条，并着生多数细长的须根，须根上常有不明显的细小疣状突出。',
    color: '#d4c4a8',
    nature: '微温',
    flavor: '甘、微苦',
    meridian: '脾、肺、心、肾经',
    processing: '生'
  },
  {
    id: 'banxia',
    name: '半夏',
    description: '呈类球形，有的稍偏斜，直径1～1.5cm。表面白色或浅黄色，顶端有凹陷的茎痕，周围密布麻点状根痕；下面钝圆，较光滑。质坚实，断面洁白，富粉性。',
    color: '#f5f0e8',
    nature: '温',
    flavor: '辛',
    meridian: '脾、胃、肺经',
    processing: '炙'
  },
  {
    id: 'wutou',
    name: '乌头',
    description: '呈不规则圆锥形，稍弯曲，顶端常有残茎，中部多向一侧膨大，长2～7.5cm，直径1.2～2.5cm。表面棕褐色或灰棕色，皱缩，有小瘤状侧根及子根脱离后的痕迹。质坚实，断面类白色或浅灰黄色。',
    color: '#5c4a3a',
    nature: '热',
    flavor: '辛、苦',
    meridian: '心、肝、肾、脾经',
    processing: '炙'
  },
  {
    id: 'shuiyin',
    name: '水银',
    description: '呈银白色液体，小颗粒可流动，在空气中不易氧化。比重13.6，熔点-38.87℃，沸点356.6℃。常温下即可蒸发，汞蒸气和汞的化合物多有剧毒。',
    color: '#c0c0c0',
    nature: '寒',
    flavor: '辛',
    meridian: '心、肝、肾经',
    processing: '生'
  },
  {
    id: 'pishuang',
    name: '砒霜',
    name: '砒霜',
    description: '呈白色结晶性粉末，常呈不规则块状。质脆，易砸碎，断面显结晶性。无臭，味咸酸。极毒，内服宜慎。',
    color: '#f8f8ff',
    nature: '大热',
    flavor: '辛、酸',
    meridian: '肺、脾、胃经',
    processing: '煅'
  },
  {
    id: 'liulu',
    name: '藜芦',
    description: '根茎短粗，外被残留的棕色叶鞘维管束，呈纤维状，下端簇生多数细长的根。根长10～20cm，直径约3mm，表面黄白色或灰褐色，具细密的横皱纹。质脆，易折断，断面类白色。',
    color: '#d4c8b0',
    nature: '寒',
    flavor: '苦、辛',
    meridian: '肺、肝、胃经',
    processing: '生'
  },
  {
    id: 'xixin',
    name: '细辛',
    description: '常卷缩成团。根茎横生呈不规则圆柱形，具短分枝，长1～10cm，直径0.2～0.4cm；表面灰棕色，粗糙，有环形的节，节间长0.2～0.3cm，分枝顶端有碗状的茎痕。',
    color: '#8a9a7a',
    nature: '温',
    flavor: '辛',
    meridian: '心、肺、肾经',
    processing: '生'
  },
  {
    id: 'shaoyao',
    name: '芍药',
    description: '呈圆柱形，平直或稍弯曲，两端平截，长5～18cm，直径1～2.5cm。表面类白色或淡棕红色，光洁或有纵皱纹及细根痕，偶有残存的棕褐色外皮。质坚实，不易折断，断面较平坦，类白色或微带棕红色。',
    color: '#e8d4d4',
    nature: '微寒',
    flavor: '苦、酸',
    meridian: '肝、脾经',
    processing: '生'
  },
  {
    id: 'liuhuang',
    name: '硫黄',
    description: '呈不规则块状，黄色或略呈绿黄色。表面不平坦，呈脂肪光泽，常有多数小孔。用手握紧置于耳旁，可闻轻微的爆裂声。体轻，质松，易碎，断面常呈针状结晶形。',
    color: '#ffff00',
    nature: '温',
    flavor: '酸',
    meridian: '肾、大肠经',
    processing: '生'
  },
  {
    id: 'poxiao',
    name: '朴硝',
    description: '呈棱柱状、长方体或不规则块状及粒状。无色透明或类白色半透明。质脆，易碎，断面呈玻璃样光泽。无臭，味咸、微苦。',
    color: '#f0f8ff',
    nature: '寒',
    flavor: '咸、苦',
    meridian: '胃、大肠经',
    processing: '生'
  },
  {
    id: 'badou',
    name: '巴豆',
    description: '呈卵圆形，一般具三棱，长1.8～2.2cm，直径1.4～2cm。表面灰黄色或稍深，粗糙，有纵线6条，顶端平截，基部有果梗痕。破开果壳，可见3室，每室含种子1粒。',
    color: '#c9b896',
    nature: '热',
    flavor: '辛',
    meridian: '胃、大肠经',
    processing: '炙'
  },
  {
    id: 'qianniu',
    name: '牵牛',
    description: '似橘瓣状，长4～8mm，宽3～5mm。表面灰黑色或淡黄白色，背面有1条浅纵沟，腹面棱线的下端有一点状种脐，微凹。质硬，横切面可见淡黄色或黄绿色皱缩折叠的子叶。',
    color: '#3a3a3a',
    nature: '寒',
    flavor: '苦',
    meridian: '肺、肾、大肠经',
    processing: '生'
  },
  {
    id: 'dingxiang',
    name: '丁香',
    description: '呈研棒状，长1～2cm。花冠圆球形，直径0.3～0.5cm，花瓣4，复瓦状抱合，棕褐色至褐黄色，花瓣内为雄蕊和花柱，搓碎后可见众多黄色细粒状的花药。',
    color: '#8b4513',
    nature: '温',
    flavor: '辛',
    meridian: '脾、胃、肺、肾经',
    processing: '生'
  },
  {
    id: 'yujin',
    name: '郁金',
    description: '呈椭圆形或长条形薄片。外表皮灰黄色、灰褐色至灰棕色，具不规则的纵皱纹。切面灰棕色、橙黄色至灰黑色。角质样，内皮层环明显。',
    color: '#d4a574',
    nature: '寒',
    flavor: '辛、苦',
    meridian: '肝、心、肺经',
    processing: '生'
  },
  {
    id: 'rougui',
    name: '肉桂',
    description: '呈槽状或卷筒状，长30～40cm，宽或直径3～10cm，厚0.2～0.8cm。外表面灰棕色，稍粗糙，有不规则的细皱纹和横向突起的皮孔，有的可见灰白色的斑纹。',
    color: '#8b4513',
    nature: '大热',
    flavor: '辛、甘',
    meridian: '肾、脾、心、肝经',
    processing: '生'
  },
  {
    id: 'chishizhi',
    name: '赤石脂',
    description: '为块状集合体，呈不规则的块状。表面局部平坦，全体凹凸不平。浅红色、红色至紫红色，或红白相间呈花纹状。土状光泽或蜡样光泽，不透明。体较轻，质软。',
    color: '#cd5c5c',
    nature: '温',
    flavor: '甘、酸、涩',
    meridian: '大肠、胃经',
    processing: '煅'
  },
  {
    id: 'wulingzhi',
    name: '五灵脂',
    description: '呈长椭圆形颗粒状，长5～15mm，直径3～6mm。表面黑棕色、红棕色或灰棕色，凹凸不平，有油润性光泽。质硬或稍软，断面黄棕色或棕褐色，不平坦。',
    color: '#4a3728',
    nature: '温',
    flavor: '咸、甘',
    meridian: '肝经',
    processing: '生'
  },
  {
    id: 'chuanniu',
    name: '川乌',
    description: '呈不规则圆锥形，稍弯曲，顶端常有残茎，中部多向一侧膨大，长2～7.5cm，直径1.2～2.5cm。表面棕褐色或灰棕色，皱缩，有小瘤状侧根及子根脱离后的痕迹。',
    color: '#5c4a3a',
    nature: '热',
    flavor: '辛、苦',
    meridian: '心、肝、肾、脾经',
    processing: '炙'
  },
  {
    id: 'caowu',
    name: '草乌',
    description: '呈不规则长圆锥形，略弯曲，长2～7cm，直径0.6～1.8cm。顶端常有残茎和少数不定根残基，有的顶端一侧有一枯萎的芽，一侧有一圆形或扁圆形不定根残基。',
    color: '#4a3a2a',
    nature: '热',
    flavor: '辛、苦',
    meridian: '心、肝、肾、脾经',
    processing: '炙'
  },
  {
    id: 'xijiao',
    name: '犀角',
    description: '呈圆锥形，自底部向上渐细，稍弯曲，长短不等，大者长达30cm。表面为乌黑色，下部色渐浅，呈灰褐色。底部周边有马牙状锯齿，称"马牙边"，高约3cm，表面凹凸不平。',
    color: '#1a1a1a',
    nature: '寒',
    flavor: '苦、酸、咸',
    meridian: '心、肝、胃经',
    processing: '生'
  }
];

export const EIGHTEEN_INCOMPATIBILITIES = [
  { herbs: ['甘草', '大戟', '芫花', '甘遂', '海藻'], description: '藻戟遂芫俱战草' },
  { herbs: ['乌头', '川乌', '草乌', '附子', '半夏', '瓜蒌', '贝母', '白蔹', '白及'], description: '半蒌贝蔹及攻乌' },
  { herbs: ['藜芦', '人参', '丹参', '玄参', '沙参', '细辛', '芍药'], description: '诸参辛芍叛藜芦' },
];

export const NINETEEN_MUTUAL_FEAR = [
  { herbs: ['硫黄', '朴硝'], description: '硫黄畏朴硝' },
  { herbs: ['水银', '砒霜'], description: '水银畏砒霜' },
  { herbs: ['狼毒', '密陀僧'], description: '狼毒畏密陀僧' },
  { herbs: ['巴豆', '牵牛'], description: '巴豆畏牵牛' },
  { herbs: ['丁香', '郁金'], description: '丁香畏郁金' },
  { herbs: ['牙硝', '三棱'], description: '牙硝畏三棱' },
  { herbs: ['川乌', '犀角'], description: '川乌畏犀角' },
  { herbs: ['草乌', '犀角'], description: '草乌畏犀角' },
  { herbs: ['肉桂', '赤石脂'], description: '肉桂畏赤石脂' },
  { herbs: ['人参', '五灵脂'], description: '人参畏五灵脂' },
];

export const DOSAGE_CONVERSION = {
  LIANG_TO_GRAMS: 37.5,
  QIAN_TO_GRAMS: 3.75,
  FEN_TO_GRAMS: 0.375,
  LI_TO_GRAMS: 0.0375,
};
