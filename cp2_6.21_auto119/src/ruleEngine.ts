import type { Bookmark, CategoryRule, CategoryNode } from './types';

export const defaultRules: CategoryRule[] = [
  {
    id: 'rule-github',
    name: 'GitHub项目',
    type: 'url',
    keyword: 'github',
    category: '开发',
  },
  {
    id: 'rule-stackoverflow',
    name: 'StackOverflow技术问答',
    type: 'url',
    keyword: 'stackoverflow',
    category: '技术',
  },
  {
    id: 'rule-recipe',
    name: '美食食谱',
    type: 'title',
    keyword: '食谱',
    category: '生活',
  },
];

interface CompiledRule {
  rule: CategoryRule;
  regex: RegExp;
}

function compileRules(rules: CategoryRule[]): CompiledRule[] {
  return rules.map((rule) => ({
    rule,
    regex: new RegExp(escapeRegExp(rule.keyword), 'i'),
  }));
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildNestedTree(
  categorizedBookmarks: Map<string, Bookmark[]>
): CategoryNode[] {
  const uncategorizedName = '未分类';
  const rootMap = new Map<string, CategoryNode>();

  categorizedBookmarks.forEach((bookmarks, categoryPath) => {
    const parts = categoryPath.split('/').filter(Boolean);
    if (parts.length === 0) {
      parts.push(uncategorizedName);
    }

    let currentMap = rootMap;
    let parentNode: CategoryNode | null = null;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      let node = currentMap.get(part);

      if (!node) {
        node = {
          name: part,
          bookmarks: [],
          children: [],
        };
        currentMap.set(part, node);

        if (parentNode) {
          parentNode.children.push(node);
        }
      }

      if (i === parts.length - 1) {
        node.bookmarks.push(...bookmarks);
      }

      parentNode = node;
      const childMap = new Map<string, CategoryNode>();
      node.children.forEach((child) => childMap.set(child.name, child));
      currentMap = childMap;
    }
  });

  const sortNodes = (nodes: CategoryNode[]): CategoryNode[] => {
    return nodes
      .sort((a, b) => {
        if (a.name === uncategorizedName) return 1;
        if (b.name === uncategorizedName) return -1;
        return a.name.localeCompare(b.name, 'zh-CN');
      })
      .map((node) => ({
        ...node,
        children: sortNodes(node.children),
      }));
  };

  return sortNodes(Array.from(rootMap.values()));
}

export function classifyBookmarks(
  bookmarks: Bookmark[],
  rules: CategoryRule[]
): { bookmarks: Bookmark[]; tree: CategoryNode[] } {
  const compiledRules = compileRules(rules);
  const uncategorizedName = '未分类';
  const categorizedMap = new Map<string, Bookmark[]>();

  const classifiedBookmarks = bookmarks.map((bookmark) => {
    const matchedCategories: string[] = [];

    compiledRules.forEach(({ rule, regex }) => {
      const text = rule.type === 'url' ? bookmark.url : bookmark.title;
      if (regex.test(text)) {
        matchedCategories.push(rule.category);
      }
    });

    const finalCategories = matchedCategories.length > 0
      ? [...new Set(matchedCategories)]
      : [uncategorizedName];

    finalCategories.forEach((category) => {
      if (!categorizedMap.has(category)) {
        categorizedMap.set(category, []);
      }
      categorizedMap.get(category)!.push(bookmark);
    });

    return { ...bookmark, categories: finalCategories };
  });

  const tree = buildNestedTree(categorizedMap);

  return { bookmarks: classifiedBookmarks, tree };
}
