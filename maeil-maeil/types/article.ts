export interface Article {
  slug: string;
  title: string;
  category: '프론트엔드' | 'AI' | '기타';
  date: string;
  summary: string;
  tags: string[];
  content: string;
  isTemplate: boolean;
}

export type ArticleMeta = Omit<Article, 'content'>;
