import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const file = join(__dirname, 'db.json');

const adapter = new JSONFile(file);
const db = new Low(adapter, { stars: [] });

await db.read();

if (!db.data || !db.data.stars || db.data.stars.length === 0) {
  db.data = {
    stars: [
      {
        id: 'star-1',
        name: '天狼星',
        coordinates: { x: 0, y: 0, z: 0 },
        starType: 'A1V',
        temperature: 9940,
        mass: 2.063,
        color: '#ffffff',
        luminosity: 25.4,
        description: '天狼星是夜空中最亮的恒星，距离地球约8.6光年。它是一个双星系统，由一颗主序星和一颗白矮星组成。',
        planets: [
          {
            id: 'planet-1-1',
            name: '天狼星I-b',
            type: '岩石行星',
            radius: 0.8,
            orbitRadius: 5,
            orbitSpeed: 0.4,
            rotationSpeed: 0.01,
            color: '#8B4513',
            moons: 0,
            habitable: false,
            hasAtmosphere: false,
            atmosphereColor: '',
            description: '距离主星过近，表面温度极高，无法维持液态水。'
          },
          {
            id: 'planet-1-2',
            name: '天狼星II-c',
            type: '气态巨行星',
            radius: 3.2,
            orbitRadius: 14,
            orbitSpeed: 0.15,
            rotationSpeed: 0.02,
            color: '#4169E1',
            moons: 14,
            habitable: false,
            hasAtmosphere: true,
            atmosphereColor: '#87CEEB',
            description: '巨大的气态行星，拥有壮观的环系和众多卫星。'
          },
          {
            id: 'planet-1-3',
            name: '天狼星III-d',
            type: '冰巨星',
            radius: 2.4,
            orbitRadius: 28,
            orbitSpeed: 0.08,
            rotationSpeed: 0.015,
            color: '#9370DB',
            moons: 7,
            habitable: false,
            hasAtmosphere: true,
            atmosphereColor: '#DDA0DD',
            description: '极寒的冰巨星，大气中含有大量甲烷。'
          }
        ]
      },
      {
        id: 'star-2',
        name: '织女星',
        coordinates: { x: 50, y: 20, z: -30 },
        starType: 'A0V',
        temperature: 9602,
        mass: 2.135,
        color: '#e0e8ff',
        luminosity: 40.12,
        description: '织女星是夏季大三角的一员，是天琴座中最亮的恒星。',
        planets: [
          {
            id: 'planet-2-1',
            name: '织女I-a',
            type: '超级地球',
            radius: 1.8,
            orbitRadius: 8,
            orbitSpeed: 0.3,
            rotationSpeed: 0.008,
            color: '#2E8B57',
            moons: 2,
            habitable: true,
            hasAtmosphere: true,
            atmosphereColor: '#87CEEB',
            description: '位于宜居带内，表面有液态水海洋，适合殖民。'
          },
          {
            id: 'planet-2-2',
            name: '织女II-b',
            type: '岩石行星',
            radius: 0.9,
            orbitRadius: 18,
            orbitSpeed: 0.12,
            rotationSpeed: 0.012,
            color: '#CD853F',
            moons: 3,
            habitable: false,
            hasAtmosphere: true,
            atmosphereColor: '#DEB887',
            description: '沙漠行星，大气稀薄，昼夜温差极大。'
          }
        ]
      },
      {
        id: 'star-3',
        name: '参宿四',
        coordinates: { x: -60, y: 35, z: 25 },
        starType: 'M1-2Ia-Iab',
        temperature: 3600,
        mass: 11.6,
        color: '#ff6b4a',
        luminosity: 126000,
        description: '参宿四是一颗红超巨星，是猎户座中第二亮的恒星。它已接近生命终点，随时可能发生超新星爆发。',
        planets: [
          {
            id: 'planet-3-1',
            name: '参宿I-a',
            type: '熔岩行星',
            radius: 1.5,
            orbitRadius: 20,
            orbitSpeed: 0.2,
            rotationSpeed: 0.005,
            color: '#FF4500',
            moons: 0,
            habitable: false,
            hasAtmosphere: true,
            atmosphereColor: '#FF6347',
            description: '被恒星潮汐锁定，一面永远是熔岩海洋。'
          },
          {
            id: 'planet-3-2',
            name: '参宿II-b',
            type: '气态巨行星',
            radius: 4.5,
            orbitRadius: 45,
            orbitSpeed: 0.07,
            rotationSpeed: 0.025,
            color: '#B22222',
            moons: 23,
            habitable: false,
            hasAtmosphere: true,
            atmosphereColor: '#FA8072',
            description: '巨大的红色气态行星，被恒星辐射染成橙红色。'
          }
        ]
      },
      {
        id: 'star-4',
        name: '比邻星',
        coordinates: { x: 25, y: -40, z: 55 },
        starType: 'M5.5Ve',
        temperature: 3042,
        mass: 0.122,
        color: '#ff9966',
        luminosity: 0.0017,
        description: '比邻星是距离太阳最近的恒星，是一颗红矮星，属于半人马座α系统。',
        planets: [
          {
            id: 'planet-4-1',
            name: '比邻星b',
            type: '超级地球',
            radius: 1.1,
            orbitRadius: 3,
            orbitSpeed: 0.6,
            rotationSpeed: 0.004,
            color: '#3CB371',
            moons: 1,
            habitable: true,
            hasAtmosphere: true,
            atmosphereColor: '#98FB98',
            description: '位于宜居带内，可能存在液态水和生命迹象。'
          },
          {
            id: 'planet-4-2',
            name: '比邻星c',
            type: '冰行星',
            radius: 2.2,
            orbitRadius: 9,
            orbitSpeed: 0.25,
            rotationSpeed: 0.01,
            color: '#B0C4DE',
            moons: 5,
            habitable: false,
            hasAtmosphere: true,
            atmosphereColor: '#ADD8E6',
            description: '覆盖着厚厚冰层的行星，地下可能存在液态海洋。'
          }
        ]
      },
      {
        id: 'star-5',
        name: '北极星',
        coordinates: { x: -35, y: 60, z: -45 },
        starType: 'F7Ib-II',
        temperature: 6015,
        mass: 5.4,
        color: '#fff8e7',
        luminosity: 1260,
        description: '北极星是小熊座α星，是目前最靠近北天极的亮星。它是一个多星系统。',
        planets: [
          {
            id: 'planet-5-1',
            name: '北极I-a',
            type: '岩石行星',
            radius: 0.7,
            orbitRadius: 6,
            orbitSpeed: 0.35,
            rotationSpeed: 0.009,
            color: '#696969',
            moons: 0,
            habitable: false,
            hasAtmosphere: false,
            atmosphereColor: '',
            description: '贫瘠的石质行星，没有大气层保护。'
          },
          {
            id: 'planet-5-2',
            name: '北极II-b',
            type: '海洋行星',
            radius: 2.0,
            orbitRadius: 16,
            orbitSpeed: 0.14,
            rotationSpeed: 0.011,
            color: '#1E90FF',
            moons: 8,
            habitable: true,
            hasAtmosphere: true,
            atmosphereColor: '#87CEFA',
            description: '全球被海洋覆盖的行星，孕育着丰富的海洋生命。'
          },
          {
            id: 'planet-5-3',
            name: '北极III-c',
            type: '气态巨行星',
            radius: 3.8,
            orbitRadius: 32,
            orbitSpeed: 0.06,
            rotationSpeed: 0.018,
            color: '#DAA520',
            moons: 31,
            habitable: false,
            hasAtmosphere: true,
            atmosphereColor: '#FFD700',
            description: '金黄色的气态巨星，拥有复杂的环系统。'
          }
        ]
      },
      {
        id: 'star-6',
        name: '天狼星B（伴星）',
        coordinates: { x: 8, y: 3, z: 5 },
        starType: 'DA2',
        temperature: 25200,
        mass: 1.018,
        color: '#b8e0ff',
        luminosity: 0.026,
        description: '天狼星B是天狼星的伴星，是一颗白矮星，体积和地球差不多，但质量接近太阳。',
        planets: [
          {
            id: 'planet-6-1',
            name: '白矮I-a',
            type: '残余行星核',
            radius: 0.5,
            orbitRadius: 4,
            orbitSpeed: 0.5,
            rotationSpeed: 0.02,
            color: '#808080',
            moons: 0,
            habitable: false,
            hasAtmosphere: false,
            atmosphereColor: '',
            description: '恒星演化过程中幸存下来的行星核心。'
          }
        ]
      }
    ]
  };

  await db.write();
  console.log('数据库初始化完成，已写入默认星系数据。');
} else {
  console.log('数据库已存在，跳过初始化。');
}

export { db };
export default db;
