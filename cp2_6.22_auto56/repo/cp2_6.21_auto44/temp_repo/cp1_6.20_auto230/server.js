import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const cityDatabase = {
  成都: {
    name: '成都',
    foodScore: 95,
    transportScore: 82,
    baseCost: 350,
    cultural: [
      { name: '武侯祠', description: '纪念诸葛亮与刘备的君臣合祀祠庙，三国文化圣地', duration: '建议游玩 2 小时', type: '古迹' },
      { name: '杜甫草堂', description: '唐代诗人杜甫流寓成都时的故居，古典园林建筑', duration: '建议游玩 2.5 小时', type: '古迹' },
      { name: '宽窄巷子', description: '清末民初的老成都街区，体验川西民俗文化', duration: '建议游玩 2 小时', type: '文化街区' },
      { name: '金沙遗址博物馆', description: '商周时期古蜀文化遗址，出土太阳神鸟金饰', duration: '建议游玩 3 小时', type: '博物馆' },
      { name: '青羊宫', description: '道教发源地之一，川西第一道观', duration: '建议游玩 1.5 小时', type: '古迹' },
    ],
    food: [
      { name: '锦里古街', description: '成都著名的美食步行街，汇聚各类川菜小吃', duration: '建议游玩 2 小时', type: '美食街' },
      { name: '春熙路', description: '成都最繁华的商业街，美食与购物天堂', duration: '建议游玩 3 小时', type: '商圈' },
      { name: '玉林小区', description: '成都本地人最爱的美食聚集地，小酒馆发源地', duration: '建议游玩 2.5 小时', type: '美食街' },
      { name: '建设路小吃街', description: '学生党最爱，性价比超高的美食一条街', duration: '建议游玩 2 小时', type: '美食街' },
      { name: '人民公园鹤鸣茶社', description: '百年老茶馆，体验成都盖碗茶与采耳文化', duration: '建议游玩 2 小时', type: '休闲' },
    ],
    nature: [
      { name: '青城山', description: '四大道教名山之一，清幽秀丽的避暑胜地', duration: '建议游玩 6 小时', type: '自然' },
      { name: '都江堰', description: '世界文化遗产，两千多年历史的水利工程奇迹', duration: '建议游玩 4 小时', type: '古迹' },
      { name: '大熊猫繁育研究基地', description: '近距离观看国宝大熊猫的最佳地点', duration: '建议游玩 4 小时', type: '自然' },
      { name: '西岭雪山', description: '成都第一峰，冬季滑雪夏季避暑', duration: '建议游玩 8 小时', type: '自然' },
      { name: '青龙湖湿地公园', description: '成都最大的城市湿地公园，观鸟胜地', duration: '建议游玩 3 小时', type: '自然' },
    ]
  },
  杭州: {
    name: '杭州',
    foodScore: 85,
    transportScore: 88,
    baseCost: 450,
    cultural: [
      { name: '西湖', description: '世界文化遗产，杭州的灵魂，三潭印月等著名景点', duration: '建议游玩 5 小时', type: '自然文化' },
      { name: '灵隐寺', description: '千年古刹，江南著名佛教寺院', duration: '建议游玩 3 小时', type: '古迹' },
      { name: '岳王庙', description: '纪念岳飞的庙宇，西湖边的历史圣地', duration: '建议游玩 1.5 小时', type: '古迹' },
      { name: '河坊街', description: '杭州历史文化街区，老字号与传统工艺汇聚', duration: '建议游玩 2.5 小时', type: '文化街区' },
      { name: '宋城', description: '宋文化主题公园，《宋城千古情》震撼演出', duration: '建议游玩 5 小时', type: '主题公园' },
    ],
    food: [
      { name: '知味观', description: '百年老字号，杭州传统名点的代表', duration: '建议用餐 1.5 小时', type: '餐厅' },
      { name: '外婆家', description: '杭帮菜连锁代表，高性价比的地道口味', duration: '建议用餐 1.5 小时', type: '餐厅' },
      { name: '河坊街小吃', description: '定胜糕、葱包桧、杭州小笼等特色小吃', duration: '建议游玩 2 小时', type: '美食街' },
      { name: '湖滨银泰in77', description: '西湖边的高端商圈，美食与购物一体', duration: '建议游玩 3 小时', type: '商圈' },
      { name: '龙井村', description: '西湖龙井茶原产地，品茶与农家菜', duration: '建议游玩 3 小时', type: '休闲' },
    ],
    nature: [
      { name: '千岛湖', description: '天下第一秀水，1078个岛屿星罗棋布', duration: '建议游玩 8 小时', type: '自然' },
      { name: '西溪湿地', description: '城市湿地公园，《非诚勿扰》取景地', duration: '建议游玩 4 小时', type: '自然' },
      { name: '龙井茶园', description: '连绵起伏的茶山，春季采茶体验', duration: '建议游玩 3 小时', type: '自然' },
      { name: '九溪十八涧', description: '西湖群山间的清幽溪流，徒步胜地', duration: '建议游玩 3 小时', type: '自然' },
      { name: '莫干山', description: '中国四大避暑胜地之一，竹海与别墅群', duration: '建议游玩 8 小时', type: '自然' },
    ]
  },
  西安: {
    name: '西安',
    foodScore: 88,
    transportScore: 80,
    baseCost: 320,
    cultural: [
      { name: '秦始皇兵马俑', description: '世界第八大奇迹，两千年前的地下军团', duration: '建议游玩 4 小时', type: '古迹' },
      { name: '大雁塔', description: '唐代玄奘法师藏经译经之地，唐代古塔代表', duration: '建议游玩 2.5 小时', type: '古迹' },
      { name: '西安城墙', description: '中国现存最完整的古代城垣，可骑行环游', duration: '建议游玩 3 小时', type: '古迹' },
      { name: '陕西历史博物馆', description: '中华宝库，馆藏文物37万余件', duration: '建议游玩 4 小时', type: '博物馆' },
      { name: '华清池', description: '杨贵妃沐浴之地，西安事变旧址', duration: '建议游玩 3 小时', type: '古迹' },
    ],
    food: [
      { name: '回民街', description: '西安最著名的美食街，羊肉泡馍、肉夹馍等', duration: '建议游玩 2.5 小时', type: '美食街' },
      { name: '永兴坊', description: '陕西非遗美食文化街区，摔碗酒发源地', duration: '建议游玩 2 小时', type: '美食街' },
      { name: '大唐不夜城', description: '盛唐文化主题步行街，夜景与美食交融', duration: '建议游玩 3 小时', type: '商圈' },
      { name: '老孙家泡馍', description: '百年老字号，西安羊肉泡馍的代表', duration: '建议用餐 1.5 小时', type: '餐厅' },
      { name: '春发生葫芦头', description: '西安传统名吃，猪大肠制成的地方风味', duration: '建议用餐 1 小时', type: '餐厅' },
    ],
    nature: [
      { name: '华山', description: '五岳之西岳，奇险天下第一山', duration: '建议游玩 10 小时', type: '自然' },
      { name: '骊山', description: '秦岭支脉，华清池与兵谏亭所在地', duration: '建议游玩 4 小时', type: '自然' },
      { name: '秦岭野生动物园', description: '西北地区最大的野生动物园', duration: '建议游玩 5 小时', type: '自然' },
      { name: '大唐芙蓉园', description: '皇家园林式主题公园，盛唐风貌再现', duration: '建议游玩 4 小时', type: '主题公园' },
      { name: '曲江池遗址公园', description: '开放式园林公园，西安市民休闲胜地', duration: '建议游玩 2.5 小时', type: '自然' },
    ]
  },
  北京: {
    name: '北京',
    foodScore: 82,
    transportScore: 95,
    baseCost: 550,
    cultural: [
      { name: '故宫博物院', description: '明清两代皇家宫殿，世界最大的木质结构建筑群', duration: '建议游玩 5 小时', type: '古迹' },
      { name: '长城（八达岭）', description: '万里长城最著名的段落，不到长城非好汉', duration: '建议游玩 6 小时', type: '古迹' },
      { name: '天坛', description: '明清帝王祭天祈谷之所，中国古建筑代表', duration: '建议游玩 3 小时', type: '古迹' },
      { name: '颐和园', description: '中国现存最大的皇家园林，皇家园林博物馆', duration: '建议游玩 4 小时', type: '古迹' },
      { name: '天安门广场', description: '世界最大的城市广场，国家象征', duration: '建议游玩 2 小时', type: '地标' },
    ],
    food: [
      { name: '王府井小吃街', description: '北京最著名的小吃街，老北京风味汇聚', duration: '建议游玩 2 小时', type: '美食街' },
      { name: '全聚德烤鸭', description: '百年老字号，北京烤鸭的代名词', duration: '建议用餐 2 小时', type: '餐厅' },
      { name: '簋街', description: '北京24小时美食不夜街，小龙虾与火锅', duration: '建议游玩 3 小时', type: '美食街' },
      { name: '南锣鼓巷', description: '老北京胡同文化代表，文艺小店与特色美食', duration: '建议游玩 2.5 小时', type: '文化街区' },
      { name: '护国寺小吃', description: '北京传统小吃代表，豆汁焦圈等老北京风味', duration: '建议用餐 1 小时', type: '餐厅' },
    ],
    nature: [
      { name: '香山公园', description: '红叶胜地，清代皇家园林三山五园之一', duration: '建议游玩 4 小时', type: '自然' },
      { name: '颐和园（昆明湖）', description: '皇家园林中的自然山水典范', duration: '建议游玩 4 小时', type: '自然' },
      { name: '北海公园', description: '中国现存最古老、最完整的皇家园林之一', duration: '建议游玩 3 小时', type: '自然' },
      { name: '奥林匹克森林公园', description: '亚洲最大的城市绿化景观，跑步圣地', duration: '建议游玩 3 小时', type: '自然' },
      { name: '十渡风景区', description: '北方小桂林，喀斯特地貌峡谷风光', duration: '建议游玩 8 小时', type: '自然' },
    ]
  },
  上海: {
    name: '上海',
    foodScore: 80,
    transportScore: 98,
    baseCost: 600,
    cultural: [
      { name: '外滩', description: '万国建筑博览群，上海的城市名片', duration: '建议游玩 2.5 小时', type: '地标' },
      { name: '豫园', description: '明代私家园林，江南古典园林代表', duration: '建议游玩 2.5 小时', type: '古迹' },
      { name: '上海博物馆', description: '中国最大的古代艺术博物馆之一', duration: '建议游玩 3.5 小时', type: '博物馆' },
      { name: '田子坊', description: '上海石库门里弄改造的创意文化街区', duration: '建议游玩 2.5 小时', type: '文化街区' },
      { name: '朱家角古镇', description: '上海威尼斯，江南水乡古镇代表', duration: '建议游玩 4 小时', type: '古镇' },
    ],
    food: [
      { name: '南京路步行街', description: '中华商业第一街，老字号与现代商业汇聚', duration: '建议游玩 3 小时', type: '商圈' },
      { name: '城隍庙小吃', description: '上海传统小吃聚集地，南翔小笼等', duration: '建议游玩 2 小时', type: '美食街' },
      { name: '新天地', description: '石库门改造的高端餐饮娱乐区', duration: '建议游玩 2.5 小时', type: '商圈' },
      { name: '云南南路美食街', description: '百年老字号美食街，生煎、白斩鸡等', duration: '建议游玩 2 小时', type: '美食街' },
      { name: '老盛昌汤包', description: '上海连锁汤包名店，地道本帮味道', duration: '建议用餐 1 小时', type: '餐厅' },
    ],
    nature: [
      { name: '东方明珠', description: '上海地标建筑，空中走廊与旋转餐厅', duration: '建议游玩 3 小时', type: '地标' },
      { name: '上海迪士尼', description: '中国内地首座迪士尼主题乐园', duration: '建议游玩 10 小时', type: '主题公园' },
      { name: '崇明岛', description: '中国第三大岛，国家级生态示范区', duration: '建议游玩 8 小时', type: '自然' },
      { name: '佘山国家森林公园', description: '上海唯一的自然山林胜地', duration: '建议游玩 4 小时', type: '自然' },
      { name: '世纪公园', description: '上海最大的城市公园，亲子休闲胜地', duration: '建议游玩 3 小时', type: '自然' },
    ]
  },
  广州: {
    name: '广州',
    foodScore: 98,
    transportScore: 90,
    baseCost: 400,
    cultural: [
      { name: '陈家祠', description: '岭南建筑艺术明珠，清代宗族祠堂代表', duration: '建议游玩 2 小时', type: '古迹' },
      { name: '越秀公园', description: '广州老牌公园，五羊石像与镇海楼', duration: '建议游玩 3 小时', type: '公园' },
      { name: '沙面', description: '欧式建筑群，曾经的租界历史见证', duration: '建议游玩 2 小时', type: '文化街区' },
      { name: '广东省博物馆', description: '岭南文化收藏中心，了解广东历史', duration: '建议游玩 3 小时', type: '博物馆' },
      { name: '黄埔军校旧址', description: '中国近代最著名的军事院校', duration: '建议游玩 2.5 小时', type: '古迹' },
    ],
    food: [
      { name: '上下九步行街', description: '广州最著名的商业步行街，粤式美食汇聚', duration: '建议游玩 3 小时', type: '商圈' },
      { name: '北京路', description: '广州老城中心，千年古道遗址与现代商业', duration: '建议游玩 2.5 小时', type: '商圈' },
      { name: '广州酒家', description: '食在广州第一家，老字号粤菜代表', duration: '建议用餐 2 小时', type: '餐厅' },
      { name: '早茶（点都德）', description: '广州早茶文化代表，虾饺烧卖等经典点心', duration: '建议用餐 2 小时', type: '餐厅' },
      { name: '宝华路小吃', description: '西关老字号小吃街，陈添记鱼皮等', duration: '建议游玩 2 小时', type: '美食街' },
    ],
    nature: [
      { name: '白云山', description: '羊城第一秀，广州的城市绿肺', duration: '建议游玩 5 小时', type: '自然' },
      { name: '广州塔（小蛮腰）', description: '广州地标建筑，最高摩天轮与空中漫步', duration: '建议游玩 3 小时', type: '地标' },
      { name: '长隆旅游度假区', description: '世界级主题公园集群，欢乐世界与野生动物园', duration: '建议游玩 10 小时', type: '主题公园' },
      { name: '南沙湿地公园', description: '珠江三角洲的候鸟天堂', duration: '建议游玩 5 小时', type: '自然' },
      { name: '海珠湖', description: '广州城市中心湿地公园，休闲骑行胜地', duration: '建议游玩 3 小时', type: '自然' },
    ]
  },
  南京: {
    name: '南京',
    foodScore: 82,
    transportScore: 85,
    baseCost: 380,
    cultural: [
      { name: '中山陵', description: '孙中山先生陵墓，中国近代建筑史上第一陵', duration: '建议游玩 3.5 小时', type: '古迹' },
      { name: '明孝陵', description: '明太祖朱元璋陵寝，明清皇家陵寝之首', duration: '建议游玩 3 小时', type: '古迹' },
      { name: '夫子庙秦淮河', description: '南京母亲河，十里秦淮繁华地', duration: '建议游玩 3 小时', type: '文化街区' },
      { name: '南京博物院', description: '中国三大博物馆之一，民国馆特色鲜明', duration: '建议游玩 4 小时', type: '博物馆' },
      { name: '总统府', description: '民国政府所在地，中国近代史的缩影', duration: '建议游玩 3 小时', type: '古迹' },
    ],
    food: [
      { name: '夫子庙小吃', description: '南京小吃聚集地，鸭血粉丝汤、盐水鸭等', duration: '建议游玩 2 小时', type: '美食街' },
      { name: '老门东', description: '南京城南老街巷，老字号与文艺小店', duration: '建议游玩 2.5 小时', type: '文化街区' },
      { name: '狮子桥美食街', description: '湖南路商圈内的南京美食聚集地', duration: '建议游玩 2 小时', type: '美食街' },
      { name: '回味鸭血粉丝', description: '南京连锁名店，鸭血粉丝汤代表', duration: '建议用餐 1 小时', type: '餐厅' },
      { name: '南京大牌档', description: '南京特色连锁餐饮，地道金陵菜系', duration: '建议用餐 1.5 小时', type: '餐厅' },
    ],
    nature: [
      { name: '玄武湖', description: '中国最大的皇家园林湖泊，江南三大名湖', duration: '建议游玩 4 小时', type: '自然' },
      { name: '紫金山', description: '南京城的母亲山，中山陵与明孝陵所在地', duration: '建议游玩 6 小时', type: '自然' },
      { name: '栖霞山', description: '金陵第一明秀山，秋季红叶胜地', duration: '建议游玩 5 小时', type: '自然' },
      { name: '牛首山', description: '佛教牛头禅宗发源地，佛顶宫震撼建筑', duration: '建议游玩 5 小时', type: '自然' },
      { name: '莫愁湖', description: '江南名湖，莫愁女传说的发生地', duration: '建议游玩 2.5 小时', type: '自然' },
    ]
  },
  武汉: {
    name: '武汉',
    foodScore: 90,
    transportScore: 88,
    baseCost: 330,
    cultural: [
      { name: '黄鹤楼', description: '江南三大名楼之首，天下江山第一楼', duration: '建议游玩 2.5 小时', type: '古迹' },
      { name: '湖北省博物馆', description: '越王勾践剑与曾侯乙编钟出土地', duration: '建议游玩 3.5 小时', type: '博物馆' },
      { name: '武汉大学', description: '中国最美大学之一，樱花大道闻名', duration: '建议游玩 3 小时', type: '校园' },
      { name: '古琴台', description: '高山流水遇知音，伯牙子期故事发生地', duration: '建议游玩 1.5 小时', type: '古迹' },
      { name: '汉口租界', description: '近代租界建筑群，武汉近代史见证', duration: '建议游玩 2.5 小时', type: '文化街区' },
    ],
    food: [
      { name: '户部巷', description: '汉味早点第一巷，热干面发源地', duration: '建议游玩 2 小时', type: '美食街' },
      { name: '吉庆街', description: '武汉夜市文化代表，夜宵与民俗表演', duration: '建议游玩 2.5 小时', type: '美食街' },
      { name: '江汉路', description: '武汉最繁华的步行街，百年商业老街', duration: '建议游玩 3 小时', type: '商圈' },
      { name: '蔡林记', description: '武汉热干面老字号，创立于1928年', duration: '建议用餐 1 小时', type: '餐厅' },
      { name: '巴厘龙虾', description: '武汉小龙虾名店，油焖大虾代表', duration: '建议用餐 2 小时', type: '餐厅' },
    ],
    nature: [
      { name: '东湖', description: '中国最大的城中湖，比杭州西湖大六倍', duration: '建议游玩 5 小时', type: '自然' },
      { name: '木兰山', description: '千年香火圣地，花木兰故里', duration: '建议游玩 6 小时', type: '自然' },
      { name: '武汉长江大桥', description: '万里长江第一桥，连接龟蛇二山', duration: '建议游玩 1.5 小时', type: '地标' },
      { name: '木兰草原', description: '华中地区唯一的草原风情景区', duration: '建议游玩 6 小时', type: '自然' },
      { name: '梁子湖', description: '湖北第二大淡水湖，武昌鱼原产地', duration: '建议游玩 6 小时', type: '自然' },
    ]
  },
  重庆: {
    name: '重庆',
    foodScore: 92,
    transportScore: 78,
    baseCost: 340,
    cultural: [
      { name: '洪崖洞', description: '巴渝传统吊脚楼建筑，夜景堪比千与千寻', duration: '建议游玩 3 小时', type: '文化街区' },
      { name: '磁器口古镇', description: '重庆千年古镇，巴渝文化缩影', duration: '建议游玩 3 小时', type: '古镇' },
      { name: '大足石刻', description: '世界文化遗产，唐宋石窟艺术巅峰', duration: '建议游玩 5 小时', type: '古迹' },
      { name: '解放碑', description: '重庆地标，全国唯一的抗战胜利纪念碑', duration: '建议游玩 2 小时', type: '地标' },
      { name: '三峡博物馆', description: '了解三峡工程与巴渝文化的最佳场所', duration: '建议游玩 3 小时', type: '博物馆' },
    ],
    food: [
      { name: '解放碑好吃街', description: '重庆最繁华的美食街，酸辣粉、小面等', duration: '建议游玩 2 小时', type: '美食街' },
      { name: '磁器口古镇小吃', description: '陈麻花、毛血旺、千张皮等古镇特色', duration: '建议游玩 2 小时', type: '美食街' },
      { name: '南山一棵树（火锅）', description: '边看夜景边吃重庆火锅的绝佳地点', duration: '建议用餐 2.5 小时', type: '餐厅' },
      { name: '小天鹅火锅', description: '重庆火锅老字号，地道九宫格麻辣味', duration: '建议用餐 2 小时', type: '餐厅' },
      { name: '花市豌杂面', description: '重庆小面前十强，豌杂面代表', duration: '建议用餐 1 小时', type: '餐厅' },
    ],
    nature: [
      { name: '武隆天坑', description: '世界自然遗产，变形金刚取景地', duration: '建议游玩 8 小时', type: '自然' },
      { name: '长江索道', description: '万里长江第一条空中走廊，山城特色交通', duration: '建议游玩 1 小时', type: '体验' },
      { name: '南山', description: '重庆主城最高峰，俯瞰全城夜景最佳地', duration: '建议游玩 5 小时', type: '自然' },
      { name: '金佛山', description: '世界自然遗产，喀斯特地貌典范', duration: '建议游玩 8 小时', type: '自然' },
      { name: '仙女山', description: '南国第一牧场，高山草原与森林', duration: '建议游玩 8 小时', type: '自然' },
    ]
  },
  厦门: {
    name: '厦门',
    foodScore: 86,
    transportScore: 84,
    baseCost: 420,
    cultural: [
      { name: '鼓浪屿', description: '世界文化遗产，万国建筑博览，钢琴之岛', duration: '建议游玩 6 小时', type: '岛屿' },
      { name: '南普陀寺', description: '闽南佛教圣地，千年古刹', duration: '建议游玩 2 小时', type: '古迹' },
      { name: '厦门大学', description: '中国最美大学之一，面朝大海的校园', duration: '建议游玩 2.5 小时', type: '校园' },
      { name: '胡里山炮台', description: '清代海防炮台，世界最大海岸炮', duration: '建议游玩 2 小时', type: '古迹' },
      { name: '曾厝垵', description: '闽南文创渔村，文艺小店与特色民宿', duration: '建议游玩 2.5 小时', type: '文化街区' },
    ],
    food: [
      { name: '中山路步行街', description: '厦门最繁华的商业街，南洋骑楼建筑', duration: '建议游玩 2.5 小时', type: '商圈' },
      { name: '八市', description: '厦门老菜市场，最新鲜的海鲜与本地小吃', duration: '建议游玩 2 小时', type: '美食街' },
      { name: '沙茶面（乌糖）', description: '厦门沙茶面代表，浓郁汤头与丰富配料', duration: '建议用餐 1 小时', type: '餐厅' },
      { name: '鼓浪屿小吃', description: '鱼丸、海蛎煎、土笋冻等岛屿特色', duration: '建议游玩 2 小时', type: '美食街' },
      { name: '姜母鸭（好清香）', description: '厦门老字号，闽南名菜姜母鸭', duration: '建议用餐 1.5 小时', type: '餐厅' },
    ],
    nature: [
      { name: '环岛路', description: '厦门最美海岸线，骑行看海的最佳路线', duration: '建议游玩 4 小时', type: '自然' },
      { name: '武夷山', description: '世界文化与自然双遗产，丹霞地貌与茶文化', duration: '建议游玩 10 小时', type: '自然' },
      { name: '日月谷温泉', description: '福建省首家大型温泉度假村', duration: '建议游玩 5 小时', type: '休闲' },
      { name: '万石植物园', description: '中国最早建立的植物园之一，多肉植物区网红', duration: '建议游玩 3.5 小时', type: '自然' },
      { name: '集美学村', description: '陈嘉庚先生创办的学村，嘉庚建筑典范', duration: '建议游玩 3 小时', type: '自然' },
    ]
  }
};

const weatherOptions = ['晴', '多云', '阴', '小雨', '中雨'];
const weatherAlerts = ['', '', '', '', '注意防晒，紫外线较强', '可能有雷阵雨，建议携带雨具', '气温骤降，注意添衣'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function generateDailyItinerary(cityData, theme, days) {
  const attractionPool = theme === '文化古迹线' ? cityData.cultural
    : theme === '美食休闲线' ? cityData.food
    : cityData.nature;
  
  const mixedPool = [
    ...attractionPool,
    ...shuffleArray(cityData.cultural).slice(0, 2),
    ...shuffleArray(cityData.food).slice(0, 2),
    ...shuffleArray(cityData.nature).slice(0, 2)
  ];
  
  const selected = shuffleArray(mixedPool).slice(0, days * 3);
  const itinerary = [];
  
  for (let d = 0; d < days; d++) {
    const weather = getRandomItem(weatherOptions);
    const alert = Math.random() > 0.7 ? getRandomItem(weatherAlerts) : undefined;
    const dayAttractions = [];
    const times = ['09:00', '11:30', '14:00', '16:30'];
    
    const count = 3 + Math.floor(Math.random() * 2);
    for (let a = 0; a < count && d * 3 + a < selected.length; a++) {
      const attr = selected[d * 3 + a];
      dayAttractions.push({
        id: uuidv4(),
        name: attr.name,
        description: attr.description,
        duration: attr.duration,
        type: attr.type,
        time: times[a] || '18:00'
      });
    }
    
    itinerary.push({
      day: d + 1,
      date: `Day ${d + 1}`,
      weather,
      weatherAlert: alert,
      attractions: dayAttractions,
      transport: ['地铁+公交', '打车', '地铁', '步行+公交', '景区直通车'][Math.floor(Math.random() * 5)],
      dailyCost: Math.round(cityData.baseCost * (0.8 + Math.random() * 0.6))
    });
  }
  
  return itinerary;
}

function generateRoutes(city, days) {
  const cityData = cityDatabase[city];
  if (!cityData) {
    return [];
  }
  
  const themes = [
    { key: '文化古迹线', theme: '探访历史古迹，感受千年文化底蕴', fitBase: 80, costMul: 1.0 },
    { key: '美食休闲线', theme: '品地道美食，享受慢生活休闲时光', fitBase: 75, costMul: 1.1 },
    { key: '自然探险线', theme: '亲近自然山水，体验户外探险乐趣', fitBase: 78, costMul: 1.2 }
  ];
  
  return themes.map(t => {
    const dailyPlan = generateDailyItinerary(cityData, t.key, days);
    const totalCost = dailyPlan.reduce((sum, d) => sum + d.dailyCost, 0);
    const allTypes = new Set(dailyPlan.flatMap(d => d.attractions.map(a => a.type)));
    
    return {
      id: uuidv4(),
      title: t.key,
      theme: t.theme,
      totalDays: days,
      fitScore: Math.round(t.fitBase + Math.random() * 15),
      costRange: {
        min: Math.round(totalCost * 0.85),
        max: Math.round(totalCost * 1.2)
      },
      foodScore: cityData.foodScore,
      transportScore: cityData.transportScore,
      attractionTypes: allTypes.size,
      weatherSuitability: Math.round(60 + Math.random() * 35),
      dailyItinerary: dailyPlan
    };
  });
}

app.get('/api/routes', (req, res) => {
  const { city, days } = req.query;
  
  if (!city || !days) {
    return res.status(400).json({
      success: false,
      error: '请提供城市和天数参数'
    });
  }
  
  const numDays = parseInt(days, 10);
  if (isNaN(numDays) || numDays < 1 || numDays > 14) {
    return res.status(400).json({
      success: false,
      error: '天数必须在1-14之间'
    });
  }
  
  if (!cityDatabase[city]) {
    return res.status(404).json({
      success: false,
      error: `暂不支持城市：${city}。支持的城市：${Object.keys(cityDatabase).join('、')}`
    });
  }
  
  const routes = generateRoutes(city, numDays);
  
  setTimeout(() => {
    res.json({
      success: true,
      data: routes
    });
  }, 1200);
});

app.get('/api/cities', (_req, res) => {
  res.json({
    success: true,
    data: Object.keys(cityDatabase)
  });
});

app.listen(PORT, () => {
  console.log(`Travel Planner API server running on http://localhost:${PORT}`);
  console.log(`Supported cities: ${Object.keys(cityDatabase).join(', ')}`);
});
