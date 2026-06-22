import express, { type Request, type Response } from 'express';

const router = express.Router();

const artifacts = [
  {
    id: 'bronze-ding',
    name: '司母戊鼎',
    dynasty: '商朝',
    era: '商周',
    origin: '河南安阳',
    rating: 5,
    eraColor: '#4A6B5D',
    modelType: 'ding',
    description: '商代晚期青铜礼器，是目前已知中国古代最重的青铜器。',
    narration: '司母戊鼎，又称后母戊大方鼎，出土于河南安阳武官村。鼎身呈长方形，口沿很厚，轮廓方直，显示不可动摇的气势。鼎身四周铸有精巧的盘龙纹和饕餮纹，增加了文物本身的威武凝重之感。此鼎是商王祖庚或祖甲为祭祀其母戊所铸，是商周时期青铜文化的代表作。',
    height: 1.33,
    relatedIds: ['bronze-zun', 'jade-bi', 'bronze-jian', 'pottery-pot', 'bronze-mirror'],
  },
  {
    id: 'bronze-zun',
    name: '四羊方尊',
    dynasty: '商朝',
    era: '商周',
    origin: '湖南宁乡',
    rating: 5,
    eraColor: '#4A6B5D',
    modelType: 'vase',
    description: '商代晚期青铜礼器，以四羊头装饰著称。',
    narration: '四羊方尊是中国现存商代青铜方尊中最大的一件，其造型独特，以四羊头、四龙首装饰于器身四角。尊的四角各塑一只卷角羊，羊首与器身浑然一体，栩栩如生。此尊集线雕、浮雕、圆雕于一身，把平面纹饰与立体雕塑融会贯通，是商代青铜铸造工艺的巅峰之作。',
    height: 0.58,
    relatedIds: ['bronze-ding', 'jade-bi', 'bronze-jian', 'pottery-pot', 'bronze-mirror'],
  },
  {
    id: 'jade-bi',
    name: '良渚玉璧',
    dynasty: '新石器时代',
    era: '良渚',
    origin: '浙江余杭',
    rating: 4,
    eraColor: '#8B7355',
    modelType: 'jade',
    description: '良渚文化典型玉器，象征天圆地方的宇宙观。',
    narration: '良渚玉璧是良渚文化的典型器物，多为扁圆形，中有圆孔。玉璧质地温润，色泽丰富。良渚时期的玉璧大多光素无纹，少数有简单的阴刻线。玉璧在古代是重要的礼器，象征天圆地方的宇宙观念，也是身份地位的象征，在祭祀活动中扮演着重要角色。',
    height: 0.2,
    relatedIds: ['bronze-ding', 'bronze-zun', 'bronze-jian', 'pottery-pot', 'bronze-mirror'],
  },
  {
    id: 'bronze-jian',
    name: '越王勾践剑',
    dynasty: '春秋',
    era: '春秋战国',
    origin: '湖北江陵',
    rating: 5,
    eraColor: '#6B4E31',
    modelType: 'sword',
    description: '春秋晚期越国青铜剑，以锋利著称。',
    narration: '越王勾践剑是春秋晚期越国青铜器，1965年出土于湖北省荆州市江陵县望山楚墓群。此剑寒气逼人、锋利无比，剑身修长，剑格正面镶蓝色玻璃，背面镶绿松石花纹。剑首向外翻卷作圆箍形，内铸有间隔只有0.2毫米的11道同心圆。这把剑历经两千四百余年，仍然纹饰清晰精美，被誉为天下第一剑。',
    height: 0.56,
    relatedIds: ['bronze-ding', 'bronze-zun', 'jade-bi', 'pottery-pot', 'bronze-mirror'],
  },
  {
    id: 'pottery-pot',
    name: '彩陶人面鱼纹盆',
    dynasty: '新石器时代',
    era: '仰韶',
    origin: '陕西西安',
    rating: 4,
    eraColor: '#A0522D',
    modelType: 'pot',
    description: '仰韶文化彩陶代表，人面鱼纹图案。',
    narration: '彩陶人面鱼纹盆是仰韶文化半坡类型的彩陶珍品，1955年出土于陕西西安半坡遗址。盆内壁绘有人面和鱼纹图案，人面呈圆形，眼睛细长，鼻子短小，嘴巴两侧各饰一条变形鱼纹。这种独特的图案可能与原始宗教或图腾崇拜有关，是研究史前艺术的珍贵资料，展现了六千年前先民的艺术创造力和精神世界。',
    height: 0.17,
    relatedIds: ['bronze-ding', 'bronze-zun', 'jade-bi', 'bronze-jian', 'bronze-mirror'],
  },
  {
    id: 'bronze-mirror',
    name: '唐代海兽葡萄镜',
    dynasty: '唐朝',
    era: '唐代',
    origin: '陕西西安',
    rating: 4,
    eraColor: '#B8860B',
    modelType: 'mirror',
    description: '唐代铜镜代表，海兽葡萄纹饰。',
    narration: '唐代海兽葡萄镜是唐代铜镜中的精品，镜背纹饰繁缛华丽，以瑞兽和葡萄为主要装饰题材。镜背中央为瑞兽纹，外区为葡萄蔓枝与瑞兽禽鸟穿插其间。铜镜在唐代不仅是照容的用具，也是精美的工艺品和馈赠的礼品。海兽葡萄镜反映了唐代对外文化交流的繁荣，是盛唐气象的一个缩影。',
    height: 0.15,
    relatedIds: ['bronze-ding', 'bronze-zun', 'jade-bi', 'bronze-jian', 'pottery-pot'],
  },
];

router.get('/', (_req: Request, res: Response) => {
  const list = artifacts.map((a) => ({
    id: a.id,
    name: a.name,
    dynasty: a.dynasty,
    era: a.era,
  }));
  res.json(list);
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const artifact = artifacts.find((a) => a.id === id);
  if (!artifact) {
    res.status(404).json({ error: 'Artifact not found' });
    return;
  }
  res.json(artifact);
});

export default router;
