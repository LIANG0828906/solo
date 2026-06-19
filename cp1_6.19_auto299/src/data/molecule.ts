export interface AtomData {
  id: string;
  element: 'C' | 'O' | 'N' | 'H';
  position: [number, number, number];
  role: string;
}

export interface BondData {
  id: string;
  atom1Id: string;
  atom2Id: string;
}

export const ELEMENT_COLORS: Record<string, string> = {
  C: '#555555',
  O: '#FF0000',
  N: '#3050F8',
  H: '#FFFFFF',
};

export const ELEMENT_RADIUS: Record<string, number> = {
  C: 0.35,
  O: 0.32,
  N: 0.34,
  H: 0.22,
};

export const CAFFEINE_ATOMS: AtomData[] = [
  { id: 'C1', element: 'C', position: [-0.6, 0.4, 0.2], role: '嘧啶环骨架' },
  { id: 'C2', element: 'C', position: [0.2, 1.0, -0.3], role: '嘧啶环骨架' },
  { id: 'C3', element: 'C', position: [1.0, 0.0, -0.3], role: '咪唑环骨架' },
  { id: 'C4', element: 'C', position: [0.4, -0.8, 0.3], role: '咪唑环骨架' },
  { id: 'C5', element: 'C', position: [-1.0, -0.6, 0.5], role: '嘧啶环骨架' },
  { id: 'C6', element: 'C', position: [-0.8, 1.1, 0.6], role: '甲基连接碳' },
  { id: 'C7', element: 'C', position: [1.6, 0.8, -0.8], role: '甲基连接碳' },
  { id: 'C8', element: 'C', position: [0.6, -1.6, 1.1], role: '甲基连接碳' },
  { id: 'N1', element: 'N', position: [-0.8, -0.2, -0.2], role: '嘧啶环氮' },
  { id: 'N2', element: 'N', position: [0.8, 0.6, 0.3], role: '桥连氮' },
  { id: 'N3', element: 'N', position: [-0.2, -1.0, -0.1], role: '咪唑环氮' },
  { id: 'N4', element: 'N', position: [-1.6, 0.3, 0.9], role: '氨基氮' },
  { id: 'O1', element: 'O', position: [0.5, 1.9, -0.9], role: '羰基氧' },
  { id: 'O2', element: 'O', position: [-1.8, -1.2, 0.9], role: '羰基氧' },
  { id: 'H1', element: 'H', position: [-1.2, 1.8, 1.2], role: '甲基氢' },
  { id: 'H2', element: 'H', position: [-1.5, 1.5, -0.2], role: '甲基氢' },
  { id: 'H3', element: 'H', position: [0.0, 1.5, 1.2], role: '甲基氢' },
  { id: 'H4', element: 'H', position: [2.0, 1.5, -0.1], role: '甲基氢' },
  { id: 'H5', element: 'H', position: [2.4, 0.2, -1.0], role: '甲基氢' },
  { id: 'H6', element: 'H', position: [1.1, 1.4, -1.7], role: '甲基氢' },
  { id: 'H7', element: 'H', position: [1.3, -2.1, 1.1], role: '甲基氢' },
  { id: 'H8', element: 'H', position: [0.0, -2.3, 1.0], role: '甲基氢' },
  { id: 'H9', element: 'H', position: [0.7, -1.2, 2.0], role: '甲基氢' },
  { id: 'H10', element: 'H', position: [-2.2, 0.7, 0.4], role: '氨基氢' },
];

export const CAFFEINE_BONDS: BondData[] = [
  { id: 'B1', atom1Id: 'C1', atom2Id: 'C2' },
  { id: 'B2', atom1Id: 'C2', atom2Id: 'C3' },
  { id: 'B3', atom1Id: 'C3', atom2Id: 'C4' },
  { id: 'B4', atom1Id: 'C4', atom2Id: 'C5' },
  { id: 'B5', atom1Id: 'C5', atom2Id: 'C1' },
  { id: 'B6', atom1Id: 'C1', atom2Id: 'N1' },
  { id: 'B7', atom1Id: 'N1', atom2Id: 'C5' },
  { id: 'B8', atom1Id: 'C2', atom2Id: 'N2' },
  { id: 'B9', atom1Id: 'N2', atom2Id: 'C3' },
  { id: 'B10', atom1Id: 'C3', atom2Id: 'N3' },
  { id: 'B11', atom1Id: 'N3', atom2Id: 'C4' },
  { id: 'B12', atom1Id: 'C5', atom2Id: 'N4' },
  { id: 'B13', atom1Id: 'C1', atom2Id: 'C6' },
  { id: 'B14', atom1Id: 'C3', atom2Id: 'C7' },
  { id: 'B15', atom1Id: 'C4', atom2Id: 'C8' },
  { id: 'B16', atom1Id: 'C2', atom2Id: 'O1' },
  { id: 'B17', atom1Id: 'C5', atom2Id: 'O2' },
  { id: 'B18', atom1Id: 'C6', atom2Id: 'H1' },
  { id: 'B19', atom1Id: 'C6', atom2Id: 'H2' },
  { id: 'B20', atom1Id: 'C6', atom2Id: 'H3' },
  { id: 'B21', atom1Id: 'C7', atom2Id: 'H4' },
  { id: 'B22', atom1Id: 'C7', atom2Id: 'H5' },
  { id: 'B23', atom1Id: 'C7', atom2Id: 'H6' },
  { id: 'B24', atom1Id: 'C8', atom2Id: 'H7' },
  { id: 'B25', atom1Id: 'C8', atom2Id: 'H8' },
  { id: 'B26', atom1Id: 'C8', atom2Id: 'H9' },
  { id: 'B27', atom1Id: 'N4', atom2Id: 'H10' },
];
