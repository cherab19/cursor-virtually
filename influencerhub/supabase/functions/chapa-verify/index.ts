import { chapaVerifyTx } from "../_shared/chapa-api.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

function extractTxRef(body: Record<string, unknown>, url: URL): string | null {
  const direct =
    (body.tx_ref as string) ||
    (body.trx_ref as string) ||
    (body.reference as string) ||
    (typeof body.txRef === "string" ? body.txRef : null);
  if (direct) return String(direct).trim();

  const nested = body.data;
  if (nested && typeof nested === "object") {
    const d = nested as Record<string, unknown>;
    const v = d.tx_ref ?? d.txRef;
    if (typeof v === "string" && v) return v.trim();
  }

  const q = url.searchParams.get("tx_ref") ?? url.searchParams.get("trx_ref");
  return q?.trim() || null;
}

async function parseRecord(req: Request): Promise<Record<string, unknown>> {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    return (await req.json().catch(() => ({}))) as Record<string, unknown>;
  }
  if (ct.includes("application/x-www-form-urlencoded")) {
    const text = await req.text().catch(() => "");
    const params = new URLSearchParams(text);
    return Object.fromEntries(params.entries());
  }
  return {};
}

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

async function runVerification(req: Request): Promise<Response> {
  try {
    const chapaSecret = Deno.env.get("CHAPA_SECRET_KEY");
    if (!chapaSecret) {
      console.error("[chapa-verify] CHAPA_SECRET_KEY not configured");
      return jsonResponse({ error: "Payment provider not configured" }, { status: 500 });
    }

    const url = new URL(req.url);
    const body =
      req.method === "GET" ? ({} as Record<string, unknown>) : await parseRecord(req);
    const txRef = extractTxRef(body, url);

    if (!txRef) {
      return jsonResponse({ error: "Missing tx_ref" }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const { data: payment, error: payErr } = await admin
      .from("payments")
      .select("id, user_id, amount, currency, status, transaction_ref, raw_payload")
      .eq("transaction_ref", txRef)
      .maybeSingle();

    if (payErr) {
      console.error("[chapa-verify] load payment", payErr);
      return jsonResponse({ error: "Database error" }, { status: 500 });
    }
    if (!payment) {
      return jsonResponse({ error: "Unknown transaction reference" }, { status: 404 });
    }

    if (payment.status === "completed") {
      return jsonResponse({ ok: true, already_completed: true, tx_ref: txRef });
    }

    const { ok, amount: chapaAmountStr, raw } = await chapaVerifyTx(chapaSecret, txRef);

    if (!ok) {
      await admin
        .from("payments")
        .update({
          status: "failed",
          raw_payload: {
            ...(typeof payment.raw_payload === "object" && payment.raw_payload
              ? (payment.raw_payload as Record<string, unknown>)
              : {}),
            chapa_verify: raw,
            verified_at: new Date().toISOString(),
          },
        })
        .eq("id", payment.id);

      return jsonResponse({ ok: false, error: "Verification failed", tx_ref: txRef }, { status: 400 });
    }

    const chapaAmt = parseFloat(String(chapaAmountStr ?? "0"));
    const expectedAmt = Number(payment.amount);
    if (Number.isFinite(chapaAmt) && Number.isFinite(expectedAmt) && Math.abs(chapaAmt - expectedAmt) > 0.05) {
      console.warn("[chapa-verify] amount mismatch", { chapaAmt, expectedAmt, txRef });
      return jsonResponse({ ok: false, error: "Amount mismatch" }, { status: 409 });
    }

    const prevPayload =
      typeof payment.raw_payload === "object" && payment.raw_payload
        ? (payment.raw_payload as Record<string, unknown>)
        : {};
    const planName = typeof prevPayload.plan === "string" ? prevPayload.plan : null;
    if (!planName) {
      return jsonResponse({ ok: false, error: "Payment missing plan metadata" }, { status: 500 });
    }

    const mergedPayload = {
      ...prevPayload,
      chapa_verify: raw,
      verified_at: new Date().toISOString(),
    };

    const { error: payUpErr } = await admin
      .from("payments")
      .update({
        status: "completed",
        raw_payload: mergedPayload,
      })
      .eq("id", payment.id);

    if (payUpErr) {
      console.error("[chapa-verify] payment update", payUpErr);
      return jsonResponse({ error: "Could not finalize payment" }, { status: 500 });
    }

    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + MONTH_MS).toISOString();

    const { error: cancelErr } = await admin
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: nowIso })
      .eq("user_id", payment.user_id)
      .in("status", ["active", "trialing"]);

    if (cancelErr) {
      console.error("[chapa-verify] cancel subs", cancelErr);
    }

    const { error: subInsErr } = await admin.from("subscriptions").insert({
      user_id: payment.user_id,
      plan: planName,
      status: "active",
      started_at: nowIso,
      expires_at: expiresAt,
      updated_at: nowIso,
    });

    if (subInsErr) {
      console.error("[chapa-verify] subscription insert", subInsErr);
      return jsonResponse({ error: "Payment recorded but subscription failed — contact support" }, { status: 500 });
    }

    return jsonResponse({
      ok: true,
      tx_ref: txRef,
      plan: planName,
      subscription_expires_at: expiresAt,
    });
  } catch (e) {
    console.error("[chapa-verify]", e);
    return jsonResponse({ error: "Internal error" }, { status: 500 });
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method === "POST" || req.method === "GET") {
    return runVerification(req);
  }

  return jsonResponse({ error: "Method not allowed" }, { status: 405 });
});
