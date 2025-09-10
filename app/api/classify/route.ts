// app/api/classify/route.ts
import { NextResponse } from "next/server";

/** Required: set this in Vercel → Project → Settings → Environment Variables */
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Allowed labels (keep in sync with your UI)
const TAXONOMY = {
  needs: [
    "Significance",
    "Approval",
    "Acceptance",
    "Intelligence",
    "Strength/Power",
    "Pity",
  ],
  decisions: [
    "Novelty",
    "Deviance",
    "Social",
    "Conformity",
    "Investment",
    "Necessity",
  ],
  values: [
    "Connection",
    "Freedom",
    "Information",
    "Recognition",
    "Investment",
    "Growth",
  ],
};

type Item = { label: string; score?: number; why?: string };

// Safe helpers
const s = (x: unknown) => (typeof x === "string" ? x : "");
const a = <T,>(x: unknown) => (Array.isArray(x) ? (x as T[]) : ([] as T[]));

/** Build a strict instruction so the model returns pure JSON we can parse. */
function buildPrompt(userText: string) {
  return `
You are a Behavior Compass analyst. Classify the user's short text into three groups with these allowed labels only.

Allowed:
- Needs: ${TAXONOMY.needs.join(", ")}
- Decisions: ${TAXONOMY.decisions.join(", ")}
- Values: ${TAXONOMY.values.join(", ")}

Instructions:
1) Pick the top 3 per group (fewer is OK if evidence is weak).
2) Score each 0..5 (0 = no support, 5 = very strong).
3) Include a brief "why" (1–2 sentences) citing specific words/phrases from the text when possible.
4) Output STRICT JSON ONLY, no prose.

Return shape:
{
  "input": string,
  "needs":   [{"label": "...", "score": number, "why": "..."}, ...],
  "decisions":[{"label": "...", "score": number, "why": "..."}, ...],
  "values":  [{"label": "...", "score": number, "why": "..."}, ...],
  "rationale": "1–2 sentences overall (optional)"
}

User text:
"""${userText.trim()}"""
`.trim();
}

/** Try to extract a JSON object from an OpenAI chat response. */
function extractJson(content: string) {
  // most models return clean JSON if prompted strictly
  try {
    return JSON.parse(content);
  } catch {
    // crude fallback: find first {...} block
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(content.slice(start, end + 1));
      } catch {
        // ignore
      }
    }
  }
  return null;
}

/** Normalize whatever we get into our canonical shape. */
function normalize(obj: any, inputText: string) {
  const clamp = (n: any) =>
    Math.max(0, Math.min(5, Number.isFinite(n) ? Number(n) : 0));

  const coerceItems = (xs: any[], allowed: string[]): Item[] =>
    a<any>(xs)
      .map((it) => ({
        label: allowed.includes(s(it?.label)) ? s(it.label) : "",
        score: clamp(it?.score),
        why: s(it?.why),
      }))
      .filter((it) => it.label) // drop anything not in the allowed list
      .slice(0, 3);

  return {
    ok: true,
    input: s(obj?.input) || inputText,
    needs: coerceItems(a(obj?.needs), TAXONOMY.needs),
    decisions: coerceItems(a(obj?.decisions), TAXONOMY.decisions),
    values: coerceItems(a(obj?.values), TAXONOMY.values),
    rationale: s(obj?.rationale),
  };
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "ai";
    const body = await req.json().catch(() => ({}));
    const text = s(body?.text);

    if (!text) {
      return NextResponse.json(
        { ok: false, error: "Missing text" },
        { status: 400 }
      );
    }

    // Optional: simple server-side rules mode, if you post with ?mode=rules
    if (mode === "rules") {
      return NextResponse.json({
        ok: true,
        input: text,
        needs: [],
        decisions: [],
        values: [],
        rationale: "Rules mode is computed on the client; server returns empty.",
      });
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Call OpenAI Chat Completions
    const prompt = buildPrompt(text);

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // fast + inexpensive, adjust if you prefer
        temperature: 0,
        messages: [
          { role: "system", content: "You output strict JSON only." },
          { role: "user", content: prompt },
        ],
        // keep responses tight
        max_tokens: 600,
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      return NextResponse.json(
        { ok: false, error: `OpenAI HTTP ${r.status}: ${errText.slice(0, 400)}` },
        { status: 500 }
      );
    }

    const data = await r.json();
    const content =
      data?.choices?.[0]?.message?.content ??
      data?.message?.content ??
      data?.content ??
      "";

    const parsed = extractJson(String(content));
    if (!parsed) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Failed to parse AI response as JSON. Check prompt/formatting.",
          raw: content,
        },
        { status: 500 }
      );
    }

    const normalized = normalize(parsed, text);
    return NextResponse.json(normalized);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

