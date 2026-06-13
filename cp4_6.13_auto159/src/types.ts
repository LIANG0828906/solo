export interface CharacterFeatures {
  hairStyle: number;
  hairColor: string;
  eyeColor: string;
  skinColor: string;
  clothesStyle: number;
  clothesColor: string;
  backgroundType: string;
  backgroundColor: string;
}

export interface CharacterData {
  id: string;
  name: string;
  description: string;
  features: CharacterFeatures;
  avatarDataUrl: string;
  createdAt: number;
}
