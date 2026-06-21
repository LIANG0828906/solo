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

export function classifyBookmarks(
  bookmarks: Bookmark[],
  rules: CategoryRule[]
): { bookmarks: Bookmark[]; tree: CategoryNode[] } {
  const compiledRules = compileRules(rules);
  const categoryMap = new Map<string, Bookmark[]>();
  const uncategorizedName = '未分类';

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

    return { ...bookmark, categories: finalCategories };
  });

  classifiedBookmarks.forEach((bookmark) => {
    bookmark.categories.forEach((category) => {
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(bookmark);
    });
  });

  const tree: CategoryNode[] = Array.from(categoryMap.entries())
    .map(([name, categoryBookmarks]) => ({
      name,
      bookmarks: categoryBookmarks,
    }))
    .sort((a, b) => {
      if (a.name === uncategorizedName) return 1;
      if (b.name === uncategorizedName) return -1;
      return a.name.localeCompare(b.name, 'zh-CN');
    });

  return { bookmarks: classifiedBookmarks, tree };
}
