import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_STYLES = new Set([
  "Modern Luxury",
  "Minimalist Scandinavian",
  "Classic Elegance",
  "Contemporary Arabic",
  "Industrial Chic",
  "Bohemian",
  "Art Deco",
  "Coastal",
]);

const MAX_IMAGE_CHARS = 12_000_000; // ~9MB binary once base64-decoded
const MAX_NOTES = 500;
const MAX_BODY_BYTES = 13_000_000;

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

export const Route = createFileRoute("/api/redesign-room")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          if (!originAllowed(request)) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
          }

          const contentLength = Number(request.headers.get("content-length") || "0");
          if (contentLength && contentLength > MAX_BODY_BYTES) {
            return Response.json({ error: "Payload too large" }, { status: 413 });
          }

          const { image, style, notes } = (await request.json()) as {
            image?: unknown;
            style?: unknown;
            notes?: unknown;
          };

          if (typeof image !== "string" || !image.startsWith("data:image/")) {
            return Response.json({ error: "Missing or invalid image" }, { status: 400 });
          }
          if (image.length > MAX_IMAGE_CHARS) {
            return Response.json({ error: "Image too large" }, { status: 413 });
          }

          const styleText =
            typeof style === "string" && ALLOWED_STYLES.has(style) ? style : "Modern Luxury";

          let notesText = "";
          if (notes !== undefined && notes !== null && notes !== "") {
            if (typeof notes !== "string") {
              return Response.json({ error: "Invalid notes" }, { status: 400 });
            }
            if (notes.length > MAX_NOTES) {
              return Response.json({ error: "Notes too long" }, { status: 400 });
            }
            notesText = notes.trim();
          }

          const key = process.env.LOVABLE_API_KEY;
          if (!key) {
            return Response.json({ error: "AI is not configured" }, { status: 500 });
          }

          const extraNotes = notesText ? ` Additional client notes: ${notesText}.` : "";
          const prompt =
            `Redesign this room in a ${styleText} interior design style. ` +
            `Preserve the room's architecture, windows, doors, and camera perspective exactly. ` +
            `Replace furniture, decor, lighting, wall treatments, and materials to create a cohesive, ` +
            `high-end, photorealistic interior that looks professionally styled and staged.${extraNotes}`;

          const upstream = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${key}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-image",
                messages: [
                  {
                    role: "user",
                    content: [
                      { type: "text", text: prompt },
                      { type: "image_url", image_url: { url: image } },
                    ],
                  },
                ],
                modalities: ["image", "text"],
              }),
            },
          );

          if (!upstream.ok) {
            const errText = await upstream.text();
            console.error(
              `[redesign-room] upstream ${upstream.status}: ${errText.slice(0, 500)}`,
            );
            if (upstream.status === 429) {
              return Response.json(
                { error: "The AI designer is busy. Please try again in a moment." },
                { status: 429 },
              );
            }
            if (upstream.status === 402) {
              return Response.json(
                { error: "AI credits are exhausted. Please contact the site owner." },
                { status: 402 },
              );
            }
            return Response.json(
              { error: "AI request failed. Please try again." },
              { status: 500 },
            );
          }

          const data = (await upstream.json()) as {
            choices?: Array<{
              message?: {
                images?: Array<{ image_url?: { url?: string } }>;
                content?: string;
              };
            }>;
          };
          const url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (!url) {
            return Response.json({ error: "No image returned by AI" }, { status: 502 });
          }
          return Response.json({ image: url });
        } catch (e) {
          console.error("[redesign-room] unexpected error:", e);
          return Response.json(
            { error: "An unexpected error occurred." },
            { status: 500 },
          );
        }
      },
    },
  },
});
