"use client";

import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [rulesResults, setRulesResults] = useState<any>(null);
  const [aiResults, setAiResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async (mode: "rules" | "ai") => {
    setLoading(true);
    setRulesResults(null);
    setAiResults(null);

    try {
      const res = await fetch(`/api/classify?mode=${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (mode === "rules") {
        setRulesResults(data);
      } else {
        setAiResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const s = (x: any) => (typeof x === "string" ? x : JSON.stringify(x, null, 2));
  const isAI = !!aiResults;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">Behavior Compass Classifier</h1>
      <p className="mb-4 text-sm text-white/70">
        Paste → Analyze (rules) or Analyze (AI) for the semantic breakdown.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a sentence (or short paragraph)"
        className="w-full rounded-md bg-black/40 p-3 text-white border border-white/10 mb-4"
        rows={4}
      />

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => analyze("rules")}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-md"
        >
          Analyze
        </button>
        <button
          onClick={() => analyze("ai")}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-4 py-2 rounded-md"
        >
          Analyze (AI)
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {(rulesResults || aiResults) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Needs */}
          <div>
            <h2 className="text-lg font-semibold">Needs</h2>
            <p className="text-xs text-white/50">Top 3</p>
            {(aiResults?.needs || rulesResults?.needs || []).map(
              (n: any, i: number) => (
                <div
                  key={i}
                  className="mt-2 rounded-md bg-black/30 px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{n.label}</span>
                    {isAI ? (
                      typeof (n as any).score === "number" && (
                        <span className="text-emerald-300">
                          {(n as any).score.toFixed(2)}
                        </span>
                      )
                    ) : (
                      <span className="ml-2 text-white/40 text-xs">rules</span>
                    )}
                  </div>
                  {isAI && (n as any)?.why && (
                    <p className="mt-1 text-white/70 text-xs">
                      {s((n as any).why).slice(0, 220)}
                    </p>
                  )}
                </div>
              )
            )}
          </div>

          {/* Decisions */}
          <div>
            <h2 className="text-lg font-semibold">Decisions</h2>
            <p className="text-xs text-white/50">Top 3</p>
            {(aiResults?.decisions || rulesResults?.decisions || []).map(
              (n: any, i: number) => (
                <div
                  key={i}
                  className="mt-2 rounded-md bg-black/30 px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{n.label}</span>
                    {isAI ? (
                      typeof (n as any).score === "number" && (
                        <span className="text-emerald-300">
                          {(n as any).score.toFixed(2)}
                        </span>
                      )
                    ) : (
                      <span className="ml-2 text-white/40 text-xs">rules</span>
                    )}
                  </div>
                  {isAI && (n as any)?.why && (
                    <p className="mt-1 text-white/70 text-xs">
                      {s((n as any).why).slice(0, 220)}
                    </p>
                  )}
                </div>
              )
            )}
          </div>

          {/* Values */}
          <div>
            <h2 className="text-lg font-semibold">Values</h2>
            <p className="text-xs text-white/50">Top 3</p>
            {(aiResults?.values || rulesResults?.values || []).map(
              (n: any, i: number) => (
                <div
                  key={i}
                  className="mt-2 rounded-md bg-black/30 px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{n.label}</span>
                    {isAI ? (
                      typeof (n as any).score === "number" && (
                        <span className="text-emerald-300">
                          {(n as any).score.toFixed(2)}
                        </span>
                      )
                    ) : (
                      <span className="ml-2 text-white/40 text-xs">rules</span>
                    )}
                  </div>
                  {isAI && (n as any)?.why && (
                    <p className="mt-1 text-white/70 text-xs">
                      {s((n as any).why).slice(0, 220)}
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {(rulesResults || aiResults) && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Export (JSON)</h2>
          <pre className="mt-2 bg-black/40 rounded-md p-4 text-xs overflow-x-auto">
            {s(rulesResults || aiResults)}
          </pre>
        </div>
      )}
    </div>
  );
}


