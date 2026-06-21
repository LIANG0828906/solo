import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

type SpotType = 'attraction' | 'restaurant' | 'shopping';

interface Spot {
  id: string;
  city: string;
  name: string;
  type: SpotType;
  images: string[];
  rating: number;
  openTime: string;
  ticketPrice: number;
  description: string;
}

interface DayPlan {
  day: number;
  morning: Spot | null;
  afternoon: Spot | null;
  evening: Spot | null;
}

interface PlanRequest {
  destination: string;
  days: number;
}

interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  title: string;
  destination: string;
  days: number;
  content: string;
  coverImage: string;
  likes: number;
  liked: boolean;
  comments: Comment[];
  createdAt: string;
  itinerary: DayPlan[];
}

interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  createdAt: string;
}

const createImageUrl = (keyword: string, index: number): string => {
  const encodedKeyword = encodeURIComponent(keyword);
  return `https://source.unsplash.com/800x600/?${encodedKeyword}&sig=${index}`;
};

const generateRating = (): number => {
  return Math.round((Math.random() * 4.5 + 0.5) * 10) / 10;
};

const generateSpot = (
  city: string,
  name: string,
  type: SpotType,
  openTime: string,
  ticketPrice: number,
  description: string,
  imageKeyword: string
): Spot => ({
  id: uuidv4(),
  city,
  name,
  type,
  images: [
    createImageUrl(imageKeyword, 1),
    createImageUrl(imageKeyword, 2),
    createImageUrl(imageKeyword, 3),
  ],
  rating: generateRating(),
  openTime,
  ticketPrice,
  description,
});

const spotsDB: Spot[] = [
  // 北京景点
  generateSpot('北京', '故宫博物院', 'attraction', '08:30-17:00', 60, '中国明清两代皇家宫殿，世界文化遗产，拥有宏伟的建筑群和珍贵文物', '故宫'),
  generateSpot('北京', '天安门广场', 'attraction', '全天开放', 0, '世界上最大的城市广场之一，是中华人民共和国的象征', '天安门'),
  generateSpot('北京', '长城（八达岭）', 'attraction', '07:30-18:00', 40, '世界文化遗产，中国古代的军事防御工程，气势磅礴', '长城'),
  generateSpot('北京', '颐和园', 'attraction', '06:30-18:00', 30, '中国古典园林之首，景色秀丽的皇家园林', '颐和园'),
  generateSpot('北京', '天坛公园', 'attraction', '06:00-22:00', 15, '明清两代皇帝祭天、祈谷的场所，建筑设计精妙', '天坛'),
  generateSpot('北京', '圆明园遗址公园', 'attraction', '07:00-19:00', 25, '清代大型皇家园林遗址，铭记历史的教育基地', '圆明园'),
  generateSpot('北京', '鸟巢（国家体育场）', 'attraction', '09:00-21:00', 50, '2008年北京奥运会主体育场，独特的建筑造型', '鸟巢建筑'),
  generateSpot('北京', '水立方（国家游泳中心）', 'attraction', '09:00-21:00', 30, '2008年奥运会主要场馆之一，膜结构建筑', '水立方'),
  generateSpot('北京', '南锣鼓巷', 'shopping', '10:00-22:00', 0, '北京最古老的街区之一，胡同文化代表，特色小店云集', '北京胡同'),
  generateSpot('北京', '王府井步行街', 'shopping', '10:00-22:00', 0, '北京最著名的商业街，购物美食天堂', '王府井'),
  generateSpot('北京', '三里屯太古里', 'shopping', '10:00-22:00', 0, '时尚潮流聚集地，国际品牌云集', '三里屯'),
  generateSpot('北京', '全聚德（前门店）', 'restaurant', '10:00-22:00', 150, '北京烤鸭老字号，百年传承的美味', '北京烤鸭'),
  generateSpot('北京', '簋街小吃街', 'restaurant', '11:00-03:00', 0, '北京著名美食街，麻辣小龙虾和各种小吃', '麻辣小龙虾'),
  generateSpot('北京', '大董烤鸭店', 'restaurant', '11:00-22:00', 300, '高端北京烤鸭代表，创意菜品精致', '精致烤鸭'),
  generateSpot('北京', '护国寺小吃', 'restaurant', '06:00-21:00', 30, '北京传统小吃代表，豆汁焦圈、驴打滚', '北京小吃'),
  generateSpot('北京', '798艺术区', 'attraction', '10:00-17:00', 0, '当代艺术聚集地，画廊、咖啡馆、创意店铺', '798艺术区'),

  // 上海景点
  generateSpot('上海', '外滩', 'attraction', '全天开放', 0, '上海标志性景观，万国建筑博览群，夜景迷人', '上海外滩'),
  generateSpot('上海', '东方明珠塔', 'attraction', '08:00-21:30', 180, '上海地标建筑，俯瞰城市美景的绝佳地点', '东方明珠'),
  generateSpot('上海', '上海迪士尼乐园', 'attraction', '08:00-22:00', 435, '中国大陆首座迪士尼主题乐园，梦幻欢乐世界', '迪士尼乐园'),
  generateSpot('上海', '豫园', 'attraction', '08:30-17:00', 40, '江南古典园林，明代私家园林，古朴雅致', '豫园'),
  generateSpot('上海', '南京路步行街', 'shopping', '10:00-22:00', 0, '中国第一商业街，百年老店与现代商场并存', '南京路'),
  generateSpot('上海', '陆家嘴', 'attraction', '全天开放', 0, '上海金融中心，摩天大楼群，现代都市象征', '陆家嘴'),
  generateSpot('上海', '上海科技馆', 'attraction', '09:00-17:00', 45, '科普教育基地，互动体验丰富', '科技馆'),
  generateSpot('上海', '田子坊', 'shopping', '10:00-22:00', 0, '石库门改造的创意园区，文艺小店聚集地', '田子坊'),
  generateSpot('上海', '新天地', 'shopping', '10:00-24:00', 0, '时尚休闲地标，中西合璧的石库门建筑群', '上海新天地'),
  generateSpot('上海', '南翔小笼馆', 'restaurant', '06:00-21:00', 50, '上海特色小吃，皮薄馅多的小笼包', '小笼包'),
  generateSpot('上海', '老正兴菜馆', 'restaurant', '11:00-21:00', 120, '上海本帮菜老字号，红烧肉、油爆虾', '上海本帮菜'),
  generateSpot('上海', '和平饭店', 'restaurant', '11:30-14:30,17:30-22:00', 400, '历史悠久的豪华酒店，顶级餐饮体验', '和平饭店'),
  generateSpot('上海', '城隍庙小吃广场', 'restaurant', '08:00-22:00', 0, '上海传统小吃聚集地，蟹粉汤包、五香豆', '城隍庙小吃'),
  generateSpot('上海', '上海博物馆', 'attraction', '09:00-17:00', 0, '中国古代艺术博物馆，珍贵文物众多', '上海博物馆'),
  generateSpot('上海', '朱家角古镇', 'attraction', '08:30-16:30', 60, '江南水乡古镇，小桥流水人家', '朱家角古镇'),
  generateSpot('上海', 'iapm环贸广场', 'shopping', '10:00-22:00', 0, '高端购物中心，国际奢侈品牌聚集地', '高端商场'),

  // 成都景点
  generateSpot('成都', '大熊猫繁育研究基地', 'attraction', '07:30-18:00', 55, '世界著名的大熊猫迁地保护基地，近距离观看国宝', '大熊猫'),
  generateSpot('成都', '锦里古街', 'shopping', '08:00-22:00', 0, '成都著名步行街，川西民俗文化，特色小店', '锦里古街'),
  generateSpot('成都', '宽窄巷子', 'attraction', '全天开放', 0, '成都遗留下来的较成规模的清朝古街道，文化保护区', '宽窄巷子'),
  generateSpot('成都', '武侯祠', 'attraction', '08:00-18:30', 50, '中国唯一的君臣合祀庙宇，纪念诸葛亮与刘备', '武侯祠'),
  generateSpot('成都', '杜甫草堂', 'attraction', '08:00-18:00', 50, '唐代诗人杜甫故居旧址，古典园林', '杜甫草堂'),
  generateSpot('成都', '青城山', 'attraction', '08:00-17:00', 80, '道教名山，素有"青城天下幽"美誉', '青城山'),
  generateSpot('成都', '都江堰', 'attraction', '08:00-17:30', 80, '世界文化遗产，古代大型水利工程', '都江堰'),
  generateSpot('成都', '春熙路', 'shopping', '10:00-22:00', 0, '成都最繁华的商业街，时尚购物天堂', '春熙路'),
  generateSpot('成都', '太古里', 'shopping', '10:00-22:00', 0, '开放式购物中心，潮流与传统融合', '成都太古里'),
  generateSpot('成都', '小龙坎火锅', 'restaurant', '11:00-03:00', 100, '成都火锅代表，麻辣鲜香', '四川火锅'),
  generateSpot('成都', '龙抄手', 'restaurant', '07:00-21:00', 30, '成都著名小吃，皮薄馅嫩的馄饨', '龙抄手'),
  generateSpot('成都', '麻婆豆腐', 'restaurant', '10:00-22:00', 40, '四川名菜，麻辣鲜香烫', '麻婆豆腐'),
  generateSpot('成都', '钟水饺', 'restaurant', '08:00-21:00', 35, '成都传统小吃，甜辣口味', '钟水饺'),
  generateSpot('成都', '三大炮', 'restaurant', '09:00-22:00', 15, '四川特色小吃，糯米制作，香甜可口', '三大炮'),
  generateSpot('成都', '锦里小吃街', 'restaurant', '09:00-23:00', 0, '成都美食聚集地，各种四川小吃', '成都小吃'),
  generateSpot('成都', 'ifs国际金融中心', 'shopping', '10:00-22:00', 0, '高端购物中心，爬墙熊猫地标', 'IFS熊猫'),

  // 杭州景点
  generateSpot('杭州', '西湖', 'attraction', '全天开放', 0, '世界文化遗产，人间天堂，湖光山色美不胜收', '杭州西湖'),
  generateSpot('杭州', '灵隐寺', 'attraction', '07:00-18:15', 30, '千年古刹，中国佛教禅宗十大古刹之一', '灵隐寺'),
  generateSpot('杭州', '千岛湖', 'attraction', '08:00-17:00', 150, '国家5A级景区，千岛碧水画中游', '千岛湖'),
  generateSpot('杭州', '宋城', 'attraction', '10:00-21:00', 310, '杭州第一个大型人造主题公园，《宋城千古情》', '宋城'),
  generateSpot('杭州', '雷峰塔', 'attraction', '08:00-20:00', 40, '西湖十景之一，白娘子传说中的古塔', '雷峰塔'),
  generateSpot('杭州', '河坊街', 'shopping', '09:00-22:00', 0, '杭州历史文化街区，老字号云集', '河坊街'),
  generateSpot('杭州', '西溪湿地', 'attraction', '07:30-18:30', 80, '国家湿地公园，生态环境优美', '西溪湿地'),
  generateSpot('杭州', '西湖断桥', 'attraction', '全天开放', 0, '西湖十景之一，白娘子与许仙相遇之地', '西湖断桥'),
  generateSpot('杭州', '武林广场', 'shopping', '10:00-22:00', 0, '杭州市中心商圈，购物中心云集', '武林广场'),
  generateSpot('杭州', '湖滨银泰in77', 'shopping', '10:00-22:00', 0, '西湖边高端购物中心', '湖滨银泰'),
  generateSpot('杭州', '楼外楼', 'restaurant', '10:30-14:30,16:30-20:30', 180, '杭州百年老店，西湖醋鱼、龙井虾仁', '楼外楼'),
  generateSpot('杭州', '知味观', 'restaurant', '07:00-21:00', 60, '杭州老字号，小笼包、猫耳朵', '杭州小笼'),
  generateSpot('杭州', '外婆家', 'restaurant', '11:00-14:00,17:00-21:00', 80, '杭帮菜代表，性价比高', '杭帮菜'),
  generateSpot('杭州', '西湖醋鱼', 'restaurant', '10:00-22:00', 120, '杭州名菜，酸甜可口', '西湖醋鱼'),
  generateSpot('杭州', '东坡肉', 'restaurant', '10:00-22:00', 50, '杭州名菜，肥而不腻', '东坡肉'),
  generateSpot('杭州', '龙井茶园', 'attraction', '08:00-17:00', 0, '西湖龙井原产地，茶园风光', '龙井茶园'),

  // 三亚景点
  generateSpot('三亚', '亚龙湾', 'attraction', '全天开放', 0, '天下第一湾，细腻沙滩，碧海蓝天', '亚龙湾'),
  generateSpot('三亚', '天涯海角', 'attraction', '07:30-18:20', 68, '海南标志性景观，天涯海角石刻', '天涯海角'),
  generateSpot('三亚', '蜈支洲岛', 'attraction', '08:00-17:30', 144, '中国马尔代夫，潜水胜地', '蜈支洲岛'),
  generateSpot('三亚', '南山文化旅游区', 'attraction', '08:00-17:30', 129, '佛教文化主题公园，南海观音像', '南海观音'),
  generateSpot('三亚', '大东海', 'attraction', '全天开放', 0, '三亚市区最近的海滨浴场', '大东海'),
  generateSpot('三亚', '三亚湾', 'attraction', '全天开放', 0, '椰梦长廊，最美日落观赏地', '三亚湾'),
  generateSpot('三亚', '海棠湾', 'attraction', '全天开放', 0, '高端酒店聚集区，安静私密', '海棠湾'),
  generateSpot('三亚', '呀诺达雨林', 'attraction', '07:30-17:30', 170, '热带雨林文化旅游区，天然氧吧', '热带雨林'),
  generateSpot('三亚', '第一市场', 'shopping', '09:00-22:00', 0, '三亚最大海鲜市场，新鲜海鲜', '海鲜市场'),
  generateSpot('三亚', '三亚国际免税城', 'shopping', '10:00-22:00', 0, '全球最大单体免税店', '免税店'),
  generateSpot('三亚', '春园海鲜广场', 'restaurant', '11:00-23:00', 0, '三亚知名海鲜加工广场', '海鲜大餐'),
  generateSpot('三亚', '文昌糟粕醋海鲜', 'restaurant', '11:00-22:00', 80, '海南特色美食，酸辣开胃', '糟粕醋'),
  generateSpot('三亚', '清补凉', 'restaurant', '10:00-23:00', 15, '海南特色甜品，消暑佳品', '清补凉'),
  generateSpot('三亚', '椰子鸡', 'restaurant', '11:00-22:00', 90, '海南特色火锅，清甜鲜美', '椰子鸡'),
  generateSpot('三亚', '和乐蟹', 'restaurant', '11:00-22:00', 200, '海南四大名菜之一，膏满肉肥', '和乐蟹'),
  generateSpot('三亚', '解放路步行街', 'shopping', '10:00-22:00', 0, '三亚市中心商业街', '步行街'),

  // 西安景点
  generateSpot('西安', '秦始皇兵马俑', 'attraction', '08:30-18:00', 120, '世界第八大奇迹，世界文化遗产', '兵马俑'),
  generateSpot('西安', '大雁塔', 'attraction', '08:00-18:30', 40, '唐代著名佛塔，玄奘法师主持修建', '大雁塔'),
  generateSpot('西安', '西安城墙', 'attraction', '08:00-22:00', 54, '中国现存规模最大、保存最完整的古代城垣', '西安城墙'),
  generateSpot('西安', '华清宫', 'attraction', '07:30-18:00', 120, '唐代皇家温泉行宫，《长恨歌》实景演出', '华清宫'),
  generateSpot('西安', '回民街', 'shopping', '全天开放', 0, '西安著名美食文化街区', '回民街'),
  generateSpot('西安', '钟鼓楼', 'attraction', '08:30-21:00', 50, '西安地标建筑，明代建筑', '西安钟鼓楼'),
  generateSpot('西安', '陕西历史博物馆', 'attraction', '08:30-18:00', 0, '中国第一座大型现代化国家级博物馆', '陕西历史博物馆'),
  generateSpot('西安', '大唐不夜城', 'attraction', '10:00-23:00', 0, '盛唐文化主题街区，夜景璀璨', '大唐不夜城'),
  generateSpot('西安', '小寨赛格', 'shopping', '10:00-22:00', 0, '西安最大购物中心，亚洲最长扶梯', '赛格购物中心'),
  generateSpot('西安', 'skp西安', 'shopping', '10:00-22:00', 0, '高端奢侈品购物中心', 'SKP'),
  generateSpot('西安', '老孙家羊肉泡馍', 'restaurant', '07:00-21:00', 45, '西安老字号，羊肉泡馍名店', '羊肉泡馍'),
  generateSpot('西安', '肉夹馍', 'restaurant', '07:00-22:00', 15, '西安特色小吃，腊汁肉夹馍', '肉夹馍'),
  generateSpot('西安', '凉皮', 'restaurant', '07:00-22:00', 12, '陕西特色小吃，秦镇凉皮', '凉皮'),
  generateSpot('西安', 'biangbiang面', 'restaurant', '10:00-22:00', 25, '陕西特色面食，面条宽而长', 'biangbiang面'),
  generateSpot('西安', '西安饭庄', 'restaurant', '11:00-14:00,17:00-21:00', 150, '陕西菜代表，葫芦鸡、温拌腰丝', '陕西菜'),
  generateSpot('西安', '大唐芙蓉园', 'attraction', '09:00-22:00', 120, '盛唐风貌大型皇家园林式文化主题公园', '大唐芙蓉园'),
];

const communityDB: CommunityPost[] = [
  {
    id: uuidv4(),
    author: '旅行达人小王',
    avatar: 'https://source.unsplash.com/100x100/?portrait,man&sig=1',
    title: '北京5日深度游，带你领略千年帝都的魅力',
    destination: '北京',
    days: 5,
    content: '这次北京之旅，我们从故宫开始，一步步领略这座千年古都的魅力。从皇家宫殿到胡同小巷，从传统美食到现代艺术，每一处都让人流连忘返。特别推荐故宫的深度游览，至少需要半天时间才能细细品味。',
    coverImage: createImageUrl('北京故宫', 10),
    likes: 328,
    liked: false,
    comments: [
      {
        id: uuidv4(),
        author: '旅行者小李',
        avatar: 'https://source.unsplash.com/100x100/?portrait,woman&sig=11',
        content: '攻略太实用了！下个月就要去北京，正好参考',
        createdAt: '2024-01-15T10:30:00Z',
      },
    ],
    createdAt: '2024-01-10T14:20:00Z',
    itinerary: [],
  },
  {
    id: uuidv4(),
    author: '美食博主阿杰',
    avatar: 'https://source.unsplash.com/100x100/?portrait,man&sig=2',
    title: '成都3日吃货之旅，从早吃到晚不重样',
    destination: '成都',
    days: 3,
    content: '成都真的是美食天堂！从早到晚，火锅、串串、龙抄手、钟水饺、三大炮...每天都在挑战自己的胃容量。除了美食，成都的慢生活也让人着迷，在茶馆里坐一下午，感受当地人的悠闲。',
    coverImage: createImageUrl('成都火锅', 20),
    likes: 512,
    liked: true,
    comments: [
      {
        id: uuidv4(),
        author: '吃货小美',
        avatar: 'https://source.unsplash.com/100x100/?portrait,woman&sig=21',
        content: '看饿了！求火锅店具体位置',
        createdAt: '2024-01-12T15:20:00Z',
      },
      {
        id: uuidv4(),
        author: '背包客小张',
        avatar: 'https://source.unsplash.com/100x100/?portrait,man&sig=22',
        content: '成都确实是个来了就不想走的城市',
        createdAt: '2024-01-13T09:15:00Z',
      },
    ],
    createdAt: '2024-01-08T09:45:00Z',
    itinerary: [],
  },
  {
    id: uuidv4(),
    author: '摄影师小林',
    avatar: 'https://source.unsplash.com/100x100/?portrait,woman&sig=3',
    title: '杭州西湖4日游，每一步都是风景画',
    destination: '杭州',
    days: 4,
    content: '上有天堂，下有苏杭。杭州的美，需要静下心来慢慢品味。西湖的清晨、黄昏、夜晚各有不同的韵味。推荐租一辆自行车，沿着苏堤白堤慢慢骑行，感受那份宁静与美好。',
    coverImage: createImageUrl('杭州西湖', 30),
    likes: 456,
    liked: false,
    comments: [],
    createdAt: '2024-01-05T16:30:00Z',
    itinerary: [],
  },
  {
    id: uuidv4(),
    author: '海岛控小晴',
    avatar: 'https://source.unsplash.com/100x100/?portrait,woman&sig=4',
    title: '三亚5天4晚度假攻略，阳光沙滩海浪',
    destination: '三亚',
    days: 5,
    content: '冬天就该去三亚！避开寒冷的北方，在三亚享受温暖的阳光。蜈支洲岛一定要去，海水清澈见底，潜水体验超棒。海鲜大餐也是必不可少的，第一市场买海鲜，找加工店加工，性价比超高。',
    coverImage: createImageUrl('三亚海滩', 40),
    likes: 678,
    liked: true,
    comments: [
      {
        id: uuidv4(),
        author: '度假达人',
        avatar: 'https://source.unsplash.com/100x100/?portrait,man&sig=41',
        content: '求推荐蜈支洲岛的水上项目',
        createdAt: '2024-01-14T11:00:00Z',
      },
    ],
    createdAt: '2024-01-03T12:15:00Z',
    itinerary: [],
  },
  {
    id: uuidv4(),
    author: '历史爱好者阿龙',
    avatar: 'https://source.unsplash.com/100x100/?portrait,man&sig=5',
    title: '西安4日穿越之旅，梦回大唐盛世',
    destination: '西安',
    days: 4,
    content: '西安是一座让历史爱好者疯狂的城市！兵马俑的震撼只有身临其境才能感受到。陕西历史博物馆更是值得花一整天时间细细参观。晚上一定要去大唐不夜城，灯火辉煌，真的有种穿越回唐朝的感觉。',
    coverImage: createImageUrl('西安兵马俑', 50),
    likes: 389,
    liked: false,
    comments: [
      {
        id: uuidv4(),
        author: '汉服小姐姐',
        avatar: 'https://source.unsplash.com/100x100/?portrait,woman&sig=51',
        content: '大唐不夜城穿汉服拍照超出片！',
        createdAt: '2024-01-11T20:30:00Z',
      },
    ],
    createdAt: '2024-01-01T10:00:00Z',
    itinerary: [],
  },
  {
    id: uuidv4(),
    author: '魔都玩家Amy',
    avatar: 'https://source.unsplash.com/100x100/?portrait,woman&sig=6',
    title: '上海3日都市之旅，感受国际大都市的脉搏',
    destination: '上海',
    days: 3,
    content: '上海是一座永不睡觉的城市！外滩的夜景、陆家嘴的摩天大楼、迪士尼的欢乐、田子坊的文艺...这座城市总有新的惊喜等着你。推荐晚上坐游船游黄浦江，两岸的夜景真的太美了！',
    coverImage: createImageUrl('上海外滩夜景', 60),
    likes: 423,
    liked: true,
    comments: [
      {
        id: uuidv4(),
        author: '建筑控',
        avatar: 'https://source.unsplash.com/100x100/?portrait,man&sig=61',
        content: '外滩的万国建筑群确实值得细细品味',
        createdAt: '2024-01-09T08:45:00Z',
      },
    ],
    createdAt: '2024-01-02T15:20:00Z',
    itinerary: [],
  },
];

app.get('/api/spots', (req: Request, res: Response) => {
  const { destination } = req.query;
  if (!destination || typeof destination !== 'string') {
    return res.status(400).json({ error: 'destination 参数是必需的' });
  }
  const spots = spotsDB.filter(spot => spot.city === destination);
  res.json(spots);
});

app.get('/api/spots/search', (req: Request, res: Response) => {
  const { keyword } = req.query;
  if (!keyword || typeof keyword !== 'string') {
    return res.status(400).json({ error: 'keyword 参数是必需的' });
  }
  const lowerKeyword = keyword.toLowerCase();
  const spots = spotsDB.filter(
    spot =>
      spot.name.toLowerCase().includes(lowerKeyword) ||
      spot.city.toLowerCase().includes(lowerKeyword) ||
      spot.description.toLowerCase().includes(lowerKeyword)
  );
  res.json(spots);
});

app.post('/api/plan/generate', (req: Request, res: Response) => {
  const { destination, days } = req.body as PlanRequest;

  if (!destination || !days || typeof days !== 'number' || days < 1) {
    return res.status(400).json({ error: '请提供有效的目的地和天数' });
  }

  const citySpots = spotsDB.filter(spot => spot.city === destination);
  if (citySpots.length === 0) {
    return res.status(404).json({ error: '未找到该城市的景点数据' });
  }

  const sortedSpots = [...citySpots].sort((a, b) => b.rating - a.rating);

  const attractions = sortedSpots.filter(s => s.type === 'attraction');
  const shoppings = sortedSpots.filter(s => s.type === 'shopping');
  const restaurants = sortedSpots.filter(s => s.type === 'restaurant');

  const itinerary: DayPlan[] = [];

  for (let day = 1; day <= days; day++) {
    const dayPlan: DayPlan = {
      day,
      morning: attractions[(day - 1) % attractions.length] || null,
      afternoon: shoppings[(day - 1) % shoppings.length] || null,
      evening: restaurants[(day - 1) % restaurants.length] || null,
    };
    itinerary.push(dayPlan);
  }

  res.json({
    destination,
    days,
    itinerary,
  });
});

app.post('/api/plan/publish', (req: Request, res: Response) => {
  const { author, title, destination, days, content, itinerary } = req.body;

  if (!author || !title || !destination || !days || !content || !itinerary) {
    return res.status(400).json({ error: '请提供完整的行程信息' });
  }

  const newPost: CommunityPost = {
    id: uuidv4(),
    author,
    avatar: `https://source.unsplash.com/100x100/?portrait&sig=${Date.now()}`,
    title,
    destination,
    days,
    content,
    coverImage: createImageUrl(destination, Date.now()),
    likes: 0,
    liked: false,
    comments: [],
    createdAt: new Date().toISOString(),
    itinerary,
  };

  communityDB.unshift(newPost);
  res.status(201).json(newPost);
});

app.get('/api/community', (_req: Request, res: Response) => {
  res.json(communityDB);
});

app.post('/api/community/:id/like', (req: Request, res: Response) => {
  const { id } = req.params;
  const post = communityDB.find(p => p.id === id);

  if (!post) {
    return res.status(404).json({ error: '帖子不存在' });
  }

  post.liked = !post.liked;
  post.likes += post.liked ? 1 : -1;

  res.json({ likes: post.likes, liked: post.liked });
});

app.post('/api/community/:id/comment', (req: Request, res: Response) => {
  const { id } = req.params;
  const { author, content } = req.body;

  if (!author || !content) {
    return res.status(400).json({ error: '请提供评论者和评论内容' });
  }

  const post = communityDB.find(p => p.id === id);
  if (!post) {
    return res.status(404).json({ error: '帖子不存在' });
  }

  const newComment: Comment = {
    id: uuidv4(),
    author,
    avatar: `https://source.unsplash.com/100x100/?portrait&sig=${Date.now()}`,
    content,
    createdAt: new Date().toISOString(),
  };

  post.comments.push(newComment);
  res.status(201).json(newComment);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
