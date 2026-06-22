import type { Bookmark, BookmarkTreeNode } from './types';

function flattenTree(nodes: BookmarkTreeNode[]): Bookmark[] {
  const bookmarks: Bookmark[] = [];
  const seen = new Set<string>();

  const traverse = (nodes: BookmarkTreeNode[]): void => {
    nodes.forEach((node) => {
      if (node.type === 'bookmark' && node.url) {
        if (seen.has(node.url)) return;
        seen.add(node.url);
        bookmarks.push({
          id: node.id,
          title: node.title,
          url: node.url,
          categories: [],
          addedAt: node.addedAt,
        });
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  };

  traverse(nodes);
  return bookmarks;
}

function parseTreeNode(element: Element): BookmarkTreeNode | null {
  const h3 = element.querySelector(':scope > h3');
  const anchor = element.querySelector(':scope > a');

  if (h3) {
    const folderTitle = h3.textContent?.trim() || '未命名文件夹';
    const addDate = h3.getAttribute('add_date');
    const folderNode: BookmarkTreeNode = {
      id: crypto.randomUUID(),
      title: folderTitle,
      type: 'folder',
      addedAt: addDate ? parseInt(addDate, 10) * 1000 : Date.now(),
      children: [],
    };

    const dl = element.querySelector(':scope > dl');
    if (dl) {
      const dtElements = dl.querySelectorAll(':scope > dt');
      dtElements.forEach((dt) => {
        const child = parseTreeNode(dt);
        if (child) {
          folderNode.children.push(child);
        }
      });
    }

    return folderNode;
  }

  if (anchor) {
    const title = anchor.textContent?.trim() || '无标题';
    const url = anchor.getAttribute('href') || '';
    const addDate = anchor.getAttribute('add_date');

    if (url && url.startsWith('http')) {
      return {
        id: crypto.randomUUID(),
        title,
        type: 'bookmark',
        url,
        addedAt: addDate ? parseInt(addDate, 10) * 1000 : Date.now(),
        children: [],
      };
    }
  }

  return null;
}

export function parseBookmarkTree(html: string): BookmarkTreeNode[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const rootNodes: BookmarkTreeNode[] = [];

  const rootDl = doc.querySelector('dl');
  if (!rootDl) return rootNodes;

  const dtElements = rootDl.querySelectorAll(':scope > dt');
  dtElements.forEach((dt) => {
    const node = parseTreeNode(dt);
    if (node) {
      rootNodes.push(node);
    }
  });

  const topLevelAnchors = rootDl.querySelectorAll(':scope > a');
  topLevelAnchors.forEach((anchor) => {
    const title = anchor.textContent?.trim() || '无标题';
    const url = anchor.getAttribute('href') || '';
    const addDate = anchor.getAttribute('add_date');

    if (url && url.startsWith('http')) {
      rootNodes.push({
        id: crypto.randomUUID(),
        title,
        type: 'bookmark',
        url,
        addedAt: addDate ? parseInt(addDate, 10) * 1000 : Date.now(),
        children: [],
      });
    }
  });

  return rootNodes;
}

export function parseBookmarks(html: string): Bookmark[] {
  const tree = parseBookmarkTree(html);
  return flattenTree(tree);
}

export { flattenTree };
