import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "../components/Navbar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "NoorGameZone - Multiplayer Gaming Platform",
  description:
    "Play multiplayer games with friends! Draw & Guess, Crazy Eights, and more. Create a room, invite friends, and compete!",
  keywords: ["drawing game", "card game", "multiplayer", "NoorGameZone", "crazy eights", "online game"],
  openGraph: {
    title: "NoorGameZone - Multiplayer Gaming Platform",
    description: "Play multiplayer games with friends in real-time!",
    type: "website",
    siteName: "NoorGameZone",
  },
  twitter: {
    card: "summary_large_image",
    title: "NoorGameZone - Draw & Guess",
    description: "Draw, guess, and compete with friends in real-time!",
  },
  icons: {
    icon: "/favicon.svg",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4a90d9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
