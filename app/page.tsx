"use client";

import React, { useMemo, useState } from "react";

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

const KEYWORDS: Record<string, string[]> = {
  // Needs
  Significance: ["i matter","matter","important","best","special","recognize","recognition","impact"],
  Approval: ["approve","approval","validate","validation","like me","impress","accept me","admire"],
  Acceptance: ["accept","belong","included","welcome","fit in","part of"],
  Intelligence: ["smart","intelligent","figure out","understand","learn","knowledgeable","clever"],
  "Strength/Power": ["power","control","in control","strong","dominate","lead","authority"],
  Pity: ["feel sorry","pity","victim","helpless","poor me"],

  // Decisions
  Novelty: ["new","novel","adventure","explore","different","variety","fresh"],
  Deviance: ["break rules","against the rules","rebel","nonconform","edge","taboo"],
  Social: ["together","friends","team","group","we ","community","social"],
  Conformity: ["normal","standard","expected","proper","should","supposed to"],
  Investment: ["invest","commit","long term","sacrifice","pay off","return","roi"],
  Necessity: ["have to","need to","must","required","necessary","obligation"],

  // Values
  Connection: ["connect","connection","relationship","bond","intimacy","together","belong"],
  Freedom: ["free","freedom","autonomy","independent","my way","choice"],
  Information: ["information","data","facts","learn","research","understand"],
  Recognition: ["recognize","recognition","credit","acknowledge","applause","famous"],
  Growth: ["grow","growth","improve","progress","develop","level up","mastery"],
};

type RuleItem = { label: string; score: number; hits: string[] };
type AIItem = { label: string; score?: number; why?: string };

const s = (x?: string) => (typeof x === "string" ? x : "");
const a = <T,>(x: unknown) => (Array.isArray(x) ? (x as T[]) : ([] as T[]));

function scoreCategory(text: string, labels: string[]): RuleItem[] {
  const t = text.toLowerCase();
  return labels
    .map((label) => {
      const words = KEYWORDS[label] || [];
      let hits: string[] = [];
      let score = 0;
      for (const w of words) {
        const needle = w.toLowerCase();
        const count = needle ? t.split(needle).length - 1 : 0;
        if (count > 0) {
          hits.push(`${needle}×${count}`);
          score += count;
        }
      }
      const scaled = Math.max(0, Math.min(5, score));
      return { label, score: scaled, hits };
    })
    .sort((x, y) => y.score - x.score)
    .slice(0, 3);
}

export default function Page() {
  const [input, setInput] = useState("i am the best at everything");
  const [aiResults, setAiResults] = useState<{
    input: string;
    needs: AIItem[];
    decisions: AIItem[];
    values: AIItem[];
    rationale?: string;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // RULES results are computed locally and always available
  const rulesResults = useMemo(() => {
    const t = s(input);
    return {
      needs: scoreCategory(t, TAXONOMY.needs),
      decisions: scoreCategory(t, TAXONOMY.decisions),
      values: scoreCategory(t, TAXONOMY.values),
    };
  }, [input]);

  const isAI = !!aiResults;

  async function analyzeAI() {
    setAiLoading(true);
    setAiError(null);
    setAiResults(null);
    try {
      const res = await fetch("/api/classify?mode=ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setAiResults({
        input: data.input,
        needs: a<AIItem>(data.needs),
        decisions: a<AIItem>(data.decisions),
        values: a<AIItem>(data.values),
        rationale: s(data.rationale),
      });
    } catch (err: any) {
      setAiError(err?.message || "AI analysis failed");
      console.error("AI analyze error:", err);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b1020] text-white px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold">Behavior Compass Classifier</h1>
        <p className="mt-1 text-sm text-white/60">
          Paste → <span className="font-medium">Analyze</span> (rules) or{" "}
          <span className="font-medium">Analyze (AI)</span> for the semantic breakdown.
        </p>

        {/* Input */}
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <label className="mb-2 block text-sm text-white/70">
            Paste a sentence (or short paragraph)
          </label>
          <textarea
            className="w-full min-h-[160px] rounded-lg bg-black/30 p-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-400"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // clear AI state when text changes
              setAiResults(null);
              setAiError(null);
            }}
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

            {/* Rules is automatic (computed locally). This button just “confirms” */}
            <button
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm hover:bg-indigo-500"
              onClick={() => setInput((v) => v)}
            >
              Analyze
            </button>

            <button
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm hover:bg-emerald-500 disabled:opacity-60"
              disabled={aiLoading || !input.trim()}
              onClick={analyzeAI}
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

        {/* Results */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {/* Needs */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Needs</h3>
              <span className="text-xs text-white/50">Top 3</span>
            </div>

            {(isAI ? a(aiResults?.needs) : a(rulesResults.needs)).slice(0, 3).map((n: any, i: number) => (
              <div key={i} className="mt-2 rounded-md bg-black/30 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{n.label}</span>
                  {isAI ? (
                    typeof n.score === "number" && (
                      <span className="text-emerald-300">{n.score.toFixed(2)}</span>
                    )
                  ) : (
                    <span className="ml-2 text-white/40 text-xs">rules</span>
                  )}
                </div>
                {isAI && n?.why && (
                  <p className="mt-1 text-white/70 text-xs">{s(n.why).slice(0, 220)}</p>
                )}
              </div>
            ))}
          </div>

          {/* Decisions */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Decisions</h3>
              <span className="text-xs text-white/50">Top 3</span>
            </div>

            {(isAI ? a(aiResults?.decisions) : a(rulesResults.decisions)).slice(0, 3).map((n: any, i: number) => (
              <div key={i} className="mt-2 rounded-md bg-black/30 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{n.label}</span>
                  {isAI ? (
                    typeof n.score === "number" && (
                      <span className="text-emerald-300">{n.score.toFixed(2)}</span>
                    )
                  ) : (
                    <span className="ml-2 text-white/40 text-xs">rules</span>
                  )}
                </div>
                {isAI && n?.why && (
                  <p className="mt-1 text-white/70 text-xs">{s(n.why).slice(0, 220)}</p>
                )}
              </div>
            ))}
          </div>

          {/* Values */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Values</h3>
              <span className="text-xs text-white/50">Top 3</span>
            </div>

            {(isAI ? a(aiResults?.values) : a(rulesResults.values)).slice(0, 3).map((n: any, i: number) => (
              <div key={i} className="mt-2 rounded-md bg-black/30 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{n.label}</span>
                  {isAI ? (
                    typeof n.score === "number" && (
                      <span className="text-emerald-300">{n.score.toFixed(2)}</span>
                    )
                  ) : (
                    <span className="ml-2 text-white/40 text-xs">rules</span>
                  )}
                </div>
                {isAI && n?.why && (
                  <p className="mt-1 text-white/70 text-xs">{s(n.why).slice(0, 220)}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Export */}
        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="font-semibold">Export (JSON)</h3>
          <pre className="mt-3 overflow-auto rounded-lg bg-black/40 p-3 text-sm">
            {JSON.stringify(
              {
                input,
                rulesResults,
                aiResults,
                aiError,
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


