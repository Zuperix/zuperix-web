import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

import { AuthProvider } from "@/context/AuthContext";
import { LaunchDarklyProvider } from "@/providers/LaunchDarklyProvider";
import { PostHogProvider } from "@/providers/PostHogProvider";
import { ConsentBanner } from "@/components/ConsentBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Zuperix",
    template: "%s | Zuperix",
  },
  description: "Zuperix - Digital Asset Management system",
  icons: {
    icon: "/logo_transparant.png",
  },
};

import { Toaster } from "sonner";

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
        <AuthProvider>
          <PostHogProvider>
            <LaunchDarklyProvider>{children}</LaunchDarklyProvider>
            <ConsentBanner />
          </PostHogProvider>
        </AuthProvider>
        <Toaster position="top-right" richColors expand={false} />
        <Script
          type="module"
          src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
