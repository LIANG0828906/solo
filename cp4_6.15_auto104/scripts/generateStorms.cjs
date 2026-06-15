const fs = require('fs');
const path = require('path');

const basins = ['NA', 'EP', 'WP', 'NI', 'SI', 'SP'];
const basinNames = {
  NA: '北大西洋',
  EP: '东太平洋',
  WP: '西太平洋',
  NI: '北印度洋',
  SI: '南印度洋',
  SP: '南太平洋'
};

// 生成风暴名称池
const stormNames = [
  'Alex', 'Bonnie', 'Colin', 'Danielle', 'Earl', 'Fiona', 'Gaston', 'Hermine',
  'Igor', 'Julia', 'Karl', 'Lisa', 'Matthew', 'Nicole', 'Otto', 'Paula',
  'Richard', 'Shary', 'Tomas', 'Virginie', 'Walter', 'Arlene', 'Bret', 'Cindy',
  'Don', 'Emily', 'Franklin', 'Gert', 'Harvey', 'Irene', 'Jose', 'Katia',
  'Lee', 'Maria', 'Nate', 'Ophelia', 'Philippe', 'Rina', 'Sean', 'Tammy'
];

const landfallLocations = {
  NA: ['美国佛罗里达', '美国得克萨斯', '美国路易斯安那', '美国北卡', '墨西哥尤卡坦', '古巴', '波多黎各', '多米尼加'],
  EP: ['墨西哥哈利斯科', '墨西哥下加利福尼亚', '墨西哥锡那罗亚', '危地马拉', '萨尔瓦多', '尼加拉瓜'],
  WP: ['中国福建', '中国广东', '中国台湾', '日本冲绳', '日本九州', '菲律宾吕宋', '菲律宾莱特', '越南', '韩国济州'],
  NI: ['阿曼', '也门', '印度古吉拉特', '孟加拉国', '缅甸', '巴基斯坦'],
  SI: ['马达加斯加', '莫桑比克', '坦桑尼亚', '南非夸祖鲁', '毛里求斯'],
  SP: ['澳大利亚昆士兰', '澳大利亚西澳', '澳大利亚北领地', '巴布亚新几内亚', '新喀里多尼亚']
};

// 经纬度范围（每个海域的大致范围）
const basinBounds = {
  NA: { lat: [10, 45], lon: [-100, -10] },
  EP: { lat: [5, 30], lon: [-140, -80] },
  WP: { lat: [5, 40], lon: [105, 170] },
  NI: { lat: [5, 25], lon: [45, 100] },
  SI: { lat: [-30, -5], lon: [30, 75] },
  SP: { lat: [-30, -5], lon: [105, 175] }
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function formatDate(year, month, day) {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}T18:00:00Z`;
}

function generateStorm(id, name, year, basin) {
  const bounds = basinBounds[basin];
  const category = randomInt(1, 5);
  
  // 风速与等级对应 (knots)
  const windByCat = {
    1: [64, 82],
    2: [83, 95],
    3: [96, 112],
    4: [113, 136],
    5: [137, 190]
  };
  
  const maxWind = randomInt(windByCat[category][0], windByCat[category][1]);
  const minPressure = Math.round(1000 - (maxWind - 30) * 0.7 + randomFloat(-10, 10));
  
  // 生成路径点
  const numPoints = randomInt(8, 20);
  const startLat = randomFloat(bounds.lat[0], bounds.lat[1] * 0.6);
  const startLon = randomFloat(bounds.lon[0], bounds.lon[1] * 0.4);
  
  // 终点一般向极地方向移动
  const endLat = startLat + (basin === 'SI' || basin === 'SP' ? -1 : 1) * randomFloat(5, 20);
  const endLon = startLon + randomFloat(-20, 40);
  
  const startMonth = basin === 'SP' || basin === 'SI' 
    ? randomInt(11, 12)
    : randomInt(6, 10);
  const startDay = randomInt(1, 28);
  
  const path = [];
  
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    
    // 弯曲路径（添加一些正弦扰动）
    const curveAmount = randomFloat(5, 15);
    const lat = startLat + (endLat - startLat) * t + Math.sin(t * Math.PI) * curveAmount * 0.3;
    const lon = startLon + (endLon - startLon) * t + Math.sin(t * Math.PI * 0.5) * curveAmount * 0.5;
    
    // 风速曲线：中间高，两头低
    const windCurve = Math.sin(t * Math.PI);
    const windSpeed = Math.round(25 + (maxWind - 25) * windCurve + randomFloat(-5, 5));
    
    // 气压曲线：与风速相反
    const pressure = Math.round(1010 - (maxWind - 25) * windCurve * 0.7 + randomFloat(-5, 5));
    
    const dayOffset = Math.floor(t * randomInt(5, 12));
    const timestamp = formatDate(year, startMonth, Math.min(startDay + dayOffset, 28));
    
    path.push({
      lat: parseFloat(lat.toFixed(2)),
      lon: parseFloat(lon.toFixed(2)),
      windSpeed,
      pressure,
      timestamp
    });
  }
  
  const landfalls = landfallLocations[basin];
  const landfall = landfalls[randomInt(0, landfalls.length - 1)];
  
  return {
    id: `${name.toLowerCase()}-${year}-${id}`,
    name,
    year,
    basin,
    category,
    maxWind,
    minPressure,
    landfall,
    durationDays: path.length > 0 ? Math.ceil(path.length * 0.8) : 7,
    path
  };
}

function generateDataset() {
  const storms = [];
  
  // 1900-2024 每年生成 0-4 个风暴，后期更多
  const startYear = 1900;
  const endYear = 2024;
  
  let stormCounter = 0;
  let nameIndex = 0;
  
  for (let year = startYear; year <= endYear; year++) {
    // 后期年份风暴更多（模拟全球变暖趋势）
    const yearFactor = (year - startYear) / (endYear - startYear);
    const minStorms = Math.floor(0 + yearFactor * 0.5);
    const maxStorms = Math.floor(3 + yearFactor * 2);
    const numStorms = randomInt(minStorms, maxStorms);
    
    for (let i = 0; i < numStorms; i++) {
      const basin = basins[randomInt(0, basins.length - 1)];
      const name = stormNames[nameIndex % stormNames.length];
      nameIndex++;
      
      const storm = generateStorm(stormCounter++, name, year, basin);
      storms.push(storm);
    }
  }
  
  return storms;
}

const dataset = generateDataset();

const outputPath = path.join(__dirname, '..', 'src', 'data', 'stormRecords.json');
fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2));
console.log(`Generated ${dataset.length} storms at ${outputPath}`);
