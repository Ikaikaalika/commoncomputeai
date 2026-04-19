import type { Metadata } from "next";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const display = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Common Compute | The batch AI bill you shouldn't be paying",
    template: "%s | Common Compute",
  },
  description:
    "A fraction of the cost of OpenAI and AWS for batch embeddings, transcription, OCR, rerankers, and image captioning. One SDK call, deterministic pricing, signed receipts.",
  metadataBase: new URL("https://commoncompute.ai"),
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
