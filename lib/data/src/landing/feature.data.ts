import { FiBook, FiMinimize2 } from "react-icons/fi/index.js";
import { MdQrCode } from "react-icons/md/index.js";

export const featureList = [
  {
    slug: "link-shortening",
    title: "Link Shortening",
    subtitle: "Customize your links and track your audience engagement.",
    description:
      "InkByte simplifies your links by creating short, clean links that are easy to remember and share. Its powerful analytics tracks link clicks to help you optimize your marketing campaigns, saving you time and boosting your online presence.",
    benefits: [
      "Custom links that match your brand",
      "Bring your domain to InkByte",
      "Analytics & Tracking",
    ],
    benefits_long: [
      {
        title: "Custom Links",
        description:
          "Match your brand and style with custom links and build trust with your audience using your own domain.",
      },
      {
        title: "Branding",
        description:
          "Use InkByte's link shortening feature for custom links that match your brand and style, and build trust with your own domain.",
      },
      {
        title: "Analytics",
        description:
          "Track link clicks and page visits for audience engagement insights to optimize your social media strategy.",
      },
    ],
    Icon: FiMinimize2,
  },
  {
    slug: "link-in-bio",
    title: "Link-in-Bio",
    subtitle: "Share multiple links with one customizable page.",
    description:
      "Elevate your social media game with InkByte's Link in Bio. Share multiple links with one customizable page and drive traffic to your website - Mobile optimized and easy to use.",
    benefits: [
      "Custom landing page",
      "Easy-to-manage multiple links",
      "Analytics & Tracking",
    ],
    benefits_long: [
      {
        title: "Customizable",
        description:
          "Customize your landing page to match your brand and style.",
      },
      {
        title: "Multiple Links",
        description:
          "Share multiple links through a single customizable landing page.",
      },
      {
        title: "Analytics",
        description:
          "Track link clicks and page visits to better understand your audience engagement and optimize your social media strategy.",
      },
    ],
    Icon: FiBook,
  },
  {
    slug: "qr-codes",
    title: "QR Codes",
    subtitle: "Create custom QR codes for your business.",
    description:
      "InkByte's QR code generator allows you to create custom QR codes for your business. Use QR codes to promote your brand, share links, and track engagement.",
    benefits: [
      "Customizable QR codes",
      "Dynamic QR codes",
      "Analytics & Tracking",
    ],
    benefits_long: [
      {
        title: "Customizable",
        description: "Customize your QR codes with your brand colors and logo.",
      },
      {
        title: "Dynamic QR codes",
        description:
          "Edit the content of your QR codes without having to reprint them.",
      },
      {
        title: "Analytics",
        description:
          "Track link clicks and page visits to better understand your audience engagement and optimize your social media strategy.",
      },
    ],
    Icon: MdQrCode,
  },
];
