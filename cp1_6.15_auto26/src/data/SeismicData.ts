export interface SeismicRecord {
  id: string;
  time: Date;
  latitude: number;
  longitude: number;
  magnitude: number;
  depth: number;
  location: string;
}

export interface PlateBoundaryData {
  name: string;
  coordinates: Array<{ lat: number; lng: number }>;
  movementDirection: string;
  color: string;
}

const plateNames = [
  '太平洋板块', '欧亚板块', '北美板块', '南美板块',
  '非洲板块', '印度洋板块', '南极板块', '纳斯卡板块',
  '菲律宾板块', '加勒比板块', '科科斯板块', '阿拉伯板块'
];

const movementDirections = [
  '向西北移动', '向东北移动', '向西南移动', '向东南移动',
  '向北移动', '向南移动', '向东移动', '向西移动'
];

const locations = [
  '日本海沟', '智利近海', '印尼苏门答腊', '美国加州',
  '土耳其安纳托利亚', '冰岛', '新西兰', '巴布亚新几内亚',
  '秘鲁近海', '墨西哥', '台湾近海', '菲律宾',
  '伊朗', '巴基斯坦', '智利北部', '阿根廷',
  '加拿大西部', '阿拉斯加', '阿留申群岛', '加勒比海',
  '地中海', '喜马拉雅山脉', '中大西洋海岭', '东太平洋海岭'
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return function(): number {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const random = seededRandom(42);

function generateEarthquakeData(count: number): SeismicRecord[] {
  const data: SeismicRecord[] = [];
  const now = new Date();
  
  const seismicZones = [
    { latRange: [30, 45], lngRange: [125, 150], weight: 20 },
    { latRange: [-35, -15], lngRange: [-75, -65], weight: 15 },
    { latRange: [-10, 10], lngRange: [90, 110], weight: 18 },
    { latRange: [30, 40], lngRange: [-125, -115], weight: 12 },
    { latRange: [35, 42], lngRange: [25, 45], weight: 10 },
    { latRange: [55, 70], lngRange: [-25, -10], weight: 6 },
    { latRange: [-48, -34], lngRange: [165, 180], weight: 8 },
    { latRange: [-10, 0], lngRange: [140, 155], weight: 9 },
    { latRange: [-20, -5], lngRange: [-85, -70], weight: 11 },
    { latRange: [15, 25], lngRange: [-105, -95], weight: 7 },
    { latRange: [20, 25], lngRange: [118, 122], weight: 8 },
    { latRange: [5, 18], lngRange: [120, 130], weight: 9 },
    { latRange: [25, 40], lngRange: [40, 60], weight: 10 },
    { latRange: [20, 35], lngRange: [60, 75], weight: 8 },
    { latRange: [-30, -15], lngRange: [-75, -65], weight: 7 },
    { latRange: [-40, -25], lngRange: [-75, -60], weight: 6 },
    { latRange: [45, 60], lngRange: [-135, -120], weight: 8 },
    { latRange: [55, 75], lngRange: [-160, -140], weight: 9 },
    { latRange: [45, 55], lngRange: [-180, -150], weight: 7 },
    { latRange: [10, 20], lngRange: [-85, -60], weight: 6 },
    { latRange: [35, 45], lngRange: [5, 20], weight: 7 },
    { latRange: [25, 35], lngRange: [75, 95], weight: 10 },
    { latRange: [-30, 30], lngRange: [-45, -15], weight: 8 },
    { latRange: [-30, 30], lngRange: [-135, -105], weight: 9 }
  ];

  for (let i = 0; i < count; i++) {
    const zoneIndex = Math.floor(random() * seismicZones.length);
    const zone = seismicZones[zoneIndex];
    
    const lat = zone.latRange[0] + random() * (zone.latRange[1] - zone.latRange[0]);
    const lng = zone.lngRange[0] + random() * (zone.lngRange[1] - zone.lngRange[0]);
    
    const daysAgo = Math.floor(random() * 365);
    const hoursAgo = Math.floor(random() * 24);
    const time = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000);
    
    const magnitude = Math.round((3.5 + random() * 4.5) * 10) / 10;
    const depth = Math.round((5 + random() * 650) * 10) / 10;
    
    const locationIndex = Math.floor(random() * locations.length);
    
    data.push({
      id: `eq-${i.toString().padStart(5, '0')}`,
      time,
      latitude: Math.round(lat * 10000) / 10000,
      longitude: Math.round(lng * 10000) / 10000,
      magnitude,
      depth,
      location: locations[locationIndex]
    });
  }
  
  return data.sort((a, b) => a.time.getTime() - b.time.getTime());
}

function generatePlateBoundaries(): PlateBoundaryData[] {
  const boundaries: PlateBoundaryData[] = [];
  
  const boundaryDefinitions = [
    {
      name: '太平洋板块',
      color: '#00ffff',
      points: [
        { lat: 55, lng: -160 }, { lat: 50, lng: -170 }, { lat: 45, lng: 180 },
        { lat: 40, lng: 170 }, { lat: 35, lng: 155 }, { lat: 30, lng: 145 },
        { lat: 20, lng: 140 }, { lat: 10, lng: 135 }, { lat: 0, lng: 130 },
        { lat: -10, lng: -140 }, { lat: -20, lng: -120 }, { lat: -30, lng: -105 },
        { lat: -40, lng: -100 }, { lat: -50, lng: -105 }, { lat: -55, lng: -120 },
        { lat: -60, lng: -150 }, { lat: -65, lng: 180 }, { lat: -60, lng: 160 },
        { lat: -50, lng: 150 }, { lat: -40, lng: 155 }, { lat: -30, lng: 170 },
        { lat: -20, lng: 175 }, { lat: -10, lng: -175 }, { lat: 0, lng: -170 },
        { lat: 10, lng: -165 }, { lat: 20, lng: -160 }, { lat: 30, lng: -155 },
        { lat: 40, lng: -155 }, { lat: 50, lng: -160 }
      ]
    },
    {
      name: '欧亚板块',
      color: '#ff6b6b',
      points: [
        { lat: 75, lng: 0 }, { lat: 70, lng: 30 }, { lat: 65, lng: 60 },
        { lat: 60, lng: 90 }, { lat: 55, lng: 120 }, { lat: 50, lng: 140 },
        { lat: 45, lng: 145 }, { lat: 40, lng: 135 }, { lat: 35, lng: 130 },
        { lat: 30, lng: 125 }, { lat: 25, lng: 120 }, { lat: 20, lng: 110 },
        { lat: 15, lng: 100 }, { lat: 10, lng: 95 }, { lat: 5, lng: 90 },
        { lat: 0, lng: 85 }, { lat: -5, lng: 80 }, { lat: -10, lng: 75 },
        { lat: -5, lng: 65 }, { lat: 0, lng: 55 }, { lat: 5, lng: 45 },
        { lat: 10, lng: 35 }, { lat: 15, lng: 30 }, { lat: 20, lng: 25 },
        { lat: 25, lng: 20 }, { lat: 30, lng: 15 }, { lat: 35, lng: 10 },
        { lat: 40, lng: 5 }, { lat: 45, lng: 0 }, { lat: 50, lng: -5 },
        { lat: 55, lng: -10 }, { lat: 60, lng: -15 }, { lat: 65, lng: -20 },
        { lat: 70, lng: -15 }, { lat: 75, lng: -5 }
      ]
    },
    {
      name: '北美板块',
      color: '#ffd93d',
      points: [
        { lat: 80, lng: -180 }, { lat: 75, lng: -150 }, { lat: 70, lng: -130 },
        { lat: 65, lng: -110 }, { lat: 60, lng: -90 }, { lat: 55, lng: -75 },
        { lat: 50, lng: -60 }, { lat: 45, lng: -55 }, { lat: 40, lng: -50 },
        { lat: 35, lng: -45 }, { lat: 30, lng: -40 }, { lat: 25, lng: -35 },
        { lat: 20, lng: -30 }, { lat: 15, lng: -25 }, { lat: 10, lng: -20 },
        { lat: 15, lng: -15 }, { lat: 20, lng: -10 }, { lat: 25, lng: -5 },
        { lat: 30, lng: 0 }, { lat: 35, lng: 5 }, { lat: 40, lng: 10 },
        { lat: 45, lng: 15 }, { lat: 50, lng: 20 }, { lat: 55, lng: 25 },
        { lat: 60, lng: 30 }, { lat: 65, lng: 35 }, { lat: 70, lng: 40 },
        { lat: 75, lng: 45 }, { lat: 80, lng: 50 }, { lat: 85, lng: -180 }
      ]
    },
    {
      name: '南美板块',
      color: '#6bcb77',
      points: [
        { lat: 15, lng: -80 }, { lat: 10, lng: -75 }, { lat: 5, lng: -70 },
        { lat: 0, lng: -65 }, { lat: -5, lng: -60 }, { lat: -10, lng: -55 },
        { lat: -15, lng: -50 }, { lat: -20, lng: -45 }, { lat: -25, lng: -40 },
        { lat: -30, lng: -35 }, { lat: -35, lng: -30 }, { lat: -40, lng: -25 },
        { lat: -45, lng: -20 }, { lat: -50, lng: -15 }, { lat: -55, lng: -10 },
        { lat: -60, lng: -5 }, { lat: -55, lng: 0 }, { lat: -50, lng: 5 },
        { lat: -45, lng: 10 }, { lat: -40, lng: 15 }, { lat: -35, lng: 20 },
        { lat: -30, lng: 25 }, { lat: -25, lng: 30 }, { lat: -20, lng: 35 },
        { lat: -15, lng: 40 }, { lat: -10, lng: 45 }, { lat: -5, lng: 50 },
        { lat: 0, lng: 55 }, { lat: 5, lng: 60 }, { lat: 10, lng: 65 },
        { lat: 15, lng: 70 }, { lat: 20, lng: 65 }, { lat: 25, lng: 60 },
        { lat: 30, lng: 55 }, { lat: 35, lng: 50 }, { lat: 40, lng: 45 },
        { lat: 35, lng: 40 }, { lat: 30, lng: 35 }, { lat: 25, lng: 30 },
        { lat: 20, lng: 25 }, { lat: 15, lng: 20 }, { lat: 10, lng: 15 },
        { lat: 15, lng: 10 }, { lat: 20, lng: 5 }, { lat: 25, lng: 0 },
        { lat: 30, lng: -5 }, { lat: 35, lng: -10 }, { lat: 40, lng: -15 },
        { lat: 45, lng: -20 }, { lat: 50, lng: -25 }, { lat: 55, lng: -30 },
        { lat: 50, lng: -35 }, { lat: 45, lng: -40 }, { lat: 40, lng: -45 },
        { lat: 35, lng: -50 }, { lat: 30, lng: -55 }, { lat: 25, lng: -60 },
        { lat: 20, lng: -65 }, { lat: 15, lng: -70 }, { lat: 15, lng: -80 }
      ]
    },
    {
      name: '非洲板块',
      color: '#9b59b6',
      points: [
        { lat: 35, lng: -10 }, { lat: 30, lng: -5 }, { lat: 25, lng: 0 },
        { lat: 20, lng: 5 }, { lat: 15, lng: 10 }, { lat: 10, lng: 15 },
        { lat: 5, lng: 20 }, { lat: 0, lng: 25 }, { lat: -5, lng: 30 },
        { lat: -10, lng: 35 }, { lat: -15, lng: 40 }, { lat: -20, lng: 45 },
        { lat: -25, lng: 50 }, { lat: -30, lng: 55 }, { lat: -35, lng: 60 },
        { lat: -40, lng: 65 }, { lat: -45, lng: 70 }, { lat: -40, lng: 75 },
        { lat: -35, lng: 80 }, { lat: -30, lng: 85 }, { lat: -25, lng: 90 },
        { lat: -20, lng: 95 }, { lat: -15, lng: 100 }, { lat: -10, lng: 105 },
        { lat: -5, lng: 110 }, { lat: 0, lng: 115 }, { lat: 5, lng: 120 },
        { lat: 10, lng: 125 }, { lat: 15, lng: 130 }, { lat: 20, lng: 135 },
        { lat: 25, lng: 140 }, { lat: 30, lng: 145 }, { lat: 35, lng: 150 },
        { lat: 40, lng: 145 }, { lat: 45, lng: 140 }, { lat: 50, lng: 135 },
        { lat: 55, lng: 130 }, { lat: 60, lng: 125 }, { lat: 65, lng: 120 },
        { lat: 70, lng: 115 }, { lat: 75, lng: 110 }, { lat: 80, lng: 105 },
        { lat: 75, lng: 100 }, { lat: 70, lng: 95 }, { lat: 65, lng: 90 },
        { lat: 60, lng: 85 }, { lat: 55, lng: 80 }, { lat: 50, lng: 75 },
        { lat: 45, lng: 70 }, { lat: 40, lng: 65 }, { lat: 35, lng: 60 },
        { lat: 40, lng: 55 }, { lat: 45, lng: 50 }, { lat: 50, lng: 45 },
        { lat: 55, lng: 40 }, { lat: 60, lng: 35 }, { lat: 65, lng: 30 },
        { lat: 70, lng: 25 }, { lat: 75, lng: 20 }, { lat: 80, lng: 15 },
        { lat: 75, lng: 10 }, { lat: 70, lng: 5 }, { lat: 65, lng: 0 },
        { lat: 60, lng: -5 }, { lat: 55, lng: -10 }, { lat: 50, lng: -15 },
        { lat: 45, lng: -15 }, { lat: 40, lng: -10 }, { lat: 35, lng: -10 }
      ]
    },
    {
      name: '印度洋板块',
      color: '#e17055',
      points: [
        { lat: 0, lng: 75 }, { lat: -5, lng: 70 }, { lat: -10, lng: 65 },
        { lat: -15, lng: 60 }, { lat: -20, lng: 55 }, { lat: -25, lng: 50 },
        { lat: -30, lng: 45 }, { lat: -35, lng: 40 }, { lat: -40, lng: 35 },
        { lat: -45, lng: 30 }, { lat: -50, lng: 25 }, { lat: -55, lng: 20 },
        { lat: -60, lng: 15 }, { lat: -55, lng: 10 }, { lat: -50, lng: 5 },
        { lat: -45, lng: 0 }, { lat: -40, lng: -5 }, { lat: -35, lng: -10 },
        { lat: -30, lng: -15 }, { lat: -25, lng: -20 }, { lat: -20, lng: -25 },
        { lat: -15, lng: -30 }, { lat: -10, lng: -35 }, { lat: -5, lng: -40 },
        { lat: 0, lng: -45 }, { lat: 5, lng: -50 }, { lat: 10, lng: -55 },
        { lat: 15, lng: -60 }, { lat: 20, lng: -65 }, { lat: 25, lng: -70 },
        { lat: 30, lng: -75 }, { lat: 35, lng: -80 }, { lat: 40, lng: -85 },
        { lat: 45, lng: -90 }, { lat: 50, lng: -95 }, { lat: 55, lng: -100 },
        { lat: 60, lng: -105 }, { lat: 65, lng: -110 }, { lat: 70, lng: -115 },
        { lat: 75, lng: -120 }, { lat: 80, lng: -125 }, { lat: 75, lng: -130 },
        { lat: 70, lng: -135 }, { lat: 65, lng: -140 }, { lat: 60, lng: -145 },
        { lat: 55, lng: -150 }, { lat: 50, lng: -155 }, { lat: 45, lng: -160 },
        { lat: 40, lng: -155 }, { lat: 35, lng: -150 }, { lat: 30, lng: -145 },
        { lat: 25, lng: -140 }, { lat: 20, lng: -135 }, { lat: 15, lng: -130 },
        { lat: 10, lng: -125 }, { lat: 5, lng: -120 }, { lat: 0, lng: -115 },
        { lat: -5, lng: -110 }, { lat: -10, lng: -105 }, { lat: -15, lng: -100 },
        { lat: -20, lng: -95 }, { lat: -25, lng: -90 }, { lat: -30, lng: -85 },
        { lat: -35, lng: -80 }, { lat: -40, lng: -75 }, { lat: -45, lng: -70 },
        { lat: -50, lng: -65 }, { lat: -55, lng: -60 }, { lat: -60, lng: -55 },
        { lat: -55, lng: -50 }, { lat: -50, lng: -45 }, { lat: -45, lng: -40 },
        { lat: -40, lng: -35 }, { lat: -35, lng: -30 }, { lat: -30, lng: -25 },
        { lat: -25, lng: -20 }, { lat: -20, lng: -15 }, { lat: -15, lng: -10 },
        { lat: -10, lng: -5 }, { lat: -5, lng: 0 }, { lat: 0, lng: 5 },
        { lat: 5, lng: 10 }, { lat: 10, lng: 15 }, { lat: 15, lng: 20 },
        { lat: 20, lng: 25 }, { lat: 25, lng: 30 }, { lat: 30, lng: 35 },
        { lat: 35, lng: 40 }, { lat: 40, lng: 45 }, { lat: 45, lng: 50 },
        { lat: 50, lng: 55 }, { lat: 55, lng: 60 }, { lat: 60, lng: 65 },
        { lat: 65, lng: 70 }, { lat: 70, lng: 75 }, { lat: 75, lng: 80 },
        { lat: 80, lng: 85 }, { lat: 75, lng: 90 }, { lat: 70, lng: 95 },
        { lat: 65, lng: 100 }, { lat: 60, lng: 105 }, { lat: 55, lng: 110 },
        { lat: 50, lng: 115 }, { lat: 45, lng: 120 }, { lat: 40, lng: 125 },
        { lat: 35, lng: 130 }, { lat: 30, lng: 135 }, { lat: 25, lng: 140 },
        { lat: 20, lng: 145 }, { lat: 15, lng: 150 }, { lat: 10, lng: 155 },
        { lat: 5, lng: 160 }, { lat: 0, lng: 165 }, { lat: -5, lng: 170 },
        { lat: -10, lng: 175 }, { lat: -15, lng: 180 }, { lat: -10, lng: -175 },
        { lat: -5, lng: -170 }, { lat: 0, lng: -165 }, { lat: 5, lng: -160 },
        { lat: 10, lng: -155 }, { lat: 15, lng: -150 }, { lat: 20, lng: -145 },
        { lat: 25, lng: -140 }, { lat: 30, lng: -135 }, { lat: 35, lng: -130 },
        { lat: 40, lng: -125 }, { lat: 45, lng: -120 }, { lat: 50, lng: -115 },
        { lat: 55, lng: -110 }, { lat: 60, lng: -105 }, { lat: 65, lng: -100 },
        { lat: 70, lng: -95 }, { lat: 75, lng: -90 }, { lat: 80, lng: -85 },
        { lat: 75, lng: -80 }, { lat: 70, lng: -75 }, { lat: 65, lng: -70 },
        { lat: 60, lng: -65 }, { lat: 55, lng: -60 }, { lat: 50, lng: -55 },
        { lat: 45, lng: -50 }, { lat: 40, lng: -45 }, { lat: 35, lng: -40 },
        { lat: 30, lng: -35 }, { lat: 25, lng: -30 }, { lat: 20, lng: -25 },
        { lat: 15, lng: -20 }, { lat: 10, lng: -15 }, { lat: 5, lng: -10 },
        { lat: 0, lng: -5 }, { lat: 0, lng: 75 }
      ]
    }
  ];
  
  for (const def of boundaryDefinitions) {
    boundaries.push({
      name: def.name,
      coordinates: def.points,
      movementDirection: movementDirections[Math.floor(random() * movementDirections.length)],
      color: def.color
    });
  }
  
  return boundaries;
}

export const seismicData: SeismicRecord[] = generateEarthquakeData(300);
export const plateBoundaries: PlateBoundaryData[] = generatePlateBoundaries();
