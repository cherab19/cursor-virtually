import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, SendHorizonal } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  useMarkThreadReadEffect,
  useMessageThreads,
  useThreadMessages,
} from "@/hooks/use-message-threads";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export interface MessagesInboxPageProps {
  /** e.g. `/dashboard/influencer` for back links and layout copy */
  dashboardBasePath: string;
}

export function MessagesInboxPage({ dashboardBasePath }: MessagesInboxPageProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const partnerId = searchParams.get("with");
  const [draft, setDraft] = useState("");

  const threadsQuery = useMessageThreads();
  const threadQuery = useThreadMessages(partnerId);

  useMarkThreadReadEffect(partnerId, threadQuery.data);

  const activeLabel = useMemo(() => {
    if (!partnerId) return null;
    return threadsQuery.data?.find((t) => t.partnerId === partnerId)?.label ?? "Member";
  }, [partnerId, threadsQuery.data]);

  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      if (!user?.id || !partnerId) throw new Error("Not ready to send");
      const trimmed = body.trim();
      if (!trimmed) throw new Error("Empty message");

      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: partnerId,
        subject: "",
        body: trimmed,
        is_read: false,
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      setDraft("");
      if (user?.id) {
        await queryClient.invalidateQueries({ queryKey: ["message-threads", user.id] });
        await queryClient.invalidateQueries({ queryKey: ["message-thread", user.id, partnerId] });
      }
    },
  });

  function selectThread(id: string) {
    const next = new URLSearchParams(searchParams);
    next.set("with", id);
    setSearchParams(next, { replace: true });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!partnerId || sendMutation.isPending) return;
    sendMutation.mutate(draft);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Inbox</p>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-display text-2xl font-semibold text-navy">Messages</h1>
          <Link
            to={dashboardBasePath}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
        <p className="max-w-xl text-sm text-muted-foreground">
          Threads update in real time. Open a conversation to mark it read and reply.
        </p>
      </header>

      <div
        className={cn(
          "overflow-hidden rounded-xl border border-border bg-card shadow-card",
          "flex min-h-[28rem] flex-col md:flex-row",
        )}
      >
        <aside
          className="border-border md:w-72 md:shrink-0 md:border-e"
          aria-label="Conversation list"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">Conversations</p>
          </div>
          <div className="max-h-[22rem] overflow-y-auto md:max-h-[calc(28rem-3rem)]">
            {threadsQuery.isLoading ? (
              <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Loading threads…
              </div>
            ) : threadsQuery.isError ? (
              <p className="px-4 py-6 text-sm text-destructive">
                Could not load conversations. Refresh and try again.
              </p>
            ) : !threadsQuery.data?.length ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                No messages yet. When someone contacts you, their thread appears here.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {threadsQuery.data.map((t) => {
                  const active = partnerId === t.partnerId;
                  const snippetSource = t.lastMessage.body || t.lastMessage.subject || "Message";
                  const snippet =
                    snippetSource.length > 72 ? `${snippetSource.slice(0, 72)}…` : snippetSource;
                  return (
                    <li key={t.partnerId}>
                      <button
                        type="button"
                        onClick={() => selectThread(t.partnerId)}
                        className={cn(
                          "flex w-full flex-col gap-1 px-4 py-3 text-left text-sm transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                          active
                            ? "bg-primary/10 text-foreground"
                            : "text-foreground hover:bg-muted/80",
                        )}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate font-medium text-secondary-foreground">
                            {t.label}
                          </span>
                          {t.unread > 0 ? (
                            <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                              {t.unread}
                            </span>
                          ) : null}
                        </span>
                        <span className="line-clamp-2 text-xs text-muted-foreground">{snippet}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatWhen(t.lastMessage.created_at)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <section className="flex min-h-[16rem] flex-1 flex-col" aria-label="Active conversation">
          {!partnerId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
              <p className="text-sm font-medium text-secondary-foreground">Select a conversation</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Choose a thread on the left to view messages and reply.
              </p>
            </div>
          ) : (
            <>
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-secondary-foreground">{activeLabel}</p>
                <p className="text-xs text-muted-foreground">Direct message thread</p>
              </div>

              <div className="flex flex-1 flex-col">
                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  {threadQuery.isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Loading messages…
                    </div>
                  ) : threadQuery.isError ? (
                    <p className="text-sm text-destructive">Could not load this thread.</p>
                  ) : !threadQuery.data?.length ? (
                    <p className="text-sm text-muted-foreground">No messages in this thread yet.</p>
                  ) : (
                    threadQuery.data.map((m) => {
                      const mine = m.sender_id === user?.id;
                      return (
                        <div
                          key={m.id}
                          className={cn("flex", mine ? "justify-end" : "justify-start")}
                        >
                          <div
                            className={cn(
                              "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                              mine
                                ? "bg-primary text-primary-foreground"
                                : "border border-border bg-secondary text-secondary-foreground",
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>
                            <p
                              className={cn(
                                "mt-1 text-[10px] opacity-80",
                                mine ? "text-primary-foreground/80" : "text-muted-foreground",
                              )}
                            >
                              {formatWhen(m.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form
                  onSubmit={onSubmit}
                  className="border-t border-border bg-secondary/40 px-4 py-3"
                >
                  <label htmlFor="message-draft" className="sr-only">
                    Message
                  </label>
                  <div className="flex gap-2">
                    <textarea
                      id="message-draft"
                      rows={2}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Write a reply…"
                      className={cn(
                        "min-h-[2.75rem] flex-1 resize-y rounded-lg border border-input bg-card px-3 py-2 text-sm text-card-foreground",
                        "placeholder:text-muted-foreground",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={sendMutation.isPending || !draft.trim()}
                      className="shrink-0 self-end"
                    >
                      {sendMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <SendHorizonal className="size-4" aria-hidden />
                      )}
                      <span className="sr-only">Send</span>
                    </Button>
                  </div>
                  {sendMutation.isError ? (
                    <p className="mt-2 text-xs text-destructive">Could not send. Try again.</p>
                  ) : null}
                </form>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
