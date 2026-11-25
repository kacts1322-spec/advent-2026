import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '2026 대림절 말씀 묵상 | 청년부 묵상집',
  description:
    '2026 대림절 기간 동안 매일의 말씀과 교회력 본문을 읽고 청년부 공동체와 함께 묵상을 나누는 2D 레트로 묵상 웹앱',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: '대림절 묵상',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#261847',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* 성경 본문(고운바탕) & 일반 본문(Noto Sans KR) & 2D 픽셀 폰트(Galmuri11) */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Noto+Sans+KR:wght@400;500;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/galmuri@latest/dist/galmuri.css"
        />
      </head>
      <body className="antialiased selection:bg-amber-300/30 selection:text-amber-100">
        {children}
      </body>
    </html>
  );
}
