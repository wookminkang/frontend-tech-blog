import { getAllArticles } from '@/lib/articles';
import ArticleListClient from './ArticleListClient';

export default function HomePage() {
  const articles = getAllArticles();
  return <ArticleListClient articles={articles} />;
}
