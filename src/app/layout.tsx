import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "언제볼까? | 모임 날짜 정하기",
    template: "%s | 언제볼까?",
  },
  description:
    "여행, 모임, 회식 날짜 정하기가 어렵다면? 각자 가능한 날에 O·세모·X만 표시하면 모두가 되는 날짜를 한눈에 찾아드려요.",
  openGraph: {
    title: "언제볼까? - 모임 날짜 정하기",
    description:
      "각자 가능한 날에 O·세모·X만 표시하면 모두가 되는 날짜를 한눈에!",
    type: "website",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f5f6fb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={notoSansKr.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
