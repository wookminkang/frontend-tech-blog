'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { label: '전체', href: '/' },
  { label: '프론트엔드', href: '/?category=프론트엔드' },
  { label: 'AI', href: '/?category=AI' },
  { label: '실무 경험', href: '/?category=실무 경험' },
  { label: '기타', href: '/?category=기타' },
];

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);

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
    <>
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

          {/* Desktop nav */}
          <nav className="hidden md:flex" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#757575',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: 6,
                  transition: 'color 0.15s, background 0.15s',
                }}
                className="nav-link"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Hamburger button — mobile only */}
          <button
            className="flex md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="메뉴 열기"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
            }}
          >
            <span style={{ display: 'block', width: 22, height: 2, background: '#212121', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: '#212121', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: '#212121', borderRadius: 2 }} />
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 200,
          }}
        />
      )}

      {/* Mobile menu drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 260,
          height: '100%',
          background: '#fff',
          zIndex: 201,
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
        }}
      >
        {/* Drawer header */}
        <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid #E8E8E8' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#212121', letterSpacing: '-0.5px' }}>
            매일<span style={{ color: '#fe6e00' }}>매일</span>
          </span>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="메뉴 닫기"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#212121', fontSize: 20, lineHeight: 1 }}
          >
            &#x2715;
          </button>
        </div>

        {/* Drawer nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#757575', letterSpacing: 2, textTransform: 'uppercase', padding: '4px 10px', marginBottom: 4 }}>
            Category
          </p>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: '#212121',
                textDecoration: 'none',
                padding: '10px 12px',
                borderRadius: 8,
                display: 'block',
                transition: 'background 0.15s',
              }}
              className="drawer-link"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Drawer footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #E8E8E8' }}>
          <p style={{ fontSize: 12, color: '#bdbdbd', margin: 0 }}>kangmu238@gmail.com</p>
        </div>
      </div>
    </>
  );
}
