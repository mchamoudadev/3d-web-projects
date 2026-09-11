import type { Metadata } from "next";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "9 Bar | Everything in between",
  description: "The story of one shot of espresso, explored through a continuous, scroll-driven 3D machine.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
