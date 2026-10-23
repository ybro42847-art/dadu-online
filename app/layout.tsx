import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Dadu Online — Dashboard",
  description: "Aplikasi dadu online dan dashboard Firebase."
};
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="id"><body>{children}</body></html>;
}
