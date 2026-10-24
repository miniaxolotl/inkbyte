import type { Metadata, Viewport } from "next";
import "@fontsource/secular-one";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/600.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Suspense } from "react";
import { WebsiteInsights } from "@/components/website-insights";
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
  icons: { icon: "/assets/logo/default.svg" },
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
  themeColor: "#f2f2f2",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only fixed left-4 top-4 z-50 rounded bg-paper-raised p-3 text-cerulean focus:not-sr-only"
        >
          Skip to content
        </a>
        {publishableKey ? (
          <ClerkProvider
            publishableKey={publishableKey}
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            signInFallbackRedirectUrl="/dashboard"
            signUpFallbackRedirectUrl="/dashboard"
            appearance={{
              variables: {
                colorPrimary: "#276d8b",
                colorBackground: "#fbfbfa",
                colorForeground: "#262626",
                borderRadius: "0.75rem",
                fontFamily: '"Open Sans", system-ui, sans-serif',
              },
            }}
          >
            {children}
          </ClerkProvider>
        ) : (
          children
        )}
        <Suspense fallback={null}>
          <WebsiteInsights />
        </Suspense>
      </body>
    </html>
  );
}
