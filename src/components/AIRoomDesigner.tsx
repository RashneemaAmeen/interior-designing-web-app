import { useRef, useState, type ChangeEvent } from "react";
import { Sparkles, Upload, Loader2, Download, RefreshCw } from "lucide-react";

const STYLES = [
  "Modern Luxury",
  "Minimalist Scandinavian",
  "Classic Elegance",
  "Contemporary Arabic",
  "Industrial Chic",
  "Bohemian",
  "Art Deco",
  "Coastal",
];

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export function AIRoomDesigner() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<string | null>(null);
  const [style, setStyle] = useState(STYLES[0]);
  const [notes, setNotes] = useState("");
  const [designedUrl, setDesignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 8MB.");
      return;
    }
    setError(null);
    setDesignedUrl(null);
    const dataUrl = await readAsDataUrl(file);
    setOriginalData(dataUrl);
    setOriginalUrl(dataUrl);
  }

  async function redesign() {
    if (!originalData) return;
    setLoading(true);
    setError(null);
    setDesignedUrl(null);
    try {
      const res = await fetch("/api/redesign-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: originalData, style, notes }),
      });
      const data = (await res.json()) as { image?: string; error?: string };
      if (!res.ok || !data.image) {
        throw new Error(data.error || "Failed to redesign room");
      }
      setDesignedUrl(data.image);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setOriginalUrl(null);
    setOriginalData(null);
    setDesignedUrl(null);
    setError(null);
    setNotes("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section id="ai-designer" className="py-20 sm:py-28 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-background/60 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold">
            <Sparkles className="h-3.5 w-3.5" />
            AI Room Designer
          </div>
          <h2 className="mt-4 text-3xl sm:text-4xl text-foreground">
            See your room reimagined in seconds
          </h2>
          <p className="mt-3 text-muted-foreground">
            Upload a photo of your space, choose a style, and let our AI generate a fresh interior
            concept — powered by Spectra's design sensibility.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Controls */}
          <div className="rounded-2xl border border-border bg-background p-6 sm:p-8 shadow-sm">
            <label className="block text-sm font-medium text-foreground">
              1. Upload a room photo
            </label>
            <div className="mt-3">
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={onFile}
                className="hidden"
                id="room-upload"
              />
              <label
                htmlFor="room-upload"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-gold/60 hover:text-foreground"
              >
                <Upload className="h-4 w-4" />
                {originalUrl ? "Choose a different photo" : "Click to upload (JPG, PNG · max 8MB)"}
              </label>
            </div>

            <label className="mt-6 block text-sm font-medium text-foreground">
              2. Pick a style
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-gold focus:outline-none"
            >
              {STYLES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <label className="mt-6 block text-sm font-medium text-foreground">
              3. Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="e.g. warm wood tones, brass accents, keep the sofa"
              className="mt-3 w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-gold focus:outline-none"
            />

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={redesign}
                disabled={!originalData || loading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Designing…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Redesign my room
                  </>
                )}
              </button>
              {(originalUrl || designedUrl) && (
                <button
                  type="button"
                  onClick={reset}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset
                </button>
              )}
            </div>

            {error && (
              <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              AI-generated concepts are for inspiration. Contact us to bring the design to life.
            </p>
          </div>

          {/* Preview */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col">
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Original
              </div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-muted">
                {originalUrl ? (
                  <img
                    src={originalUrl}
                    alt="Your uploaded room"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                    Your uploaded room will appear here
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-gold">AI redesign</span>
                {designedUrl && (
                  <a
                    href={designedUrl}
                    download="spectra-ai-redesign.png"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                )}
              </div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-gold/40 bg-muted">
                {loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-gold" />
                    <p className="text-xs text-muted-foreground">
                      Styling your room…
                    </p>
                  </div>
                )}
                {designedUrl ? (
                  <img
                    src={designedUrl}
                    alt="AI redesigned room"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  !loading && (
                    <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                      Your AI-designed room will appear here
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
