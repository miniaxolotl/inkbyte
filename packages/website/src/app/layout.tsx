import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/dm-sans";
import { ClerkProvider } from "@clerk/nextjs";
import { site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.title,
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.creator }],
  creator: site.creator,
  publisher: site.creator,
  category: "productivity",
  icons: { icon: "/icon.svg" },
  keywords: [
    "url shortener",
    "link shortener",
    "link analytics",
    "custom domain",
    "InkByte",
  ],
  robots: {
    index: site.indexable,
    follow: site.indexable,
    googleBot: { "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    url: site.url,
    title: site.title,
    description: site.description,
    siteName: site.name,
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f4ef",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return (
    <html lang="en">
      <body>
        {publishableKey ? (
          <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
