// Page 4 — The Full Squad. Browsable, filterable.

function SquadDesktop() {
  return (
    <div className="oyg-app">
      <Header mobile={false} showCounter={true} activeNav="squad" voiceCount={247} />
      <div className="wf-body">
        <header style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Kicker>The full squad</Kicker>
          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 700, fontStretch: "85%",
            textTransform: "uppercase", letterSpacing: "0.04em", fontSize: 56, lineHeight: 1, margin: 0,
          }}>
            THE FULL SQUAD — 247 VOICES
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 17, color: "var(--c-ink-2)", margin: 0, maxWidth: "60ch" }}>
            Every young person who has added their voice. New voices arrive every day. Filter by theme, country, or language.
          </p>
        </header>

        <div className="wf-filter-bar">
          <span className="label">Filter</span>
          <span className="wf-select">Theme · All</span>
          <span className="wf-select">Country · All</span>
          <span className="wf-select">Language · All</span>
          <span className="wf-filter-bar-right">Showing 24 of 247</span>
        </div>

        <div className="wf-squad-grid">
          {SQUAD_SAMPLE.slice(0, 24).map((p, i) => (
            <Tile key={i} className="wf-squad-tile" num={i + 1} name={p.name} cc={p.cc} theme={p.theme} tagged />
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center", paddingTop: 16 }}>
          <Btn variant="ghost">Load more — 223 voices remaining</Btn>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function SquadMobile() {
  return (
    <div className="oyg-app">
      <Header mobile showCounter={true} voiceCount={247} />
      <div className="wf-body wf-body--mobile">
        <header style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Kicker>The full squad</Kicker>
          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 700, fontStretch: "85%",
            textTransform: "uppercase", letterSpacing: "0.04em", fontSize: 28, lineHeight: 1, margin: 0,
          }}>
            THE FULL SQUAD<br />247 VOICES
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--c-ink-2)", margin: 0 }}>
            Every young person who has added their voice.
          </p>
        </header>

        <div className="wf-mobile-filter">
          <span className="wf-btn wf-btn--sm wf-btn--ghost" style={{ width: "100%" }}>Filter & sort</span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--c-ink-3)" }}>24 / 247</span>
        </div>

        <div className="wf-squad-grid wf-squad-grid--mobile">
          {SQUAD_SAMPLE.slice(0, 18).map((p, i) => (
            <Tile key={i} className="wf-squad-tile" num={i + 1} name={p.name} cc={p.cc} theme={p.theme} tagged />
          ))}
        </div>

        <div className="wf-cta-stack">
          <Btn variant="ghost">Load more</Btn>
        </div>
      </div>
      <Footer mobile />
    </div>
  );
}

Object.assign(window, { SquadDesktop, SquadMobile });
