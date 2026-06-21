import type { Bookmark } from './types';

export function parseBookmarks(html: string): Bookmark[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const bookmarks: Bookmark[] = [];

  const extractBookmarks = (container: Element): void => {
    const anchors = container.querySelectorAll('a');
    const dtElements = container.querySelectorAll(':scope > dt');

    dtElements.forEach((dt) => {
      const anchor = dt.querySelector('a');
      if (anchor) {
        const title = anchor.textContent?.trim() || '无标题';
        const url = anchor.getAttribute('href') || '';
        const addedAt = anchor.getAttribute('add_date') 
          ? parseInt(anchor.getAttribute('add_date')!, 10) * 1000 
          : Date.now();

        if (url && url.startsWith('http')) {
          bookmarks.push({
            id: crypto.randomUUID(),
            title,
            url,
            categories: [],
            addedAt,
          });
        }
      }

      const dl = dt.querySelector(':scope > dl');
      if (dl) {
        extractBookmarks(dl);
      }
    });

    if (dtElements.length === 0) {
      anchors.forEach((anchor) => {
        const title = anchor.textContent?.trim() || '无标题';
        const url = anchor.getAttribute('href') || '';
        const addedAt = anchor.getAttribute('add_date')
          ? parseInt(anchor.getAttribute('add_date')!, 10) * 1000
          : Date.now();

        if (url && url.startsWith('http')) {
          bookmarks.push({
            id: crypto.randomUUID(),
            title,
            url,
            categories: [],
            addedAt,
          });
        }
      });
    }
  };

  const dlElements = doc.querySelectorAll('dl');
  dlElements.forEach((dl) => {
    extractBookmarks(dl);
  });

  const seen = new Set<string>();
  return bookmarks.filter((b) => {
    if (seen.has(b.url)) return false;
    seen.add(b.url);
    return true;
  });
}
