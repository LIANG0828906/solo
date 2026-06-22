export interface Atom {
  id: string;
  element: 'H' | 'C' | 'O';
  position: [number, number, number];
}

export interface Bond {
  id: string;
  atom1Id: string;
  atom2Id: string;
  bondLength: number;
}

export interface Molecule {
  id: string;
  name: string;
  formula: string;
  atoms: Atom[];
  bonds: Bond[];
}

export interface MoleculeInfo {
  id: string;
  name: string;
  formula: string;
}

export interface EnergyResponse {
  energy: number;
  timestamp: number;
}

const API_BASE = '/api';

export const fetchMoleculeList = async (): Promise<MoleculeInfo[]> => {
  const response = await fetch(`${API_BASE}/molecules`);
  if (!response.ok) {
    throw new Error('Failed to fetch molecule list');
  }
  return response.json();
};

export const fetchMolecule = async (id: string): Promise<Molecule> => {
  const response = await fetch(`${API_BASE}/molecules/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch molecule');
  }
  return response.json();
};

export const calculateEnergy = async (
  moleculeId: string,
  atoms: Atom[]
): Promise<EnergyResponse> => {
  const startTime = Date.now();
  const response = await fetch(`${API_BASE}/calculate-energy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ moleculeId, atoms }),
  });

  const responseTime = Date.now() - startTime;
  if (responseTime > 200) {
    console.warn(`Energy API response took ${responseTime}ms`);
  }

  if (!response.ok) {
    throw new Error('Failed to calculate energy');
  }
  return response.json();
};
