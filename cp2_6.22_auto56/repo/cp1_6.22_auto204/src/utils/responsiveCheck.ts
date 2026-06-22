export interface LayoutIssue {
  type: 'overflow' | 'overlap' | 'scroll';
  description: string;
  position: { top: number; left: number; width: number; height: number };
}

export function checkTextOverflow(element: Element): LayoutIssue | null {
  const hasOverflow =
    element.scrollWidth > element.clientWidth + 1 ||
    element.scrollHeight > element.clientHeight + 1;

  if (!hasOverflow) return null;

  const rect = element.getBoundingClientRect();
  return {
    type: 'overflow',
    description: '文本溢出',
    position: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    },
  };
}

export function checkElementOverlap(elements: Element[]): LayoutIssue[] {
  const issues: LayoutIssue[] = [];
  const rects: { element: Element; rect: DOMRect }[] = elements.map((el) => ({
    element: el,
    rect: el.getBoundingClientRect(),
  }));

  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i].rect;
      const b = rects[j].rect;

      const overlap =
        a.left < b.right &&
        a.right > b.left &&
        a.top < b.bottom &&
        a.bottom > b.top;

      if (overlap) {
        const overlapRect = {
          top: Math.max(a.top, b.top),
          left: Math.max(a.left, b.left),
          width: Math.min(a.right, b.right) - Math.max(a.left, b.left),
          height: Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top),
        };

        if (overlapRect.width > 5 && overlapRect.height > 5) {
          issues.push({
            type: 'overlap',
            description: '元素重叠',
            position: overlapRect,
          });
        }
      }
    }
  }

  return issues;
}

export function checkHorizontalScroll(element: Element): LayoutIssue | null {
  const hasScroll = element.scrollWidth > element.clientWidth + 1;
  if (!hasScroll) return null;

  const rect = element.getBoundingClientRect();
  return {
    type: 'scroll',
    description: '水平滚动',
    position: {
      top: rect.top,
      left: rect.right - 20,
      width: 20,
      height: rect.height,
    },
  };
}

export function analyzeLayout(doc: Document): LayoutIssue[] {
  const issues: LayoutIssue[] = [];

  const textElements = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, li, a, button');
  textElements.forEach((el) => {
    const issue = checkTextOverflow(el);
    if (issue) {
      issues.push(issue);
    }
  });

  const allElements = doc.querySelectorAll('body *');
  const visibleElements: Element[] = [];
  allElements.forEach((el) => {
    const style = window.getComputedStyle(el);
    if (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    ) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        visibleElements.push(el);
      }
    }
  });

  const overlapIssues = checkElementOverlap(visibleElements.slice(0, 100));
  issues.push(...overlapIssues.slice(0, 20));

  const bodyScroll = checkHorizontalScroll(doc.body);
  if (bodyScroll) {
    issues.push(bodyScroll);
  }

  return issues;
}
