import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
});

export const metadata: Metadata = {
  title: "ipalsam - ניהול ציוד",
  description: "מערכת לניהול ציוד בבסיס צבאי",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} font-sans`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
