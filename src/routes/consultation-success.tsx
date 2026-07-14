import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Copy, Loader2, ArrowLeft } from "lucide-react";

type Consultation = {
  reference_number: string;
  project_type: string;
  service_type: string;
  consultation_datetime: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  property_location: string;
  project_budget: string | null;
  project_description: string | null;
  status: string;
  payment_status: string;
};

type VerifyResponse = {
  paid: boolean;
  consultation: Consultation;
  amount_total: number;
  currency: string;
  error?: string;
};

export const Route = createFileRoute("/consultation-success")({
  validateSearch: (s: Record<string, unknown>) => ({
    session_id: typeof s.session_id === "string" ? s.session_id : "",
  }),
  head: () => ({
    meta: [
      { title: "Consultation Confirmed | Spectra Interior" },
      { name: "description", content: "Your consultation with Spectra Interior is confirmed." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { session_id } = Route.useSearch();
  const [state, setState] = useState<"loading" | "ok" | "unpaid" | "error">("loading");
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!session_id) {
      setState("error");
      return;
    }
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/verify-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id }),
        });
        const json = (await res.json()) as VerifyResponse;
        if (!alive) return;
        if (!res.ok || !json.consultation) {
          setState("error");
          return;
        }
        setData(json);
        setState(json.paid ? "ok" : "unpaid");
      } catch {
        if (alive) setState("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [session_id]);

  function copyRef() {
    if (!data) return;
    navigator.clipboard.writeText(data.consultation.reference_number).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-background py-16 px-4 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft size={16} /> Back to home
        </Link>

        {state === "loading" && (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold" />
            <p className="mt-4 text-muted-foreground">Verifying your payment…</p>
          </div>
        )}

        {state === "error" && (
          <div className="rounded-2xl border border-destructive/40 bg-card p-8 text-center">
            <h1 className="font-display text-2xl text-foreground">Something went wrong</h1>
            <p className="mt-2 text-muted-foreground">
              We couldn't verify your payment. If you were charged, please contact us at{" "}
              <a className="text-gold underline" href="mailto:contact@spectrainterior.ae">contact@spectrainterior.ae</a>.
            </p>
          </div>
        )}

        {state === "unpaid" && data && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <h1 className="font-display text-2xl text-foreground">Payment not completed</h1>
            <p className="mt-2 text-muted-foreground">
              Your consultation <span className="font-mono">{data.consultation.reference_number}</span> is saved but the deposit was not received. Please try again from the booking form.
            </p>
          </div>
        )}

        {state === "ok" && data && (
          <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
            <div className="bg-gradient-to-br from-gold/10 to-transparent px-8 py-10 text-center border-b border-border">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold text-charcoal">
                <Check size={32} strokeWidth={3} />
              </div>
              <p className="mt-4 text-[11px] uppercase tracking-[0.3em] text-gold">Spectra Interior</p>
              <h1 className="mt-2 font-display text-3xl text-foreground">Consultation Confirmed</h1>
              <p className="mt-2 text-muted-foreground">
                Thank you, {data.consultation.client_name}. Your AED 500 deposit was received.
              </p>
            </div>

            <div className="px-8 py-6 border-b border-border">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Reference Number</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="font-mono text-xl text-foreground">{data.consultation.reference_number}</span>
                <button
                  type="button"
                  onClick={copyRef}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 px-8 py-6 text-sm">
              <Field label="Project Type" value={data.consultation.project_type} />
              <Field label="Service" value={data.consultation.service_type} />
              <Field
                label="Date & Time"
                value={new Date(data.consultation.consultation_datetime).toLocaleString("en-GB", {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              />
              <Field label="Budget" value={data.consultation.project_budget ?? "—"} />
              <Field label="Phone" value={data.consultation.client_phone} />
              <Field label="Email" value={data.consultation.client_email} />
              <Field label="Location" value={data.consultation.property_location} className="sm:col-span-2" />
              {data.consultation.project_description && (
                <Field label="Description" value={data.consultation.project_description} className="sm:col-span-2" />
              )}
              <Field
                label="Deposit Paid"
                value={`${(data.amount_total / 100).toFixed(2)} ${(data.currency || "aed").toUpperCase()}`}
              />
              <Field label="Status" value="Confirmed" />
            </dl>

            <div className="bg-muted/30 px-8 py-6 text-sm text-muted-foreground">
              A confirmation email will be sent shortly. Our design team will contact you within one business day to finalize the details.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-foreground">{value}</dd>
    </div>
  );
}
