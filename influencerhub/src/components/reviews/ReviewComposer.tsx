import { Loader2, Star } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useSubmitInfluencerReview } from "@/hooks/use-influencer-profile-data";
import { cn } from "@/lib/utils";

export interface ReviewComposerProps {
  revieweeId: string;
  canSubmit: boolean;
  /** When false, show a short hint instead of the form */
  disabledReason?: string;
}

export function ReviewComposer({ revieweeId, canSubmit, disabledReason }: ReviewComposerProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const submit = useSubmitInfluencerReview(revieweeId);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  if (!canSubmit) {
    return disabledReason ? (
      <p className="mt-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        {disabledReason}
      </p>
    ) : null;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitErr(null);
    submit.mutate(
      { rating, comment },
      {
        onSuccess: () => {
          toast.success("Thanks — your review is live.");
          setSubmitErr(null);
          setComment("");
          setRating(5);
        },
        onError: (err: { message?: string; code?: string }) => {
          const msg = err?.message ?? "";
          if (msg.includes("duplicate key") || msg.includes("idx_reviews_reviewer_reviewee") || err.code === "23505") {
            toast.error("You have already reviewed this creator.");
            setSubmitErr("You have already reviewed this creator.");
            return;
          }
          setSubmitErr(msg || "Could not submit review.");
          toast.error(msg || "Could not submit review.");
        },
      },
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <p className="text-sm font-medium text-card-foreground">Write a review</p>
      <p className="mt-1 text-xs text-muted-foreground">Share quick feedback after collaborating.</p>

      <div className="mt-3 flex items-center gap-2" role="group" aria-label="Star rating">
        {Array.from({ length: 5 }).map((_, i) => {
          const value = i + 1;
          const active = value <= rating;
          return (
            <button
              key={value}
              type="button"
              className={cn(
                "rounded-sm p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
              )}
              aria-label={`${value} star${value > 1 ? "s" : ""}`}
              aria-pressed={active}
              onClick={() => setRating(value)}
            >
              <Star
                className={cn(
                  "size-7",
                  active ? "fill-accent text-accent" : "text-muted-foreground/35",
                )}
                aria-hidden
              />
            </button>
          );
        })}
        <span className="sr-only">Selected rating: {rating} out of 5</span>
      </div>

      <label htmlFor="review-comment" className="mt-4 block text-xs font-medium text-muted-foreground">
        Comment (optional)
      </label>
      <textarea
        id="review-comment"
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className={cn(
          "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
        placeholder="What stood out about this collaboration?"
      />

      {submitErr ? (
        <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitErr}
        </p>
      ) : null}

      <Button type="submit" className="mt-4 gap-2" disabled={submit.isPending}>
        {submit.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            <span className="sr-only">Submitting</span>
          </>
        ) : (
          "Post review"
        )}
      </Button>
    </form>
  );
}
