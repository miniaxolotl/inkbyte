import { BarChart3, Globe, Link2, QrCode } from "lucide-react";

type Feature = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

const features: Feature[] = [
  {
    title: "Links you can remember",
    description:
      "Choose a short name that makes sense for what you’re sharing. Less clutter in a message, more room for what matters.",
    icon: <Link2 aria-hidden size={20} />,
  },
  {
    title: "A QR code when you need it",
    description:
      "Take a link off the screen. Download its QR code for invitations, posters, packaging and the things you put out into the world.",
    icon: <QrCode aria-hidden size={22} />,
  },
  {
    title: "Your favourites, together",
    description:
      "Make one page for the things you want people to find. Share it in your profile instead of choosing just one link.",
    icon: <Globe aria-hidden size={20} />,
  },
  {
    title: "See what gets opened",
    description:
      "Check how often your links are opened, change where they lead, or pause them when their moment has passed. You stay in control.",
    icon: <BarChart3 aria-hidden size={22} />,
  },
];

export const FeatureList = () => (
  <div className="grid w-full gap-x-14 gap-y-10 sm:grid-cols-2">
    {features.map((feature) => (
      <article key={feature.title} className="border-t border-rule pt-6">
        <span className="mb-4 inline-flex text-cerulean">{feature.icon}</span>
        <h3 className="font-display text-xl text-ink">{feature.title}</h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
          {feature.description}
        </p>
      </article>
    ))}
  </div>
);
