export interface IAuraParams {
  color: string;
  particleCount: number;
  rotationSpeed: number;
  radius: number;
  pulseFrequency: number;
}

export interface IAuraSlot {
  id: number;
  enabled: boolean;
  params: IAuraParams;
  hueShift: boolean;
}

export const PRESET_COLORS: string[] = [
  '#ff4444',
  '#ff8800',
  '#ffcc00',
  '#00cc44',
  '#00cccc',
  '#4488ff',
  '#8844ff',
  '#ff44aa',
];

export const DEFAULT_AURA_PARAMS: IAuraParams = {
  color: '#4488ff',
  particleCount: 200,
  rotationSpeed: 1.5,
  radius: 2.5,
  pulseFrequency: 1.5,
};

export interface PresetTemplate {
  name: string;
  slots: Omit<IAuraSlot, 'id'>[];
}

export const PRESET_TEMPLATES: Record<string, PresetTemplate> = {
  firestorm: {
    name: '火焰风暴',
    slots: [
      { enabled: true, hueShift: true, params: { color: '#ff4444', particleCount: 350, rotationSpeed: 2.5, radius: 3.5, pulseFrequency: 2.0 } },
      { enabled: true, hueShift: false, params: { color: '#ff8800', particleCount: 280, rotationSpeed: 1.8, radius: 2.8, pulseFrequency: 1.8 } },
      { enabled: true, hueShift: false, params: { color: '#ffcc00', particleCount: 200, rotationSpeed: 1.2, radius: 2.0, pulseFrequency: 1.5 } },
      { enabled: false, hueShift: false, params: { color: '#ff4444', particleCount: 150, rotationSpeed: 0.8, radius: 1.5, pulseFrequency: 1.0 } },
    ],
  },
  frost: {
    name: '冰霜领域',
    slots: [
      { enabled: true, hueShift: false, params: { color: '#00cccc', particleCount: 320, rotationSpeed: 1.0, radius: 3.8, pulseFrequency: 1.2 } },
      { enabled: true, hueShift: true, params: { color: '#4488ff', particleCount: 260, rotationSpeed: 1.5, radius: 3.0, pulseFrequency: 1.6 } },
      { enabled: true, hueShift: false, params: { color: '#00cccc', particleCount: 180, rotationSpeed: 2.2, radius: 2.2, pulseFrequency: 2.0 } },
      { enabled: false, hueShift: false, params: { color: '#8844ff', particleCount: 120, rotationSpeed: 0.6, radius: 1.2, pulseFrequency: 0.8 } },
    ],
  },
  shadow: {
    name: '暗影缠绕',
    slots: [
      { enabled: true, hueShift: true, params: { color: '#8844ff', particleCount: 380, rotationSpeed: 2.8, radius: 4.0, pulseFrequency: 2.2 } },
      { enabled: true, hueShift: false, params: { color: '#ff44aa', particleCount: 250, rotationSpeed: 2.0, radius: 3.2, pulseFrequency: 1.8 } },
      { enabled: true, hueShift: false, params: { color: '#4488ff', particleCount: 180, rotationSpeed: 1.4, radius: 2.4, pulseFrequency: 1.4 } },
      { enabled: false, hueShift: false, params: { color: '#8844ff', particleCount: 140, rotationSpeed: 0.9, radius: 1.6, pulseFrequency: 1.0 } },
    ],
  },
  holy: {
    name: '圣光祝福',
    slots: [
      { enabled: true, hueShift: false, params: { color: '#ffcc00', particleCount: 400, rotationSpeed: 0.8, radius: 4.2, pulseFrequency: 1.0 } },
      { enabled: true, hueShift: true, params: { color: '#00cccc', particleCount: 280, rotationSpeed: 1.2, radius: 3.4, pulseFrequency: 1.4 } },
      { enabled: true, hueShift: false, params: { color: '#ffffff', particleCount: 220, rotationSpeed: 1.8, radius: 2.6, pulseFrequency: 1.8 } },
      { enabled: false, hueShift: false, params: { color: '#ffcc00', particleCount: 160, rotationSpeed: 0.5, radius: 1.8, pulseFrequency: 0.6 } },
    ],
  },
};
