export interface ColorStop {
  id: string;
  color: string;
  position: number;
}

export interface GradientScheme {
  id: string;
  name: string;
  colorStops: ColorStop[];
  angle: number;
  createdAt: number;
}

export interface GradientResult {
  cssString: string;
  previewColors: string[];
}
