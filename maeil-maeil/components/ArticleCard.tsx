import Link from 'next/link';
import type { ArticleMeta } from '@/types/article';

const GRADIENTS = [
  'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
  'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
  'linear-gradient(135deg, #2d1b69, #11998e, #38ef7d)',
  'linear-gradient(135deg, #1a1a2e, #2d1a00)',
  'linear-gradient(135deg, #0a2463, #1f3c88)',
  'linear-gradient(135deg, #1f0a3b, #4b0082)',
  'linear-gradient(135deg, #0d4b1c, #27ae60)',
  'linear-gradient(135deg, #2c1810, #8b3a0a)',
];

const THUMBNAIL_KEYWORDS: Record<string, string> = {
  'nextjs-ssg-ssr-isr-difference': 'SSG\nSSR\nISR',
  'nextjs-params-vs-usesearchparams': 'params\nuseSearch\nParams',
  'nextjs-error-loading-not-found': 'error\nloading\nnot-found',
  'nextjs-optional-catch-all-routes': '[...slug]\n[[...slug]]',
  'react-why-immutability': 'immuta\nbility',
  'react-usecallback-usememo-reactmemo': 'useCallback\nuseMemo\nmemo',
  'react-rerender-conditions': 're-render\nconditions',
  'react-useref': 'useRef',
  'tanstack-query-key-and-fn': 'queryKey\nqueryFn',
  'tanstack-query-methods': 'useMutation\ninvalidate',
  'why-not-use-async-in-useeffect': 'async\nuseEffect',
  'why-not-use-index-as-key-in-react': 'index\nas key',
  'why-not-use-usestate-in-condition': 'useState\ncondition',
};

function getThumbnailKeyword(slug: string): string {
  return THUMBNAIL_KEYWORDS[slug] ?? slug.split('-').slice(0, 3).join('\n');
}

interface ArticleCardProps {
  article: ArticleMeta;
  index: number;
}

export default function ArticleCard({ article, index }: ArticleCardProps) {
  const keyword = getThumbnailKeyword(article.slug);
  const gradient = GRADIENTS[index % GRADIENTS.length];

  return (
    <div
      className="article-card"
      style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          height: 180,
          background: gradient,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            lineHeight: 1.4,
            padding: '0 16px',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '-0.5px',
            whiteSpace: 'pre-line',
          }}
        >
          {keyword}
        </span>
        <span
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            fontSize: 11,
            fontWeight: 600,
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(4px)',
            color: '#fff',
            borderRadius: 4,
            padding: '3px 8px',
            border: '1px solid rgba(255,255,255,0.25)',
          }}
        >
          {article.category}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#212121',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            margin: 0,
          }}
        >
          {article.title}
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
            color: '#757575',
          }}
        >
          <span>{article.date}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
        <Link
          href={`/articles/${article.slug}`}
          className="btn-detail"
          style={{
            flex: 1,
            height: 34,
            background: '#F5F5F5',
            color: '#212121',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s',
          }}
        >
          자세히 보기
        </Link>
      </div>
    </div>
  );
}
