export interface HSV {
  h: number;
  s: number;
  v: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export type SchemeType = 'complementary' | 'analogous' | 'triadic' | 'splitComplementary' | 'monochromatic';

export interface ColorScheme {
  id: string;
  name: string;
  tags?: string[];
  colors: string[];
  primaryColor: string;
  schemeType: SchemeType;
  isPublic: boolean;
  createdAt: string;
}

export interface GeneratedScheme {
  type: SchemeType;
  name: string;
  colors: string[];
}

export interface CreateSchemeRequest {
  name: string;
  tags?: string[];
  colors: string[];
  primaryColor: string;
  schemeType: SchemeType;
  isPublic?: boolean;
}
