/**
 * Chapa REST helpers — secret key used only in edge functions (never in the browser).
 */
const CHAPA_INIT_URL = "https://api.chapa.co/v1/transaction/initialize";
const CHAPA_VERIFY_BASE = "https://api.chapa.co/v1/transaction/verify";

export interface ChapaInitializePayload {
  amount: string;
  currency: string;
  email: string;
  tx_ref: string;
  callback_url?: string;
  return_url?: string;
  first_name?: string;
  last_name?: string;
}

export async function chapaInitialize(
  secretKey: string,
  body: ChapaInitializePayload,
): Promise<{ checkout_url: string; raw: unknown }> {
  const res = await fetch(CHAPA_INIT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof (raw as { message?: string })?.message === "string"
        ? (raw as { message: string }).message
        : `Chapa initialize failed (${res.status})`,
    );
  }

  const root = raw as {
    status?: string;
    data?: { checkout_url?: string };
    message?: string;
  };
  const url = root.data?.checkout_url;
  if (root.status !== "success" || !url) {
    throw new Error(root.message ?? "Chapa initialize: missing checkout_url");
  }
  return { checkout_url: url, raw };
}

export async function chapaVerifyTx(
  secretKey: string,
  txRef: string,
): Promise<{ ok: boolean; status?: string; amount?: string; currency?: string; raw: unknown }> {
  const enc = encodeURIComponent(txRef);
  const res = await fetch(`${CHAPA_VERIFY_BASE}/${enc}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      Accept: "application/json",
    },
  });

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, raw };
  }

  const root = raw as {
    status?: string;
    data?: { status?: string; amount?: string; currency?: string };
  };
  const payStatus = (root.data?.status ?? "").toLowerCase();
  const apiOk = root.status === "success" && payStatus === "success";

  return {
    ok: apiOk,
    status: payStatus,
    amount: root.data?.amount,
    currency: root.data?.currency,
    raw,
  };
}
