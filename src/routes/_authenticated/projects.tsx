import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  House,
  LogOut,
  Calendar,
  Wallet,
  Briefcase,
  Palette,
  Hash,
  UserCircle2,
  Loader2,
  X,
  Send,
  Upload,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Consultation = {
  id: string;
  reference_number: string;
  project_type: string;
  service_type: string;
  consultation_datetime: string;
  project_budget: string;
  status: string;
  assigned_designer: string | null;
  client_name: string;
  project_description: string | null;
  inspiration_images: { name: string; dataUrl?: string }[];
  property_location: string;
};

type Message = {
  id: string;
  consultation_id: string;
  sender_role: "client" | "designer";
  sender_id: string | null;
  body: string;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({
    meta: [
      { title: "My Projects | Spectra Interior Designing" },
      { name: "description", content: "View and manage your Spectra Interior consultations." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjectsPage,
});

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  confirmed: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-rose-100 text-rose-900",
  completed: "bg-sky-100 text-sky-900",
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function formatDT(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ProjectsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Consultation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Consultation | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  const load = async () => {
    const { data, error: err } = await supabase
      .from("consultations")
      .select("*")
      .order("consultation_datetime", { ascending: false });
    if (err) {
      setError(err.message);
      return;
    }
    setItems((data ?? []) as unknown as Consultation[]);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? "");
    });
    load();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-gold/10 text-gold">
              <House size={18} strokeWidth={1.75} />
            </span>
            <span className="font-display text-xl text-foreground">
              Spectra <span className="text-gold font-light">Interior</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden sm:inline text-xs text-muted-foreground">{userEmail}</span>
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
            >
              <ArrowLeft size={14} /> Site
            </Link>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold">Client Portal</p>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl text-foreground">My Projects</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage your consultations and stay in touch with your designer.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-md bg-gold px-4 py-2.5 text-sm font-semibold text-charcoal hover:bg-gold-light"
          >
            <Plus size={16} /> Book new consultation
          </Link>
        </div>

        {error && (
          <p className="mt-6 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        {items === null ? (
          <div className="mt-16 flex justify-center">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center">
            <p className="font-display text-xl text-foreground">No consultations yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Book your first free consultation from the homepage to get started.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm text-primary-foreground hover:opacity-90"
            >
              Book a consultation
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c)}
                className="text-left rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <Hash size={12} /> {c.reference_number}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      STATUS_STYLES[c.status] ?? "bg-muted text-foreground"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-lg text-foreground">{c.project_type}</h3>
                <p className="text-sm text-muted-foreground">{c.service_type}</p>

                <dl className="mt-4 space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-foreground/80">
                    <Calendar size={14} className="text-gold" />
                    {formatDT(c.consultation_datetime)}
                  </div>
                  <div className="flex items-center gap-2 text-foreground/80">
                    <Wallet size={14} className="text-gold" /> {c.project_budget}
                  </div>
                  <div className="flex items-center gap-2 text-foreground/80">
                    <UserCircle2 size={14} className="text-gold" />
                    {c.assigned_designer ?? <span className="text-muted-foreground">Designer to be assigned</span>}
                  </div>
                </dl>
              </button>
            ))}
          </div>
        )}
      </main>

      {active && (
        <ConsultationDrawer
          consultation={active}
          onClose={() => setActive(null)}
          onUpdated={async () => {
            await load();
            // refresh active view from latest data
            const { data } = await supabase.from("consultations").select("*").eq("id", active.id).maybeSingle();
            if (data) setActive(data as unknown as Consultation);
          }}
        />
      )}
    </div>
  );
}

function ConsultationDrawer({
  consultation,
  onClose,
  onUpdated,
}: {
  consultation: Consultation;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}) {
  const [tab, setTab] = useState<"overview" | "messages">("overview");
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState(consultation.consultation_datetime.slice(0, 10));
  const [newTime, setNewTime] = useState(
    new Date(consultation.consultation_datetime).toISOString().slice(11, 16),
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const isCancelled = consultation.status === "cancelled";

  async function saveReschedule() {
    setBusy("resched");
    setErr(null);
    try {
      const iso = new Date(`${newDate}T${newTime}:00`).toISOString();
      const { error } = await supabase
        .from("consultations")
        .update({ consultation_datetime: iso, status: "pending" })
        .eq("id", consultation.id);
      if (error) throw error;
      setRescheduling(false);
      await onUpdated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to reschedule.");
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    if (!confirm("Cancel this consultation?")) return;
    setBusy("cancel");
    setErr(null);
    try {
      const { error } = await supabase
        .from("consultations")
        .update({ status: "cancelled" })
        .eq("id", consultation.id);
      if (error) throw error;
      await onUpdated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to cancel.");
    } finally {
      setBusy(null);
    }
  }

  async function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy("upload");
    setErr(null);
    try {
      const additions: { name: string; dataUrl: string }[] = [];
      for (const f of files) {
        if (!f.type.startsWith("image/")) continue;
        if (f.size > MAX_IMAGE_BYTES) {
          setErr(`${f.name} is larger than 5MB and was skipped.`);
          continue;
        }
        const dataUrl = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result));
          r.onerror = () => rej(new Error("read failed"));
          r.readAsDataURL(f);
        });
        additions.push({ name: f.name, dataUrl });
      }
      const merged = [...(consultation.inspiration_images ?? []), ...additions];
      const { error } = await supabase
        .from("consultations")
        .update({ inspiration_images: merged })
        .eq("id", consultation.id);
      if (error) throw error;
      await onUpdated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-charcoal/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex max-h-[100dvh] sm:max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border px-5 sm:px-8 py-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold">{consultation.reference_number}</p>
            <h2 className="mt-1 font-display text-xl sm:text-2xl text-foreground truncate">
              {consultation.project_type}
            </h2>
            <p className="text-sm text-muted-foreground">{consultation.service_type}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-2 text-muted-foreground hover:bg-muted">
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-border px-5 sm:px-8">
          <div className="flex gap-4">
            {(["overview", "messages"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`py-3 text-sm border-b-2 transition-colors ${
                  tab === t
                    ? "border-gold text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "overview" ? "Overview" : "Messages"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6">
          {err && (
            <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>
          )}

          {tab === "overview" ? (
            <div className="space-y-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Info icon={Hash} label="Reference" value={consultation.reference_number} />
                <Info
                  icon={Calendar}
                  label="Scheduled"
                  value={formatDT(consultation.consultation_datetime)}
                />
                <Info icon={Briefcase} label="Project" value={consultation.project_type} />
                <Info icon={Palette} label="Service" value={consultation.service_type} />
                <Info icon={Wallet} label="Budget" value={consultation.project_budget} />
                <Info
                  icon={UserCircle2}
                  label="Assigned Designer"
                  value={consultation.assigned_designer ?? "To be assigned"}
                />
                <Info icon={House} label="Property" value={consultation.property_location} />
                <Info
                  icon={Hash}
                  label="Status"
                  value={
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        STATUS_STYLES[consultation.status] ?? "bg-muted text-foreground"
                      }`}
                    >
                      {consultation.status}
                    </span>
                  }
                />
              </dl>

              {consultation.project_description && (
                <div>
                  <p className="text-xs font-medium text-foreground/60 uppercase tracking-wide">Description</p>
                  <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap">
                    {consultation.project_description}
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground/60 uppercase tracking-wide">
                    Inspiration ({consultation.inspiration_images?.length ?? 0})
                  </p>
                  {!isCancelled && (
                    <>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={onFilePick}
                      />
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={busy === "upload"}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-60"
                      >
                        {busy === "upload" ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Upload size={12} />
                        )}
                        Add images
                      </button>
                    </>
                  )}
                </div>
                {consultation.inspiration_images?.length ? (
                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {consultation.inspiration_images.map((img, i) =>
                      img.dataUrl ? (
                        <img
                          key={i}
                          src={img.dataUrl}
                          alt={img.name}
                          className="aspect-square w-full rounded-md object-cover border border-border"
                        />
                      ) : (
                        <div
                          key={i}
                          className="flex aspect-square items-center justify-center rounded-md border border-dashed border-border p-2 text-center text-[10px] text-muted-foreground"
                        >
                          {img.name}
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">No inspiration images yet.</p>
                )}
              </div>

              {!isCancelled && (
                <div className="border-t border-border pt-6">
                  {rescheduling ? (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-foreground">Reschedule consultation</p>
                      <div className="flex flex-wrap gap-3">
                        <input
                          type="date"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          min={new Date().toISOString().slice(0, 10)}
                          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                        />
                        <input
                          type="time"
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                          min="09:00"
                          max="20:00"
                          step={1800}
                          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={saveReschedule}
                          disabled={busy === "resched"}
                          className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-70"
                        >
                          {busy === "resched" && <Loader2 size={14} className="animate-spin" />}
                          Save
                        </button>
                        <button
                          onClick={() => setRescheduling(false)}
                          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setRescheduling(true)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
                      >
                        <Calendar size={14} /> Reschedule
                      </button>
                      <button
                        onClick={cancel}
                        disabled={busy === "cancel"}
                        className="inline-flex items-center gap-1 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-60"
                      >
                        {busy === "cancel" && <Loader2 size={14} className="animate-spin" />}
                        Cancel consultation
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <MessagesPanel consultationId={consultation.id} designer={consultation.assigned_designer} />
          )}
        </div>
      </div>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof House;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon size={12} className="text-gold" />
        {label}
      </div>
      <div className="mt-1 text-sm text-foreground">{value}</div>
    </div>
  );
}

function MessagesPanel({ consultationId, designer }: { consultationId: string; designer: string | null }) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const load = useMemo(
    () => async () => {
      const { data, error } = await supabase
        .from("consultation_messages")
        .select("*")
        .eq("consultation_id", consultationId)
        .order("created_at", { ascending: true });
      if (error) {
        setErr(error.message);
        return;
      }
      setMessages((data ?? []) as unknown as Message[]);
    },
    [consultationId],
  );

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`msgs:${consultationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "consultation_messages", filter: `consultation_id=eq.${consultationId}` },
        (payload) => {
          setMessages((prev) => (prev ? [...prev, payload.new as Message] : [payload.new as Message]));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [consultationId, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSending(true);
    setErr(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in.");
      const { error } = await supabase.from("consultation_messages").insert({
        consultation_id: consultationId,
        sender_id: userData.user.id,
        sender_role: "client",
        body: text,
      });
      if (error) throw error;
      setBody("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to send.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-[400px] flex-col">
      <p className="text-xs text-muted-foreground">
        {designer
          ? `Chatting with ${designer}. Messages appear here in real time.`
          : "A designer will be assigned soon. Your messages will be shared with them."}
      </p>

      {err && (
        <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>
      )}

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-lg border border-border bg-muted/20 p-4">
        {messages === null ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" size={18} /></div>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No messages yet. Say hello!</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender_role === "client" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  m.sender_role === "client"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-background border border-border text-foreground rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className={`mt-1 text-[10px] ${m.sender_role === "client" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {new Date(m.created_at).toLocaleString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          placeholder="Message your designer…"
          className="flex-1 rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Send
        </button>
      </form>
    </div>
  );
}
