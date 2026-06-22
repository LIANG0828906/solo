import express from 'express';
import cors from 'cors';
import { findSimilarWines } from './flavorAlgorithm.js';

const app = express();
app.use(cors());
app.use(express.json());

const wines = [
  {
    id: '1',
    name: 'Château Margaux',
    year: 2015,
    variety: '赤霞珠/梅洛混酿',
    alcohol: 13.5,
    region: '法国·波尔多·玛歌',
    flavors: { fruit: 8, acidity: 7, tannin: 8, body: 8, sweetness: 2, aftertaste: 9 },
    notes: '深邃的宝石红色，黑醋栗与紫罗兰的芳香交织，入口丝滑而有力，单宁细腻如丝绸，余味悠长持久。'
  },
  {
    id: '2',
    name: 'Opus One',
    year: 2018,
    variety: '赤霞珠/梅洛',
    alcohol: 14.5,
    region: '美国·纳帕谷',
    flavors: { fruit: 9, acidity: 6, tannin: 7, body: 9, sweetness: 3, aftertaste: 8 },
    notes: '浓郁的黑莓与黑樱桃果香，伴随香草与巧克力的橡木气息，酒体饱满圆润，结构优雅。'
  },
  {
    id: '3',
    name: 'Cloudy Bay Sauvignon Blanc',
    year: 2021,
    variety: '长相思',
    alcohol: 12.5,
    region: '新西兰·马尔堡',
    flavors: { fruit: 7, acidity: 9, tannin: 1, body: 3, sweetness: 4, aftertaste: 6 },
    notes: '明亮的浅金色，百香果与青草的清新香气扑面而来，酸度活泼明亮，余味干净清爽。'
  },
  {
    id: '4',
    name: 'Barolo Riserva',
    year: 2014,
    variety: '内比奥罗',
    alcohol: 14.0,
    region: '意大利·皮埃蒙特',
    flavors: { fruit: 6, acidity: 8, tannin: 9, body: 8, sweetness: 1, aftertaste: 10 },
    notes: '砖红色泽，玫瑰花瓣与焦油的经典香气，高酸高单宁却不失优雅，陈年潜力卓越。'
  },
  {
    id: '5',
    name: 'Dr. Loosen Riesling',
    year: 2020,
    variety: '雷司令',
    alcohol: 8.5,
    region: '德国·摩泽尔',
    flavors: { fruit: 7, acidity: 8, tannin: 1, body: 4, sweetness: 7, aftertaste: 7 },
    notes: '浅金色液体，青苹果与蜂蜜的芬芳，甜酸平衡恰到好处，矿物感绵延回甘。'
  },
  {
    id: '6',
    name: 'Penfolds Grange',
    year: 2017,
    variety: '设拉子',
    alcohol: 14.5,
    region: '澳大利亚·南澳',
    flavors: { fruit: 9, acidity: 6, tannin: 8, body: 9, sweetness: 2, aftertaste: 9 },
    notes: '深紫红色，黑巧克力与黑胡椒的浓烈香气，酒体雄浑有力，单宁紧致而成熟。'
  },
  {
    id: '7',
    name: 'Veuve Clicquot Brut',
    year: 2016,
    variety: '黑皮诺/霞多丽/莫尼耶',
    alcohol: 12.0,
    region: '法国·香槟区',
    flavors: { fruit: 6, acidity: 8, tannin: 1, body: 5, sweetness: 3, aftertaste: 7 },
    notes: '金黄色气泡绵密持久，白色花朵与柑橘的清新，烤面包的酵母香，口感细腻优雅。'
  },
  {
    id: '8',
    name: 'Sassicaia',
    year: 2016,
    variety: '赤霞珠/品丽珠',
    alcohol: 13.5,
    region: '意大利·托斯卡纳',
    flavors: { fruit: 8, acidity: 7, tannin: 8, body: 8, sweetness: 2, aftertaste: 9 },
    notes: '深红宝石色，黑醋栗与地中海灌木的芬芳，单宁如天鹅绒般顺滑，结构精妙。'
  },
  {
    id: '9',
    name: 'Chablis Grand Cru Les Clos',
    year: 2019,
    variety: '霞多丽',
    alcohol: 13.0,
    region: '法国·勃艮第·夏布利',
    flavors: { fruit: 5, acidity: 9, tannin: 1, body: 6, sweetness: 1, aftertaste: 8 },
    notes: '浅金色微带绿光，燧石与柑橘的矿物芬芳，酸度清冽如泉，余味悠远深邃。'
  },
  {
    id: '10',
    name: 'Amarone della Valpolicella',
    year: 2015,
    variety: '科维纳/龙迪内拉',
    alcohol: 15.5,
    region: '意大利·威尼托',
    flavors: { fruit: 8, acidity: 6, tannin: 7, body: 10, sweetness: 5, aftertaste: 9 },
    notes: '深邃的红宝石色，风干葡萄带来的浓缩黑樱桃与无花果香，酒体饱满厚重，温暖而悠长。'
  },
  {
    id: '11',
    name: 'Sancerre Les Monts Damnés',
    year: 2022,
    variety: '长相思',
    alcohol: 12.5,
    region: '法国·卢瓦尔河谷',
    flavors: { fruit: 6, acidity: 9, tannin: 1, body: 4, sweetness: 2, aftertaste: 7 },
    notes: '浅稻草色，燧石与醋栗的矿物芬芳，清脆的酸度与绵长的矿物余韵，纯粹而精密。'
  },
  {
    id: '12',
    name: 'Tignanello',
    year: 2019,
    variety: '桑娇维塞/赤霞珠/品丽珠',
    alcohol: 14.0,
    region: '意大利·托斯卡纳',
    flavors: { fruit: 8, acidity: 7, tannin: 7, body: 8, sweetness: 2, aftertaste: 8 },
    notes: '浓郁的红宝石色，成熟红果与香草的气息，单宁柔滑有结构，收尾优雅绵长。'
  }
];

app.get('/api/wines', (req, res) => {
  res.json(wines);
});

app.get('/api/wines/:id', (req, res) => {
  const wine = wines.find(w => w.id === req.params.id);
  if (!wine) return res.status(404).json({ error: 'Wine not found' });
  res.json(wine);
});

app.post('/api/wines/:id/similar', (req, res) => {
  const wine = wines.find(w => w.id === req.params.id);
  if (!wine) return res.status(404).json({ error: 'Wine not found' });
  const result = findSimilarWines(wine, wines.filter(w => w.id !== wine.id), 5);
  res.json(result);
});

app.listen(4000, () => {
  console.log('🍷 Wine API server running on http://localhost:4000');
});
