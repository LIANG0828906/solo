export interface CountryEmission {
  countryCode: string;
  countryName: string;
  lat: number;
  lng: number;
  emissions: Record<number, number>;
  population: number;
}

export interface ScenarioParams {
  transport: {
    flightsPerMonth: number;
    carKmPerWeek: number;
  };
  diet: {
    redMeatPerWeek: number;
    dairyPerWeek: number;
  };
  energy: {
    electricityPerMonth: number;
  };
}

export interface ScenarioResult {
  totalCarbon: number;
  breakdown: {
    transport: number;
    diet: number;
    energy: number;
  };
}

export interface TrendDataPoint {
  year: number;
  emission: number;
}

const generateEmissions = (base: number, growthRate: number): Record<number, number> => {
  const emissions: Record<number, number> = {};
  for (let year = 1990; year <= 2023; year++) {
    const yearsPassed = year - 1990;
    const variation = Math.sin(yearsPassed * 0.3) * 0.15 + Math.sin(yearsPassed * 0.7) * 0.08;
    emissions[year] = Math.max(0.1, base * (1 + growthRate * yearsPassed / 100 + variation));
  }
  return emissions;
};

const countries: CountryEmission[] = [
  { countryCode: 'USA', countryName: '美国', lat: 37.0902, lng: -95.7129, population: 334000000, emissions: generateEmissions(19.5, -0.3) },
  { countryCode: 'CHN', countryName: '中国', lat: 35.8617, lng: 104.1954, population: 1410000000, emissions: generateEmissions(2.2, 5.5) },
  { countryCode: 'JPN', countryName: '日本', lat: 36.2048, lng: 138.2529, population: 125000000, emissions: generateEmissions(8.5, -0.5) },
  { countryCode: 'DEU', countryName: '德国', lat: 51.1657, lng: 10.4515, population: 84000000, emissions: generateEmissions(11.2, -1.8) },
  { countryCode: 'GBR', countryName: '英国', lat: 55.3781, lng: -3.4360, population: 67000000, emissions: generateEmissions(10.0, -2.0) },
  { countryCode: 'IND', countryName: '印度', lat: 20.5937, lng: 78.9629, population: 1420000000, emissions: generateEmissions(0.7, 4.5) },
  { countryCode: 'BRA', countryName: '巴西', lat: -14.2350, lng: -51.9253, population: 215000000, emissions: generateEmissions(1.5, 2.0) },
  { countryCode: 'RUS', countryName: '俄罗斯', lat: 61.5240, lng: 105.3188, population: 143000000, emissions: generateEmissions(14.0, 0.5) },
  { countryCode: 'CAN', countryName: '加拿大', lat: 56.1304, lng: -106.3468, population: 39000000, emissions: generateEmissions(15.5, -1.0) },
  { countryCode: 'AUS', countryName: '澳大利亚', lat: -25.2744, lng: 133.7751, population: 26000000, emissions: generateEmissions(16.0, -0.5) },
  { countryCode: 'FRA', countryName: '法国', lat: 46.2276, lng: 2.2137, population: 68000000, emissions: generateEmissions(6.0, -1.5) },
  { countryCode: 'ITA', countryName: '意大利', lat: 41.8719, lng: 12.5674, population: 59000000, emissions: generateEmissions(7.5, -1.2) },
  { countryCode: 'ESP', countryName: '西班牙', lat: 40.4637, lng: -3.7492, population: 47000000, emissions: generateEmissions(5.5, -0.8) },
  { countryCode: 'KOR', countryName: '韩国', lat: 35.9078, lng: 127.7669, population: 52000000, emissions: generateEmissions(5.5, 1.5) },
  { countryCode: 'MEX', countryName: '墨西哥', lat: 23.6345, lng: -102.5528, population: 128000000, emissions: generateEmissions(3.5, 1.0) },
  { countryCode: 'IDN', countryName: '印度尼西亚', lat: -0.7893, lng: 113.9213, population: 278000000, emissions: generateEmissions(1.2, 3.0) },
  { countryCode: 'SAU', countryName: '沙特阿拉伯', lat: 23.8859, lng: 45.0792, population: 36000000, emissions: generateEmissions(12.0, 2.0) },
  { countryCode: 'ZAF', countryName: '南非', lat: -30.5595, lng: 22.9375, population: 60000000, emissions: generateEmissions(7.5, 0.0) },
  { countryCode: 'TUR', countryName: '土耳其', lat: 38.9637, lng: 35.2433, population: 85000000, emissions: generateEmissions(2.8, 2.5) },
  { countryCode: 'ARG', countryName: '阿根廷', lat: -38.4161, lng: -63.6167, population: 46000000, emissions: generateEmissions(3.5, 0.5) },
  { countryCode: 'POL', countryName: '波兰', lat: 51.9194, lng: 19.1451, population: 38000000, emissions: generateEmissions(8.5, -0.8) },
  { countryCode: 'NLD', countryName: '荷兰', lat: 52.1326, lng: 5.2913, population: 17000000, emissions: generateEmissions(9.5, -1.5) },
  { countryCode: 'SWE', countryName: '瑞典', lat: 60.1282, lng: 18.6435, population: 10000000, emissions: generateEmissions(6.0, -2.5) },
  { countryCode: 'NOR', countryName: '挪威', lat: 60.4720, lng: 8.4689, population: 5500000, emissions: generateEmissions(8.0, -1.0) },
  { countryCode: 'CHE', countryName: '瑞士', lat: 46.8182, lng: 8.2275, population: 8700000, emissions: generateEmissions(5.5, -1.2) },
  { countryCode: 'AUT', countryName: '奥地利', lat: 47.5162, lng: 14.5501, population: 9000000, emissions: generateEmissions(7.0, -1.5) },
  { countryCode: 'BEL', countryName: '比利时', lat: 50.5039, lng: 4.4699, population: 11600000, emissions: generateEmissions(10.5, -1.8) },
  { countryCode: 'THA', countryName: '泰国', lat: 15.8700, lng: 100.9925, population: 70000000, emissions: generateEmissions(2.0, 3.0) },
  { countryCode: 'VNM', countryName: '越南', lat: 14.0583, lng: 108.2772, population: 99000000, emissions: generateEmissions(0.8, 5.0) },
  { countryCode: 'EGY', countryName: '埃及', lat: 26.8206, lng: 30.8025, population: 110000000, emissions: generateEmissions(1.8, 2.5) },
];

export const getCountries = (): CountryEmission[] => countries;

export const getCountryData = (countryCode: string, year: number): { emission: number; population: number; countryName: string } | null => {
  const country = countries.find(c => c.countryCode === countryCode);
  if (!country) return null;
  const emission = country.emissions[year] || 0;
  return { emission, population: country.population, countryName: country.countryName };
};

export const getGlobalTrend = (): TrendDataPoint[] => {
  const trend: TrendDataPoint[] = [];
  for (let year = 1990; year <= 2023; year++) {
    let totalEmission = 0;
    let totalPopulation = 0;
    countries.forEach(country => {
      const emission = country.emissions[year] || 0;
      totalEmission += emission * country.population;
      totalPopulation += country.population;
    });
    trend.push({
      year,
      emission: totalEmission / totalPopulation
    });
  }
  return trend;
};

export const getCountryRank = (countryCode: string, year: number): number => {
  const sorted = [...countries].sort((a, b) => (b.emissions[year] || 0) - (a.emissions[year] || 0));
  return sorted.findIndex(c => c.countryCode === countryCode) + 1;
};

export const calculateScenario = (params: ScenarioParams): ScenarioResult => {
  const flightEmission = params.transport.flightsPerMonth * 12 * 0.5;
  const carEmission = params.transport.carKmPerWeek * 52 * 0.00018;
  const transport = flightEmission + carEmission;

  const redMeatEmission = params.diet.redMeatPerWeek * 52 * 0.027;
  const dairyEmission = params.diet.dairyPerWeek * 52 * 0.0032;
  const diet = redMeatEmission + dairyEmission;

  const energy = params.energy.electricityPerMonth * 12 * 0.0005;

  return {
    totalCarbon: transport + diet + energy,
    breakdown: { transport, diet, energy }
  };
};

export const defaultScenarioParams: ScenarioParams = {
  transport: {
    flightsPerMonth: 1,
    carKmPerWeek: 200
  },
  diet: {
    redMeatPerWeek: 0.5,
    dairyPerWeek: 3
  },
  energy: {
    electricityPerMonth: 300
  }
};
