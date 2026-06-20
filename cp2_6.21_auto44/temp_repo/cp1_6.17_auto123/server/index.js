import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

const inspirationCards = [
  { id: '1', type: '故事开头', title: '雨夜来客', content: '那天晚上，雨下得很大，有人敲响了你家的门。当你打开门时，站在那里的竟然是……' },
  { id: '2', type: '对话片段', title: '秘密交换', content: '"你确定要这么做吗？"她压低声音问。"我没有选择了，"他回答，"要么现在，要么永远没有机会。"' },
  { id: '3', type: '场景描写', title: '废弃花园', content: '杂草从石缝中疯长，喷泉早已干涸，唯有那朵玫瑰在废墟中绽放，仿佛时光从未流逝。' },
  { id: '4', type: '情感表达', title: '离别时刻', content: '站台上，火车即将启程。她知道这可能是最后一次见面，却说不出一句告别的话。' },
  { id: '5', type: '悬念设置', title: '神秘信件', content: '信封上没有寄件人地址，只有你的名字，用你从未见过的笔迹写成。你拆开信，里面只有一行字……' },
  { id: '6', type: '故事开头', title: '镜中世界', content: '你站在镜子前，忽然发现镜中的自己在微笑——而你并没有。' },
  { id: '7', type: '对话片段', title: '午夜来电', content: '"你知道现在几点吗？""三点零七分。""不，是三点零七分零一秒。每一秒都很重要，尤其是现在。"' },
  { id: '8', type: '场景描写', title: '深海之光', content: '在深海最黑暗的地方，一束微光缓缓靠近。那不是鱼群，而是一座沉睡了千年的城市。' },
  { id: '9', type: '情感表达', title: '旧照片', content: '翻到那张旧照片时，他的手微微颤抖。照片上的人笑得那么灿烂，仿佛未来还很遥远。' },
  { id: '10', type: '悬念设置', title: '消失的房间', content: '公寓楼的住户都记得四楼有401到405五个房间，但今天早上，403号房间消失了——连同里面的一切。' },
  { id: '11', type: '故事开头', title: '时间旅人', content: '他第一次注意到时间不对劲，是在星期三的早晨——已经第三次经历了。' },
  { id: '12', type: '对话片段', title: '天才的困惑', content: '"我能计算出宇宙的年龄，却算不出她为什么离开。""也许因为人心不是公式。"' },
  { id: '13', type: '场景描写', title: '极光之下', content: '极光在天空中舞动，将整片冰原染成了翠绿色。他终于理解了为什么古人相信那里住着神灵。' },
  { id: '14', type: '情感表达', title: '重逢', content: '十年后再见面，他们都没有变老，只是眼神里多了一些只有彼此才能读懂的东西。' },
  { id: '15', type: '悬念设置', title: '密码日记', content: '她留下的日记最后一页写着：如果你正在读这段话，说明我的计划已经开始了。' },
  { id: '16', type: '故事开头', title: '最后一班列车', content: '午夜十二点的最后一班列车上，只有三名乘客——但他们要去的是同一个目的地。' },
  { id: '17', type: '对话片段', title: '祖孙之间', content: '"奶奶，你年轻时是什么样？""和你一样，觉得自己无所不能，直到有一天发现，脆弱也是一种力量。"' },
  { id: '18', type: '场景描写', title: '旧书店', content: '书架上的灰尘在午后阳光中起舞，空气中弥漫着旧纸张的气味，每本书都像一扇通往另一个时代的门。' },
  { id: '19', type: '情感表达', title: '第一场雪', content: '今年的第一场雪比往年早了一周。她站在窗前，想起他说过最喜欢初雪，而他已经不在了。' },
  { id: '20', type: '悬念设置', title: '双面人生', content: '同事们都说他是最好的会计师，没有人知道他抽屉里那把钥匙通向哪里。' },
];

let records = [];

app.get('/api/card', (req, res) => {
  const randomIndex = Math.floor(Math.random() * inspirationCards.length);
  res.json(inspirationCards[randomIndex]);
});

app.post('/api/records', (req, res) => {
  const { cardId, duration, wordCount, cardTitle, startTime } = req.body;
  const record = {
    id: uuidv4(),
    cardId,
    cardTitle,
    duration,
    wordCount,
    startTime: startTime || new Date().toISOString(),
  };
  records.unshift(record);
  res.json({ id: record.id, success: true });
});

app.get('/api/records', (req, res) => {
  res.json(records);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
