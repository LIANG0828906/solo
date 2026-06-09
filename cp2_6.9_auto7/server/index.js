const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const mockTexts = [
  '我们需要优化用户登录流程',
  '设计一个新的产品首页',
  '考虑使用AI技术提升用户体验',
  '移动端适配需要加强',
  '数据分析功能要更直观',
  '增加社交分享功能',
  '性能优化是关键',
  '用户反馈收集系统',
  '品牌视觉需要升级',
  '考虑微服务架构改造',
  '建立完善的测试体系',
  '自动化部署流程',
  '用户画像系统建设',
  '推荐算法优化',
  '安全性评估和加固'
];

const clusterDefinitions = [
  { name: '科技话题', color: '#4caf50', keywords: ['AI', '技术', '架构', '算法', '性能', '微服务', '安全', '测试', '部署', '自动化'] },
  { name: '设计话题', color: '#ff9800', keywords: ['设计', '视觉', 'UI', '用户体验', 'UX', '品牌', '移动端', '适配', '首页'] },
  { name: '商业话题', color: '#2196f3', keywords: ['用户', '产品', '数据', '分享', '社交', '反馈', '运营', '推荐', '画像'] }
];

function analyzeCluster(text) {
  const lowerText = text.toLowerCase();
  let bestMatch = null;
  let maxHits = 0;

  for (const cluster of clusterDefinitions) {
    let hits = 0;
    for (const keyword of cluster.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        hits++;
      }
    }
    if (hits > maxHits) {
      maxHits = hits;
      bestMatch = cluster;
    }
  }

  if (!bestMatch) {
    bestMatch = clusterDefinitions[Math.floor(Math.random() * clusterDefinitions.length)];
  }

  return bestMatch;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.post('/api/transcribe', async (req, res) => {
  await delay(200);
  const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
  res.json({
    text: randomText,
    confidence: 0.85 + Math.random() * 0.15
  });
});

app.post('/api/analyze', async (req, res) => {
  await delay(200);
  const { bubbles } = req.body;

  const clustersMap = new Map();
  const sentiments = {};

  for (const clusterDef of clusterDefinitions) {
    clustersMap.set(clusterDef.name, {
      name: clusterDef.name,
      color: clusterDef.color,
      count: 0,
      bubbleIds: []
    });
  }

  for (const bubble of bubbles) {
    const cluster = analyzeCluster(bubble.content);
    const clusterData = clustersMap.get(cluster.name);
    if (clusterData) {
      clusterData.count++;
      clusterData.bubbleIds.push(bubble.id);
    }
    sentiments[bubble.id] = Math.floor(30 + Math.random() * 70);
  }

  const clusters = Array.from(clustersMap.values()).filter(c => c.count > 0);

  res.json({
    clusters,
    sentiments
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
