import * as d3 from 'd3';

export interface AttackHotspot {
  id: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  frequency24h: number;
  frequency7d: number;
  frequency30d: number;
  attackTypes: string[];
}

export type TimeRange = '24h' | '7d' | '30d';

export interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    id: string;
    country: string;
    countryCode: string;
    frequency: number;
    attackTypes: string[];
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface AttackGeoJSON {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
  metadata: {
    totalAttacks: number;
    timeRange: TimeRange;
    generatedAt: Date;
    maxFrequency: number;
    minFrequency: number;
  };
}

const COUNTRIES_DATA: Array<{
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  baseWeight: number;
}> = [
  { country: 'United States', countryCode: 'US', lat: 39.8283, lng: -98.5795, baseWeight: 0.95 },
  { country: 'China', countryCode: 'CN', lat: 35.8617, lng: 104.1954, baseWeight: 0.92 },
  { country: 'Russia', countryCode: 'RU', lat: 61.5240, lng: 105.3188, baseWeight: 0.88 },
  { country: 'Germany', countryCode: 'DE', lat: 51.1657, lng: 10.4515, baseWeight: 0.78 },
  { country: 'United Kingdom', countryCode: 'GB', lat: 55.3781, lng: -3.4360, baseWeight: 0.76 },
  { country: 'Japan', countryCode: 'JP', lat: 36.2048, lng: 138.2529, baseWeight: 0.74 },
  { country: 'France', countryCode: 'FR', lat: 46.2276, lng: 2.2137, baseWeight: 0.72 },
  { country: 'India', countryCode: 'IN', lat: 20.5937, lng: 78.9629, baseWeight: 0.70 },
  { country: 'Brazil', countryCode: 'BR', lat: -14.2350, lng: -51.9253, baseWeight: 0.66 },
  { country: 'South Korea', countryCode: 'KR', lat: 35.9078, lng: 127.7669, baseWeight: 0.64 },
  { country: 'Canada', countryCode: 'CA', lat: 56.1304, lng: -106.3468, baseWeight: 0.62 },
  { country: 'Australia', countryCode: 'AU', lat: -25.2744, lng: 133.7751, baseWeight: 0.60 },
  { country: 'Italy', countryCode: 'IT', lat: 41.8719, lng: 12.5674, baseWeight: 0.58 },
  { country: 'Netherlands', countryCode: 'NL', lat: 52.1326, lng: 5.2913, baseWeight: 0.56 },
  { country: 'Spain', countryCode: 'ES', lat: 40.4637, lng: -3.7492, baseWeight: 0.54 },
  { country: 'Iran', countryCode: 'IR', lat: 32.4279, lng: 53.6880, baseWeight: 0.58 },
  { country: 'North Korea', countryCode: 'KP', lat: 40.3399, lng: 127.5101, baseWeight: 0.62 },
  { country: 'Israel', countryCode: 'IL', lat: 31.0461, lng: 34.8516, baseWeight: 0.55 },
  { country: 'Turkey', countryCode: 'TR', lat: 38.9637, lng: 35.2433, baseWeight: 0.48 },
  { country: 'Poland', countryCode: 'PL', lat: 51.9194, lng: 19.1451, baseWeight: 0.46 },
  { country: 'Sweden', countryCode: 'SE', lat: 60.1282, lng: 18.6435, baseWeight: 0.44 },
  { country: 'Switzerland', countryCode: 'CH', lat: 46.8182, lng: 8.2275, baseWeight: 0.42 },
  { country: 'Singapore', countryCode: 'SG', lat: 1.3521, lng: 103.8198, baseWeight: 0.52 },
  { country: 'Mexico', countryCode: 'MX', lat: 23.6345, lng: -102.5528, baseWeight: 0.46 },
  { country: 'Argentina', countryCode: 'AR', lat: -38.4161, lng: -63.6167, baseWeight: 0.40 },
  { country: 'South Africa', countryCode: 'ZA', lat: -30.5595, lng: 22.9375, baseWeight: 0.42 },
  { country: 'Saudi Arabia', countryCode: 'SA', lat: 23.8859, lng: 45.0792, baseWeight: 0.44 },
  { country: 'Egypt', countryCode: 'EG', lat: 26.8206, lng: 30.8025, baseWeight: 0.38 },
  { country: 'Thailand', countryCode: 'TH', lat: 15.8700, lng: 100.9925, baseWeight: 0.40 },
  { country: 'Indonesia', countryCode: 'ID', lat: -0.7893, lng: 113.9213, baseWeight: 0.42 },
  { country: 'Vietnam', countryCode: 'VN', lat: 14.0583, lng: 108.2772, baseWeight: 0.44 },
  { country: 'Malaysia', countryCode: 'MY', lat: 4.2105, lng: 101.9758, baseWeight: 0.38 },
  { country: 'Philippines', countryCode: 'PH', lat: 12.8797, lng: 121.7740, baseWeight: 0.40 },
  { country: 'Pakistan', countryCode: 'PK', lat: 30.3753, lng: 69.3451, baseWeight: 0.42 },
  { country: 'Ukraine', countryCode: 'UA', lat: 48.3794, lng: 31.1656, baseWeight: 0.65 },
  { country: 'Nigeria', countryCode: 'NG', lat: 9.0820, lng: 8.6753, baseWeight: 0.36 },
  { country: 'Colombia', countryCode: 'CO', lat: 4.5709, lng: -74.2973, baseWeight: 0.34 },
  { country: 'Chile', countryCode: 'CL', lat: -35.6751, lng: -71.5430, baseWeight: 0.32 },
  { country: 'Norway', countryCode: 'NO', lat: 60.4720, lng: 8.4689, baseWeight: 0.40 },
  { country: 'Finland', countryCode: 'FI', lat: 61.9241, lng: 25.7482, baseWeight: 0.38 },
  { country: 'Denmark', countryCode: 'DK', lat: 56.2639, lng: 9.5018, baseWeight: 0.36 },
  { country: 'Belgium', countryCode: 'BE', lat: 50.5039, lng: 4.4699, baseWeight: 0.38 },
  { country: 'Austria', countryCode: 'AT', lat: 47.5162, lng: 14.5501, baseWeight: 0.36 },
  { country: 'Portugal', countryCode: 'PT', lat: 39.3999, lng: -8.2245, baseWeight: 0.34 },
  { country: 'Greece', countryCode: 'GR', lat: 39.0742, lng: 21.8243, baseWeight: 0.32 },
  { country: 'Czech Republic', countryCode: 'CZ', lat: 49.8175, lng: 15.4730, baseWeight: 0.34 },
  { country: 'Ireland', countryCode: 'IE', lat: 53.1424, lng: -7.6921, baseWeight: 0.36 },
  { country: 'New Zealand', countryCode: 'NZ', lat: -40.9006, lng: 174.8860, baseWeight: 0.32 },
  { country: 'Hong Kong', countryCode: 'HK', lat: 22.3193, lng: 114.1694, baseWeight: 0.50 },
  { country: 'Taiwan', countryCode: 'TW', lat: 23.6978, lng: 120.9605, baseWeight: 0.48 },
  { country: 'United Arab Emirates', countryCode: 'AE', lat: 23.4241, lng: 53.8478, baseWeight: 0.44 },
  { country: 'Kazakhstan', countryCode: 'KZ', lat: 48.0196, lng: 66.9237, baseWeight: 0.38 },
  { country: 'Romania', countryCode: 'RO', lat: 45.9432, lng: 24.9668, baseWeight: 0.42 },
  { country: 'Hungary', countryCode: 'HU', lat: 47.1625, lng: 19.5033, baseWeight: 0.34 },
  { country: 'Bangladesh', countryCode: 'BD', lat: 23.6850, lng: 90.3563, baseWeight: 0.36 },
  { country: 'Ethiopia', countryCode: 'ET', lat: 9.1450, lng: 40.4897, baseWeight: 0.30 },
  { country: 'Venezuela', countryCode: 'VE', lat: 6.4238, lng: -66.5897, baseWeight: 0.34 },
  { country: 'Peru', countryCode: 'PE', lat: -9.1900, lng: -75.0152, baseWeight: 0.32 },
  { country: 'Iraq', countryCode: 'IQ', lat: 33.2232, lng: 43.6793, baseWeight: 0.40 },
  { country: 'Syria', countryCode: 'SY', lat: 34.8021, lng: 38.9968, baseWeight: 0.42 },
  { country: 'Afghanistan', countryCode: 'AF', lat: 33.9391, lng: 67.7100, baseWeight: 0.38 },
  { country: 'Yemen', countryCode: 'YE', lat: 15.5527, lng: 48.5164, baseWeight: 0.32 },
  { country: 'Sudan', countryCode: 'SD', lat: 12.8628, lng: 30.2176, baseWeight: 0.30 },
  { country: 'Libya', countryCode: 'LY', lat: 26.3351, lng: 17.2283, baseWeight: 0.34 },
  { country: 'Congo', countryCode: 'CD', lat: -4.0383, lng: 21.7587, baseWeight: 0.28 },
  { country: 'Kenya', countryCode: 'KE', lat: -0.0236, lng: 37.9062, baseWeight: 0.32 },
  { country: 'Tanzania', countryCode: 'TZ', lat: -6.3690, lng: 34.8888, baseWeight: 0.30 },
  { country: 'Algeria', countryCode: 'DZ', lat: 28.0339, lng: 1.6596, baseWeight: 0.34 },
  { country: 'Morocco', countryCode: 'MA', lat: 31.7917, lng: -7.0926, baseWeight: 0.36 },
  { country: 'Mongolia', countryCode: 'MN', lat: 46.8625, lng: 103.8467, baseWeight: 0.26 },
  { country: 'Uzbekistan', countryCode: 'UZ', lat: 41.3775, lng: 64.5853, baseWeight: 0.30 },
  { country: 'Turkmenistan', countryCode: 'TM', lat: 38.9697, lng: 59.5563, baseWeight: 0.28 },
  { country: 'Iceland', countryCode: 'IS', lat: 64.9631, lng: -19.0208, baseWeight: 0.28 },
  { country: 'Luxembourg', countryCode: 'LU', lat: 49.8153, lng: 6.1296, baseWeight: 0.34 },
  { country: 'Qatar', countryCode: 'QA', lat: 25.3548, lng: 51.1839, baseWeight: 0.38 },
  { country: 'Kuwait', countryCode: 'KW', lat: 29.3759, lng: 47.9774, baseWeight: 0.36 },
  { country: 'Oman', countryCode: 'OM', lat: 21.5126, lng: 55.9233, baseWeight: 0.30 },
  { country: 'Jordan', countryCode: 'JO', lat: 30.5852, lng: 36.2384, baseWeight: 0.32 },
  { country: 'Lebanon', countryCode: 'LB', lat: 33.8547, lng: 35.8623, baseWeight: 0.34 },
  { country: 'Bahrain', countryCode: 'BH', lat: 26.0667, lng: 50.5577, baseWeight: 0.30 },
  { country: 'Armenia', countryCode: 'AM', lat: 40.0691, lng: 45.0382, baseWeight: 0.32 },
  { country: 'Azerbaijan', countryCode: 'AZ', lat: 40.1431, lng: 47.5769, baseWeight: 0.34 },
  { country: 'Georgia', countryCode: 'GE', lat: 42.3154, lng: 43.3569, baseWeight: 0.30 },
  { country: 'Serbia', countryCode: 'RS', lat: 44.0165, lng: 21.0059, baseWeight: 0.32 },
  { country: 'Croatia', countryCode: 'HR', lat: 45.1000, lng: 15.2000, baseWeight: 0.30 },
  { country: 'Slovakia', countryCode: 'SK', lat: 48.6690, lng: 19.6990, baseWeight: 0.30 },
  { country: 'Bulgaria', countryCode: 'BG', lat: 42.7339, lng: 25.4858, baseWeight: 0.32 },
  { country: 'Lithuania', countryCode: 'LT', lat: 55.1694, lng: 23.8813, baseWeight: 0.28 },
  { country: 'Latvia', countryCode: 'LV', lat: 56.8796, lng: 24.6032, baseWeight: 0.28 },
  { country: 'Estonia', countryCode: 'EE', lat: 58.5953, lng: 25.0136, baseWeight: 0.30 },
  { country: 'Slovenia', countryCode: 'SI', lat: 46.1512, lng: 14.9955, baseWeight: 0.28 },
  { country: 'Bosnia', countryCode: 'BA', lat: 43.9159, lng: 17.6791, baseWeight: 0.26 },
  { country: 'Macedonia', countryCode: 'MK', lat: 41.6086, lng: 21.7453, baseWeight: 0.26 },
  { country: 'Albania', countryCode: 'AL', lat: 41.1533, lng: 20.1683, baseWeight: 0.24 },
  { country: 'Moldova', countryCode: 'MD', lat: 47.4116, lng: 28.3699, baseWeight: 0.28 },
  { country: 'Belarus', countryCode: 'BY', lat: 53.7098, lng: 27.9534, baseWeight: 0.32 },
  { country: 'Lithuania', countryCode: 'LT', lat: 55.1694, lng: 23.8813, baseWeight: 0.28 },
  { country: 'Cuba', countryCode: 'CU', lat: 21.5218, lng: -77.7812, baseWeight: 0.34 },
  { country: 'Ecuador', countryCode: 'EC', lat: -1.8312, lng: -78.1834, baseWeight: 0.28 },
  { country: 'Bolivia', countryCode: 'BO', lat: -16.2902, lng: -63.5887, baseWeight: 0.24 }
];

const ATTACK_TYPES = [
  'DDoS', 'SQL Injection', 'XSS', 'Brute Force',
  'Ransomware', 'Phishing', 'Malware', 'Zero-Day',
  'MITM', 'Data Breach', 'Botnet', 'Exploit Kit'
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function getRandomAttackTypes(rand: () => number, count: number): string[] {
  const shuffled = [...ATTACK_TYPES].sort(() => rand() - 0.5);
  return shuffled.slice(0, Math.max(1, Math.min(count, 4)));
}

export class DataLoader {
  private hotspots: AttackHotspot[] = [];
  private colorScale: d3.ScaleSequential<string>;

  constructor() {
    this.colorScale = d3.scaleSequential(d3.interpolateTurbo)
      .domain([0, 1]);
    this.generateHotspots();
  }

  private generateHotspots(): void {
    const rand = seededRandom(42);
    const numHotspots = 80;
    const selectedCountries = COUNTRIES_DATA
      .sort(() => rand() - 0.5)
      .slice(0, numHotspots);

    this.hotspots = selectedCountries.map((country, idx) => {
      const localRand = seededRandom(idx * 1000 + 7);
      const freqVariation24h = 0.4 + localRand() * 0.6;
      const freqVariation7d = 0.5 + localRand() * 0.5;
      const freqVariation30d = 0.6 + localRand() * 0.4;

      const latJitter = (localRand() - 0.5) * 8;
      const lngJitter = (localRand() - 0.5) * 8;

      const maxFreq = 10000;
      return {
        id: `hotspot-${idx.toString().padStart(3, '0')}`,
        country: country.country,
        countryCode: country.countryCode,
        lat: Math.max(-85, Math.min(85, country.lat + latJitter)),
        lng: country.lng + lngJitter,
        frequency24h: Math.floor(country.baseWeight * freqVariation24h * maxFreq * (0.3 + localRand() * 0.7)),
        frequency7d: Math.floor(country.baseWeight * freqVariation7d * maxFreq * 7 * (0.3 + localRand() * 0.7)),
        frequency30d: Math.floor(country.baseWeight * freqVariation30d * maxFreq * 30 * (0.3 + localRand() * 0.7)),
        attackTypes: getRandomAttackTypes(localRand, Math.floor(1 + localRand() * 4))
      };
    });
  }

  public getFrequency(hotspot: AttackHotspot, timeRange: TimeRange): number {
    switch (timeRange) {
      case '24h': return hotspot.frequency24h;
      case '7d': return hotspot.frequency7d;
      case '30d': return hotspot.frequency30d;
    }
  }

  public getHotspots(): AttackHotspot[] {
    return this.hotspots;
  }

  public getGeoJSON(timeRange: TimeRange = '24h'): AttackGeoJSON {
    const frequencies = this.hotspots.map(h => this.getFrequency(h, timeRange));
    const minFrequency = Math.min(...frequencies);
    const maxFrequency = Math.max(...frequencies);

    const sortedByFreq = [...this.hotspots]
      .sort((a, b) => this.getFrequency(b, timeRange) - this.getFrequency(a, timeRange));

    const features: GeoJSONFeature[] = sortedByFreq.map(h => ({
      type: 'Feature',
      properties: {
        id: h.id,
        country: h.country,
        countryCode: h.countryCode,
        frequency: this.getFrequency(h, timeRange),
        attackTypes: h.attackTypes
      },
      geometry: {
        type: 'Point',
        coordinates: [h.lng, h.lat]
      }
    }));

    const totalAttacks = frequencies.reduce((sum, f) => sum + f, 0);

    return {
      type: 'FeatureCollection',
      features,
      metadata: {
        totalAttacks,
        timeRange,
        generatedAt: new Date(),
        maxFrequency,
        minFrequency
      }
    };
  }

  public getTopCountries(timeRange: TimeRange, limit: number = 5): Array<{
    country: string;
    countryCode: string;
    frequency: number;
    percentage: number;
  }> {
    const frequencies = this.hotspots.map(h => ({
      country: h.country,
      countryCode: h.countryCode,
      frequency: this.getFrequency(h, timeRange)
    }));

    const total = frequencies.reduce((sum, f) => sum + f.frequency, 0);

    return frequencies
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit)
      .map(f => ({
        ...f,
        percentage: (f.frequency / total) * 100
      }));
  }

  public getColorScale(): d3.ScaleSequential<string> {
    return this.colorScale;
  }

  public getFrequencyColor(frequency: number, min: number, max: number): string {
    const t = (frequency - min) / (max - min);
    return this.colorScale(t);
  }
}
