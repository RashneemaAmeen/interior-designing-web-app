import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_ORIGIN_SUFFIXES = [".lovable.app", ".lovableproject.com"];

function getOrigin(request: Request): string | null {
  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  if (!origin) return null;
  try {
    const u = new URL(origin);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return u.origin;
    if (ALLOWED_ORIGIN_SUFFIXES.some((s) => u.hostname.endsWith(s))) return u.origin;
    return null;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/create-checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const origin = getOrigin(request);
        if (!origin) return Response.json({ error: "Forbidden" }, { status: 403 });

        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) return Response.json({ error: "Stripe not configured" }, { status: 500 });

        let reference_number: string | undefined;
        let client_email: string | undefined;
        try {
          const body = (await request.json()) as { reference_number?: string; client_email?: string };
          reference_number = body.reference_number;
          client_email = body.client_email;
        } catch {
          return Response.json({ error: "Invalid body" }, { status: 400 });
        }
        if (!reference_number || !/^SPC-\d{8}-[A-Z0-9]{4,10}$/.test(reference_number)) {
          return Response.json({ error: "Invalid reference" }, { status: 400 });
        }
        if (!client_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client_email) || client_email.length > 254) {
          return Response.json({ error: "Invalid email" }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: consultation, error: fetchErr } = await supabaseAdmin
          .from("consultations")
          .select("id, reference_number, client_email, client_name, deposit_amount, deposit_currency, payment_status, project_type, service_type")
          .eq("reference_number", reference_number)
          .maybeSingle();

        if (fetchErr || !consultation) {
          return Response.json({ error: "Consultation not found" }, { status: 404 });
        }
        // Ownership check: caller must supply the email tied to the reference
        if ((consultation.client_email ?? "").toLowerCase() !== client_email.trim().toLowerCase()) {
          return Response.json({ error: "Consultation not found" }, { status: 404 });
        }
        if (consultation.payment_status === "paid") {
          return Response.json({ error: "Already paid" }, { status: 400 });
        }

        const amount = consultation.deposit_amount ?? 50000;
        const currency = (consultation.deposit_currency ?? "aed").toLowerCase();
        const productName = `Consultation Deposit — ${consultation.project_type} / ${consultation.service_type}`;

        const params = new URLSearchParams();
        params.append("mode", "payment");
        params.append("success_url", `${origin}/consultation-success?session_id={CHECKOUT_SESSION_ID}`);
        params.append("cancel_url", `${origin}/?booking=cancelled&ref=${encodeURIComponent(reference_number)}`);
        params.append("customer_email", consultation.client_email);
        params.append("client_reference_id", reference_number);
        params.append("metadata[reference_number]", reference_number);
        params.append("metadata[consultation_id]", consultation.id);
        params.append("line_items[0][quantity]", "1");
        params.append("line_items[0][price_data][currency]", currency);
        params.append("line_items[0][price_data][unit_amount]", String(amount));
        params.append("line_items[0][price_data][product_data][name]", productName);
        params.append("line_items[0][price_data][product_data][description]",
          `Refundable AED 500 deposit for Spectra Interior consultation ${reference_number}`);
        params.append("payment_intent_data[metadata][reference_number]", reference_number);

        const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${stripeKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });

        const session = (await stripeRes.json()) as { id?: string; url?: string; error?: { message?: string } };
        if (!stripeRes.ok || !session.url || !session.id) {
          console.error("[create-checkout] stripe error", session.error);
          return Response.json({ error: "Payment provider error" }, { status: 502 });
        }

        await supabaseAdmin
          .from("consultations")
          .update({ stripe_session_id: session.id, payment_status: "pending" })
          .eq("id", consultation.id);

        return Response.json({ url: session.url, session_id: session.id });
      },
    },
  },
});
