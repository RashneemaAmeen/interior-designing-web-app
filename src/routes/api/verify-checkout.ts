import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_ORIGIN_SUFFIXES = [".lovable.app", ".lovableproject.com"];

function originAllowed(request: Request): boolean {
  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  if (!origin) return false;
  try {
    const host = new URL(origin).hostname;
    if (host === "localhost" || host === "127.0.0.1") return true;
    return ALLOWED_ORIGIN_SUFFIXES.some((s) => host.endsWith(s));
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/verify-checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!originAllowed(request)) return Response.json({ error: "Forbidden" }, { status: 403 });

        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) return Response.json({ error: "Stripe not configured" }, { status: 500 });

        let session_id: string | undefined;
        try {
          const body = (await request.json()) as { session_id?: string };
          session_id = body.session_id;
        } catch {
          return Response.json({ error: "Invalid body" }, { status: 400 });
        }
        if (!session_id || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(session_id)) {
          return Response.json({ error: "Invalid session id" }, { status: 400 });
        }

        const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session_id}`, {
          headers: { Authorization: `Bearer ${stripeKey}` },
        });
        const session = (await stripeRes.json()) as {
          id?: string;
          payment_status?: string;
          status?: string;
          amount_total?: number;
          currency?: string;
          client_reference_id?: string;
        };
        if (!stripeRes.ok || !session.id) {
          return Response.json({ error: "Could not verify session" }, { status: 502 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: consultation } = await supabaseAdmin
          .from("consultations")
          .select("id, reference_number, project_type, service_type, consultation_datetime, client_name, client_email, client_phone, property_location, project_budget, project_description, status, payment_status, deposit_amount, deposit_currency")
          .eq("stripe_session_id", session.id)
          .maybeSingle();

        if (!consultation) return Response.json({ error: "Consultation not found" }, { status: 404 });

        const paid = session.payment_status === "paid";
        if (paid && consultation.payment_status !== "paid") {
          await supabaseAdmin
            .from("consultations")
            .update({ payment_status: "paid", status: "confirmed" })
            .eq("id", consultation.id);
          consultation.payment_status = "paid";
          consultation.status = "confirmed";
        }

        return Response.json({
          paid,
          consultation,
          amount_total: session.amount_total,
          currency: session.currency,
        });
      },
    },
  },
});
