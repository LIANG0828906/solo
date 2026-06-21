import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const topicKeywords = {
  '旅行': ['自驾游', '背包客', '穷游', '民宿', '打卡', '攻略', '美食', '风景', '摄影', '机票', '酒店', '签证', '海岛', '雪山', '古镇', '徒步', '露营', '滑翔伞', '潜水', '日出', '日落', '星空', '云海', '瀑布', '沙漠', '草原', '古城', '博物馆', '艺术馆', '夜市', '小吃', '特产', '伴手礼', 'vlog', '旅行日记', '说走就走', '一人游', '亲子游', '情侣游', '闺蜜游', '毕业旅行', '蜜月旅行', '环岛', '登山', '滑雪', '温泉', '沙滩', '冲浪', '跳伞'],
  '科技': ['AI', 'GPT', '人工智能', '机器学习', '深度学习', '神经网络', '大模型', '生成式AI', 'Prompt', 'AI绘画', 'ChatGPT', 'Claude', 'Gemini', '文心一言', '通义千问', 'AI助手', '自动驾驶', '机器人', '元宇宙', 'VR', 'AR', 'MR', '虚拟现实', '增强现实', '区块链', 'Web3', 'NFT', '加密货币', '比特币', '以太坊', '智能合约', '量子计算', '芯片', '5G', '6G', '物联网', 'IoT', '智能家居', '智能穿戴', '无人机', '航空航天', 'SpaceX', '星链', '新能源', '电动车', '特斯拉', '比亚迪', '电池技术', '光伏', '风电', '储能'],
  '美食': ['家常菜', '快手菜', '减脂餐', '健身餐', '早餐', '午餐', '晚餐', '夜宵', '甜点', '烘焙', '蛋糕', '面包', '咖啡', '奶茶', '火锅', '烧烤', '日料', '韩料', '泰菜', '法餐', '意餐', '中餐', '川菜', '粤菜', '湘菜', '鲁菜', '苏菜', '浙菜', '闽菜', '徽菜', '小吃', '路边摊', '探店', '吃播', '美食vlog', '做饭', '菜谱', '调料', '食材', '有机', '健康', '素食', ' gluten free', '低糖', '低卡', '高蛋白', '空气炸锅', '电饭煲', '烤箱', '厨艺'],
  '健身': ['增肌', '减脂', '塑形', '马甲线', '腹肌', '翘臀', '瘦腿', '瘦腰', '减肥', '瘦身', '运动', '跑步', '马拉松', '瑜伽', '普拉提', '拳击', '格斗', 'CrossFit', 'HIIT', '有氧', '无氧', '力量训练', '器械训练', '徒手健身', '街头健身', '健身房', '私教', '健身餐', '蛋白粉', '肌酸', '氮泵', '补剂', '卡路里', '基础代谢', '体脂率', 'BMI', '运动表现', '拉伸', '热身', '损伤预防', '康复训练', '体态矫正', '圆肩', '驼背', '骨盆前倾', 'XO型腿', '健身打卡', '健身日记', '坚持'],
  '时尚': ['穿搭', 'OOTD', '潮流', '复古', '街头风', '简约风', '法式风', 'ins风', '日系', '韩系', '欧美风', '甜酷', '温柔风', '通勤装', '约会装', '度假风', '学生党', '小个子', '微胖穿搭', '大码女装', '男装', '中性风', '无性别', '配饰', '首饰', '包包', '鞋子', '帽子', '围巾', '眼镜', '手表', '香水', '美妆', '护肤', '化妆', '妆容', '发型', '美甲', '美睫', '纹身', '小众品牌', '设计师品牌', '奢侈品', '平价替代', '薅羊毛', '开箱', '测评', '种草', '避坑']
};

const defaultKeywords = ['热门', '推荐', '爆款', '最新', '必看', '干货', '分享', '教程', '测评', '开箱', 'vlog', '日常', '记录', '生活', '挑战', '反转', '爆料', '内幕', '科普', '知识', '技能', '技巧', '方法', '攻略', '指南', '盘点', '合集', '系列', '原创', '独家', '首发', '限量', '限定', '福利', '免费', '优惠', '折扣', '秒杀', '团购', '预售', '预约', '排队', '打卡', '探店', '体验', '感受', '评价', '推荐指数', '踩雷', '避坑'];

const warmColors = ['#FF6B6B', '#FCA5A5', '#F59E0B'];

function generateKeywords(topic, count = 80) {
  const baseWords = topicKeywords[topic] || defaultKeywords;
  const shuffled = [...baseWords].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, baseWords.length, 100));
  
  return selected.map(word => ({
    word,
    weight: Math.floor(Math.random() * 90) + 10,
    color: warmColors[Math.floor(Math.random() * warmColors.length)],
    id: uuidv4()
  })).sort((a, b) => b.weight - a.weight);
}

function generateHistory(topic) {
  const history = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    history.push({
      date: dateStr,
      keywords: generateKeywords(topic, 15)
    });
  }
  
  return history;
}

const dataCache = new Map();

app.get('/api/trends/:topic', async (req, res) => {
  const { topic } = req.params;
  const cacheKey = `trends_${topic}`;
  
  await new Promise(resolve => setTimeout(resolve, 200));
  
  let data = dataCache.get(cacheKey);
  if (!data) {
    data = {
      topic,
      keywords: generateKeywords(topic, 80),
      timestamp: Date.now()
    };
    dataCache.set(cacheKey, data);
  }
  
  res.json(data);
});

app.get('/api/history/:topic', async (req, res) => {
  const { topic } = req.params;
  const cacheKey = `history_${topic}`;
  
  let data = dataCache.get(cacheKey);
  if (!data) {
    data = {
      topic,
      history: generateHistory(topic)
    };
    dataCache.set(cacheKey, data);
  }
  
  res.json(data);
});

app.get('/api/preset-tags', (_req, res) => {
  res.json({
    tags: ['旅行', '科技', '美食', '健身', '时尚', '娱乐', '游戏', '教育', '职场', '财经', '房产', '汽车', '数码', '摄影', '音乐', '电影', '动漫', '游戏', '体育', '军事']
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
