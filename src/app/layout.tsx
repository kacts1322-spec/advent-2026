import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://advent-2026-five.vercel.app'
  ),
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
    icon: [
      { url: '/icon-192.png?v=2', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png?v=2', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png?v=2', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: '2026 대림절 말씀 묵상 | 청년부 묵상집',
    description: '2026년 11월 29일 ~ 12월 25일, 매일의 말씀과 함께 성탄을 기다려요.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: '2026 대림절 말씀 묵상 트리' }],
    type: 'website',
    locale: 'ko_KR',
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
