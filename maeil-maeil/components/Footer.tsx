import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="px-6" style={{ background: '#1A1A2E', color: 'rgba(255,255,255,0.7)', padding: '56px 24px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-12 mb-12">
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
              매일<span style={{ color: '#fe6e00' }}>매일</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>
              주니어~미드레벨 프론트엔드 개발자를 위한
              <br />
              기술 지식 공유 플랫폼입니다.
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              <a
                href="mailto:kangmu238@gmail.com"
                style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}
              >
                kangmu238@gmail.com
              </a>
            </p>
          </div>

          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)',
                marginBottom: 16,
              }}
            >
              Category
            </p>
            <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
              {['프론트엔드', 'CS', '개발도구'].map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/?category=${encodeURIComponent(cat)}`}
                    style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)',
                marginBottom: 16,
              }}
            >
              Links
            </p>
            <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
              <li>
                <a
                  href="https://github.com/wookminkang"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="flex flex-wrap items-center justify-between gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24 }}
        >
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
            Copyright &copy; 2026 매일매일. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
