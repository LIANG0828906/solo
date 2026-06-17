const fs = require('fs');
const path = require('path');

const famousStars = [
  { name: '天狼星', nameEn: 'Sirius' },
  { name: '北极星', nameEn: 'Polaris' },
  { name: '织女星', nameEn: 'Vega' },
  { name: '牛郎星', nameEn: 'Altair' },
  { name: '参宿四', nameEn: 'Betelgeuse' },
  { name: '参宿七', nameEn: 'Rigel' },
  { name: '南河三', nameEn: 'Procyon' },
  { name: '北河三', nameEn: 'Pollux' },
  { name: '五车二', nameEn: 'Capella' },
  { name: '角宿一', nameEn: 'Spica' },
  { name: '心宿二', nameEn: 'Antares' },
  { name: '织女二', nameEn: 'Sulafat' },
  { name: '天津四', nameEn: 'Deneb' },
  { name: '河鼓二', nameEn: 'Altair' },
  { name: '北落师门', nameEn: 'Fomalhaut' },
];

const starPrefixes = ['天枢星', '瑶光星', '开阳星', '玉衡星', '天璇星', '天玑星', '天权星', '紫薇星', '太微星', '天市星', '天狼星', '破军星', '武曲星', '廉贞星', '文曲星', '禄存星', '巨门星', '贪狼星', '左辅星', '右弼星'];

const spectralTypeRanges = {
  O: { min: 30000, max: 50000, weight: 5 },
  B: { min: 10000, max: 30000, weight: 8 },
  A: { min: 7500, max: 10000, weight: 10 },
  F: { min: 6000, max: 7500, weight: 12 },
  G: { min: 5000, max: 6000, weight: 30 },
  K: { min: 3500, max: 5000, weight: 15 },
  M: { min: 2400, max: 3500, weight: 20 },
};

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function pickSpectralType() {
  const total = Object.values(spectralTypeRanges).reduce((sum, r) => sum + r.weight, 0);
  let rand = Math.random() * total;
  for (const [type, range] of Object.entries(spectralTypeRanges)) {
    rand -= range.weight;
    if (rand <= 0) return type;
  }
  return 'G';
}

function getTemperature(spectralType) {
  const range = spectralTypeRanges[spectralType];
  return random(range.min, range.max);
}

function generatePosition() {
  while (true) {
    const x = random(-50, 50);
    const y = random(-50, 50);
    const z = random(-50, 50);
    const distance = Math.sqrt(x * x + y * y + z * z);
    if (distance <= 50 && distance >= 5) {
      return { x, y, z, distance };
    }
  }
}

function generateStars(count) {
  const stars = [];
  
  for (let i = 0; i < count; i++) {
    let name, nameEn;
    
    if (i < famousStars.length) {
      name = famousStars[i].name;
      nameEn = famousStars[i].nameEn;
    } else {
      const prefix = starPrefixes[i % starPrefixes.length];
      const num = Math.floor(i / starPrefixes.length) + 1;
      name = `${prefix}${num}`;
      nameEn = `Star-${String(i + 1).padStart(3, '0')}`;
    }
    
    const spectralType = pickSpectralType();
    const { x, y, z, distance } = generatePosition();
    
    stars.push({
      id: `star-${String(i + 1).padStart(4, '0')}`,
      name,
      nameEn,
      spectralType,
      magnitude: parseFloat(random(0.0, 6.0).toFixed(2)),
      luminosity: parseFloat(random(0.01, 100000).toFixed(2)),
      temperature: parseFloat(getTemperature(spectralType).toFixed(1)),
      distance: parseFloat(distance.toFixed(2)),
      position: {
        x: parseFloat(x.toFixed(2)),
        y: parseFloat(y.toFixed(2)),
        z: parseFloat(z.toFixed(2)),
      },
    });
  }
  
  return stars;
}

const stars = generateStars(200);
const outputPath = path.join(__dirname, 'public', 'stars.json');

fs.writeFileSync(outputPath, JSON.stringify(stars, null, 2), 'utf-8');

console.log(`Generated ${stars.length} stars in ${outputPath}`);
console.log('Spectral type distribution:');
const distribution = {};
stars.forEach(s => {
  distribution[s.spectralType] = (distribution[s.spectralType] || 0) + 1;
});
Object.entries(distribution).sort().forEach(([type, count]) => {
  console.log(`  ${type}: ${count} (${(count / stars.length * 100).toFixed(1)}%)`);
});
