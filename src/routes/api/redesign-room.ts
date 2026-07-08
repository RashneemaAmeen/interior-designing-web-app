import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/redesign-room")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { image, style, notes } = (await request.json()) as {
            image: string;
            style?: string;
            notes?: string;
          };
          if (!image || !image.startsWith("data:image/")) {
            return Response.json({ error: "Missing or invalid image" }, { status: 400 });
          }
          const key = process.env.LOVABLE_API_KEY;
          if (!key) {
            return Response.json({ error: "AI is not configured" }, { status: 500 });
          }

          const styleText = style?.trim() || "modern luxury";
          const extraNotes = notes?.trim() ? ` Additional client notes: ${notes.trim()}.` : "";
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
            const status = upstream.status === 429 || upstream.status === 402 ? upstream.status : 500;
            const message =
              upstream.status === 429
                ? "The AI designer is busy. Please try again in a moment."
                : upstream.status === 402
                  ? "AI credits are exhausted. Please contact the site owner."
                  : `AI request failed: ${errText.slice(0, 200)}`;
            return Response.json({ error: message }, { status });
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
          return Response.json(
            { error: e instanceof Error ? e.message : "Unexpected error" },
            { status: 500 },
          );
        }
      },
    },
  },
});
