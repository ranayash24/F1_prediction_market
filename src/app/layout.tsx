import type { Metadata } from "next";
import { Bebas_Neue, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Providers from "@/app/providers";
import TopNav from "@/components/TopNav";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "600"],
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Redline Markets | F1 Prediction Market",
  description:
    "Trade play-money GP Coins on F1 race outcomes with Polymarket-inspired visuals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bebasNeue.variable} ${spaceGrotesk.variable} ${plexMono.variable}`}>
        <Providers>
          <div className="page">
            <TopNav />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
