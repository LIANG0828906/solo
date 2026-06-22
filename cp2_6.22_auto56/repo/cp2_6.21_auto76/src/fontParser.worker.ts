import opentype from 'opentype.js';

interface StoredFont {
  font: opentype.Font;
  id: string;
}

const fonts = new Map<string, StoredFont>();

function extractGlyphData(font: opentype.Font, chars: string) {
  const glyphs: Record<string, any> = {};
  const seen = new Set<string>();
  for (const ch of chars) {
    if (seen.has(ch)) continue;
    seen.add(ch);
    const glyph = font.charToGlyph(ch);
    const path = glyph.getPath(0, 0, font.unitsPerEm);
    glyphs[ch] = {
      commands: path.commands.map((cmd: any) => {
        const base: any = { type: cmd.type };
        if (cmd.x !== undefined) base.x = cmd.x;
        if (cmd.y !== undefined) base.y = cmd.y;
        if (cmd.x1 !== undefined) base.x1 = cmd.x1;
        if (cmd.y1 !== undefined) base.y1 = cmd.y1;
        if (cmd.x2 !== undefined) base.x2 = cmd.x2;
        if (cmd.y2 !== undefined) base.y2 = cmd.y2;
        return base;
      }),
      advanceWidth: glyph.advanceWidth || 0,
      xMin: glyph.xMin || 0,
      yMin: glyph.yMin || 0,
      xMax: glyph.xMax || 0,
      yMax: glyph.yMax || 0,
      nodeCount: path.commands.length,
    };
  }
  return glyphs;
}

function extractKerning(font: opentype.Font, chars: string) {
  const kerning: Record<string, number> = {};
  const seen = new Set<string>();
  for (let i = 0; i < chars.length; i++) {
    for (let j = 0; j < chars.length; j++) {
      const c1 = chars[i];
      const c2 = chars[j];
      const key = `${c1}|${c2}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const g1 = font.charToGlyphIndex(c1);
      const g2 = font.charToGlyphIndex(c2);
      if (g1 > 0 && g2 > 0) {
        const val = font.getKerningValue(g1, g2);
        if (val !== 0) {
          kerning[key] = val;
        }
      }
    }
  }
  return kerning;
}

self.onmessage = (e: MessageEvent) => {
  const { type, id, buffer, chars } = e.data;

  if (type === 'parse') {
    try {
      const font = opentype.parse(buffer);
      const stored: StoredFont = { font, id };
      fonts.set(id, stored);

      const allChars = chars || '';
      const glyphs = extractGlyphData(font, allChars);
      const kerningValues = extractKerning(font, allChars);

      const sampleChars = 'AaBbCc123';
      const samplePaths: Record<string, any> = {};
      for (const ch of sampleChars) {
        const glyph = font.charToGlyph(ch);
        const path = glyph.getPath(0, 0, font.unitsPerEm);
        samplePaths[ch] = path.commands.map((cmd: any) => {
          const base: any = { type: cmd.type };
          if (cmd.x !== undefined) base.x = cmd.x;
          if (cmd.y !== undefined) base.y = cmd.y;
          if (cmd.x1 !== undefined) base.x1 = cmd.x1;
          if (cmd.y1 !== undefined) base.y1 = cmd.y1;
          if (cmd.x2 !== undefined) base.x2 = cmd.x2;
          if (cmd.y2 !== undefined) base.y2 = cmd.y2;
          return base;
        });
      }

      self.postMessage({
        type: 'parsed',
        data: {
          id,
          name: font.names.fontFamily?.en || font.names.fontFamily?.zh || id,
          familyName: font.names.fontFamily?.en || '',
          styleName: font.names.fontSubfamily?.en || '',
          unitsPerEm: font.unitsPerEm,
          ascender: font.ascender,
          descender: font.descender,
          uploadTime: new Date().toISOString(),
          glyphs,
          kerningValues,
          samplePaths,
        },
      });
    } catch (err: any) {
      self.postMessage({ type: 'error', id, error: err.message });
    }
  }

  if (type === 'updateChars') {
    const stored = fonts.get(id);
    if (stored) {
      const glyphs = extractGlyphData(stored.font, chars);
      const kerningValues = extractKerning(stored.font, chars);
      self.postMessage({ type: 'charsUpdated', id, glyphs, kerningValues });
    }
  }

  if (type === 'dispose') {
    fonts.delete(id);
  }
};
