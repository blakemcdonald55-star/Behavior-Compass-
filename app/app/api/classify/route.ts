import { NextResponse } from "next/server";

// If you use OpenAI, set OPENAI_API_KEY in .env.local (and in Vercel env)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

/** Keep this list in sync with your UI taxonomy */
const TAXONOMY = {
  needs: ["Significance","Approval","Acceptance","Intelligence","Strength/Power","Pity"],
  decisions: ["Novelty","Deviance","Social","Conformity","Investment","Necessity"],
  values: ["Connection","Freedom","Information","Recognition","Investment","Growth"]
};

const SYSTEM = `You are a Behavior Compass analyst.
You classify a short sentence into three groups with these labels:
Needs: ${TAXONOMY.needs.join(", ")}
Decisions: ${TAXONOMY.decisions.join(", ")}
Values: ${TAXONOMY.values.join(", ")}

Return calibrated scores in [0,5] (0 = none, 5 = very strong), and 1–2 sentence rationales for the top 3 per group.
Be concise and only infer what's supported by the text. Keep weak evidence near 0. Provide JSON only.`;

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = {
      model: "gpt-4o-mini",            // good quality / cost balance; change if you prefer
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content:
`Text: """${text}"""

Return strict JSON with this shape:
{
  "needs": [{"label":"...","score":0-5,"rationale":"..."}],
  "decisions": [{"label":"...","score":0-5,"rationale":"..."}],
  "values": [{"label":"...","score":0-5,"rationale":"..."}]
}
Include all labels with scores, but only the top 3 per group need non-empty "rationale".`
        }
      ]
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":"application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      const t = await r.text();
      return NextResponse.json({ error: `LLM error: ${t}` }, { status: 500 });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);

    return NextResponse.json({ input: text, ...parsed });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
