import { chapaInitialize } from "../_shared/chapa-api.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { supabaseAdmin, supabaseUserClient } from "../_shared/supabase.ts";

interface InitializeBody {
  plan?: string;
  return_url?: string | null;
}

function splitName(full: string): { first: string; last: string } {
  const t = full.trim();
  if (!t) return { first: "Customer", last: "User" };
  const parts = t.split(/\s+/);
  if (parts.length === 1) return { first: parts[0]!, last: parts[0]! };
  return { first: parts[0]!, last: parts.slice(1).join(" ") };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }

    const chapaSecret = Deno.env.get("CHAPA_SECRET_KEY");
    if (!chapaSecret) {
      console.error("[chapa-initialize] CHAPA_SECRET_KEY not configured");
      return jsonResponse({ error: "Payment provider not configured" }, { status: 500 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) {
      return jsonResponse({ error: "Server misconfigured" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as InitializeBody;
    const planName = (body.plan ?? "").trim().toLowerCase();
    if (!planName || planName === "free") {
      return jsonResponse({ error: "Invalid or unpaid plan" }, { status: 400 });
    }

    const userSb = supabaseUserClient(authHeader);
    const {
      data: { user },
      error: userErr,
    } = await userSb.auth.getUser();
    if (userErr || !user) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = supabaseAdmin();

    const { data: planRow, error: planErr } = await admin
      .from("subscription_plans")
      .select("name, price_monthly")
      .eq("name", planName)
      .maybeSingle();

    if (planErr || !planRow) {
      return jsonResponse({ error: "Unknown subscription plan" }, { status: 400 });
    }

    const price = Number(planRow.price_monthly);
    if (!Number.isFinite(price) || price <= 0) {
      return jsonResponse({ error: "Plan has no payable amount" }, { status: 400 });
    }

    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profErr) {
      console.error("[chapa-initialize] profile", profErr);
      return jsonResponse({ error: "Could not load profile" }, { status: 500 });
    }

    const email = profile?.email || user.email || "";
    if (!email) {
      return jsonResponse({ error: "User email required for checkout" }, { status: 400 });
    }

    const { first, last } = splitName(profile?.full_name ?? "");

    const txRef = `ihub_${user.id.slice(0, 8)}_${Date.now()}_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;

    const callbackUrl = `${supabaseUrl}/functions/v1/chapa-verify`;
    const defaultReturn = Deno.env.get("CHAPA_RETURN_URL") ?? "";
    const returnUrl = (body.return_url ?? defaultReturn) || undefined;

    const initPayload = {
      amount: price.toFixed(2),
      currency: "ETB",
      email,
      first_name: first,
      last_name: last,
      tx_ref: txRef,
      callback_url: callbackUrl,
      ...(returnUrl ? { return_url: returnUrl } : {}),
    };

    const { data: payment, error: payInsErr } = await admin
      .from("payments")
      .insert({
        user_id: user.id,
        amount: price,
        currency: "ETB",
        status: "pending",
        transaction_ref: txRef,
        payment_method: "chapa",
        raw_payload: {
          plan: planName,
          initiated_via: "chapa-initialize",
        },
      })
      .select("id")
      .single();

    if (payInsErr || !payment) {
      console.error("[chapa-initialize] payment insert", payInsErr);
      return jsonResponse({ error: "Could not create payment record" }, { status: 500 });
    }

    try {
      const { checkout_url, raw } = await chapaInitialize(chapaSecret, initPayload);
      const mergedPayload = {
        plan: planName,
        initiated_via: "chapa-initialize",
        chapa_initialize: raw,
      };
      await admin
        .from("payments")
        .update({ raw_payload: mergedPayload })
        .eq("id", payment.id);

      return jsonResponse({
        checkout_url,
        tx_ref: txRef,
        payment_id: payment.id,
      });
    } catch (e) {
      await admin.from("payments").delete().eq("id", payment.id);
      console.error("[chapa-initialize] Chapa error", e);
      return jsonResponse(
        { error: e instanceof Error ? e.message : "Chapa initialization failed" },
        { status: 502 },
      );
    }
  } catch (e) {
    console.error("[chapa-initialize]", e);
    return jsonResponse({ error: "Internal error" }, { status: 500 });
  }
});
