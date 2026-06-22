import WebFont from 'webfontloader';

export const loadedFonts = new Set<string>();

export function isFontLoaded(fontName: string): boolean {
  return loadedFonts.has(fontName);
}

export function loadFont(fontName: string): Promise<boolean> {
  if (loadedFonts.has(fontName)) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    WebFont.load({
      google: {
        families: [fontName],
      },
      active: () => {
        loadedFonts.add(fontName);
        resolve(true);
      },
      inactive: () => {
        resolve(false);
      },
      fontinactive: () => {
        resolve(false);
      },
    });
  });
}
