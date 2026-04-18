import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "Common Compute | Affordable AI compute powered by idle Macs",
    template: "%s | Common Compute",
  },
  description:
    "Run verified batch AI workloads for less or earn from the Apple Silicon you already own.",
  metadataBase: new URL("https://commoncompute.ai"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <Header />
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
