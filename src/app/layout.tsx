import type { Metadata, Viewport } from "next";
import { Heebo, Smooch_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
});

const smoochSans = Smooch_Sans({
  subsets: ["latin"],
  variable: "--font-smooch-sans",
});

export const metadata: Metadata = {
  title: "ipalsam - ניהול ציוד",
  description: "מערכת לניהול ציוד בבסיס צבאי",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} ${smoochSans.variable} font-sans`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
