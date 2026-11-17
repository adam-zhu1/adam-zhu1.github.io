/* Draft-only: a small switch between the concept mocks and the current site. */
const ITEMS: [string, string][] = [["lane", "Lane"], ["instrument", "Instrument"], ["", "Current site"]];

export function Switcher() {
  const cur = new URLSearchParams(location.search).get("concept") ?? "";
  return (
    <div style={{
      position: "fixed", left: 14, bottom: 14, zIndex: 99, display: "flex", gap: 4, padding: 4, borderRadius: 999,
      background: "rgba(20,20,22,.92)", font: "400 12px/1 var(--mono)", boxShadow: "0 4px 18px rgba(0,0,0,.3)",
    }}>
      {ITEMS.map(([k, label]) => (
        <a key={k} href={k ? `/?concept=${k}` : "/"} style={{
          padding: "7px 11px", borderRadius: 999, textDecoration: "none", border: 0,
          color: cur === k ? "#111" : "#c9c9cf", background: cur === k ? "#f3f2ee" : "transparent",
        }}>{label}</a>
      ))}
    </div>
  );
}
