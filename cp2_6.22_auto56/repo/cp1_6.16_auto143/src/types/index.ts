export interface FlavorProfile {
  spicy: number;
  aromatic: number;
  warm: number;
  pungent: number;
  sweet: number;
}

export interface Spice {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  flavor: FlavorProfile;
  description: string;
  typicalRatio: string;
}

export interface Culture {
  id: string;
  name: string;
  nameEn: string;
  lat: number;
  lng: number;
  color: string;
  spices: Spice[];
}

export interface FavoriteItem {
  id: string;
  spices: [Spice, Spice];
  cultureName: string;
  similarity: number;
  createdAt: number;
}
