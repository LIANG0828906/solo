import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

const rand = seededRandom(42);

const speciesList = ['红松', '白桦', '橡树', '枫树', '雪松', '紫杉', '银杏', '楠木', '樟树', '榆树', '槐树', '杉木', '柏树', '榉树', '檀木', '柳树', '桉树', '柚木', '桃木', '桂树'];
const eras = ['百年古木', '五十年壮木', '二十年少木', '千年神木', '三百年灵木'];

const trees = [];
for (let i = 0; i < 20; i++) {
  let x: number, z: number;
  do {
    x = (rand() - 0.5) * 40;
    z = (rand() - 0.5) * 40;
  } while (Math.abs(x) < 2 && Math.abs(z) < 2);
  trees.push({
    id: i,
    x: Math.round(x * 10) / 10,
    z: Math.round(z * 10) / 10,
    speciesName: speciesList[i],
    era: eras[i % eras.length],
  });
}

const rocks = [];
for (let i = 0; i < 6; i++) {
  let x: number, z: number;
  do {
    x = (rand() - 0.5) * 36;
    z = (rand() - 0.5) * 36;
  } while (Math.abs(x) < 2 && Math.abs(z) < 2);
  rocks.push({
    id: i,
    x: Math.round(x * 10) / 10,
    z: Math.round(z * 10) / 10,
    scaleX: Math.round((0.5 + rand() * 1.5) * 10) / 10,
    scaleY: Math.round((0.3 + rand() * 0.8) * 10) / 10,
    scaleZ: Math.round((0.5 + rand() * 1.5) * 10) / 10,
  });
}

const treasures = [
  { id: 0, x: 10, z: 8, speciesName: '金叶古榕', era: '三千年' },
  { id: 1, x: -6, z: 12, speciesName: '银铃神木', era: '一千五百年' },
  { id: 2, x: 3, z: -5, speciesName: '翡翠灵松', era: '八百年' },
];

app.get('/api/data', (_req, res) => {
  res.json({ trees, rocks, treasures });
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`回声之森后端服务启动于 http://localhost:${PORT}`);
  console.log(`数据接口: http://localhost:${PORT}/api/data`);
});
