export function resolveEpubResourcePath(chapterHref: string, resourcePath: string): string {
  if (resourcePath.startsWith('http://') || resourcePath.startsWith('https://') || resourcePath.startsWith('data:')) {
    return resourcePath;
  }

  if (resourcePath.startsWith('/')) {
    return resourcePath.substring(1);
  }

  if (resourcePath.startsWith('#')) {
    return resourcePath;
  }

  const chapterParts = chapterHref.split('/');
  chapterParts.pop();

  const resourceParts = resourcePath.split('/');
  const resolvedParts: string[] = [...chapterParts];

  for (const part of resourceParts) {
    if (part === '..') {
      if (resolvedParts.length > 0) {
        resolvedParts.pop();
      }
    } else if (part !== '.' && part !== '') {
      resolvedParts.push(part);
    }
  }

  return resolvedParts.join('/');
}

export function generateCfiFromRange(range: Range, container: HTMLElement, chapterHref: string): string {
  const startContainer = range.startContainer;
  const startOffset = range.startOffset;
  const endContainer = range.endContainer;
  const endOffset = range.endOffset;

  const startPath = getNodePath(startContainer, container);
  const endPath = getNodePath(endContainer, container);

  const safeChapterHref = chapterHref.replace(/[^\w\-./]/g, '_');
  return `epubcfi(/6/4[${safeChapterHref}]!/${startPath}:${startOffset},/${endPath}:${endOffset})`;
}

function getNodePath(node: Node, container: HTMLElement): string {
  const path: string[] = [];
  let current: Node | null = node;

  while (current && current !== container) {
    const parent: Node | null = current.parentNode;
    if (parent) {
      const children = Array.from(parent.childNodes);
      let elementCount = 0;
      let textCount = 0;
      let targetIndex = 0;
      
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.nodeType === Node.COMMENT_NODE) {
          continue;
        }
        if (child.nodeType === Node.ELEMENT_NODE) {
          elementCount++;
          if (child === current) {
            targetIndex = elementCount * 2 - 1;
            const id = (child as Element).id;
            if (id) {
              path.unshift(`${targetIndex}[${id}]`);
            } else {
              path.unshift(targetIndex.toString());
            }
            break;
          }
        } else if (child.nodeType === Node.TEXT_NODE) {
          if (child.textContent && child.textContent.trim().length > 0) {
            textCount++;
          }
          if (child === current) {
            targetIndex = textCount * 2;
            path.unshift(targetIndex.toString());
            break;
          }
        }
      }
      
      if (targetIndex === 0) {
        path.unshift('4');
      }
    }
    current = parent;
  }

  return path.length > 0 ? path.join('/') : '4';
}

export function getRangeFromCfi(container: HTMLElement, cfi: string): Range | null {
  try {
    const cfiMatch = cfi.match(/!\//);
    if (!cfiMatch || cfiMatch.index === undefined) return null;

    const rangePart = cfi.substring(cfiMatch.index + 2);
    const [startPart, endPart] = rangePart.split(',');

    if (!startPart) return null;

    const startRange = resolveCfiPath(container, startPart);
    const endRange = endPart ? resolveCfiPath(container, endPart) : startRange;

    if (!startRange || !endRange) return null;

    const range = document.createRange();
    range.setStart(startRange.node, startRange.offset);
    range.setEnd(endRange.node, endRange.offset);

    return range;
  } catch (e) {
    console.warn('解析CFI失败:', e);
    return null;
  }
}

function resolveCfiPath(container: HTMLElement, path: string): { node: Node; offset: number } | null {
  const parts = path.split(':');
  const pathStr = parts[0];
  const offset = parts.length > 1 ? parseInt(parts[1], 10) : 0;

  const indices = pathStr.split('/').filter(p => p);
  let currentNode: Node = container;

  for (const indexStr of indices) {
    const idMatch = indexStr.match(/^(\d+)\[(.+?)\]$/);
    let targetIndex: number;
    let targetId: string | null = null;

    if (idMatch) {
      targetIndex = parseInt(idMatch[1], 10);
      targetId = idMatch[2];
    } else {
      targetIndex = parseInt(indexStr, 10);
    }

    const isElement = targetIndex % 2 === 1;
    const targetCount = isElement ? (targetIndex + 1) / 2 : targetIndex / 2;

    const children = Array.from(currentNode.childNodes);
    let elementCount = 0;
    let textCount = 0;
    let foundNode: Node | null = null;

    for (const child of children) {
      if (child.nodeType === Node.COMMENT_NODE) {
        continue;
      }
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (targetId && (child as Element).id === targetId) {
          foundNode = child;
          break;
        }
        elementCount++;
        if (isElement && elementCount === targetCount && !targetId) {
          foundNode = child;
          break;
        }
      } else if (child.nodeType === Node.TEXT_NODE) {
        if (child.textContent && child.textContent.trim().length > 0) {
          textCount++;
        }
        if (!isElement && textCount === targetCount) {
          foundNode = child;
          break;
        }
      }
    }

    if (!foundNode) {
      return null;
    }

    currentNode = foundNode;
  }

  return { node: currentNode, offset };
}

export async function loadEpubResource(book: any, path: string): Promise<string | null> {
  try {
    const resource = await book.load(path);
    if (typeof resource === 'string') {
      return resource;
    }
    return null;
  } catch (e) {
    console.warn('加载EPUB资源失败:', path, e);
    return null;
  }
}

function getMimeType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',
    'css': 'text/css',
    'js': 'text/javascript',
    'html': 'text/html',
    'htm': 'text/html',
    'xml': 'text/xml',
    'json': 'application/json',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'otf': 'font/otf',
    'eot': 'application/vnd.ms-fontobject'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function resourceToDataUrl(book: any, path: string): Promise<string | null> {
  try {
    const resource = await book.load(path);
    
    if (resource instanceof Blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(resource);
      });
    }
    
    if (resource instanceof ArrayBuffer) {
      const mimeType = getMimeType(path);
      const base64 = arrayBufferToBase64(resource);
      return `data:${mimeType};base64,${base64}`;
    }
    
    if (typeof resource === 'string') {
      if (path.match(/\.(jpg|jpeg|png|gif|webp|bmp|ico)$/i)) {
        const encoder = new TextEncoder();
        const buffer = encoder.encode(resource).buffer;
        const mimeType = getMimeType(path);
        const base64 = arrayBufferToBase64(buffer);
        return `data:${mimeType};base64,${base64}`;
      }
      if (path.match(/\.svg$/i)) {
        const encodedResource = encodeURIComponent(resource)
          .replace(/'/g, '%27')
          .replace(/"/g, '%22');
        return `data:image/svg+xml,${encodedResource}`;
      }
      return resource;
    }
    
    return null;
  } catch (e) {
    console.warn('资源转换失败:', path, e);
    return null;
  }
}
