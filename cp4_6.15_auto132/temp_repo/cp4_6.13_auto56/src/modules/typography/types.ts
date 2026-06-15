export interface ITypographyParams {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  color: string;
}

export interface ISavedScheme {
  id: string;
  name: string;
  createdAt: number;
  text: string;
  params: ITypographyParams;
  thumbnail: string;
}

export interface IPreviewState {
  text: string;
  paramsList: ITypographyParams[];
  compareMode: boolean;
  selectedIndex: number;
  compareIndex: number;
}

export const FONT_OPTIONS: { label: string; value: string; category: string }[] = [
  { label: '衬线体 (Playfair Display)', value: "'Playfair Display', serif", category: '衬线' },
  { label: '无衬线体 (Roboto)', value: "'Roboto', sans-serif", category: '无衬线' },
  { label: '手写体 (Pacifico)', value: "'Pacifico', cursive", category: '手写' },
  { label: '等宽体 (JetBrains Mono)', value: "'JetBrains Mono', monospace", category: '等宽' },
  { label: '装饰体 (Lobster)', value: "'Lobster', cursive", category: '装饰' },
];

export const DEFAULT_PARAMS: ITypographyParams = {
  fontFamily: FONT_OPTIONS[1].value,
  fontSize: 32,
  lineHeight: 1.6,
  letterSpacing: 0,
  color: '#ffffff',
};
