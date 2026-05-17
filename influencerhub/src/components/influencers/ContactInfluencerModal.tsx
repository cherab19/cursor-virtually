import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export interface ContactInfluencerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  influencerName: string;
  returnPath?: string;
}

export function ContactInfluencerModal({
  open,
  onOpenChange,
  influencerName,
  returnPath = "/",
}: ContactInfluencerModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onKeyDown={(e) => {
        if (e.key === "Escape") onOpenChange(false);
      }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-navy/40 backdrop-blur-sm transition-opacity hover:bg-navy/50 focus:outline-none"
        aria-label="Close dialog backdrop"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-card"
      >
        <h2 id="contact-modal-title" className="font-display text-lg font-semibold text-card-foreground">
          Message {influencerName}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Real-time messaging between brands and creators is wired in a later phase. For the demo, sign in as an
          advertiser to open your inbox soon.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild variant="default" size="sm">
            <Link
              to="/auth"
              state={{ from: { pathname: returnPath } }}
              onClick={() => onOpenChange(false)}
            >
              Sign in to continue
            </Link>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
