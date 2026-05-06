import type { Metadata } from "next";
import {
  Bebas_Neue,
  Fira_Code,
  Inter,
  Montserrat,
  Oswald,
  Playfair_Display,
  Poppins,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Motion Editor",
  description: "Browser-based video editor with timeline, multi-track support, screen recording, and video export",
};

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
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
    <html lang={locale} className="h-full">
      <body
        className={`${inter.variable} ${poppins.variable} ${montserrat.variable} ${oswald.variable} ${playfair.variable} ${bebas.variable} ${spaceGrotesk.variable} ${firaCode.variable} h-full overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}