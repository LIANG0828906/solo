export interface Stratum {
  id: string;
  name: string;
  lithologyCode: string;
  thickness: number;
  color: string;
  textureDensity: number;
}

export type FaultType = 'normal' | 'reverse';

export interface Fault {
  id: string;
  type: FaultType;
  dip: number;
  strike: number;
  throw: number;
  position: number;
}

export interface GeologyTemplate {
  id: string;
  name: string;
  strata: Stratum[];
  faults: Fault[];
  modelSize: { x: number; y: number; z: number };
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_STRATA: Stratum[] = [
  {
    id: 'stratum-1',
    name: '表层沉积层',
    lithologyCode: 'Q',
    thickness: 30,
    color: '#D4A574',
    textureDensity: 0.3
  },
  {
    id: 'stratum-2',
    name: '砂岩地层',
    lithologyCode: 'Ss',
    thickness: 50,
    color: '#C17F59',
    textureDensity: 0.5
  },
  {
    id: 'stratum-3',
    name: '泥岩层',
    lithologyCode: 'Sh',
    thickness: 40,
    color: '#A0522D',
    textureDensity: 0.6
  },
  {
    id: 'stratum-4',
    name: '基岩层',
    lithologyCode: 'Bg',
    thickness: 60,
    color: '#8B0000',
    textureDensity: 0.8
  }
];

export const DEFAULT_FAULTS: Fault[] = [
  {
    id: 'fault-1',
    type: 'normal',
    dip: 60,
    strike: 90,
    throw: 25,
    position: 0.3
  },
  {
    id: 'fault-2',
    type: 'reverse',
    dip: 55,
    strike: 0,
    throw: 15,
    position: 0.65
  }
];

export const DEFAULT_MODEL_SIZE = { x: 200, y: 200, z: 180 };

export const STRATUM_COLOR_PALETTE = [
  '#D4A574',
  '#C17F59',
  '#B8860B',
  '#A0522D',
  '#8B4513',
  '#A52A2A',
  '#8B0000'
];

export function createDefaultTemplate(): GeologyTemplate {
  return {
    id: '',
    name: '默认地质模型',
    strata: DEFAULT_STRATA,
    faults: DEFAULT_FAULTS,
    modelSize: DEFAULT_MODEL_SIZE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export async function saveTemplate(template: GeologyTemplate): Promise<GeologyTemplate> {
  try {
    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(template)
    });
    if (!response.ok) {
      throw new Error('Failed to save template');
    }
    return await response.json();
  } catch (error) {
    console.error('Error saving template:', error);
    const saved = { ...template, id: template.id || `local-${Date.now()}` };
    localStorage.setItem(`geology-template-${saved.id}`, JSON.stringify(saved));
    return saved;
  }
}

export async function loadTemplates(): Promise<GeologyTemplate[]> {
  try {
    const response = await fetch('/api/templates');
    if (!response.ok) {
      throw new Error('Failed to load templates');
    }
    const templates = await response.json();
    const localTemplates = Object.keys(localStorage)
      .filter((key) => key.startsWith('geology-template-'))
      .map((key) => JSON.parse(localStorage.getItem(key) || '{}'));
    return [...templates, ...localTemplates];
  } catch (error) {
    console.error('Error loading templates:', error);
    return Object.keys(localStorage)
      .filter((key) => key.startsWith('geology-template-'))
      .map((key) => JSON.parse(localStorage.getItem(key) || '{}'));
  }
}

export async function loadTemplate(id: string): Promise<GeologyTemplate | null> {
  try {
    const response = await fetch(`/api/templates/${id}`);
    if (!response.ok) {
      throw new Error('Failed to load template');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading template:', error);
    const local = localStorage.getItem(`geology-template-${id}`);
    return local ? JSON.parse(local) : null;
  }
}
