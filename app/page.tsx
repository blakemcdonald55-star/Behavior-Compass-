'use client';
import React, { useMemo, useState } from 'react';

type Result = { label: string; score: number; hits: string[] };

const TAXONOMY = {
  needs: {
    "Significance": [
      "matter","impact","important","recognition","status","legacy","win","excel","leader","influence",
      "only one","all on me","carry the team","unseen effort","credit","acknowledge"
    ],
    "Approval": [
      "approval","validation","liked","impress","praise","feedback","appreciate","support","permission",
      "do they like me","do they approve","be proud of me"
    ],
    "Acceptance": [
      "belong","included","welcomed","fit in","understood","seen","heard","accepted",
      "alone","on my own","by myself","left out","excluded","unsupported","no help"
    ],
    "Intelligence": [
      "smart","learn","understand","strategy","knowledge","analytical","insight","logic","cognition",
      "figure it out","make sense","research","information"
    ],
    "Strength/Power": [
      "power","strong","dominance","control","authority","lead","resilient","tough","toughness",
      "in control","take charge","handle it","powerful"
    ],
    "Pity": [
      "help me","feel bad","unfair","victim","sympathy","sorry for me","struggling","burden",
      "overwhelmed","exhausted","no one helps","why me","always me"
    ]
  },
  decisions: {
    "Novelty": [
      "new","different","experiment","try","change","variety","adventure","explore","novelty",
      "spontaneous","switch it up"
    ],
    "Deviance": [
      "rebel","break rules","challenge","nonconform","push limits","disrupt","deviate",
      "reckless","blackout","blacked out","drunk","partied","went too far"
    ],
    "Social": [
      "together","with friends","team","group","share","community","people","support",
      "we","us","with others"
    ],
    "Conformity": [
      "comply","follow rules","fit in","standard","align","normal","expected","tradition","conform",
      "supposed to","should","the rules"
    ],
    "Investment": [
      "invest","commit","dedicate","all-in","long-term","build","buy in","stick with","investment",
      "consistent","keep showing up"
    ],
    "Necessity": [
      "must","need to","have to","required","essential","urgent","necessity","forced",
      "no choice","gotta","had to","it falls on me"
    ]
  },
  values: {
    "Connection": [
      "connection","relationships","belong","community","together","bond","intimacy","team","support",
      "be there for me","show up","not alone"
    ],
    "Freedom": [
      "freedom","autonomy","independence","choose","flexibility","travel","no limits",
      "my own terms","not trapped","not forced"
    ],
    "Information": [
      "information","data","facts","evidence","research","sources","learn","figure it out","understand"
    ],
    "Recognition": [
      "recognition","status","credit","acknowledgement","fame","reputation","appreciation","be seen"
    ],
    "Investment": [
      "investment","compounding","long-term","equity","ROI","build","commitment","stick with it"
    ],
    "Growth": [
      "growth","improve","evolve","progress","develop","challenge","learn","get better"
    ]
  }
};


// Boost phrases more than single words
const WEIGHTS = {
  word: 1.0,          // single-word hit
  phrase: 1.7,        // phrase hit (2+ words) — heavier!
  caseInsensitive: true
};

// helper
function escapeRegExp(s: string){ return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'); }

// count all occurrences for phrases and words
function scoreCategory(
  text: string,
  lexicon: Record<string, readonly string[]>
) {
  const lcText = WEIGHTS.caseInsensitive ? text.toLowerCase() : text;
  const results: { label: string; score: number; hits: string[] }[] = [];

  for (const [label, terms] of Object.entries(lexicon)) {
    let score = 0;
    const hits: string[] = [];

    for (const raw of terms) {
      const t = WEIGHTS.caseInsensitive ? raw.toLowerCase() : raw;

      if (t.includes(' ')) {
        // PHRASE: count all occurrences
        let idx = 0, found = false;
        while (true) {
          idx = lcText.indexOf(t, idx);
          if (idx === -1) break;
          score += WEIGHTS.phrase;
          found = true;
          idx += t.length;
        }
        if (found) hits.push(raw);
      } else {
        // WORD: boundary match, count all occurrences
        const re = new RegExp(`\\b${escapeRegExp(t)}\\b`, WEIGHTS.caseInsensitive ? 'gi' : 'g');
        const matches = lcText.match(re);
        if (matches && matches.length) {
          score += WEIGHTS.word * matches.length;
          hits.push(raw);
        }
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
