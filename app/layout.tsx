import Disclaimer from "@/components/Disclaimer";
import Header from "@/components/Header";
import { MonitorProvider } from "@/components/monitor-context";
import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Tarra — landslide monitoring prototype",
    template: "%s · Tarra",
  },
  description:
    "Research prototype for landslide monitoring with open geospatial data. Not an official warning system.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b3a4a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full`}>
      <body className="flex h-dvh flex-col overflow-hidden font-sans antialiased">
        <MonitorProvider>
          <Header />
          <Disclaimer />
          <div data-testid="shell" className="min-h-0 flex-1 overflow-auto">{children}</div>
        </MonitorProvider>
      </body>
    </html>
  );
}
