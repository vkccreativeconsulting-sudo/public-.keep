import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Pacifico, Rajdhani } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const display = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });
const hud = Rajdhani({ weight: ["500", "600", "700"], subsets: ["latin"], variable: "--font-hud", display: "swap" });
const script = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-script", display: "swap" });

export const metadata: Metadata = {
  title: "VICE CITY AIRWATCH — Live GTA VI Blimp Tracker",
  description:
    "Track the Vice City–branded Goodyear blimp (Wingfoot Three, N3A) over Miami and South Florida on a GTA-inspired live map. Unofficial fan project.",
  applicationName: "Vice City Airwatch",
  keywords: ["GTA VI", "Vice City", "blimp", "Goodyear", "Wingfoot Three", "N3A", "Miami", "tracker"],
  openGraph: {
    title: "VICE CITY AIRWATCH",
    description: "The skies are ours. Live tracking of the Vice City blimp over Miami.",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "VICE CITY AIRWATCH", description: "Live tracking of the Vice City blimp over Miami." },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#1b0b33",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${hud.variable} ${script.variable} h-full antialiased`}>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
