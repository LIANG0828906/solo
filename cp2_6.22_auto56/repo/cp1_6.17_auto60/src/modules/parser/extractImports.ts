import type { ImportInfo, ImportType } from '../../types';

function classifyImport(path: string): ImportType {
  if (path.startsWith('.') || path.startsWith('/')) return 'internal';
  if (path.startsWith('@') && !path.includes('/') && path.length > 1) return 'namespace';
  if (path.startsWith('@') && path.split('/')[0].length > 1) return 'namespace';
  return 'external';
}

export function extractImports(source: string, filePath: string): ImportInfo[] {
  const results: ImportInfo[] = [];

  const importRegex =
    /import\s+(?:(?:type\s+)?(?:\{([^}]*)\}|([\w$]+)|(?:([\w$]+)\s*,\s*\{([^}]*)\}))\s+from\s+)?['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g;

  const requireRegex = /(?:const|let|var)\s+(?:(?:\{([^}]*)\}|([\w$]+)|(?:([\w$]+)\s*,\s*\{([^}]*)\}))\s*=\s*)?require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(source)) !== null) {
    const namedStr = match[1] || match[4] || '';
    const defaultName = match[2] || match[3] || '';
    const path = match[5] || match[6];
    if (!path) continue;

    const named = namedStr
      .split(',')
      .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
      .filter(Boolean);

    results.push({
      path,
      type: classifyImport(path),
      named,
      default: defaultName || undefined,
    });
  }

  while ((match = requireRegex.exec(source)) !== null) {
    const namedStr = match[1] || match[4] || '';
    const defaultName = match[2] || match[3] || '';
    const path = match[5];
    if (!path) continue;

    const named = namedStr
      .split(',')
      .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
      .filter(Boolean);

    results.push({
      path,
      type: classifyImport(path),
      named,
      default: defaultName || undefined,
    });
  }

  return results;
}

export { classifyImport };
