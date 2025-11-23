import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { ToastProvider } from "@/contexts/ToastContext";
import LoadingWrapper from "@/components/common/LoadingWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Airguard Control Center",
  description: "Official web app for Airguard",
  icons: {
    icon: "/airguard.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <ToastProvider>
          <LoadingProvider>
            <LoadingWrapper>{children}</LoadingWrapper>
          </LoadingProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
