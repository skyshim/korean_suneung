import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar"; // Import the Navbar component

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "700"], // You can specify the weights you need
  display: "swap",
});

export const metadata: Metadata = {
  title: "수능 국어 학습 웹사이트",
  description: "Next.js 14 (App Router) + TypeScript + Tailwind CSS로 만든 수능 국어 학습 웹사이트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className={`${notoSansKr.className} min-h-full flex flex-col`}>
        <Navbar />
        <main className="flex-grow pt-16 bg-white"> {/* Added pt-16 to account for fixed navbar height */}
          {children}
        </main>
      </body>
    </html>
  );
}

