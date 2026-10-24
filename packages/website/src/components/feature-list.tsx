import { BarChart3, Globe, Link2 } from "lucide-react";
import { CheckCircle2 } from "lucide-react";

type Feature = {
  title: string;
  description: string;
  benefits: string[];
  icon: React.ReactNode;
};

const features: Feature[] = [
  {
    title: "Link Shortener",
    description:
      "Shorten any link, pick your own alias, and put it on a domain you control.",
    benefits: [
      "Custom links that match your brand",
      "Bring your own domain",
      "Aliases that stay reserved",
    ],
    icon: <Link2 aria-hidden size={20} />,
  },
  {
    title: "Analytics & Tracking",
    description:
      "Every click is recorded — views, unique visitors, referrers, countries, cities and devices.",
    benefits: [
      "Real numbers, not estimates",
      "Bot and preview filtering",
      "QR codes for every link",
    ],
    icon: <BarChart3 aria-hidden size={20} />,
  },
  {
    title: "Link in Bio",
    description:
      "One page for every link that matters, with each item tracked like a short link.",
    benefits: [
      "Customizable landing page",
      "Easy-to-manage multiple links",
      "Analytics on every tap",
    ],
    icon: <Globe aria-hidden size={20} />,
  },
];

export const FeatureList = () => (
  <div className="grid w-full gap-6 md:grid-cols-3">
    {features.map((feature) => (
      <article key={feature.title} className="ink-card flex flex-col p-5">
        <h3 className="flex items-center gap-2 font-display text-lg text-cerulean">
          {feature.icon}
          {feature.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
          {feature.description}
        </p>
        <div className="my-4 border-t border-rule" />
        <h4 className="font-display text-sm text-ink">
          Features &amp; Benefits
        </h4>
        <ul className="mt-2 flex flex-col gap-2">
          {feature.benefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2 text-sm">
              <CheckCircle2
                aria-hidden
                size={16}
                className="shrink-0 text-green"
              />
              {benefit}
            </li>
          ))}
        </ul>
      </article>
    ))}
  </div>
);
