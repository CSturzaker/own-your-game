// Page 2 — Player card. Desktop = modal overlay over dimmed home; Mobile = full-screen.

function PlayerDesktop() {
  return (
    <div className="oyg-app" style={{ position: "relative" }}>
      {/* Dimmed home in background */}
      <div style={{ filter: "saturate(0.4)", opacity: 0.55 }}>
        <Header mobile={false} showCounter={true} />
        <div className="wf-body" style={{ paddingBottom: 40 }}>
          <section className="wf-hero">
            <div>
              <Kicker>A UNICEF campaign · FIFA World Cup 2026</Kicker>
              <h1 style={{ marginTop: 16 }}>
                <span className="accent" />WN YOUR<br />GAME
              </h1>
              <p className="strap">The team writing to FIFA.</p>
            </div>
            <div className="counter">
              <div className="n">247</div>
              <div className="lbl"><span className="dot" />voices and counting</div>
            </div>
          </section>
          <div className="wf-eleven">
            <div className="wf-eleven-row" data-row="1">
              {ELEVEN.slice(0, 4).map((p, i) => <Tile key={i} num={i + 1} {...p} />)}
            </div>
            <div className="wf-eleven-row" data-row="2">
              {ELEVEN.slice(4, 7).map((p, i) => <Tile key={i} num={i + 5} {...p} />)}
            </div>
          </div>
        </div>
      </div>

      {/* Modal overlay */}
      <div className="wf-overlay-scrim">
        <div className="wf-overlay">
          <button className="wf-overlay-close">✕</button>

          <div className="wf-overlay-left">
            <VideoPlaceholder label="Video — 16:9 · click to play" duration="0:38" />
            <div className="wf-overlay-controls" style={{ marginTop: 16, borderTop: "none", paddingTop: 0 }}>
              <span className="wf-control">CC · Captions on</span>
              <span className="wf-control">🔊 Sound on</span>
              <span className="wf-control">🌐 EN ▾</span>
            </div>
          </div>

          <div className="wf-overlay-right">
            <div>
              <div className="meta">№ 04 · Player card</div>
              <h2 style={{ marginTop: 8 }}>Sofía, 14</h2>
              <div className="meta" style={{ marginTop: 4 }}>Rosario, Argentina 🇦🇷</div>
            </div>

            <Tag theme="friendship">on friendship</Tag>

            <p className="quote">
              "When I play, the only thing that matters is the next pass — and the next pass is to someone."
            </p>

            <div style={{ flex: 1 }} />

            <div className="wf-overlay-sign">
              <div className="signed">Sofía has signed the letter.</div>
              <div className="wf-cta-row">
                <Btn variant="primary" arrow>Read the letter</Btn>
                <Btn variant="ghost" arrow>Next player</Btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerMobile() {
  return (
    <div className="oyg-app">
      <Header mobile showCounter={true} />
      <div className="wf-player-mobile">
        <button className="close-btn">✕</button>
        <VideoPlaceholder label="Video · 16:9" duration="0:38" />

        <div className="wf-overlay-controls" style={{ borderTop: "none", paddingTop: 0, gap: 8 }}>
          <span className="wf-control">CC</span>
          <span className="wf-control">🔊</span>
          <span className="wf-control" style={{ marginLeft: "auto" }}>🌐 EN ▾</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--c-ink-3)", fontWeight: 600 }}>
            № 04 · Player card
          </div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 700, fontStretch: "85%",
            textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1,
            fontSize: 28, margin: 0,
          }}>Sofía, 14</h2>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--c-ink-2)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Rosario, Argentina 🇦🇷
          </div>
          <div style={{ marginTop: 6 }}><Tag theme="friendship">on friendship</Tag></div>
          <p style={{
            fontFamily: "var(--font-display)", fontWeight: 500, fontStyle: "italic",
            fontSize: 19, lineHeight: 1.35, color: "var(--c-ink)", margin: "8px 0 0",
          }}>
            "When I play, the only thing that matters is the next pass."
          </p>
        </div>

        <div style={{ borderTop: "1px solid var(--c-rule-soft)", paddingTop: 16, marginTop: 4, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--c-ink-2)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--c-live)", fontWeight: 700 }}>✓</span>
            Sofía has signed the letter.
          </div>
          <div className="wf-cta-stack">
            <Btn variant="primary" arrow>Read the letter</Btn>
            <Btn variant="ghost" arrow>Bring on the next player</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PlayerDesktop, PlayerMobile });
