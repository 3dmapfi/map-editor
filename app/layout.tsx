import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3DMapFi - Map Editor",
  description: "Create and edit 3D maps with ease",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
