import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ClerkProvider } from "@clerk/nextjs";
import { features } from "@/lib/config";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const title = "Kairo — Map the way. Build the day.";
const description =
  "Tell Kairo what you want done. It turns your goals, ideas, and available time into a clear plan for today.";

export const metadata: Metadata = {
  metadataBase: new URL("https://kairo-zeta-five.vercel.app"),
  title,
  description,
  applicationName: "Kairo",
  appleWebApp: { capable: true, title: "Kairo", statusBarStyle: "black-translucent" },
  openGraph: { title, description, siteName: "Kairo", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: "#0a0b0d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const tree = (
    <html
      lang="en"
      className={`${sora.variable} ${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
  // Wrap in ClerkProvider only when Clerk is configured; demo mode runs bare.
  return features.clerk ? <ClerkProvider>{tree}</ClerkProvider> : tree;
}
