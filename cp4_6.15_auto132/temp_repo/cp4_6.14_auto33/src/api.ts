import axios from 'axios';
import type { BuildingInfo, ModelData } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export const fetchModelUrl = async (year: number): Promise<ModelData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData: Record<number, ModelData> = {
        2000: {
          year: 2000,
          modelUrl: '/models/city_2000.gltf',
          buildings: [
            { id: 'b1_2000', name: '市政大楼', year: 1995, description: '城市早期行政中心', position: [-8, 0, -8], height: 15, color: '#8B4513' },
            { id: 'b2_2000', name: '商业中心', year: 1998, description: '传统商业综合体', position: [8, 0, -8], height: 20, color: '#4682B4' },
            { id: 'b3_2000', name: '文化艺术馆', year: 1990, description: '城市文化地标', position: [-8, 0, 8], height: 12, color: '#2E8B57' },
            { id: 'b4_2000', name: '居民小区A区', year: 1985, description: '早期居民住宅', position: [8, 0, 8], height: 8, color: '#CD853F' },
            { id: 'b5_2000', name: '交通枢纽', year: 1992, description: '城市交通中心', position: [0, 0, 0], height: 10, color: '#708090' },
          ]
        },
        2024: {
          year: 2024,
          modelUrl: '/models/city_2024.gltf',
          buildings: [
            { id: 'b1_2024', name: '金融中心大厦', year: 2020, description: '现代化摩天大楼，城市新地标', position: [-8, 0, -8], height: 45, color: '#1E90FF' },
            { id: 'b2_2024', name: '环球商业广场', year: 2018, description: '大型综合商业体', position: [8, 0, -8], height: 35, color: '#FF6347' },
            { id: 'b3_2024', name: '科技研发中心', year: 2015, description: '科技创新孵化基地', position: [-8, 0, 8], height: 28, color: '#32CD32' },
            { id: 'b4_2024', name: '国际公寓', year: 2010, description: '高端住宅社区', position: [8, 0, 8], height: 30, color: '#DAA520' },
            { id: 'b5_2024', name: '中央车站', year: 2022, description: '综合交通换乘中心', position: [0, 0, 0], height: 22, color: '#9370DB' },
            { id: 'b6_2024', name: '绿色生态塔', year: 2023, description: '生态环保示范建筑', position: [0, 0, 15], height: 40, color: '#00CED1' },
          ]
        }
      };
      resolve(mockData[year] || mockData[2024]);
    }, 300);
  });
};

export const fetchBuildingInfo = async (buildingId: string): Promise<BuildingInfo | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const buildingData: Record<string, BuildingInfo> = {
        'b1_2000': { id: 'b1_2000', name: '市政大楼', year: 1995, description: '城市早期行政中心，见证了城市发展的起点。' },
        'b2_2000': { id: 'b2_2000', name: '商业中心', year: 1998, description: '传统商业综合体，当年最繁华的购物场所。' },
        'b3_2000': { id: 'b3_2000', name: '文化艺术馆', year: 1990, description: '城市文化地标，举办过众多艺术展览。' },
        'b4_2000': { id: 'b4_2000', name: '居民小区A区', year: 1985, description: '早期居民住宅，城市第一代社区。' },
        'b5_2000': { id: 'b5_2000', name: '交通枢纽', year: 1992, description: '城市交通中心，连接城市各区域。' },
        'b1_2024': { id: 'b1_2024', name: '金融中心大厦', year: 2020, description: '现代化摩天大楼，城市新地标，高180米。' },
        'b2_2024': { id: 'b2_2024', name: '环球商业广场', year: 2018, description: '大型综合商业体，汇集全球品牌。' },
        'b3_2024': { id: 'b3_2024', name: '科技研发中心', year: 2015, description: '科技创新孵化基地，汇聚顶尖科技企业。' },
        'b4_2024': { id: 'b4_2024', name: '国际公寓', year: 2010, description: '高端住宅社区，配套完善。' },
        'b5_2024': { id: 'b5_2024', name: '中央车站', year: 2022, description: '综合交通换乘中心，日均客流30万人次。' },
        'b6_2024': { id: 'b6_2024', name: '绿色生态塔', year: 2023, description: '生态环保示范建筑，零碳排放。' },
      };
      resolve(buildingData[buildingId] || null);
    }, 100);
  });
};

export default api;
