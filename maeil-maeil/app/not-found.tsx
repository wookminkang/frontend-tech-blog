import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <>
      <Header />
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 80,
            fontWeight: 800,
            color: '#fe6e00',
            lineHeight: 1,
            marginBottom: 24,
          }}
        >
          404
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#212121', marginBottom: 12 }}>
          페이지를 찾을 수 없습니다
        </h1>
        <p style={{ fontSize: 15, color: '#757575', marginBottom: 40, lineHeight: 1.7 }}>
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 44,
            padding: '0 24px',
            background: '#fe6e00',
            color: '#fff',
            borderRadius: 20,
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          홈으로 돌아가기
        </Link>
      </main>
      <Footer />
    </>
  );
}
