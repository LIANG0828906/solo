const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');

const router = Router();

const usernames = [
  '咖啡爱好者小王', '环保达人Lisa', '美食探店家', '科技先锋', '生活记录者',
  '旅行者阿杰', '读书爱好者', '健身达人Mike', '摄影师小雨', '设计师张三',
  '产品经理老李', '程序员大刘', '运营小姐姐', '市场分析师', '创意总监'
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomTimestamp(timeRange) {
  const now = new Date();
  let hoursBack = 24;
  
  switch (timeRange) {
    case '24h':
      hoursBack = 24;
      break;
    case '7d':
      hoursBack = 24 * 7;
      break;
    case '30d':
      hoursBack = 24 * 30;
      break;
    default:
      hoursBack = 24;
  }
  
  const randomMs = Math.random() * hoursBack * 60 * 60 * 1000;
  const timestamp = new Date(now.getTime() - randomMs);
  return timestamp.toISOString();
}

function generateContent(keyword, sentiment) {
  const templates = {
    positive: [
      `这个${keyword}真的太棒了，用了之后感觉生活品质都提升了！`,
      `强烈推荐这款${keyword}，性价比超高，用起来非常舒适。`,
      `买了这个${keyword}之后，朋友们都问我在哪买的，太满意了！`,
      `${keyword}的设计很用心，细节处理得很好，值得入手。`,
      `用了一周${keyword}，体验感满分，是最近买过最满意的东西。`,
      `这款${keyword}真的很赞，功能强大而且外观漂亮。`,
      `${keyword}太棒了，已经推荐给身边所有朋友了！`,
      `收到${keyword}很惊喜，比想象中还要好，必须给好评。`
    ],
    negative: [
      `这个${keyword}太让我失望了，质量很差，不推荐购买。`,
      `买了${keyword}之后后悔了，价格贵还不好用，踩雷了。`,
      `这款${keyword}名不副实，宣传和实物差太远了。`,
      `${keyword}用了几天就出问题，客服态度也不好，差评。`,
      `不建议买这个${keyword}，性价比太低，浪费钱。`,
      `${keyword}的做工很粗糙，和图片上完全不一样。`,
      `买了这个${keyword}真的很后悔，难用还占地方。`,
      `${keyword}太坑了，不值这个价，大家别上当。`
    ],
    neutral: [
      `刚收到${keyword}，先试用几天看看效果再说。`,
      `这个${keyword}中规中矩吧，没有特别惊艳的感觉。`,
      `${keyword}整体还行，就是价格稍微有点贵。`,
      `关于${keyword}，网上评价褒贬不一，我也想试试。`,
      `用了一段时间${keyword}，感觉和普通产品差不多。`,
      `这款${keyword}功能基本够用，但没什么特别的亮点。`,
      `${keyword}到货了，包装一般，先用用看。`,
      `看到很多人讨论${keyword}，我也来分享一下使用感受。`
    ]
  };
  
  return getRandomItem(templates[sentiment] || templates.neutral);
}

function generateCommentContent(keyword, sentiment) {
  const templates = {
    positive: [
      `同意楼主，这个${keyword}确实好用！`,
      `我也在用这款${keyword}，体验很不错~`,
      `${keyword}的质量确实没话说，点赞！`,
      `看完帖子我也想买一个${keyword}了。`,
      `这款${keyword}我用了半年，依然很满意。`
    ],
    negative: [
      `我也觉得这个${keyword}不太行...`,
      `还好没买这个${keyword}，谢谢避雷。`,
      `${keyword}的售后确实很差，我也遇到过。`,
      `同感，这个${keyword}性价比真的不高。`,
      `我买的${keyword}也出问题了，太坑了。`
    ],
    neutral: [
      `观望中，不知道到底值不值得买。`,
      `请问${keyword}适合新手使用吗？`,
      `有其他品牌的${keyword}推荐吗？`,
      `想知道${keyword}的具体尺寸是多少。`,
      `这个${keyword}一般能用多久啊？`
    ]
  };
  
  return getRandomItem(templates[sentiment] || templates.neutral);
}

function generateComments(keyword, count, timeRange, postTimestamp) {
  const comments = [];
  const sentiments = ['positive', 'neutral', 'negative'];
  const postTime = new Date(postTimestamp).getTime();
  const now = Date.now();
  const maxCommentDelay = Math.min(now - postTime, 60 * 60 * 1000);
  
  for (let i = 0; i < count; i++) {
    const sentiment = getRandomItem(sentiments);
    const commentDelay = Math.random() * maxCommentDelay;
    const commentTimestamp = new Date(postTime + commentDelay);
    comments.push({
      id: uuidv4(),
      username: getRandomItem(usernames),
      content: generateCommentContent(keyword, sentiment),
      timestamp: commentTimestamp.toISOString(),
      likes: getRandomInt(0, 100),
      sentiment
    });
  }
  
  return comments;
}

function generatePosts(keyword, timeRange, count) {
  const posts = [];
  const sentiments = ['positive', 'neutral', 'negative'];
  const sentimentWeights = [0.4, 0.35, 0.25];
  
  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    let sentiment;
    if (rand < sentimentWeights[0]) {
      sentiment = 'positive';
    } else if (rand < sentimentWeights[0] + sentimentWeights[1]) {
      sentiment = 'neutral';
    } else {
      sentiment = 'negative';
    }
    
    const commentCount = getRandomInt(3, 8);
    const timestamp = generateRandomTimestamp(timeRange);
    posts.push({
      id: uuidv4(),
      username: getRandomItem(usernames),
      content: generateContent(keyword, sentiment),
      timestamp,
      likes: getRandomInt(10, 5000),
      comments: generateComments(keyword, commentCount, timeRange, timestamp)
    });
  }
  
  posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  return posts;
}

router.get('/posts', (req, res) => {
  const { keyword = '环保咖啡杯', timeRange = '24h' } = req.query;
  
  const postCount = 25;
  const posts = generatePosts(keyword, timeRange, postCount);
  
  res.json({
    success: true,
    data: {
      keyword,
      timeRange,
      total: posts.length,
      posts
    }
  });
});

module.exports = router;
