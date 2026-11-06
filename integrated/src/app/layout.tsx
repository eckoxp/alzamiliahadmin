import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This root layout just passes children through
  // The [locale]/layout.tsx handles html/body/metadata
  return children;
}
