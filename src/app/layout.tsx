import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AlertProvider } from "@/components/ui/AlertProvider";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Finance21",
  description: "Accounting platform for Uzbekistan businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Apply saved theme ASAP (before first paint) to avoid a flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(() => {
  const THEME_KEY = 'theme';
  try {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
    const shouldUseDark = saved ? saved === 'dark' : Boolean(prefersDark);
    document.documentElement.classList.toggle('dark', shouldUseDark);
  } catch {
    // ignore
  }
})();`.trim(),
          }}
        />
      </head>
      <body className={`${inter.className} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <AlertProvider>
            {children}
          </AlertProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
