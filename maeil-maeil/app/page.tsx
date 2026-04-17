import { Suspense } from 'react';
import { getAllArticles } from '@/lib/articles';
import ArticleListClient from './ArticleListClient';

export default function HomePage() {
  const articles = getAllArticles();
  return (
    <Suspense>
      <ArticleListClient articles={articles} />
    </Suspense>
  );
}
