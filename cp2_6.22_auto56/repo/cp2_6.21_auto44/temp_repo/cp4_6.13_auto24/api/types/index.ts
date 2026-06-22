export interface Leather {
  id: number;
  name: string;
  type: string;
  thickness: number;
  area: number;
  remaining: number;
  receiveDate: string;
}

export interface ProcessStep {
  id: number;
  articleId: number;
  stepOrder: number;
  description: string;
  duration: number;
}

export interface Article {
  id: number;
  name: string;
  completionDate: string;
  mainImageUrl: string;
  steps?: ProcessStep[];
  leatherIds?: number[];
  leathers?: Leather[];
}

export interface WorkshopStats {
  totalLeatherTypes: number;
  totalArticles: number;
  totalRemainingArea: number;
}

export interface LeatherDbRow {
  id: number;
  name: string;
  type: string;
  thickness: number;
  area: number;
  remaining: number;
  receive_date: string;
}

export interface ProcessStepDbRow {
  id: number;
  article_id: number;
  step_order: number;
  description: string;
  duration: number;
}

export interface ArticleDbRow {
  id: number;
  name: string;
  completion_date: string;
  main_image_url: string;
}

export function mapLeather(row: LeatherDbRow): Leather {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    thickness: row.thickness,
    area: row.area,
    remaining: row.remaining,
    receiveDate: row.receive_date,
  };
}

export function mapProcessStep(row: ProcessStepDbRow): ProcessStep {
  return {
    id: row.id,
    articleId: row.article_id,
    stepOrder: row.step_order,
    description: row.description,
    duration: row.duration,
  };
}

export function mapArticle(row: ArticleDbRow): Article {
  return {
    id: row.id,
    name: row.name,
    completionDate: row.completion_date,
    mainImageUrl: row.main_image_url,
  };
}
