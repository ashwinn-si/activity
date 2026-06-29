import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageWrapper } from "@/components/layout/PageWrapper";
import ThemeInitializer from "@/components/ThemeInitializer";

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
    default: "Strava Hub — Your Training, Visualized",
    template: "%s · Strava Hub",
  },
  description:
    "Personal Strava dashboard to track, compare, and analyze every run, ride, and walk. Km splits, route maps, personal records, and session comparisons — all in one place.",
  keywords: [
    "Strava", "running", "cycling", "fitness dashboard",
    "activity tracker", "km splits", "personal records",
    "pace chart", "route map", "training analytics",
  ],
  authors: [{ name: "Ashwin" }],
  creator: "Ashwin",
  applicationName: "Strava Hub",
  metadataBase: new URL("https://strava-activity-hub.vercel.app"),
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", type: "image/png" },
    ],
    shortcut: "/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://strava-activity-hub.vercel.app",
    siteName: "Strava Hub",
    title: "Strava Hub — Your Training, Visualized",
    description:
      "Personal dashboard for runs, rides, and walks. Km splits, route maps, personal records, and head-to-head session comparison.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Strava Hub",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Strava Hub — Your Training, Visualized",
    description:
      "Km splits, route maps, personal records, and session comparison for your Strava activities.",
    images: ["/logo.png"],
  },
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://strava-activity-hub.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-text-primary overflow-hidden relative">
        <ThemeInitializer />
        {/* Decorative background glow orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] sm:w-[60vw] sm:h-[60vw] md:w-[50vw] md:h-[50vw] rounded-full bg-accent-ride/10 blur-[80px] sm:blur-[100px] md:blur-[120px] animate-float-1" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[100vw] h-[100vw] sm:w-[70vw] sm:h-[70vw] md:w-[60vw] md:h-[60vw] rounded-full bg-accent-run/10 blur-[80px] sm:blur-[110px] md:blur-[130px] animate-float-2" />
        </div>

        <div className="flex h-screen relative z-10">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <PageWrapper>{children}</PageWrapper>
          </div>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
