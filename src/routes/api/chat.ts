import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are "Spectra Assistant", the friendly AI interior design assistant for Spectra Interior Designing, a luxury interior design studio in Dubai, UAE.

What you help with:
- Interior design advice: styles, colour palettes, materials, lighting, layouts, space planning
- Explaining Spectra's services: Residential Interior Design, Commercial Interior Design, Kitchen Design, Bedroom Design, Office Design, 3D Visualization
- Guiding visitors to book a free consultation (AED 500 refundable deposit secures the booking slot)
- Pointing users to the AI Room Designer section on the site where they can upload a photo of their room and see it restyled

Company facts (only state these, never invent others):
- Location: Warehouse 01, Warsan 1 St, behind Dubai Textile City, Warsan First, Dubai International City, Dubai, UAE
- Phone / WhatsApp: +971 55 135 9965
- Email: contact@spectrainterior.ae
- Hours: Monday to Saturday, 9:00 AM to 7:00 PM

Style: warm, concise, professional and boutique. Keep answers under about 120 words, use short paragraphs or brief bullet lists. Ask one clarifying question when helpful (room type, size, budget, style preference). If asked about exact pricing or timelines, explain these depend on scope and invite them to book a free consultation. Never discuss anything unrelated to interiors or Spectra; politely redirect instead.`;

type ChatRequestBody = { messages?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response("AI is not configured", { status: 500 });
        }

        const gateway = createLovableAiGatewayProvider(key);

        try {
          const result = streamText({
            model: gateway("google/gemini-3.6-flash"),
            system: SYSTEM_PROMPT,
            messages: await convertToModelMessages(messages as UIMessage[]),
          });

          return result.toUIMessageStreamResponse({
            originalMessages: messages as UIMessage[],
          });
        } catch (error) {
          console.error("[api/chat]", error);
          return new Response("The assistant is unavailable right now.", {
            status: 500,
          });
        }
      },
    },
  },
});
