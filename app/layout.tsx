import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hardik Agrawal — Engineering, AI & Interactive Worlds",
  description: "Hardik Agrawal’s portfolio. Full-stack tools, creative AI experiments, and Unity game prototypes. Final-year CS student at the University of Mumbai.",
  openGraph: { title: "Hardik Agrawal — Software & Other Worlds", description: "Full-stack engineering, creative experiments, and interactive worlds.", type: "website", url: "https://hardik-portfolio-mu.vercel.app" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
