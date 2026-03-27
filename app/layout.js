import "./globals.css";
import CartShell from "@/components/checkout/CartShell";

/**
 * Root Layout for CentralTexas.com
 * Applied to all routes (marketing, multi-tenant, admin)
 */
export const metadata = {
  title: {
    default: "CentralTexas.com - Free Websites for Local Businesses",
    template: "%s | CentralTexas.com",
  },
  description:
    "Build a beautiful, mobile-perfect website on your own domain — completely free. Built for local businesses in the I-35 Innovation Corridor between Austin and San Antonio.",
  keywords: [
    "marketplace",
    "central texas",
    "local business",
    "austin",
    "san antonio",
    "free website",
    "events",
    "catering",
    "retail",
    "services",
  ],
  authors: [{ name: "Davis Jones" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#E8495A",
  openGraph: {
    title: "CentralTexas.com - Free Websites for Local Businesses",
    description:
      "Build a beautiful, mobile-perfect website on your own domain — completely free. Built for local businesses along I-35.",
    url: "https://centraltexas.com",
    siteName: "CentralTexas.com",
    images: [
      {
        url: "/logo-512.png",
        width: 512,
        height: 512,
        alt: "CentralTexas.com Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "CentralTexas.com - Free Websites for Local Businesses",
    description:
      "Build a beautiful, mobile-perfect website on your own domain — completely free.",
    images: ["/logo-512.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <CartShell>{children}</CartShell>
      </body>
    </html>
  );
}
