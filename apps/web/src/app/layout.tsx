import type { Metadata } from "next";
import {
  Bebas_Neue,
  Fira_Code,
  Inter,
  Instrument_Serif,
  Montserrat,
  Oswald,
  Playfair_Display,
  Poppins,
  Space_Grotesk,
} from "next/font/google";
import "@/styles/globals.css";
import { getLocale } from "@/shared/i18n";

export const metadata: Metadata = {
  title: "Open Studio",
  description: "Browser-based video editor with timeline, multi-track support, screen recording, and video export",
};

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const instrumentSerif = Instrument_Serif({ 
  subsets: ["latin"], 
  weight: ["400"], 
  style: ["normal", "italic"],
  variable: "--font-instrument-serif" 
});
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-poppins" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-montserrat" });
const oswald = Oswald({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-oswald" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-playfair" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: ["400"], variable: "--font-bebas" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-space-grotesk" });
const firaCode = Fira_Code({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-fira-code" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = getLocale();
  return (
    <html
      lang={locale}
      className="h-full"
      data-theme="dark"
      suppressHydrationWarning
    >
      <body
        className={`${inter.variable} ${instrumentSerif.variable} ${poppins.variable} ${montserrat.variable} ${oswald.variable} ${playfair.variable} ${bebas.variable} ${spaceGrotesk.variable} ${firaCode.variable} h-full min-h-0 overflow-hidden antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}