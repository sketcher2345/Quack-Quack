// apps/participant-client/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HackVerse - Join a Hackathon",
  description: "Discover and participate in exciting hackathons.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* We will add a Header/Navbar component here later */}
        {children}
      </body>
    </html>
  );
}