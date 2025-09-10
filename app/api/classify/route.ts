import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    let text: string | undefined;

    // accept JSON {text} or raw text
    try {
      const parsed = JSON.parse(body || "{}");
      text = typeof parsed.text === "string" ? parsed.text : undefined;
    } catch {
      text = body?.trim() || undefined;
    }

    if (!text) {
      return NextResponse.json({ ok: false, error: "Missing text" }, { status: 400 });
    }

    // TEMP response so the UI never crashes while we wire things up
    return NextResponse.json({
      ok: true,
      input: text,
      needs: [],
      decisions: [],
      values: [],
      rationale: "Echo-only test response (wire check)."
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}


