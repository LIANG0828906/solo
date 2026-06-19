import { EmissionSource } from '@/types';

export const emissionSources: EmissionSource[] = [
  {
    id: 'energy-coal',
    name: '煤炭发电',
    gasType: 'CO2',
    annualEmission: 14.2,
    contribution: 0.28,
    sector: '能源',
  },
  {
    id: 'energy-oil',
    name: '石油燃烧',
    gasType: 'CO2',
    annualEmission: 11.5,
    contribution: 0.23,
    sector: '能源',
  },
  {
    id: 'energy-gas',
    name: '天然气发电',
    gasType: 'CO2',
    annualEmission: 6.3,
    contribution: 0.12,
    sector: '能源',
  },
  {
    id: 'industry-cement',
    name: '水泥生产',
    gasType: 'CO2',
    annualEmission: 2.8,
    contribution: 0.06,
    sector: '工业',
  },
  {
    id: 'industry-steel',
    name: '钢铁冶炼',
    gasType: 'CO2',
    annualEmission: 3.1,
    contribution: 0.07,
    sector: '工业',
  },
  {
    id: 'transport-road',
    name: '道路交通',
    gasType: 'CO2',
    annualEmission: 5.2,
    contribution: 0.10,
    sector: '交通',
  },
  {
    id: 'agriculture-livestock',
    name: '牲畜养殖',
    gasType: 'CH4',
    annualEmission: 3.8,
    contribution: 0.08,
    sector: '农业',
  },
  {
    id: 'agriculture-fertilizer',
    name: '化肥使用',
    gasType: 'N2O',
    annualEmission: 2.1,
    contribution: 0.06,
    sector: '农业',
  },
];

export const getTotalEmission = () => {
  return emissionSources.reduce((sum, s) => sum + s.annualEmission, 0);
};
