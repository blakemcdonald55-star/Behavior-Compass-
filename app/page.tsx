"use client";

import React, { useMemo, useState } from "react";

/* safety helpers */
const s = (str?: string) => (typeof str === "string" ? str : "");
const a = <T,>(arr?: T[]) => (Array.isArray(arr) ? arr : []);

/* taxonomy */
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

/* simple rules scoring placeholder */
function scoreCategory(text: string, labels: string[]) {
  return labels
    .map((label) => ({
      label,
      score: 0,
      hits: [] as string[],
    }))
    .slice(0, 3);
}

export default function Page() {
  const [input, setInput] = useState(
    "I hate feeling like I have to do everything on my own."
  );

  const rulesResults = useMemo(() => {
    const t = s(input).toLowerCase();
    return {
      needs: scoreCategory(t, TAXONOMY.needs),
      decisions: scoreCategory(t, TAXONOMY.decisions),
      values: scoreCategory(t, TAXONOMY.values),
    };
  }, [input]);

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<{
    input: string;
    needs: Array<{ label: string; score?: number; why?: string }>;
    decisions: Array<{ label: string; score?: number; why?: string }>;
    values: Array<{ label: string; score?: number; why?: string }>;
    rationale?: string;
  } | null>(null);

  const handleAnalyzeAI = async () => {
    setAiError(null);
    setAiResults(null);
    setAiLoading(true);
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.trim() }),
      });

      const raw = await res.text();
      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          `Non-JSON response (status ${res.status}): ${s(raw).slice(0, 200)}`
        );
      }

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      setAiResults({
        input: s(data.input) || input,
        needs: a(data.needs),
        decisions: a(data.decisions),
        values: a(data.values),
        rationale: s(data.rationale),
      });
    } catch (err: any) {
      setAiError(err?.message || "AI analysis failed");
      console.error("AI analyze error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b1020] text-white px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold">Behavior Compass Classifier</h1>
        <p className="mt-1 text-sm text-white/60">
          Paste → <span className="font-medium">Analyze</span> (rules) or{" "}
          <span className="font-medium">Analyze (AI)</span> for the semantic
          breakdown.
        </p>

        {/* Input */}
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <label className="mb-2 block text-sm text-white/70">
            Paste a sentence (or short paragraph)
          </label>
          <textarea
            className="w-full min-h-[160px] rounded-lg bg-black/30 p-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-400"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type here…"
          />
          <div className="mt-3 flex gap-2">
            <button
              className="rounded-md bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600"
              onClick={() => {
                setInput("");
                setAiResults(null);
                setAiError(null);
              }}
            >
              Clear
            </button>
            <button
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm hover:bg-indigo-500"
              onClick={() => setInput((v) => v)} // triggers rules useMemo
            >
              Analyze
            </button>
            <button
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm hover:bg-emerald-500 disabled:opacity-60"
              disabled={aiLoading || !input.trim()}
              onClick={handleAnalyzeAI}
            >
              {aiLoading ? "Analyzing (AI)..." : "Analyze (AI)"}
            </button>
          </div>

          {aiError && (
            <div className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-red-200">
              {aiError}
            </div>
          )}
        </div>

        {/* Results grid */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {/* Needs */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Needs</h3>
              <span className="text-xs text-white/50">Top 3</span>
            </div>
            {a(aiResults?.needs).length ? (
              a(aiResults?.needs)
                .slice(0, 3)
                .map((n, i) => (
                  <div
                    key={i}
                    className="mt-2 rounded-md bg-black/30 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{n.label}</span>
                      {typeof n.score === "number" && (
                        <span className="text-emerald-300">
                          {n.score.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {s(n.why) && (
                      <p className="mt-1 text-white/70 text-xs">
                        {s(n.why).slice(0, 220)}
                      </p>
                    )}
                  </div>
                ))
            ) : (
              scoreCategory(s(input).toLowerCase(), TAXONOMY.needs)
                .slice(0, 3)
                .map((n, i) => (
                  <div
                    key={i}
                    className="mt-2 rounded-md bg-black/30 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{n.label}</span>
                      <span className="ml-2 text-white/40 text-xs">rules</span>
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* Decisions */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Decisions</h3>
              <span className="text-xs text-white/50">Top 3</span>
            </div>
            {a(aiResults?.decisions).length ? (
              a(aiResults?.decisions)
                .slice(0, 3)
                .map((n, i) => (
                  <div
                    key={i}
                    className="mt-2 rounded-md bg-black/30 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{n.label}</span>
                      {typeof n.score === "number" && (
                        <span className="text-emerald-300">
                          {n.score.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {s(n.why) && (
                      <p className="mt-1 text-white/70 text-xs">
                        {s(n.why).slice(0, 220)}
                      </p>
                    )}
                  </div>
                ))
            ) : (
              scoreCategory(s(input).toLowerCase(), TAXONOMY.decisions)
                .slice(0, 3)
                .map((n, i) => (
                  <div
                    key={i}
                    className="mt-2 rounded-md bg-black/30 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{n.label}</span>
                      <span className="ml-2 text-white/40 text-xs">rules</span>
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* Values */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Values</h3>
              <span className="text-xs text-white/50">Top 3</span>
            </div>
            {a(aiResults?.values).length ? (
              a(aiResults?.values)
                .slice(0, 3)
                .map((n, i) => (
                  <div
                    key={i}
                    className="mt-2 rounded-md bg-black/30 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{n.label}</span>
                      {typeof n.score === "number" && (
                        <span className="text-emerald-300">
                          {n.score.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {s(n.why) && (
                      <p className="mt-1 text-white/70 text-xs">
                        {s(n.why).slice(0, 220)}
                      </p>
                    )}
                  </div>
                ))
            ) : (
              scoreCategory(s(input).toLowerCase(), TAXONOMY.values)
                .slice(0, 3)
                .map((n, i) => (
                  <div
                    key={i}
                    className="mt-2 rounded-md bg-black/30 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{n.label}</span>
                      <span className="ml-2 text-white/40 text-xs">rules</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Export JSON */}
        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="font-semibold">Export (JSON)</h3>
          <pre className="mt-3 overflow-auto rounded-lg bg-black/40 p-3 text-sm">
            {JSON.stringify(
              {
                input,
                rulesResults,
                aiResults: aiResults && {
                  input: aiResults.input,
                  needs: a(aiResults.needs),
                  decisions: a(aiResults.decisions),
                  values: a(aiResults.values),
                  rationale: s(aiResults.rationale),
                },
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </main>
  );
}


