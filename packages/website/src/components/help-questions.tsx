import { Plus } from "lucide-react";
import { helpTopics } from "@/lib/help-topics";

export function HelpQuestions({ limit }: { limit?: number }) {
  return (
    <div className="divide-y divide-rule border-y border-rule">
      {helpTopics.slice(0, limit).map(({ question, answer }) => (
        <details key={question} className="group">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-5 font-display text-base text-ink sm:text-lg [&::-webkit-details-marker]:hidden">
            <span>{question}</span>
            <Plus
              aria-hidden
              size={20}
              className="shrink-0 text-cerulean transition-transform group-open:rotate-45"
            />
          </summary>
          <p className="max-w-2xl pb-6 pr-5 text-sm leading-relaxed text-ink-soft">
            {answer}
          </p>
        </details>
      ))}
    </div>
  );
}
