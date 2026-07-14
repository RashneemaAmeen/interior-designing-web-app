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
          .select("id, reference_number, project_type, service_type, consultation_datetime, client_name, client_email, client_phone, property_location, project_budget, project_description, status, payment_status, deposit_amount, deposit_currency, confirmation_email_sent_at")
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

        // Send confirmation email (once) — failures never affect payment/confirmation
        if (paid && !consultation.confirmation_email_sent_at) {
          const resendKey = process.env.RESEND_API_KEY;
          if (resendKey) {
            try {
              const dt = new Date(consultation.consultation_datetime as string);
              const dateStr = dt.toLocaleString("en-AE", {
                dateStyle: "full",
                timeStyle: "short",
                timeZone: "Asia/Dubai",
              });
              const deposit = `${consultation.deposit_currency?.toUpperCase() ?? "AED"} ${
                consultation.deposit_amount ?? 500
              }`;
              const html = `
                <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#2a2a2a">
                  <h1 style="color:#1a1a1a;border-bottom:2px solid #c9a961;padding-bottom:12px">Your Interior Design Consultation is Confirmed</h1>
                  <p>Dear ${escapeHtml(consultation.client_name ?? "")},</p>
                  <p>Thank you for booking with Spectra Interior. Your consultation has been confirmed. Details below:</p>
                  <table style="width:100%;border-collapse:collapse;margin:20px 0">
                    <tbody>
                      ${row("Reference", consultation.reference_number)}
                      ${row("Project Type", consultation.project_type)}
                      ${row("Service", consultation.service_type)}
                      ${row("Date & Time", dateStr)}
                      ${row("Property Location", consultation.property_location)}
                      ${row("Project Budget", consultation.project_budget)}
                      ${row("Deposit Paid", deposit)}
                    </tbody>
                  </table>
                  <h3 style="color:#c9a961">Our Office</h3>
                  <p>Warehouse 01, Warsan 1 St, behind Dubai Textile City, Warsan First,<br/>Dubai International City, Dubai, UAE</p>
                  <h3 style="color:#c9a961">Designer Contact</h3>
                  <p>Phone / WhatsApp: +971 55 135 9965<br/>Email: contact@spectrainterior.ae</p>
                  <p>We look forward to designing something beautiful with you.</p>
                  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
                  <p style="color:#888;font-size:13px;text-align:center">
                    <strong>Spectra Interior</strong><br/>
                    Luxury Interior Design • Dubai<br/>
                    Built with Lovable + Supabase
                  </p>
                </div>
              `;
              const emailRes = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${resendKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: "Spectra Interior <onboarding@resend.dev>",
                  to: ["rashneema@gmail.com"],
                  subject: "Your Interior Design Consultation is Confirmed",
                  html,
                }),
              });
              if (emailRes.ok) {
                await supabaseAdmin
                  .from("consultations")
                  .update({ confirmation_email_sent_at: new Date().toISOString() })
                  .eq("id", consultation.id);
              } else {
                console.error("Resend send failed:", emailRes.status, await emailRes.text());
              }
            } catch (err) {
              console.error("Resend send error:", err);
            }
          } else {
            console.error("RESEND_API_KEY not configured");
          }
        }

        // Only expose PII once payment is confirmed. Before that, return a minimal
        // envelope so a leaked session id can't be used to dump client details.
        const safeConsultation = paid
          ? consultation
          : {
              reference_number: consultation.reference_number,
              status: consultation.status,
              payment_status: consultation.payment_status,
            };

        return Response.json({
          paid,
          consultation: safeConsultation,
          amount_total: paid ? session.amount_total : null,
          currency: paid ? session.currency : null,
        });
      },
    },
  },
});

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function row(label: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  return `<tr>
    <td style="padding:8px 12px;background:#faf7f2;border:1px solid #eee;font-weight:600;width:40%">${label}</td>
    <td style="padding:8px 12px;border:1px solid #eee">${escapeHtml(String(value))}</td>
  </tr>`;
}
