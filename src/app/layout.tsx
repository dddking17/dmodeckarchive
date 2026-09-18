import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "디지몬 덱 아카이브",
  description: "보유한 디지몬 체크만으로 편성 가능한 덱을 한눈에 확인하는 덱 관리 도구",
};

const GA_MEASUREMENT_ID = "G-VNNGNKQ5RS";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Gothic+A1:wght@400;500;700;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
