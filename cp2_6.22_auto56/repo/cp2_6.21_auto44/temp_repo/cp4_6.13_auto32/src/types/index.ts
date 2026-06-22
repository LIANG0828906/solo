export interface Feed {
  id: string;
  url: string;
  title: string;
  lastUpdated: string;
  unreadCount: number;
}

export interface Article {
  id: string;
  feedId: string;
  title: string;
  link: string;
  author: string;
  pubDate: string;
  content: string;
  isRead: boolean;
  isFavorite: boolean;
}

export interface ReadingProgress {
  articleId: string;
  percentage: number;
  scrollTop: number;
  lastReadAt: string;
}

export interface ParsedFeed {
  title: string;
  articles: Omit<Article, 'id' | 'feedId' | 'isRead' | 'isFavorite'>[];
}

export type MobileView = 'feeds' | 'articles' | 'reader';

export interface AppState {
  feeds: Feed[];
  articles: Article[];
  selectedFeedId: string | null;
  selectedArticleId: string | null;
  isDarkMode: boolean;
  mobileView: MobileView;
  readingProgress: Map<string, ReadingProgress>;
  selectedFeedIds: Set<string>;
  showAboutModal: boolean;
  errorMessage: string | null;
}
