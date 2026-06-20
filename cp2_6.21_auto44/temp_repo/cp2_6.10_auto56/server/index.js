import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

let currentMarketTrend = '平';
let trendLastUpdated = Date.now();
const transactions = [];

const TRENDS = ['旺', '平', '淡'];

const refreshMarketTrend = () => {
  const randomIndex = Math.floor(Math.random() * TRENDS.length);
  currentMarketTrend = TRENDS[randomIndex];
  trendLastUpdated = Date.now();
  console.log(`[${new Date().toLocaleTimeString()}] 牛市指数更新为: ${currentMarketTrend}`);
};

refreshMarketTrend();

setInterval(refreshMarketTrend, 30000);

app.get('/api/market-trend', (req, res) => {
  res.json({
    trend: currentMarketTrend,
    timestamp: trendLastUpdated,
    nextRefresh: 30 - Math.floor((Date.now() - trendLastUpdated) / 1000)
  });
});

app.post('/api/transactions', (req, res) => {
  const {
    transactionAmount,
    agentFee,
    taxFee,
    farmerPrice,
    shopkeeperPrice,
    marketTrend,
    cattleId
  } = req.body;

  const newTransaction = {
    id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    transactionAmount,
    agentFee,
    taxFee,
    farmerPrice,
    shopkeeperPrice,
    marketTrend,
    cattleId
  };

  transactions.push(newTransaction);
  console.log(`[${new Date().toLocaleTimeString()}] 新交易记录: ${newTransaction.id}`, {
    交易额: `${transactionAmount}两`,
    牙钱: `${agentFee}两`,
    税钱: `${taxFee}两`
  });

  res.status(201).json(newTransaction);
});

app.get('/api/transactions', (req, res) => {
  res.json(transactions);
});

app.get('/api/transactions/:id', (req, res) => {
  const transaction = transactions.find(t => t.id === req.params.id);
  if (transaction) {
    res.json(transaction);
  } else {
    res.status(404).json({ error: '交易记录不存在' });
  }
});

app.get('/api/stats', (req, res) => {
  const totalTransactions = transactions.length;
  const totalAmount = transactions.reduce((sum, t) => sum + t.transactionAmount, 0);
  const totalAgentFees = transactions.reduce((sum, t) => sum + t.agentFee, 0);
  const totalTaxes = transactions.reduce((sum, t) => sum + t.taxFee, 0);

  const trendCounts = transactions.reduce((acc, t) => {
    acc[t.marketTrend] = (acc[t.marketTrend] || 0) + 1;
    return acc;
  }, {});

  res.json({
    totalTransactions,
    totalAmount,
    totalAgentFees,
    totalTaxes,
    trendCounts,
    currentTrend: currentMarketTrend,
    averageTransaction: totalTransactions > 0 ? Math.round(totalAmount / totalTransactions) : 0
  });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║     🏮 汴京大相国寺 - 牙人交易后端服务 🏮               ║
╠══════════════════════════════════════════════════════════╣
║  服务已启动于: http://localhost:3002                     ║
║  当前牛市指数: ${currentMarketTrend}                                    ║
║                                                          ║
║  API 接口:                                               ║
║    GET  /api/market-trend    - 获取当前行情              ║
║    POST /api/transactions    - 提交交易记录              ║
║    GET  /api/transactions    - 获取交易历史              ║
║    GET  /api/stats           - 获取统计数据              ║
║                                                          ║
║  行情每30秒自动刷新一次                                  ║
╚══════════════════════════════════════════════════════════╝
  `);
});
