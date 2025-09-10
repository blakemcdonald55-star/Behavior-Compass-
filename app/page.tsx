{/* Needs */}
<div>
  <h3 className="font-semibold mb-2">Needs</h3>
  <ul className="space-y-1">
    {rulesResults.needs.map((item, i) => (
      <li key={i} className="flex items-center justify-between">
        <span>{item.label}</span>
        <span className="ml-2 text-white/40 text-xs">rules</span>
      </li>
    ))}
  </ul>
</div>

{/* Decisions */}
<div>
  <h3 className="font-semibold mb-2">Decisions</h3>
  <ul className="space-y-1">
    {rulesResults.decisions.map((item, i) => (
      <li key={i} className="flex items-center justify-between">
        <span>{item.label}</span>
        <span className="ml-2 text-white/40 text-xs">rules</span>
      </li>
    ))}
  </ul>
</div>

{/* Values */}
<div>
  <h3 className="font-semibold mb-2">Values</h3>
  <ul className="space-y-1">
    {rulesResults.values.map((item, i) => (
      <li key={i} className="flex items-center justify-between">
        <span>{item.label}</span>
        <span className="ml-2 text-white/40 text-xs">rules</span>
      </li>
    ))}
  </ul>
</div>



