import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: '매일매일 — 매일 하나씩, 프론트엔드 지식',
    template: '%s | 매일매일',
  },
  description:
    '주니어~미드레벨 프론트엔드 개발자를 위한 기술 지식 공유 플랫폼. React, Next.js, TypeScript를 중심으로 매일 하나의 개념을 짧고 명확하게 전달합니다.',
  keywords: ['프론트엔드', 'React', 'Next.js', 'TypeScript', '개발', '학습'],
  authors: [{ name: '매일매일' }],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '매일매일',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={jetbrainsMono.variable}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
