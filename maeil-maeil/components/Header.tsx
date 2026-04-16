import Link from 'next/link';

export default function Header() {
  return (
    <header
      style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #E8E8E8' }}
      className="px-6"
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
        <Link
          href="/"
          style={{ fontSize: 18, fontWeight: 700, color: '#212121', textDecoration: 'none', letterSpacing: '-0.5px' }}
        >
          매일<span style={{ color: '#fe6e00' }}>매일</span>
        </Link>

        <nav>
          <ul style={{ display: 'flex', gap: 28, listStyle: 'none', margin: 0, padding: 0 }}>
            <li>
              <Link
                href="/"
                style={{ fontSize: 14, fontWeight: 500, color: '#757575', textDecoration: 'none' }}
              >
                홈
              </Link>
            </li>
            <li>
              <Link
                href="/"
                style={{ fontSize: 14, fontWeight: 600, color: '#212121', textDecoration: 'none' }}
              >
                아티클
              </Link>
            </li>
          </ul>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a
            href="https://github.com/wookminkang"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub"
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              background: '#F5F5F5',
              color: '#757575',
              textDecoration: 'none',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}
