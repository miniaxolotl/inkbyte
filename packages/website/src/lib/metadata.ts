import "server-only";
import type { Metadata } from "next";
import { site } from "./site";

/** Only informational routes get canonicals. Never echo query strings or account data. */
export function pageMetadata(
  title: string,
  description: string,
  publicPath?: "/" | "/help" | "/privacy",
): Metadata {
  const fullTitle = title === site.title ? title : `${title} | ${site.name}`;
  const url =
    publicPath === undefined
      ? undefined
      : new URL(publicPath, site.url).toString();
  const index = publicPath !== undefined && site.indexable;
  const image = {
    url: "/assets/brand/social-card.png",
    width: 1200,
    height: 630,
    alt: "InkByte — short links with real analytics",
  };
  return {
    title: { absolute: fullTitle },
    description,
    alternates: url ? { canonical: url } : null,
    robots: {
      index,
      follow: index,
      googleBot: { index, follow: index, "max-image-preview": "large" },
    },
    openGraph: {
      type: "website",
      title: fullTitle,
      description,
      siteName: site.name,
      locale: "en_CA",
      ...(url ? { url } : {}),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
  };
}
