import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import api from './api';
import { v4 } from 'uuid';
import {
  mockPoems,
  mockAnnotations,
  mockInspirationCards,
  mockCollections,
  mockComments,
  mockCollaborators,
  mockCurrentUser,
  mockLikes,
} from './mockData';
import type { Poem, Annotation, InspirationCard, Collection, Comment, Collaborator } from '../types';

let poems = [...mockPoems];
let annotations = [...mockAnnotations];
let inspirationCards = [...mockInspirationCards];
let collections = [...mockCollections];
let comments = [...mockComments];
let collaborators = [...mockCollaborators];
const likes = { ...mockLikes };

function delay<T>(data: T, ms: number = 50 + Math.random() * 100): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), ms);
  });
}

function matchUrl(url: string | undefined, pattern: RegExp): RegExpMatchArray | null {
  if (!url) return null;
  return url.match(pattern);
}

function makeResponse<T>(data: T, config: InternalAxiosRequestConfig): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  };
}

export function setupMockApi() {
  api.interceptors.request.use(
    (config) => {
      return new Promise((resolve, reject) => {
        const url = config.url || '';
        const method = (config.method || 'get').toLowerCase();
        const params = config.params || {};
        let body: unknown = null;
        try {
          if (typeof config.data === 'string') {
            body = JSON.parse(config.data);
          } else if (config.data) {
            body = config.data;
          }
        } catch {
          body = config.data;
        }

        setTimeout(async () => {
          let handled = false;
          let responseData: unknown = null;

          try {
            if (matchUrl(url, /^\/poems$/) && method === 'get') {
              handled = true;
              let list = poems;
              if (params.authorId) {
                list = list.filter((p) => p.authorId === params.authorId);
              }
              responseData = await delay(list);
            }

            if (matchUrl(url, /^\/poems$/) && method === 'post') {
              handled = true;
              const data = body as { title: string; authorId: string; collectionId?: string };
              const newPoem: Poem = {
                id: v4(),
                title: data.title,
                authorId: data.authorId,
                collectionId: data.collectionId || null,
                lines: [],
                likeCount: 0,
                commentCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              poems = [newPoem, ...poems];
              responseData = await delay(newPoem);
            }

            if (matchUrl(url, /^\/poems$/) && method === 'put') {
              handled = true;
              const data = body as { title?: string; collectionId?: string | null; id: string };
              poems = poems.map((p) =>
                p.id === data.id
                  ? { ...p, title: data.title ?? p.title, collectionId: data.collectionId ?? p.collectionId, updatedAt: new Date().toISOString() }
                  : p
              );
              responseData = await delay({ success: true });
            }

            const poemMatch = matchUrl(url, /^\/poems\/([^/]+)$/);
            if (poemMatch && method === 'get') {
              handled = true;
              const poem = poems.find((p) => p.id === poemMatch[1]);
              responseData = await delay(poem || null);
            }

            if (poemMatch && method === 'put') {
              handled = true;
              const data = body as { title?: string; lines?: unknown[]; collectionId?: string | null };
              poems = poems.map((p) => {
                if (p.id !== poemMatch[1]) return p;
                return {
                  ...p,
                  title: data.title ?? p.title,
                  collectionId: data.collectionId ?? p.collectionId,
                  lines: (data.lines as Poem['lines']) ?? p.lines,
                  updatedAt: new Date().toISOString(),
                };
              });
              responseData = await delay({ success: true });
            }

            if (poemMatch && method === 'delete') {
              handled = true;
              poems = poems.filter((p) => p.id !== poemMatch[1]);
              responseData = await delay({ success: true });
            }

            if (matchUrl(url, /^\/poems\/[^/]+\/check-tonal$/) && method === 'post') {
              handled = true;
              responseData = await delay([]);
            }

            const likeMatch = matchUrl(url, /^\/poems\/([^/]+)\/like$/);
            if (likeMatch && method === 'post') {
              handled = true;
              const pid = likeMatch[1];
              const wasLiked = likes[pid];
              likes[pid] = !wasLiked;
              poems = poems.map((p) =>
                p.id === pid ? { ...p, likeCount: p.likeCount + (!wasLiked ? 1 : -1) } : p
              );
              responseData = await delay({ liked: !wasLiked });
            }

            const annotationsMatch = matchUrl(url, /^\/poems\/([^/]+)\/annotations$/);
            if (annotationsMatch && method === 'get') {
              handled = true;
              const list = annotations.filter((a) => a.poemId === annotationsMatch![1]);
              responseData = await delay(list);
            }

            if (annotationsMatch && method === 'post') {
              handled = true;
              const data = body as {
                lineId: string;
                authorId: string;
                startOffset: number;
                endOffset: number;
                highlightedText: string;
                content: string;
              };
              const newAnn: Annotation = {
                id: v4(),
                poemId: annotationsMatch![1],
                lineId: data.lineId,
                authorId: data.authorId,
                authorName: mockCurrentUser.name,
                startOffset: data.startOffset,
                endOffset: data.endOffset,
                highlightedText: data.highlightedText,
                content: data.content,
                replies: [],
                createdAt: new Date().toISOString(),
              };
              annotations = [...annotations, newAnn];
              responseData = await delay(newAnn);
            }

            const replyMatch = matchUrl(url, /^\/poems\/([^/]+)\/annotations\/([^/]+)\/replies$/);
            if (replyMatch && method === 'post') {
              handled = true;
              const data = body as { authorId: string; content: string };
              const reply = {
                id: v4(),
                authorId: data.authorId,
                authorName: mockCurrentUser.name,
                content: data.content,
                createdAt: new Date().toISOString(),
              };
              annotations = annotations.map((a) =>
                a.id === replyMatch[2] ? { ...a, replies: [...a.replies, reply] } : a
              );
              responseData = await delay(reply);
            }

            const collaboratorsMatch = matchUrl(url, /^\/poems\/([^/]+)\/collaborators$/);
            if (collaboratorsMatch && method === 'get') {
              handled = true;
              const list = collaborators.filter((c) => c.poemId === collaboratorsMatch![1]);
              responseData = await delay(list);
            }

            const inviteMatch = matchUrl(url, /^\/poems\/([^/]+)\/invite$/);
            if (inviteMatch && method === 'post') {
              handled = true;
              const data = body as { email: string };
              const name = data.email.split('@')[0];
              const newCollab: Collaborator = {
                id: v4(),
                poemId: inviteMatch[1],
                userId: 'u-' + v4().slice(0, 6),
                userName: name,
                avatar: '',
                role: 'viewer',
              };
              collaborators = [...collaborators, newCollab];
              responseData = await delay(newCollab);
            }

            const commentsMatch = matchUrl(url, /^\/poems\/([^/]+)\/comments$/);
            if (commentsMatch && method === 'get') {
              handled = true;
              const list = comments.filter((c) => c.poemId === commentsMatch![1]);
              responseData = await delay(list);
            }

            if (commentsMatch && method === 'post') {
              handled = true;
              const data = body as { userId: string; content: string };
              const newCmt: Comment = {
                id: v4(),
                poemId: commentsMatch![1],
                userId: data.userId,
                userName: mockCurrentUser.name,
                content: data.content,
                createdAt: new Date().toISOString(),
              };
              comments = [...comments, newCmt];
              poems = poems.map((p) =>
                p.id === commentsMatch![1] ? { ...p, commentCount: p.commentCount + 1 } : p
              );
              responseData = await delay(newCmt);
            }

            if (matchUrl(url, /^\/inspirations$/) && method === 'get') {
              handled = true;
              responseData = await delay(inspirationCards);
            }

            if (matchUrl(url, /^\/inspirations$/) && method === 'post') {
              handled = true;
              const data = body as { content: string };
              const card: InspirationCard = {
                id: v4(),
                userId: mockCurrentUser.id,
                content: data.content,
                starred: false,
                createdAt: new Date().toISOString(),
              };
              inspirationCards = [card, ...inspirationCards];
              responseData = await delay(card);
            }

            const inspMatch = matchUrl(url, /^\/inspirations\/([^/]+)$/);
            if (inspMatch && method === 'put') {
              handled = true;
              const data = body as { starred?: boolean; content?: string };
              inspirationCards = inspirationCards.map((c) =>
                c.id === inspMatch[1] ? { ...c, starred: data.starred ?? c.starred, content: data.content ?? c.content } : c
              );
              responseData = await delay({ success: true });
            }

            if (inspMatch && method === 'delete') {
              handled = true;
              inspirationCards = inspirationCards.filter((c) => c.id !== inspMatch[1]);
              responseData = await delay({ success: true });
            }

            if (matchUrl(url, /^\/collections$/) && method === 'get') {
              handled = true;
              responseData = await delay(collections);
            }

            if (matchUrl(url, /^\/collections$/) && method === 'post') {
              handled = true;
              const data = body as { name: string; description?: string };
              const coll: Collection = {
                id: v4(),
                userId: mockCurrentUser.id,
                name: data.name,
                description: data.description || '',
                poemCount: 0,
                createdAt: new Date().toISOString(),
              };
              collections = [...collections, coll];
              responseData = await delay(coll);
            }

            const collMatch = matchUrl(url, /^\/collections\/([^/]+)$/);
            if (collMatch && method === 'put') {
              handled = true;
              const data = body as { name?: string; description?: string };
              collections = collections.map((c) =>
                c.id === collMatch[1] ? { ...c, name: data.name ?? c.name, description: data.description ?? c.description } : c
              );
              responseData = await delay({ success: true });
            }

            if (collMatch && method === 'delete') {
              handled = true;
              collections = collections.filter((c) => c.id !== collMatch[1]);
              responseData = await delay({ success: true });
            }

            const portfolioMatch = matchUrl(url, /^\/portfolio\/([^/]+)$/);
            if (portfolioMatch && method === 'get') {
              handled = true;
              const list = poems.filter((p) => p.authorId === portfolioMatch[1]);
              responseData = await delay(list);
            }

            if (handled) {
              const response = makeResponse(responseData, config);
              reject({
                __mockResponse: true,
                response,
              });
            } else {
              resolve(config);
            }
          } catch (_e) {
            void _e;
            resolve(config);
          }
        }, 0);
      });
    },
    (error) => {
      if (error && error.__mockResponse) {
        return Promise.resolve(error.response);
      }
      return Promise.reject(error);
    }
  );
}
