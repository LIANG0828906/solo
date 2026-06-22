export interface TypographyStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
}

export function exportCSS(style: TypographyStyle): string {
  const weightMap: Record<string, string> = {
    light: '300',
    regular: '400',
    bold: '700',
  };

  return [
    `font-family: '${style.fontFamily}', sans-serif;`,
    `font-size: ${style.fontSize}px;`,
    `font-weight: ${weightMap[style.fontWeight] || style.fontWeight};`,
    `color: ${style.color};`,
  ].join('\n');
}
