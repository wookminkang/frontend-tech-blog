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

      <main style={{ flex: 1, maxWidth: 720, margin: '0 auto', padding: '56px 24px 80px' }}>
        {/* Category badge */}
        <div
          style={{
            display: 'inline-block',
            padding: '6px 14px 6px 12px',
            background: '#fff3e8',
            borderLeft: '4px solid #fe6e00',
            color: '#fe6e00',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: '0 4px 4px 0',
            marginBottom: 20,
          }}
        >
          {article.category}에 관련한 질문이에요.
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacing: '-0.5px',
            color: '#212121',
            marginBottom: 32,
          }}
        >
          {article.title}
        </h1>

        {/* Meta */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            fontSize: 13,
            color: '#757575',
            paddingBottom: 28,
            borderBottom: '2px solid #212121',
            marginBottom: 44,
          }}
        >
          <span>{article.date}</span>
          {article.tags.length > 0 && (
            <>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#757575', display: 'inline-block' }} />
              <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      background: '#F5F5F5',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: 12,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </span>
            </>
          )}
        </div>

        {/* Content */}
        {article.isTemplate || !article.content ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#757575' }}>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>콘텐츠 준비 중입니다</p>
            <p style={{ fontSize: 14 }}>곧 업데이트될 예정입니다.</p>
          </div>
        ) : (
          <ArticleContent content={article.content} />
        )}

        {/* Back link */}
        <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid #E0E0E0' }}>
          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 600,
              color: '#fe6e00',
              textDecoration: 'none',
              padding: '10px 22px',
              border: '1.5px solid #fe6e00',
              borderRadius: 20,
            }}
          >
            목록으로 돌아가기
          </a>
        </div>
      </main>

      <Footer />
    </>
  );
}
