export interface ColorCard {
  id: string;
  name: string;
  hex: string;
  notes: string;
  thumbnail?: string;
  tags: string[];
  createdAt: string;
}

export interface TagFrequency {
  tag: string;
  count: number;
  color: string;
}
