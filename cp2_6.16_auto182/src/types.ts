export enum CloudType {
  CUMULUS = 'cumulus',
  STRATUS = 'stratus',
  CIRRUS = 'cirrus',
}

export interface SystemParams {
  cloudType: CloudType;
  windSpeed: number;
  windDirection: number;
  precipitationIntensity: number;
  cloudDensity: number;
}

export interface CloudTypeConfig {
  name: string;
  color: string;
  particleCount: number;
  sizeRange: [number, number];
  distribution: 'clustered' | 'layered' | 'wispy';
  opacity: number;
}

export const CLOUD_TYPE_CONFIGS: Record<CloudType, CloudTypeConfig> = {
  [CloudType.CUMULUS]: {
    name: '积云',
    color: '#F0F8FF',
    particleCount: 3000,
    sizeRange: [0.15, 0.3],
    distribution: 'clustered',
    opacity: 0.85,
  },
  [CloudType.STRATUS]: {
    name: '层云',
    color: '#DCDCDC',
    particleCount: 4000,
    sizeRange: [0.1, 0.2],
    distribution: 'layered',
    opacity: 0.75,
  },
  [CloudType.CIRRUS]: {
    name: '卷云',
    color: '#E6E6FA',
    particleCount: 2500,
    sizeRange: [0.05, 0.15],
    distribution: 'wispy',
    opacity: 0.6,
  },
};

export const MAX_CLOUD_PARTICLES = 10000;
export const MAX_PRECIP_PARTICLES = 5000;
