import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllSlugs, getArticleBySlug } from '@/lib/articles';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProgressBar from '@/components/ProgressBar';
import ArticleContent from '@/components/ArticleContent';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

const BASE_URL = 'https://frontend-tech-blog-psi.vercel.app';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  const url = `${BASE_URL}/articles/${slug}`;

  return {
    title: article.title,
    description: article.summary,
    keywords: article.tags,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: article.title,
      description: article.summary,
      type: 'article',
      publishedTime: article.date,
      url,
      locale: 'ko_KR',
      siteName: '매일매일',
      tags: article.tags,
    },
    twitter: {
      card: 'summary',
      title: article.title,
      description: article.summary,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <>
      <ProgressBar />
      <Header />

      <main className="flex-1 w-full max-w-content mx-auto px-4 pt-10 pb-16 sm:px-6 sm:pt-14 sm:pb-20">
        {/* Category badge */}
        <div className="inline-block px-3 py-1.5 bg-[#fff3e8] border-l-4 border-primary text-primary text-[13px] font-semibold rounded-r mb-5">
          {article.category}에 관련한 질문이에요.
        </div>

        {/* Title */}
        <h1 className="text-[22px] sm:text-[28px] font-bold leading-snug tracking-tight text-text-main mb-8">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-3 flex-wrap text-[13px] text-text-sub pb-7 border-b-2 border-text-main mb-11">
          <span>{article.date}</span>
          {article.tags.length > 0 && (
            <>
              <span className="w-[3px] h-[3px] rounded-full bg-text-sub inline-block" />
              <span className="flex gap-1.5 flex-wrap">
                {article.tags.map((tag) => (
                  <span key={tag} className="bg-code-bg rounded px-2 py-0.5 text-[12px]">
                    {tag}
                  </span>
                ))}
              </span>
            </>
          )}
        </div>

        {/* Content */}
        {article.isTemplate || !article.content ? (
          <div className="text-center py-20 text-text-sub">
            <p className="text-base font-semibold mb-2">콘텐츠 준비 중입니다</p>
            <p className="text-sm">곧 업데이트될 예정입니다.</p>
          </div>
        ) : (
          <ArticleContent content={article.content} />
        )}

        {/* Back link */}
        <div className="mt-16 pt-8 border-t border-border">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary no-underline px-5 py-2.5 border border-primary rounded-full hover:bg-[#fff3e8] transition-colors"
          >
            목록으로 돌아가기
          </a>
        </div>
      </main>

      <Footer />
    </>
  );
}
