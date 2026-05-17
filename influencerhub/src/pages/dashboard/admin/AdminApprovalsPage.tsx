import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  useApprovedInfluencersVerification,
  useInfluencerModerationMutations,
  usePendingInfluencers,
} from "@/hooks/use-admin-dashboard";
import { cn } from "@/lib/utils";

function ProfileCell({ name, email }: { name: string; email: string }) {
  return (
    <div>
      <p className="font-medium text-card-foreground">{name || "—"}</p>
      <p className="text-xs text-muted-foreground">{email || "—"}</p>
    </div>
  );
}

export function AdminApprovalsPage() {
  const pending = usePendingInfluencers();
  const approved = useApprovedInfluencersVerification();
  const { approve, reject, setVerified } = useInfluencerModerationMutations();

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-2xl font-bold text-card-foreground">Approvals &amp; verification</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Review pending creator profiles and manage the verified badge for approved directory listings. Updates are
          enforced by RLS: only admins may change moderation fields.
        </p>
      </header>

      <section aria-labelledby="pending-heading">
        <h2 id="pending-heading" className="font-display text-lg font-semibold text-secondary-foreground">
          Pending queue
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">New influencer profiles awaiting a decision.</p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Creator</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {pending.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Loading pending profiles…
                    </span>
                  </td>
                </tr>
              ) : pending.isError ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-destructive">
                    Failed to load pending queue.
                  </td>
                </tr>
              ) : !(pending.data?.length) ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No pending profiles. Great work.
                  </td>
                </tr>
              ) : (
                pending.data.map((row) => (
                  <tr key={row.user_id}>
                    <td className="px-4 py-3 align-top">
                      <ProfileCell
                        name={row.profile?.full_name ?? ""}
                        email={row.profile?.email ?? ""}
                      />
                    </td>
                    <td className="px-4 py-3 align-top text-muted-foreground">{row.category || "—"}</td>
                    <td className="px-4 py-3 align-top text-muted-foreground">{row.location || "—"}</td>
                    <td className="px-4 py-3 align-top text-muted-foreground">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          disabled={approve.isPending}
                          onClick={() =>
                            approve.mutate(row.user_id, {
                              onSuccess: () => toast.success("Profile approved"),
                              onError: (e) => toast.error(e.message || "Approve failed"),
                            })
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive/40 text-destructive hover:bg-destructive/10"
                          disabled={reject.isPending}
                          onClick={() =>
                            reject.mutate(row.user_id, {
                              onSuccess: () => toast.success("Profile rejected"),
                              onError: (e) => toast.error(e.message || "Reject failed"),
                            })
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="verify-heading">
        <h2 id="verify-heading" className="font-display text-lg font-semibold text-secondary-foreground">
          Verified badge
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Toggle verification for approved creators (most recent updates first).
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Creator</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-end">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {approved.isLoading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Loading approved creators…
                    </span>
                  </td>
                </tr>
              ) : approved.isError ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-destructive">
                    Failed to load approved creators.
                  </td>
                </tr>
              ) : !(approved.data?.length) ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    No approved creators yet.
                  </td>
                </tr>
              ) : (
                approved.data.map((row) => (
                  <tr key={row.user_id}>
                    <td className="px-4 py-3 align-top">
                      <ProfileCell
                        name={row.profile?.full_name ?? ""}
                        email={row.profile?.email ?? ""}
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        approved
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={row.is_verified}
                          disabled={setVerified.isPending}
                          onClick={() =>
                            setVerified.mutate(
                              { userId: row.user_id, isVerified: !row.is_verified },
                              {
                                onSuccess: () =>
                                  toast.success(!row.is_verified ? "Marked verified" : "Verification removed"),
                                onError: (e) => toast.error(e.message || "Update failed"),
                              },
                            )
                          }
                          className={cn(
                            "relative inline-flex h-7 w-12 shrink-0 rounded-full border border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                            row.is_verified ? "bg-primary" : "bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none absolute top-0.5 size-6 rounded-full bg-card shadow-card transition-transform",
                              row.is_verified ? "translate-x-5" : "translate-x-0.5",
                            )}
                          />
                          <span className="sr-only">{row.is_verified ? "Verified" : "Not verified"}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
