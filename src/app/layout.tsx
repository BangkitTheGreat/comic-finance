import type { Metadata, Viewport } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Comic Finance - Personal Finance",
  description: "A fun and clean comic-style personal finance dashboard.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#fafaf5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${publicSans.variable} font-body-md antialiased`}>
        {children}
      </body>
    </html>
  );
}
