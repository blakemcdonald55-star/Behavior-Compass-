# Behavior Compass Classifier (Needs • Decisions • Values)

Chase Hughes Behavior Compass–inspired keyword model. Paste a sentence, click **Analyze**, and see the top 3 Needs, Decisions, and Values with evidence tokens.

## Quick start (local)
```bash
npm install
npm run dev
# open http://localhost:3000
```

## Deploy to Vercel
1) Push this folder to a new GitHub repo.
2) On https://vercel.com, New Project → Import your repo → Framework: **Next.js** → Deploy.
3) Done. Get your live URL and start pasting sentences.

## Edit taxonomy
Open `app/page.tsx` and edit the `TAXONOMY` object. Categories included:

- **Needs**: Significance, Approval, Acceptance, Intelligence, Strength/Power, Pity
- **Decisions**: Novelty, Deviance, Social, Conformity, Investment, Necessity
- **Values**: Connection, Freedom, Information, Recognition, Investment, Growth

## Notes
- This is an interpretable keyword/phrase model (transparent scoring).
- No external UI libraries, just minimal CSS for portability.
