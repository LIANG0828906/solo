import { get, set, del, entries } from 'idb-keyval';
import type { Article, EventNode } from '../types';

const ARTICLES_PREFIX = 'article:';
const NODES_PREFIX = 'node:';

export async function saveArticle(article: Article): Promise<void> {
  await set(`${ARTICLES_PREFIX}${article.id}`, article);
}

export async function loadArticle(id: string): Promise<Article | undefined> {
  return get(`${ARTICLES_PREFIX}${id}`);
}

export async function deleteArticleData(id: string): Promise<void> {
  await del(`${ARTICLES_PREFIX}${id}`);
  const allNodes = await getAllNodes();
  const nodesToDelete = allNodes.filter((n) => n.articleId === id);
  for (const node of nodesToDelete) {
    await del(`${NODES_PREFIX}${node.id}`);
  }
}

export async function saveNodes(nodes: EventNode[]): Promise<void> {
  for (const node of nodes) {
    await set(`${NODES_PREFIX}${node.id}`, node);
  }
}

export async function updateNode(node: EventNode): Promise<void> {
  await set(`${NODES_PREFIX}${node.id}`, node);
}

export async function getAllNodes(): Promise<EventNode[]> {
  const allEntries = await entries<string, EventNode>();
  return allEntries
    .filter(([key]) => key.startsWith(NODES_PREFIX))
    .map(([, value]) => value);
}

export async function getAllArticles(): Promise<Article[]> {
  const allEntries = await entries<string, Article>();
  return allEntries
    .filter(([key]) => key.startsWith(ARTICLES_PREFIX))
    .map(([, value]) => value);
}

export async function getNodesByArticle(articleId: string): Promise<EventNode[]> {
  const allNodes = await getAllNodes();
  return allNodes.filter((n) => n.articleId === articleId);
}

export async function getAllEvents(): Promise<EventNode[]> {
  const allNodes = await getAllNodes();
  return allNodes.sort((a, b) => a.date.localeCompare(b.date));
}
