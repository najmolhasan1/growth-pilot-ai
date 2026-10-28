import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import CursorGlow from "@/components/effects/CursorGlow";

export const metadata: Metadata = {
  title: "GrowthPilot AI - AI Growth Workspace",
  description: "AI workspace for SEO content, keyword research, trend intelligence, video creator kits, and marketing campaigns.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/images/favicon.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const inlineThemeScript = `
  (function() {
    try {
      var saved = localStorage.getItem('theme');
      if (saved === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
    } catch (_) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: inlineThemeScript }} />
      </head>
      <body className="antialiased font-sans overflow-x-hidden" suppressHydrationWarning>
        <ThemeProvider>
          <CursorGlow />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
