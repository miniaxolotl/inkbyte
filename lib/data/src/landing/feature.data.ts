import { FiBook, FiMinimize2 } from "react-icons/fi/index.js";
import { MdQrCode } from "react-icons/md/index.js";

export const featureList = [
  {
    slug: "link-shortening",
    title: "Link Shortening",
    description:
      "InkByte simplifies your links by creating short, clean links that are easy to remember and share. Its powerful analytics tracks link clicks to help you optimize your marketing campaigns, saving you time and boosting your online presence.",
    benefits: [
      "Custom links that match your brand",
      "Bring your domain to InkByte",
      "Analytics & Tracking",
      // "Custom Links: Match your brand and style with custom links and build trust with your audience using your own domain.",
      // "Branding: Use InkByte's link shortening feature for custom links that match your brand and style, and build trust with your own domain.",
      // "Analytics: Track link clicks and page visits for audience engagement insights to optimize your social media strategy.",
    ],
    Icon: FiMinimize2,
  },
  {
    slug: "link-in-bio",
    title: "Link-in-Bio",
    description:
      "Elevate your social media game with InkByte's Link in Bio. Share multiple links with one customizable page and drive traffic to your website - Mobile optimized and easy to use.",
    benefits: [
      "Custom landing page",
      "Easy-to-manage multiple links",
      "Analytics & Tracking",
      // "Customizable: Customize your landing page to match your brand and style.",
      // "Multiple Links: Share multiple links through a single customizable landing page.",
      // "Analytics: Track link clicks and page visits to better understand your audience engagement and optimize your social media strategy.",
    ],
    Icon: FiBook,
  },
  {
    slug: "qr-codes",
    title: "QR Codes",
    description:
      "InkByte's QR code generator allows you to create custom QR codes for your business. Use QR codes to promote your brand, share links, and track engagement.",
    benefits: [
      "Customizable QR codes",
      "Dynamic QR codes",
      "Analytics & Tracking",
    ],
    Icon: MdQrCode,
  },
  // {
  //   title: "Link Tracking",
  //   description:
  //     "InkByte's link tracking feature provides valuable insights into your audience engagement. Monitor your link's performance, track clicks and page visits to optimize your social media strategy and tailor your digital marketing strategy accordingly.",
  //   benefits: [
  //     "Measure audience engagement",
  //     "Discover top-performing links",
  //     "Define your target audience",
  //     // "Multi-link Sharing: Share multiple links through a single link-in-bio, giving your audience easy access to all of your important links in one place.",
  //     // "Mobile Optimization: Fully optimized for mobile, making it easy for your audience to access your links on any device.",
  //     // "Boost Engagement: Increase audience engagement by directing them to specific pages or products with a single link.",
  //     // "Time-saving: No need to constantly update your profile URL or create new landing pages for each link. InkByte streamlines the process, saving you valuable time and effort.",
  //   ],
  // },
];
