export function resolveEpubResourcePath(chapterHref, resourcePath) {
    if (resourcePath.startsWith('http://') || resourcePath.startsWith('https://') || resourcePath.startsWith('data:')) {
        return resourcePath;
    }
    const chapterParts = chapterHref.split('/');
    chapterParts.pop();
    const basePath = chapterParts.join('/');
    const resourceParts = resourcePath.split('/');
    const resolvedParts = [];
    if (basePath) {
        resolvedParts.push(...basePath.split('/'));
    }
    for (const part of resourceParts) {
        if (part === '..') {
            resolvedParts.pop();
        }
        else if (part !== '.' && part !== '') {
            resolvedParts.push(part);
        }
    }
    return resolvedParts.join('/');
}
export function generateCfiFromRange(range, chapterHref) {
    const startContainer = range.startContainer;
    const startOffset = range.startOffset;
    const endContainer = range.endContainer;
    const endOffset = range.endOffset;
    const startPath = getNodePath(startContainer);
    const endPath = getNodePath(endContainer);
    return `epubcfi(/6/14[${chapterHref}]!/${startPath}:${startOffset},/${endPath}:${endOffset})`;
}
function getNodePath(node) {
    const path = [];
    let current = node;
    while (current && current.nodeType !== Node.DOCUMENT_NODE) {
        const parent = current.parentNode;
        if (parent) {
            const children = Array.from(parent.childNodes);
            let index = children.indexOf(current) + 1;
            if (current.nodeType === Node.TEXT_NODE) {
                index = index * 2;
            }
            else {
                index = index * 2 - 1;
            }
            path.unshift(index.toString());
        }
        current = parent;
    }
    return path.length > 0 ? path.join('/') : '4';
}
export function getRangeFromCfi(container, cfi) {
    try {
        const cfiMatch = cfi.match(/!\//);
        if (!cfiMatch)
            return null;
        const rangePart = cfi.substring(cfiMatch.index + 2);
        const [startPart, endPart] = rangePart.split(',');
        if (!startPart)
            return null;
        const startRange = resolveCfiPath(container, startPart);
        const endRange = endPart ? resolveCfiPath(container, endPart) : startRange;
        if (!startRange || !endRange)
            return null;
        const range = document.createRange();
        range.setStart(startRange.node, startRange.offset);
        range.setEnd(endRange.node, endRange.offset);
        return range;
    }
    catch (e) {
        console.warn('解析CFI失败:', e);
        return null;
    }
}
function resolveCfiPath(container, path) {
    const parts = path.split(':');
    const pathStr = parts[0];
    const offset = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    const indices = pathStr.split('/').filter(p => p);
    let currentNode = container;
    for (const indexStr of indices) {
        const index = parseInt(indexStr, 10);
        const isElement = index % 2 === 1;
        const childIndex = isElement ? Math.ceil(index / 2) - 1 : Math.floor(index / 2) - 1;
        const children = isElement
            ? Array.from(currentNode.childNodes).filter(n => n.nodeType === Node.ELEMENT_NODE)
            : Array.from(currentNode.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
        if (childIndex < 0 || childIndex >= children.length) {
            const allChildren = Array.from(currentNode.childNodes);
            const allIndex = Math.floor(index / 2) - 1;
            if (allIndex >= 0 && allIndex < allChildren.length) {
                currentNode = allChildren[allIndex];
                continue;
            }
            return null;
        }
        currentNode = children[childIndex];
    }
    return { node: currentNode, offset };
}
export async function loadEpubResource(book, path) {
    try {
        const resource = await book.load(path);
        if (typeof resource === 'string') {
            return resource;
        }
        return null;
    }
    catch (e) {
        console.warn('加载EPUB资源失败:', path, e);
        return null;
    }
}
export async function resourceToDataUrl(book, path) {
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
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(resource);
            });
        }
        if (resource instanceof ArrayBuffer) {
            let mimeType = 'application/octet-stream';
            if (path.match(/\.jpe?g$/i))
                mimeType = 'image/jpeg';
            else if (path.match(/\.png$/i))
                mimeType = 'image/png';
            else if (path.match(/\.gif$/i))
                mimeType = 'image/gif';
            else if (path.match(/\.webp$/i))
                mimeType = 'image/webp';
            else if (path.match(/\.svg$/i))
                mimeType = 'image/svg+xml';
            const bytes = new Uint8Array(resource);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return `data:${mimeType};base64,${btoa(binary)}`;
        }
        return null;
    }
    catch (e) {
        console.warn('资源转换失败:', path, e);
        return null;
    }
}
