export interface FontData {
  name: string;
  category: string;
  weights: number[];
  variants: string[];
  subsets: string[];
  popularity?: number;
}

export interface TypographyParams {
  headingFont: string;
  bodyFont: string;
  headingSize: number;
  bodySize: number;
  lineHeight: number;
  letterSpacing: number;
  paragraphSpacing: number;
  textAlign: 'left' | 'center' | 'right';
  deviceWidth: number;
}

export interface Preset {
  id: string;
  name: string;
  params: TypographyParams;
  createdAt: number;
}

export interface FontSelectedEventDetail {
  type: 'heading' | 'body';
  font: FontData;
}
