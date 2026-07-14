import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Home,
  Building2,
  Briefcase,
  Sofa,
  ChefHat,
  BedDouble,
  Tv,
  Palette,
  Hammer,
  Layers,
  Box,
  Armchair,
  KeyRound,
  Calendar,
  Upload,
  Loader2,
  Copy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PROJECT_TYPES = [
  { label: "Residential Interior", icon: Home },
  { label: "Commercial Interior", icon: Building2 },
  { label: "Office Design", icon: Briefcase },
  { label: "Villa Design", icon: Sofa },
  { label: "Kitchen Design", icon: ChefHat },
  { label: "Bedroom Design", icon: BedDouble },
  { label: "Living Room Design", icon: Tv },
] as const;

const SERVICES = [
  { label: "Interior Design", icon: Palette },
  { label: "Renovation", icon: Hammer },
  { label: "Space Planning", icon: Layers },
  { label: "3D Visualization", icon: Box },
  { label: "Custom Furniture", icon: Armchair },
  { label: "Turnkey Project", icon: KeyRound },
] as const;

const BUDGETS = [
  "Under AED 25,000",
  "AED 25,000 – 75,000",
  "AED 75,000 – 150,000",
  "AED 150,000 – 300,000",
  "AED 300,000+",
];

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 9; h <= 20; h++) {
    for (const m of [0, 30]) {
      if (h === 20 && m === 30) break;
      const hh = ((h + 11) % 12) + 1;
      const ampm = h < 12 ? "AM" : "PM";
      slots.push(`${hh}:${m === 0 ? "00" : "30"} ${ampm}`);
    }
  }
  return slots;
}
const TIME_SLOTS = generateTimeSlots();

function todayISO(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function to24h(slot: string): string {
  // "9:30 AM" -> "09:30"
  const m = slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return "09:00";
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}

function generateReference(): string {
  const d = new Date();
  const ymd =
    String(d.getFullYear()) +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SPC-${ymd}-${rand}`;
}

type Details = {
  name: string;
  phone: string;
  email: string;
  location: string;
  budget: string;
};

type InspirationImage = { name: string; dataUrl: string };

export function BookingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [projectType, setProjectType] = useState<string>("");
  const [service, setService] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [details, setDetails] = useState<Details>({
    name: "",
    phone: "",
    email: "",
    location: "",
    budget: "",
  });
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<InspirationImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  function resetAll() {
    setStep(1);
    setProjectType("");
    setService("");
    setDate("");
    setTime("");
    setDetails({ name: "", phone: "", email: "", location: "", budget: "" });
    setDescription("");
    setImages([]);
    setError(null);
    setConfirmed(false);
    setSubmitting(false);
    setReference("");
  }

  function handleClose() {
    onClose();
    // small delay to let animation finish before reset
    setTimeout(resetAll, 200);
  }

  async function onImagePick(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = MAX_IMAGES - images.length;
    const picked = files.slice(0, remaining);
    const next: InspirationImage[] = [];
    for (const f of picked) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > MAX_IMAGE_BYTES) {
        setError(`${f.name} is larger than 5MB and was skipped.`);
        continue;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(f);
      });
      next.push({ name: f.name, dataUrl });
    }
    setImages((prev) => [...prev, ...next]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function next() {
    setError(null);
    if (step === 1 && !projectType) return setError("Please select a project type.");
    if (step === 2 && !service) return setError("Please select a service.");
    if (step === 3) {
      if (!date) return setError("Please choose a date.");
      if (!time) return setError("Please choose a time slot.");
    }
    if (step === 4) {
      const { name, phone, email, location, budget } = details;
      if (!name.trim()) return setError("Please enter your full name.");
      if (!/^[+()\-\s0-9]{7,}$/.test(phone)) return setError("Please enter a valid phone number.");
      if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");
      if (!location.trim()) return setError("Please enter your property location.");
      if (!budget) return setError("Please select an approximate budget.");
    }
    setStep((s) => Math.min(6, s + 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const ref = generateReference();
      const dt = new Date(`${date}T${to24h(time)}:00`).toISOString();
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      const { error: insertError } = await supabase
        .from("consultations")
        .insert({
          reference_number: ref,
          project_type: projectType,
          service_type: service,
          consultation_datetime: dt,
          client_name: details.name.trim(),
          client_phone: details.phone.trim(),
          client_email: details.email.trim(),
          property_location: details.location.trim(),
          project_budget: details.budget,
          project_description: description.trim() || null,
          inspiration_images: images.map((i) => ({ name: i.name })),
          status: "pending",
          user_id: uid,
        });
      if (insertError) throw insertError;

      // Create Stripe Checkout session and redirect
      const checkoutRes = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference_number: ref }),
      });
      const checkoutJson = (await checkoutRes.json()) as { url?: string; error?: string };
      if (!checkoutRes.ok || !checkoutJson.url) {
        throw new Error(checkoutJson.error || "Could not start payment");
      }
      window.location.href = checkoutJson.url;
    } catch (err) {
      console.error("[booking] submit failed:", err);
      setError(
        err instanceof Error
          ? `Could not proceed to payment: ${err.message}`
          : "Could not proceed to payment. Please try again.",
      );
      setSubmitting(false);
    }
  }


  if (!open) return null;

  const stepLabels = ["Project", "Service", "Date & Time", "Details", "Description", "Review"];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-charcoal/70 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-title"
      onClick={handleClose}
    >
      <div
        className="relative flex max-h-[100dvh] sm:max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 sm:px-8 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold">Spectra Interior</p>
            <h2 id="booking-title" className="font-display text-xl sm:text-2xl text-foreground">
              {confirmed ? "Consultation Confirmed" : "Book a Free Consultation"}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stepper */}
        {!confirmed && (
          <div className="hidden sm:flex items-center gap-2 border-b border-border px-8 py-3 bg-muted/30">
            {stepLabels.map((label, i) => {
              const idx = i + 1;
              const active = step === idx;
              const done = step > idx;
              return (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                      done
                        ? "bg-gold text-charcoal"
                        : active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {done ? <Check size={12} /> : idx}
                  </div>
                  <span
                    className={`text-xs ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}
                  >
                    {label}
                  </span>
                  {idx < stepLabels.length && <span className="mx-1 h-px w-4 bg-border" />}
                </div>
              );
            })}
          </div>
        )}
        {!confirmed && (
          <div className="sm:hidden border-b border-border px-5 py-2 text-xs text-muted-foreground bg-muted/30">
            Step {step} of 6 · <span className="text-foreground font-medium">{stepLabels[step - 1]}</span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6">
          {confirmed ? (
            <ConfirmedView
              reference={reference}
              projectType={projectType}
              service={service}
              date={date}
              time={time}
              details={details}
              description={description}
              images={images}
              onClose={handleClose}
            />
          ) : (
            <>
              {step === 1 && (
                <StepGrid
                  title="What type of project is it?"
                  subtitle="Select the space you'd like us to design."
                  options={PROJECT_TYPES}
                  value={projectType}
                  onChange={setProjectType}
                />
              )}
              {step === 2 && (
                <StepGrid
                  title="Which service do you need?"
                  subtitle="Choose the type of work that fits your goals."
                  options={SERVICES}
                  value={service}
                  onChange={setService}
                />
              )}
              {step === 3 && (
                <StepDateTime
                  date={date}
                  time={time}
                  onDate={setDate}
                  onTime={setTime}
                />
              )}
              {step === 4 && (
                <StepDetails details={details} onChange={setDetails} />
              )}
              {step === 5 && (
                <StepDescription
                  description={description}
                  onDescription={setDescription}
                  images={images}
                  onImagePick={onImagePick}
                  onRemoveImage={removeImage}
                  fileInputRef={fileInputRef}
                />
              )}
              {step === 6 && (
                <StepReview
                  projectType={projectType}
                  service={service}
                  date={date}
                  time={time}
                  details={details}
                  description={description}
                  images={images}
                  onEdit={(s) => setStep(s)}
                />
              )}

              {error && (
                <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!confirmed && (
          <div className="flex items-center justify-between gap-3 border-t border-border bg-background px-5 sm:px-8 py-4">
            <button
              type="button"
              onClick={back}
              disabled={step === 1}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Back
            </button>
            {step < 6 ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Continue
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-charcoal shadow-lg shadow-gold/20 transition-all hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Redirecting to payment…
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Pay AED 500 & Confirm
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------- Sub-views -------------------- */

type IconType = typeof Home;

function StepGrid({
  title,
  subtitle,
  options,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  options: readonly { label: string; icon: IconType }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <h3 className="font-display text-lg text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {options.map(({ label, icon: Icon }) => {
          const selected = value === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onChange(label)}
              className={`group flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                selected
                  ? "border-gold bg-gold/10 shadow-sm"
                  : "border-border bg-background hover:border-gold/60 hover:bg-muted/40"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-md ${
                  selected ? "bg-gold text-charcoal" : "bg-muted text-foreground/80"
                }`}
              >
                <Icon size={18} />
              </span>
              <span className="text-sm font-medium text-foreground">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepDateTime({
  date,
  time,
  onDate,
  onTime,
}: {
  date: string;
  time: string;
  onDate: (v: string) => void;
  onTime: (v: string) => void;
}) {
  const min = todayISO();
  return (
    <div>
      <h3 className="font-display text-lg text-foreground">Pick a date & time</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        We meet clients Mon–Sat, 9:00 AM – 8:00 PM (30-minute slots).
      </p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-foreground">Date</label>
          <div className="relative mt-2">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="date"
              min={min}
              value={date}
              onChange={(e) => onDate(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 pl-9 text-sm text-foreground focus:border-gold focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">Time slot</label>
          <div className="mt-2 grid max-h-52 grid-cols-3 gap-2 overflow-y-auto rounded-md border border-border bg-muted/30 p-2 sm:grid-cols-3">
            {TIME_SLOTS.map((slot) => {
              const selected = time === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onTime(slot)}
                  className={`rounded-md px-2 py-2 text-xs transition-all ${
                    selected
                      ? "bg-gold text-charcoal font-semibold"
                      : "bg-background text-foreground/80 hover:bg-muted"
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepDetails({
  details,
  onChange,
}: {
  details: Details;
  onChange: (d: Details) => void;
}) {
  const set = <K extends keyof Details>(k: K, v: Details[K]) => onChange({ ...details, [k]: v });
  return (
    <div>
      <h3 className="font-display text-lg text-foreground">Your details</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        We'll use this to confirm your consultation.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required>
          <input
            type="text"
            value={details.name}
            onChange={(e) => set("name", e.target.value)}
            maxLength={100}
            className="input-base"
            placeholder="Jane Doe"
          />
        </Field>
        <Field label="Phone number" required>
          <input
            type="tel"
            value={details.phone}
            onChange={(e) => set("phone", e.target.value)}
            maxLength={30}
            className="input-base"
            placeholder="+971 55 123 4567"
          />
        </Field>
        <Field label="Email address" required>
          <input
            type="email"
            value={details.email}
            onChange={(e) => set("email", e.target.value)}
            maxLength={120}
            className="input-base"
            placeholder="jane@example.com"
          />
        </Field>
        <Field label="Property location" required>
          <input
            type="text"
            value={details.location}
            onChange={(e) => set("location", e.target.value)}
            maxLength={160}
            className="input-base"
            placeholder="Downtown Dubai, UAE"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Approximate budget" required>
            <select
              value={details.budget}
              onChange={(e) => set("budget", e.target.value)}
              className="input-base"
            >
              <option value="">Select a range…</option>
              {BUDGETS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>
      <style>{`
        .input-base {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: hsl(var(--foreground));
          outline: none;
        }
        .input-base:focus { border-color: hsl(var(--gold, 40 60% 55%)); }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label} {required && <span className="text-gold">*</span>}
      </span>
      {children}
    </label>
  );
}

function StepDescription({
  description,
  onDescription,
  images,
  onImagePick,
  onRemoveImage,
  fileInputRef,
}: {
  description: string;
  onDescription: (v: string) => void;
  images: InspirationImage[];
  onImagePick: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (i: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div>
      <h3 className="font-display text-lg text-foreground">
        Tell us more <span className="text-sm font-normal text-muted-foreground">(optional)</span>
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Share your vision and any inspiration you've collected.
      </p>

      <label className="mt-6 block text-sm font-medium text-foreground">Project description</label>
      <textarea
        value={description}
        onChange={(e) => onDescription(e.target.value)}
        maxLength={1000}
        rows={5}
        placeholder="Describe your project, style preferences, timeline, must-haves…"
        className="mt-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-gold focus:outline-none"
      />
      <p className="mt-1 text-xs text-muted-foreground">{description.length}/1000</p>

      <label className="mt-6 block text-sm font-medium text-foreground">
        Inspiration images <span className="text-muted-foreground">(up to {MAX_IMAGES}, 5MB each)</span>
      </label>
      <input
        ref={fileInputRef}
        id="inspiration-upload"
        type="file"
        accept="image/*"
        multiple
        onChange={onImagePick}
        className="hidden"
      />
      <label
        htmlFor="inspiration-upload"
        className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-gold/60 hover:text-foreground"
      >
        <Upload className="h-4 w-4" />
        {images.length >= MAX_IMAGES ? "Maximum reached" : "Click to upload inspiration images"}
      </label>

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images.map((img, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-md border border-border">
              <img src={img.dataUrl} alt={img.name} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onRemoveImage(i)}
                className="absolute right-1 top-1 rounded-full bg-charcoal/70 p-1 text-cream opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={`Remove ${img.name}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StepReview({
  projectType,
  service,
  date,
  time,
  details,
  description,
  images,
  onEdit,
}: {
  projectType: string;
  service: string;
  date: string;
  time: string;
  details: Details;
  description: string;
  images: InspirationImage[];
  onEdit: (step: number) => void;
}) {
  const prettyDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";
  return (
    <div>
      <h3 className="font-display text-lg text-foreground">Review your booking</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Check everything looks right, then confirm.
      </p>

      <div className="mt-6 space-y-4">
        <SummaryRow label="Project type" value={projectType} onEdit={() => onEdit(1)} />
        <SummaryRow label="Service" value={service} onEdit={() => onEdit(2)} />
        <SummaryRow
          label="Date & time"
          value={`${prettyDate} · ${time || "—"}`}
          onEdit={() => onEdit(3)}
        />
        <SummaryRow
          label="Client"
          onEdit={() => onEdit(4)}
          value={
            <div className="space-y-0.5 text-sm text-foreground">
              <div className="font-medium">{details.name}</div>
              <div className="text-muted-foreground">{details.phone} · {details.email}</div>
              <div className="text-muted-foreground">{details.location}</div>
              <div className="text-muted-foreground">Budget: {details.budget}</div>
            </div>
          }
        />
        <SummaryRow
          label="Description"
          onEdit={() => onEdit(5)}
          value={
            <div className="space-y-3">
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {description || <span className="text-muted-foreground italic">No description added.</span>}
              </p>
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {images.map((img, i) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-md border border-border">
                      <img src={img.dataUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: React.ReactNode;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/30 p-4">
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
        <div className="mt-1 text-sm font-medium text-foreground">
          {typeof value === "string" ? value || "—" : value}
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 text-xs font-medium text-gold hover:underline"
      >
        Edit
      </button>
    </div>
  );
}

function ConfirmedView({
  reference,
  projectType,
  service,
  date,
  time,
  details,
  description,
  images,
  onClose,
}: {
  reference: string;
  projectType: string;
  service: string;
  date: string;
  time: string;
  details: Details;
  description: string;
  images: InspirationImage[];
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const prettyDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";
  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="py-2">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/15">
          <Check className="h-7 w-7 text-gold" />
        </div>
        <h3 className="mt-4 font-display text-2xl text-foreground">
          Thank you, {details.name.split(" ")[0] || "friend"}!
        </h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Your consultation has been booked. Our team will contact you shortly to confirm.
        </p>
      </div>

      {/* Reference number */}
      <div className="mt-6 rounded-xl border border-gold/40 bg-gold/5 p-5 text-center">
        <div className="text-[10px] uppercase tracking-[0.25em] text-gold">Consultation reference</div>
        <div className="mt-2 flex items-center justify-center gap-2 font-mono text-xl sm:text-2xl font-semibold text-foreground">
          {reference}
          <button
            type="button"
            onClick={copyRef}
            aria-label="Copy reference"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Copy size={16} />
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {copied ? "Copied to clipboard!" : "Keep this number for your records."}
        </p>
      </div>

      {/* Full details */}
      <div className="mt-6 grid gap-3 text-sm">
        <DetailRow label="Project type" value={projectType} />
        <DetailRow label="Service" value={service} />
        <DetailRow label="Date & time" value={`${prettyDate} · ${time}`} />
        <DetailRow label="Name" value={details.name} />
        <DetailRow label="Phone" value={details.phone} />
        <DetailRow label="Email" value={details.email} />
        <DetailRow label="Property location" value={details.location} />
        <DetailRow label="Approximate budget" value={details.budget} />
        {description && (
          <DetailRow label="Project description" value={description} multiline />
        )}
        {images.length > 0 && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Inspiration images ({images.length})
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {images.map((img, i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-md border border-border">
                  <img src={img.dataUrl} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/30 p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground pt-0.5">
        {label}
      </div>
      <div
        className={`min-w-0 flex-1 text-right text-sm font-medium text-foreground ${
          multiline ? "whitespace-pre-wrap text-left" : "truncate"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
