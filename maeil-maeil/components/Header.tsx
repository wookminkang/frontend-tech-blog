'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  const logoProps = isHome
    ? {
        href: '/',
        onClick: (e: React.MouseEvent) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
      }
    : { href: '/' };

  return (
    <header
      style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #E8E8E8' }}
      className="px-6"
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
        <Link
          {...logoProps}
          style={{ fontSize: 18, fontWeight: 700, color: '#212121', textDecoration: 'none', letterSpacing: '-0.5px' }}
        >
          매일<span style={{ color: '#fe6e00' }}>매일</span>
        </Link>

        <div />
      </div>
    </header>
  );
}
