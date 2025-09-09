'use client';
import React, { useMemo, useState } from 'react';

type Result = { label: string; score: number; hits: string[] };

const TAXONOMY = {
  needs: {
    "Significance": ["matter","impact","important","recognition","status","legacy","win","excel","leader","influence"],
    "Approval": ["approval","validation","liked","impress","praise","feedback","appreciate","support","permission"],
    "Acceptance": ["belong","included","welcomed","fit in","understood","seen","heard","accepted","alone","isolated"],
    "Intelligence": ["smart","learn","understand","strategy","knowledge","analytical","insight","logic","cognition"],
    "Strength/Power": ["power","strong","dominance","control","authority","lead","resilient","tough","toughness"],
    "Pity": ["help me","feel bad","unfair","victim","sympathy","sorry for me","struggling","burden"]
  },
  decisions: {
    "Novelty": ["new","different","experiment","try","change","variety","adventure","explore","novelty"],
    "Deviance": ["rebel","break rules","challenge","nonconform","push limits","disrupt","deviate"],
    "Social": ["together","with friends","team","group","share","community","people","support"],
    "Conformity": ["comply","follow rules","fit in","standard","align","normal","expected","tradition","conform"],
    "Investment": ["invest","commit","dedicate","all-in","long-term","build","buy in","stick with","investment"],
    "Necessity": ["must","need to","have to","required","essential","urgent","necessity","forced"]
  },
  values: {
    "Connection": ["connection","relationships","belong","community","together","bond","intimacy","team","support"],
    "Freedom": ["freedom","autonomy","independence","choose","flexibility","travel","no limits"],
    "Information": ["information","data","facts","evidence","research","sources","learn"],
    "Recognition": ["recognition","status","credit","acknowledgement","fame","reputation"],
    "Investment": ["investment","compounding","long-term","equity","ROI","build"],
    "Growth": ["growth","improve","evolve","progress","develop","challenge","learn"]
  }
} as const;

const WEIGHTS = {
  keywordHit: 1.0,
  exactPhraseBonus: 0.5,
  caseInsensitive: true
};

function escapeRegExp(s: string){ return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'); }

function scoreCategory(text: string, lexicon: Record<string, string[]>): Result[] {
  const lcText = WEIGHTS.caseInsensitive ? text.toLowerCase() : text;
  const results: Result[] = [];
  for (const [label, terms] of Object.entries(lexicon)) {
    let score = 0;
    const hits: string[] = [];
    for (const raw of terms) {
      const t = WEIGHTS.caseInsensitive ? raw.toLowerCase() : raw;
      if (t.includes(' ')) {
        if (lcText.includes(t)) { score += WEIGHTS.keywordHit + WEIGHTS.exactPhraseBonus; hits.push(raw); }
      } else {
        const re = new RegExp(`\\b${escapeRegExp(t)}\\b`, WEIGHTS.caseInsensitive ? 'i' : undefined as any);
        if (re.test(lcText)) { score += WEIGHTS.keywordHit; hits.push(raw); }
      }
    }
    results.push({ label, score, hits });
  }
  results.sort((a,b)=> b.score - a.score);
  return results;
}

function Top({ title, data }: { title: string; data: Result[] }) {
  const top = data.slice(0,3);
  return (
    <div className="card">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
        <div className="label">{title}</div>
        <span className="muted">Top 3</span>
      </div>
      {top.map((r, i)=>(
        <div key={r.label} style={{display:'flex', justifyContent:'space-between', gap:8, border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:10, margin:'8px 0'}}>
          <div>
            <div className="label">{i+1}. {r.label}</div>
            <div className="muted">
              {r.hits.length ? <>matched: {r.hits.slice(0,8).map((h,idx)=>(<span key={idx} className="pill">{h}</span>))}</> : <i>no direct keyword hits</i>}
            </div>
          </div>
          <div className="score">{r.score.toFixed(2)}</div>
        </div>
      ))}
    </div>
  );
}

export default function Page(){
  const [input, setInput] = useState("I love living with intentionality and freedom. I want to master my craft and make an impact while staying true to myself.");
  const [analyzed, setAnalyzed] = useState("");

  const results = useMemo(()=>{
    const t = analyzed || "";
    return {
      needs: scoreCategory(t, TAXONOMY.needs),
      decisions: scoreCategory(t, TAXONOMY.decisions),
      values: scoreCategory(t, TAXONOMY.values)
    };
  }, [analyzed]);

  return (
    <div className="container">
      <h1>Behavior Compass Classifier</h1>
      <div className="sub">Paste → <b>Analyze</b> to score Needs • Decisions • Values (Chase Hughes-inspired).</div>

      <div className="card">
        <label className="label">Paste a sentence (or short paragraph)</label>
        <textarea
          placeholder="Paste a sentence, then click Analyze"
          value={input}
          onChange={(e)=> setInput(e.target.value)}
        />
        <div className="row">
          <button onClick={()=>{ setInput(''); setAnalyzed(''); }}>Clear</button>
          <button onClick={()=> setAnalyzed(input)}>Analyze</button>
          <button className="secondary" onClick={()=>{ const ex = "I blacked out Friday and Saturday."; setInput(ex); setAnalyzed(ex); }}>Example: blackout</button>
          <button className="secondary" onClick={()=>{ const ex = "I love living with intentionality with everything I do."; setInput(ex); setAnalyzed(ex); }}>Example: intentionality</button>
        </div>
      </div>

      <div className="grid">
        <Top title="Needs" data={results.needs} />
        <Top title="Decisions" data={results.decisions} />
        <Top title="Values" data={results.values} />
      </div>

      <div className="card" style={{marginTop:16}}>
        <div className="label">Export (JSON)</div>
        <div className="export">{JSON.stringify({
          input: analyzed || input,
          results: {
            needs: results.needs.slice(0,3),
            decisions: results.decisions.slice(0,3),
            values: results.values.slice(0,3)
          }
        }, null, 2)}</div>
        <div className="muted" style={{marginTop:8}}>This is a transparent, keyword-based model. Edit the taxonomy inside <code>app/page.tsx</code> to fit your exact Behavior Compass dictionary.</div>
      </div>
    </div>
  );
}
