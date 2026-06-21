export function resolveEpubResourcePath(chapterHref: string, resourcePath: string): string {
  if (resourcePath.startsWith('http://') || resourcePath.startsWith('https://') || resourcePath.startsWith('data:')) {
    return resourcePath;
  }

  const chapterParts = chapterHref.split('/');
  chapterParts.pop();
  const basePath = chapterParts.join('/');

  const resourceParts = resourcePath.split('/');
  const resolvedParts: string[] = [];

  if (basePath) {
    resolvedParts.push(...basePath.split('/'));
  }

  for (const part of resourceParts) {
    if (part === '..') {
      resolvedParts.pop();
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

  return `epubcfi(/6/14[${chapterHref}]!/${startPath}:${startOffset},/${endPath}:${endOffset})`;
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
        if (child.nodeType === Node.ELEMENT_NODE) {
          elementCount++;
          if (child === current) {
            targetIndex = elementCount * 2 - 1;
            break;
          }
        } else if (child.nodeType === Node.TEXT_NODE) {
          textCount++;
          if (child === current) {
            targetIndex = textCount * 2;
            break;
          }
        }
      }
      
      if (targetIndex > 0) {
        path.unshift(targetIndex.toString());
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
    const targetIndex = parseInt(indexStr, 10);
    const isElement = targetIndex % 2 === 1;
    const targetCount = isElement ? (targetIndex + 1) / 2 : targetIndex / 2;

    const children = Array.from(currentNode.childNodes);
    let elementCount = 0;
    let textCount = 0;
    let foundNode: Node | null = null;

    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        elementCount++;
        if (isElement && elementCount === targetCount) {
          foundNode = child;
          break;
        }
      } else if (child.nodeType === Node.TEXT_NODE) {
        textCount++;
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

export async function resourceToDataUrl(book: any, path: string): Promise<string | null> {
  try {
    const resource = await book.load(path);
    
    if (typeof resource === 'string') {
      if (path.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        return `data:image;base64,${btoa(unescape(encodeURIComponent(resource)))}`;
      }
      return resource;
    }
    
    if (resource instanceof Blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(resource);
      });
    }
    
    if (resource instanceof ArrayBuffer) {
      let mimeType = 'application/octet-stream';
      if (path.match(/\.jpe?g$/i)) mimeType = 'image/jpeg';
      else if (path.match(/\.png$/i)) mimeType = 'image/png';
      else if (path.match(/\.gif$/i)) mimeType = 'image/gif';
      else if (path.match(/\.webp$/i)) mimeType = 'image/webp';
      else if (path.match(/\.svg$/i)) mimeType = 'image/svg+xml';
      
      const bytes = new Uint8Array(resource);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return `data:${mimeType};base64,${btoa(binary)}`;
    }
    
    return null;
  } catch (e) {
    console.warn('资源转换失败:', path, e);
    return null;
  }
}
