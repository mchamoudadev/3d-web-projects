import type { Metadata } from "next";
import "@fontsource-variable/fraunces";
import "@fontsource/jetbrains-mono/400.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "9 Bar | The art of a single shot",
  description:
    "Nine bars. Twenty-five seconds. A first-person journey into the quiet ritual of espresso.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
