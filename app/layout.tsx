import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/lib/toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voice AI Admin Dashboard",
  description: "Real-time Voice AI operations dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider afterSignOutUrl="/login" appearance={{ elements: { footer: "hidden" } }}>
      <html lang="en" suppressHydrationWarning>
      <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 text-zinc-900`}
          suppressHydrationWarning
      >
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
    </ClerkProvider>
  );
}
