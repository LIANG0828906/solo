export type TokenCategory = 'color' | 'spacing' | 'typography';

export type FilterCategory = 'all' | TokenCategory;

export interface Token {
  id: string;
  name: string;
  category: TokenCategory;
  value: string;
  description: string;
}
