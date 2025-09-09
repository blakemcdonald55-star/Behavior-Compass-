'use client';
import React, { useMemo, useState } from 'react';

/* ============================
   TYPES
============================ */
type ResultItem = { label: string; score: number; hits: string[]; reasons: string[] };
type Bucket = Record<string, readonly string[]>;

type Boost = {
  needs?: Record<string, number>;
  decisions?: Record<string, number>;
  values?: Record<string, number>;
};
type Rule = { name: string; re: RegExp; boost: Boost; negateWindow?: number };

/* ============================
   TAXONOMY (edit freely)
============================ */
const TAXONOMY: { needs: Bucket; decisions: Bucket; values: Bucket } = {
  needs: {
    Significance: [
      'matter','impact','important','recognition','status','legacy','win','excel','leader','influence',
      'only one','all on me','carry the team','unseen effort','credit','acknowledge'
    ],
    Approval: [
      'approval','validation','liked','impress','praise','feedback','appreciate','support','permission',
      'do they like me','do they approve','be proud of me'
    ],
    Acceptance: [
      'belong','included','welcomed','fit in','understood','seen','heard','accepted',
      'alone','on my own','by myself','left out','excluded','unsupported','no help','not alone'
    ],
    Intelligence: [
      'smart','learn','understand','strategy','knowledge','analytical','insight','logic','cognition',
      'figure it out','make sense','research','information'
    ],
    'Strength/Power': [
      'power','strong','dominance','control','authority','lead','resilient','tough','toughness',
      'in control','take charge','handle it','powerful'
    ],
    Pity: [
      'help me','feel bad','unfair','victim','sympathy','sorry for me','struggling','burden',
      'overwhelmed','exhausted','no one helps','why me','always me'
    ]
  },
  decisions: {
    Novelty: [
      'new','different','experiment','try','change','variety','adventure','explore','novelty',
      'spontaneous','switch it up'
    ],
    Deviance: [
      'rebel','break rules','challenge','nonconform','push limits','disrupt','deviate',
      'reckless','blackout','blacked out','drunk','partied','went too far'
    ],
    Social: [
      'together','with friends','team','group','share','community','people','support',
      'we','us','with others'
    ],
    Conformity: [
      'comply','follow rules','fit in','standard','align','normal','expected','tradition','conform',
      'supposed to','should','the rules'
    ],
    Investment: [
      'invest','commit','dedicate','all-in','long-term','build','buy in','stick with','investment',
      'consistent','keep showing up'
    ],
    Necessity: [
      'must','need to','have to','required','essential','urgent','necessity','forced',
      'no choice','gotta','had to','it falls on me'
    ]
  },
  values: {
    Connection: [
      'connection','relationships','belong','community','together','bond','intimacy','team','support',
      'be there for me','show up','not alone'
    ],
    Freedom: [
      'freedom','autonomy','independence','choose','flexibility','travel','no limits',
      'my own terms','not trapped','not forced'
    ],
    Information: [
      'information','data','facts','evidence','research','sources','learn','figure it out','understand'
    ],
    Recognition: [
      'recognition','status','credit','acknowledgement','fame','reputation','appreciation','be seen'
    ],
    Investment: [
      'investment','compounding','long-term','equity','ROI','build','commitment','stick with it'
    ],
    Growth: [
      'growth','improve','evolve','progress','develop','challenge','learn','get better'
    ]
  }
};

/* ============================
   WEIGHTS + HELPERS
============================ */
const WEIGHTS = {
  word: 1.0,     // single-word hit
  phrase: 1.7,   // multi-word phrase hit
  caseInsensitive: true
};

function escapeRegExp(s: string){ return s.replace(/[-/\\^$*+?.()|[\\]{}]/g, '\\$&'); }

// “not/don’t/never …” near a match suppresses it
function isNegated(full: string, idx: number, windowChars = 14) {
  const start = Math.max(0, idx - windowChars);
  const chunk = full.slice(start, idx).toLowerCase();
  return /\b(no|not|don't|dont|never|isn't|ain't|can't|cannot|won't|without)\b/.test(chunk);
}

/* ============================
   RULES: high-signal pattern boosts
============================ */
const RULES: Rule[] = [
  {
    name: 'burden_on_my_own',
    re: /\b(on\s+my\s+own|by\s+myself|alone)\b/gi,
    boost: { needs: { Acceptance: 1.2, Pity: 0.8 }, values: { Connection: 1.1 } }
  },
  {
    name: 'forced_necessity',
    re: /\b(have to|must|no choice|need to|had to|gotta)\b/gi,
    boost: { decisions: { Necessity: 1.5 } }
  },
  {
    name: 'lack_of_support',
    re: /\b(no one (helps|helping|showing up)|unsupported|left out|excluded)\b/gi,
    boost: { needs: { Acceptance: 1.0, Pity: 1.0 }, values: { Connection: 1.0 } }
  },
  {
    name: 'deviance_blackout',
    re: /\b(black(ed)?\s*out|went too far|reckless|broke the rules?)\b/gi,
    boost: { decisions: { Deviance: 1.6 } }
  },
  {
    name: 'seek_recognition',
    re: /\b(recognition|credit|acknowledge|be seen|notice me)\b/gi,
    boost: { needs: { Significance: 1.2 }, values: { Recognition: 1.2 } }
  },
  {
    name: 'autonomy_vs_trapped',
    re: /\b(on my terms|not trapped|cornered|boxed in)\b/gi,
    boost: { values: { Freedom: 1.2 } }
  }
];

/* ============================
   SCORING (keyword + rules baseline)
============================ */
type BaseItem = Omit<ResultItem,'reasons'>;

function baseKeywordScores(text: string, lexicon: Record<string, readonly string[]>): BaseItem[] {
  const lc = WEIGHTS.caseInsensitive ? text.toLowerCase() : text;
  const out: BaseItem[] = [];

  for (const [label, terms] of Object.entries(lexicon)) {
    let score = 0;
    const hits: string[] = [];

    for (const raw of terms) {
      const t = WEIGHTS.caseInsensitive ? raw.toLowerCase() : raw;

      if (t.includes(' ')) {
        // phrase: count all occurrences
        let i = 0, found = false;
        while (true) {
          i = lc.indexOf(t, i);
          if (i === -1) break;
          if (!isNegated(lc, i)) { score += WEIGHTS.phrase; found = true; }
          i += t.length;
        }
        if (found) hits.push(raw);
      } else {
        // word: boundary, count all
        const re = new RegExp(`\\b${escapeRegExp(t)}\\b`, WEIGHTS.caseInsensitive ? 'gi' : 'g');
        let m: RegExpExecArray | null;
        let any = false;
        while ((m = re.exec(lc)) !== null) {
          if (!isNegated(lc, m.index)) { score += WEIGHTS.word; any = true; }
        }
        if (any) hits.push(raw);
      }
    }
    out.push({ label, score, hits });
  }

  out.sort((a,b)=> b.score - a.score);
  return out;
}

function analyzeBaseline(text: string) {
  const needs = baseKeywordScores(text, TAXONOMY.needs).map(x => ({...x, reasons: [] as string[]}));
  const decisions = baseKeywordScores(text, TAXONOMY.decisions).map(x => ({...x, reasons: [] as string[]}));
  const values = baseKeywordScores(text, TAXONOMY.values).map(x => ({...x, reasons: [] as string[]}));

  const map = (arr: ResultItem[]) => Object.fromEntries(arr.map(x => [x.label, x]));
  const N = map(needs), D = map(decisions), V = map(values);

  // rule boosts with rationales
  for (const rule of RULES) {
    let m: RegExpExecArray | null;
    const re = new RegExp(rule.re.source, rule.re.flags.includes('g') ? rule.re.flags : rule.re.flags + 'g');
    while ((m = re.exec(text)) !== null) {
      const add = (bucket: Record<string, number> | undefined, target: 'needs'|'decisions'|'values') => {
        if (!bucket) return;
        for (const [label, w] of Object.entries(bucket)) {
          const dest = target === 'needs' ? N : target === 'decisions' ? D : V;
          if (dest[label]) {
            dest[label].score += w;
            dest[label].reasons.push(`Rule "${rule.name}" (+${w.toFixed(2)}) via "${m![0]}"`);
          }
        }
      };
      add(rule.boost.needs, 'needs');
      add(rule.boost.decisions, 'decisions');
      add(rule.boost.values, 'values');
    }
  }

  const tidy = (obj: Record<string, ResultItem>) =>
    Object.values(obj).sort((a,b)=> b.score - a.score).map(a => ({ ...a, score: Math.round(a.score*100)/100 }));

  return { needs: tidy(N), decisions: tidy(D), values: tidy(V) };
}

/* ============================
   UI
============================ */
function Panel({ title, data }: { title: string; data: ResultItem[] }) {
  const top = data.slice(0, 3);
  return (
    <div className="card">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
        <div className="label">{title}</div>
        <span className="muted">Top 3</span>
      </div>
      {top.map((r, i)=>(
        <div key={r.label} style={{
          display:'flex', justifyContent:'space-between', gap:8,
          border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:10, margin:'8px 0'
        }}>
          <div>
            <div className="label">{i+1}. {r.label}</div>
            <div className="muted">
              {r.hits.length ? <>matched: {r.hits.slice(0,8).map((h,idx)=>(<span key={idx} className="pill">{h}</span>))}</> : <i>no direct keyword hits</i>}
            </div>
            {r.reasons?.length ? (
              <div className="muted" style={{ marginTop: 6 }}>
                rationale:
                {r.reasons.slice(0,3).map((why, idx)=> (<div key={idx}>• {why}</div>))}
              </div>
            ) : null}
          </div>
          <div className="score">{r.score.toFixed(2)}</div>
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  const [input, setInput] = useState('I love living with intentionality and freedom. I want to master my craft and make an impact while staying true to myself.');
  const [analyzed, setAnalyzed] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<null | {
    needs: {label:string; score:number; rationale?:string}[];
    decisions: {label:string; score:number; rationale?:string}[];
    values: {label:string; score:number; rationale?:string}[];
  }>(null);

  // Transparent baseline (keywords + rules)
  const results = useMemo(() => analyzeBaseline(analyzed || ''),

