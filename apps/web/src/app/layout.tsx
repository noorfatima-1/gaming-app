import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
  title: "NoorGameZone - Draw & Guess",
  description:
    "Play the ultimate multiplayer drawing and guessing game with friends! Create a room, invite friends, and see who can guess the fastest.",
  keywords: ["drawing game", "multiplayer", "NoorGameZone", "draw and guess", "online game"],
  openGraph: {
    title: "NoorGameZone - Draw & Guess",
    description: "Draw, guess, and compete with friends in real-time!",
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
        {children}
      </body>
    </html>
  );
}
