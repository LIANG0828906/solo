export interface FlavorProfile {
  fruit: number;
  acidity: number;
  tannin: number;
  body: number;
  sweetness: number;
  aftertaste: number;
}

export interface Wine {
  id: string;
  name: string;
  year: number;
  variety: string;
  alcohol: number;
  region: string;
  flavors: FlavorProfile;
  notes: string;
}

export interface SimilarWine extends Wine {
  eucDist: number;
  cosSim: number;
  combinedScore: number;
}

export const FLAVOR_DIMS: (keyof FlavorProfile)[] = [
  'fruit', 'acidity', 'tannin', 'body', 'sweetness', 'aftertaste'
];

export const FLAVOR_LABELS: Record<keyof FlavorProfile, string> = {
  fruit: '果香',
  acidity: '酸度',
  tannin: '单宁',
  body: '酒体',
  sweetness: '甜度',
  aftertaste: '余味',
};
