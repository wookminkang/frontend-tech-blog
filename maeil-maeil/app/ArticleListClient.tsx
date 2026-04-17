'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { ArticleMeta } from '@/types/article';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ArticleCard from '@/components/ArticleCard';

const CATEGORIES = ['전체', '프론트엔드', 'CS', '개발도구', '기타'] as const;

interface ArticleListClientProps {
  articles: ArticleMeta[];
}

export default function ArticleListClient({ articles }: ArticleListClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedCategory = searchParams.get('category') ?? '전체';
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');

  function handleCategoryChange(cat: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === '전체') {
      params.delete('category');
    } else {
      params.set('category', cat);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { '전체': articles.length };
    for (const a of articles) {
      counts[a.category] = (counts[a.category] ?? 0) + 1;
    }
    return counts;
  }, [articles]);

  const filtered = useMemo(() => {
    let result = articles;
    if (selectedCategory !== '전체') {
      result = result.filter((a) => a.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [articles, selectedCategory, searchQuery]);

  function handleSearch() {
    setSearchQuery(inputValue);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSearch();
  }

  return (
    <>
      <Header />

      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section
          style={{
            height: 260,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #2d1a00 50%, #1a1a2e 100%)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse at 60% 50%, rgba(254,110,0,0.25) 0%, transparent 70%)',
            }}
          />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: 3,
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              매일매일 — 개발 지식
            </p>
            <h1
              style={{
                fontSize: 'clamp(40px, 8vw, 96px)',
                fontWeight: 800,
                color: '#fff',
                letterSpacing: '-4px',
                lineHeight: 1,
                margin: 0,
              }}
            >
              Arti<span style={{ color: '#fe6e00' }}>cles</span>
            </h1>
            <p style={{ marginTop: 16, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
              총 {articles.length}개의 아티클
            </p>
          </div>
        </section>

        {/* Search Bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E8E8E8', padding: '16px 24px' }}>
          <div
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 17, fontWeight: 600, color: '#212121', whiteSpace: 'nowrap' }}>
              매일 하나씩, 찾아보세요
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="키워드를 입력하세요"
                style={{
                  width: 280,
                  height: 38,
                  border: '1px solid #E8E8E8',
                  borderRadius: 6,
                  padding: '0 14px',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  color: '#212121',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSearch}
                style={{
                  height: 38,
                  padding: '0 18px',
                  background: '#212121',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                검색
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '36px 24px',
            display: 'flex',
            gap: 32,
            alignItems: 'flex-start',
          }}
        >
          {/* Filter Sidebar */}
          <aside
            style={{
              width: 200,
              flexShrink: 0,
              position: 'sticky',
              top: 80,
            }}
            className="hidden lg:block"
          >
            <div style={{ marginBottom: 28 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#757575',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}
              >
                Category
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {CATEGORIES.map((cat) => {
                  const isActive = cat === selectedCategory;
                  const count = categoryCounts[cat] ?? 0;
                  return (
                    <li
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`filter-item${isActive ? ' active' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 14,
                        color: isActive ? '#fe6e00' : '#757575',
                        borderLeft: `3px solid ${isActive ? '#fe6e00' : 'transparent'}`,
                        background: isActive ? 'rgba(254,110,0,0.05)' : 'transparent',
                        fontWeight: isActive ? 600 : 400,
                        transition: 'all 0.15s',
                        userSelect: 'none',
                      }}
                    >
                      <span>{cat}</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          background: count > 0 && isActive ? '#fe6e00' : '#F5F5F5',
                          color: count > 0 && isActive ? '#fff' : '#757575',
                          borderRadius: 12,
                          padding: '1px 8px',
                          lineHeight: '18px',
                        }}
                      >
                        {count}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          {/* Grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <p style={{ fontSize: 14, color: '#757575' }}>
                <strong style={{ color: '#212121' }}>{filtered.length}</strong>개의 아티클
              </p>
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#757575' }}>
                <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>검색 결과가 없습니다</p>
                <p style={{ fontSize: 14 }}>다른 키워드로 검색해 보세요</p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 24,
                }}
              >
                {filtered.map((article, idx) => (
                  <ArticleCard key={article.slug} article={article} index={idx} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
