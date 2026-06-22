const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const poetrySessions = [];

const toneDictionary = {
  '一': 'ping', '二': 'ze', '三': 'ping', '四': 'ze', '五': 'ze', '六': 'ze', '七': 'ping', '八': 'ping', '九': 'ze', '十': 'ping',
  '天': 'ping', '地': 'ze', '人': 'ping', '日': 'ze', '月': 'ze', '山': 'ping', '水': 'ze', '风': 'ping', '云': 'ping', '雨': 'ze',
  '春': 'ping', '夏': 'ze', '秋': 'ping', '冬': 'ping', '花': 'ping', '草': 'ze', '树': 'ze', '木': 'ze', '林': 'ping', '森': 'ping',
  '东': 'ping', '西': 'ping', '南': 'ping', '北': 'ze', '中': 'ping', '上': 'ze', '下': 'ze', '左': 'ze', '右': 'ze', '前': 'ping',
  '红': 'ping', '黄': 'ping', '蓝': 'ping', '绿': 'ze', '白': 'ze', '黑': 'ze', '青': 'ping', '紫': 'ze', '金': 'ping', '银': 'ping',
  '大': 'ze', '小': 'ze', '高': 'ping', '低': 'ping', '长': 'ping', '短': 'ze', '远': 'ze', '近': 'ze', '深': 'ping', '浅': 'ze',
  '来': 'ping', '去': 'ze', '开': 'ping', '落': 'ze', '生': 'ping', '死': 'ze', '起': 'ze', '伏': 'ze', '升': 'ping', '降': 'ze',
  '山': 'ping', '河': 'ping', '海': 'ze', '江': 'ping', '湖': 'ping', '溪': 'ping', '泉': 'ping', '石': 'ze', '峰': 'ping', '岭': 'ze',
  '鸟': 'ze', '兽': 'ze', '虫': 'ping', '鱼': 'ping', '龙': 'ping', '虎': 'ze', '凤': 'ze', '凰': 'ping', '鹤': 'ze', '鹰': 'ping',
  '诗': 'ping', '书': 'ping', '画': 'ze', '琴': 'ping', '棋': 'ping', '酒': 'ze', '茶': 'ping', '歌': 'ping', '舞': 'ze', '曲': 'ze',
  '明': 'ping', '清': 'ping', '幽': 'ping', '雅': 'ze', '闲': 'ping', '静': 'ze', '寒': 'ping', '暖': 'ze', '凉': 'ping', '热': 'ze',
  '心': 'ping', '情': 'ping', '意': 'ze', '思': 'ping', '愁': 'ping', '恨': 'ze', '爱': 'ze', '怨': 'ze', '悲': 'ping', '欢': 'ping'
};

const meterPatterns = {
  'seven-zeqi': ['ze', 'ze', 'ping', 'ping', 'ping', 'ze', 'ze', 'ping', 'ping', 'ze', 'ze', 'ze', 'ping', 'ping'],
  'seven-pingqi': ['ping', 'ping', 'ze', 'ze', 'ping', 'ping', 'ze', 'ze', 'ze', 'ping', 'ping', 'ze', 'ze', 'ping'],
  'five-zeqi': ['ze', 'ze', 'ping', 'ping', 'ze', 'ping', 'ping', 'ze', 'ze', 'ping'],
  'five-pingqi': ['ping', 'ping', 'ping', 'ze', 'ze', 'ze', 'ze', 'ze', 'ping', 'ping']
};

const rhymeSections = [
  { name: '一东', characters: ['东', '同', '桐', '筒', '童', '铜', '瞳', '中', '衷', '忠', '虫', '冲', '终', '戎', '崇'] },
  { name: '二冬', characters: ['冬', '农', '宗', '钟', '龙', '松', '峰', '逢', '缝', '锋', '踪', '浓', '重', '钟', '从'] },
  { name: '三江', characters: ['江', '窗', '邦', '降', '双', '庄', '装', '腔', '撞', '幢', '桩', '缸', '杠', '扛', '艭'] },
  { name: '四支', characters: ['支', '枝', '移', '为', '垂', '吹', '陂', '碑', '奇', '宜', '仪', '皮', '儿', '离', '施'] },
  { name: '五微', characters: ['微', '薇', '晖', '辉', '挥', '围', '韦', '违', '帏', '腓', '肥', '飞', '非', '扉', '妃'] },
  { name: '六鱼', characters: ['鱼', '渔', '初', '书', '舒', '居', '裾', '车', '渠', '蔬', '疏', '虚', '嘘', '徐', '余'] },
  { name: '七虞', characters: ['虞', '愚', '娱', '无', '芜', '巫', '于', '盂', '臾', '萸', '区', '驱', '躯', '岖', '枢'] },
  { name: '八齐', characters: ['齐', '脐', '黎', '藜', '梨', '犁', '妻', '萋', '栖', '凄', '堤', '低', '提', '蹄', '啼'] },
  { name: '九佳', characters: ['佳', '街', '鞋', '阶', '皆', '偕', '谐', '骸', '柴', '钗', '侪', '淮', '怀', '槐', '回'] },
  { name: '十灰', characters: ['灰', '恢', '魁', '隈', '回', '洄', '徊', '槐', '徊', '梅', '枚', '玫', '雷', '崔', '催'] },
  { name: '十一真', characters: ['真', '因', '陈', '臣', '邻', '宾', '滨', '频', '贫', '神', '申', '伸', '身', '深', '淳'] },
  { name: '十二文', characters: ['文', '云', '纹', '蚊', '芬', '氛', '分', '纷', '焚', '坟', '群', '军', '君', '勋', '薰'] },
  { name: '十三元', characters: ['元', '原', '源', '园', '猿', '辕', '垣', '鸳', '怨', '昏', '魂', '痕', '根', '论', '坤'] },
  { name: '十四寒', characters: ['寒', '韩', '丹', '单', '安', '鞍', '难', '看', '刊', '官', '观', '冠', '欢', '宽', '盘'] },
  { name: '十五删', characters: ['删', '斑', '班', '还', '环', '弯', '湾', '攀', '顽', '蛮', '关', '山', '闲', '艰', '奸'] }
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getTone(char) {
  return toneDictionary[char] || 'unknown';
}

function getLineTones(line) {
  return line.split('').map(char => getTone(char));
}

function validateVerse(upperLine, lowerLine, lineType, meterType, prevVerse) {
  const result = {
    hasAojiu: false,
    aojiuPositions: [],
    hasGuping: false,
    gupingLine: null,
    hasHezhang: false,
    hezhangPositions: [],
    suggestions: [],
    tonePattern: ''
  };

  const upperTones = getLineTones(upperLine);
  const lowerTones = getLineTones(lowerLine);
  const lineLength = lineType === 'five' ? 5 : 7;

  result.tonePattern = upperTones.map(t => t === 'ping' ? '平' : t === 'ze' ? '仄' : '?').join('') + 
                       '，' + 
                       lowerTones.map(t => t === 'ping' ? '平' : t === 'ze' ? '仄' : '?').join('');

  const pattern = meterPatterns[meterType] || meterPatterns[`${lineType}-pingqi`];
  const expectedUpper = pattern.slice(0, lineLength);
  const expectedLower = pattern.slice(lineLength, lineLength * 2);

  function checkAojiuAndGuping(tones, expected, lineName) {
    let pingCount = 0;
    for (let i = 0; i < tones.length; i++) {
      if (tones[i] === 'ping') pingCount++;
      if (expected[i] === 'ping' && tones[i] === 'ze') {
        if (i < tones.length - 1 && tones[i + 1] === 'ping') {
          result.hasAojiu = true;
          result.aojiuPositions.push(i + (lineName === 'lower' ? lineLength : 0));
          result.suggestions.push(`${lineName === 'upper' ? '出' : '对'}句第${i + 1}字拗，第${i + 2}字救，为拗救句式`);
        } else {
          if (i !== tones.length - 1) {
            result.suggestions.push(`${lineName === 'upper' ? '出' : '对'}句第${i + 1}字应用平声，现用仄声，建议调整`);
          }
        }
      }
      if (expected[i] === 'ze' && tones[i] === 'ping' && i !== tones.length - 1) {
        result.suggestions.push(`${lineName === 'upper' ? '出' : '对'}句第${i + 1}字应用仄声，现用平声，建议调整`);
      }
    }

    if (pingCount <= 1 && tones[tones.length - 1] === 'ping') {
      result.hasGuping = true;
      result.gupingLine = lineName;
      result.suggestions.push(`${lineName === 'upper' ? '出' : '对'}句犯孤平，除韵脚外只有${pingCount}个平声字`);
    }
  }

  checkAojiuAndGuping(upperTones, expectedUpper, 'upper');
  checkAojiuAndGuping(lowerTones, expectedLower, 'lower');

  if (prevVerse) {
    const prevUpperTones = getLineTones(prevVerse.upperLine);
    const prevLowerTones = getLineTones(prevVerse.lowerLine);
    
    for (let i = 0; i < upperTones.length; i++) {
      if (upperTones[i] === prevUpperTones[i] && upperTones[i] !== 'unknown') {
        result.hasHezhang = true;
        result.hezhangPositions.push(i);
      }
    }
    for (let i = 0; i < lowerTones.length; i++) {
      if (lowerTones[i] === prevLowerTones[i] && lowerTones[i] !== 'unknown') {
        result.hasHezhang = true;
        result.hezhangPositions.push(i + lineLength);
      }
    }
    
    if (result.hasHezhang) {
      result.suggestions.push(`与前一联出现合掌现象，建议调整对应位置的平仄`);
    }
  }

  const lastCharUpper = upperLine[upperLine.length - 1];
  const lastCharLower = lowerLine[lowerLine.length - 1];
  
  if (getTone(lastCharUpper) !== 'ze') {
    result.suggestions.push(`出句尾字"${lastCharUpper}"应为仄声，现是${getTone(lastCharUpper) === 'ping' ? '平声' : '未知声调'}，建议调整`);
  }
  
  if (getTone(lastCharLower) !== 'ping') {
    result.suggestions.push(`对句尾字"${lastCharLower}"应为平声，现是${getTone(lastCharLower) === 'ze' ? '仄声' : '未知声调'}，建议调整`);
  }

  if (result.suggestions.length === 0) {
    result.suggestions.push('诗句格律工整，符合要求');
  }

  return result;
}

app.get('/api/poetry', (req, res) => {
  res.json(poetrySessions);
});

app.post('/api/poetry', (req, res) => {
  const { title, description, lineType, meterType } = req.body;
  const session = {
    id: generateId(),
    title: title || '新诗会',
    description: description || '',
    lineType: lineType || 'seven',
    meterType: meterType || 'seven-zeqi',
    verses: [],
    createdAt: new Date().toISOString()
  };
  poetrySessions.push(session);
  res.status(201).json(session);
});

app.get('/api/poetry/:id', (req, res) => {
  const session = poetrySessions.find(s => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ error: '诗会不存在' });
  }
  res.json(session);
});

app.post('/api/poetry/:id/verses', (req, res) => {
  const session = poetrySessions.find(s => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ error: '诗会不存在' });
  }

  const { poetId, upperLine, lowerLine, temperament, rhyme } = req.body;
  
  if (!upperLine || !lowerLine) {
    return res.status(400).json({ error: '请提供上下句' });
  }

  const lineType = session.lineType;
  const meterType = session.meterType;
  const prevVerse = session.verses.length > 0 ? session.verses[session.verses.length - 1] : null;

  const validation = validateVerse(upperLine, lowerLine, lineType, meterType, prevVerse);

  const verse = {
    id: generateId(),
    poetId: poetId || 'anonymous',
    upperLine,
    lowerLine,
    lineType,
    meterType,
    timestamp: new Date().toISOString(),
    temperament: temperament || '',
    rhyme: rhyme || '',
    validation
  };

  session.verses.push(verse);
  res.status(201).json(verse);
});

app.post('/api/validate', (req, res) => {
  const { upperLine, lowerLine, lineType, meterType, prevVerse } = req.body;
  
  if (!upperLine || !lowerLine) {
    return res.status(400).json({ error: '请提供上下句' });
  }

  const validation = validateVerse(
    upperLine, 
    lowerLine, 
    lineType || 'seven', 
    meterType || 'seven-zeqi', 
    prevVerse
  );

  res.json(validation);
});

app.get('/api/statistics/:sessionId', (req, res) => {
  const session = poetrySessions.find(s => s.id === req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: '诗会不存在' });
  }

  const stats = {
    totalVerses: session.verses.length,
    versesWithAojiu: 0,
    versesWithGuping: 0,
    versesWithHezhang: 0,
    perfectVerses: 0,
    poetCount: new Set(session.verses.map(v => v.poetId)).size,
    meterType: session.meterType,
    lineType: session.lineType,
    rhymeDistribution: {}
  };

  session.verses.forEach(verse => {
    if (verse.validation.hasAojiu) stats.versesWithAojiu++;
    if (verse.validation.hasGuping) stats.versesWithGuping++;
    if (verse.validation.hasHezhang) stats.versesWithHezhang++;
    if (verse.validation.suggestions.length === 1 && verse.validation.suggestions[0].includes('格律工整')) {
      stats.perfectVerses++;
    }
    if (verse.rhyme) {
      stats.rhymeDistribution[verse.rhyme] = (stats.rhymeDistribution[verse.rhyme] || 0) + 1;
    }
  });

  res.json(stats);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`诗词格律校验服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;
