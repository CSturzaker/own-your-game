// Page 1 — Home (the team sheet). Desktop and mobile.

function HomeDesktop() {
  return (
    <div className="oyg-app">
      <Header mobile={false} showCounter={false} />
      <div className="wf-body">
        {/* Hero band */}
        <section className="wf-hero">
          <div>
            <Kicker>A UNICEF campaign · FIFA World Cup 2026</Kicker>
            <h1 style={{ marginTop: 16 }}>
              <span className="accent" />WN YOUR<br />GAME
            </h1>
            <p className="strap">The team writing to FIFA.<br />Meet the team.</p>
          </div>
          <div className="counter">
            <div className="n">247</div>
            <div className="lbl"><span className="dot" />voices and counting</div>
            <div className="sub">Young people from 42 countries have added their voice. New voices arrive every day until the World Cup final.</div>
          </div>
        </section>

        {/* Eleven — team sheet layout: 1 GK · 4 DEF · 3 MID · 3 FWD */}
        <section style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 24 }}>
            <div>
              <Kicker>The starting eleven</Kicker>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, marginTop: 12, letterSpacing: "-0.01em" }}>
                Today's team. Tap a face to listen.
              </h2>
            </div>
            <div className="wf-eleven-hint">
              <span className="dot" />
              The eleven rotates — one tile cross-fades every ~12s
            </div>
          </div>

          <div className="wf-eleven">
            <div className="wf-eleven-row" data-row="0">
              {/* Goalkeeper — highlighted as "about to swap" */}
              <Tile num={1} name={ELEVEN[0].name} cc={ELEVEN[0].cc} />
            </div>
            <div className="wf-eleven-row" data-row="1">
              {ELEVEN.slice(1, 5).map((p, i) => <Tile key={i} num={i + 2} {...p} />)}
            </div>
            <div className="wf-eleven-row" data-row="2">
              {ELEVEN.slice(5, 8).map((p, i) => <Tile key={i} num={i + 6} {...p} />)}
            </div>
            <div className="wf-eleven-row" data-row="3">
              {ELEVEN.slice(8, 11).map((p, i) => <Tile key={i} num={i + 9} {...p} />)}
            </div>
          </div>

          <div className="wf-cta-row" style={{ marginTop: 16 }}>
            <Btn variant="primary" arrow>Bring on the next eleven</Btn>
            <Btn variant="ghost" arrow>Read the letter</Btn>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}

function HomeMobile() {
  return (
    <div className="oyg-app">
      <Header mobile showCounter={false} />
      <div className="wf-body wf-body--mobile">
        <section className="wf-hero-mobile">
          <div>
            <div className="wf-kicker" style={{ fontSize: 10 }}>UNICEF · World Cup 2026</div>
            <h1 style={{ marginTop: 12 }}>
              <span className="accent" />WN YOUR GAME
            </h1>
            <p className="strap" style={{ marginTop: 12 }}>The team writing to FIFA. Meet the team.</p>
          </div>
          <div className="counter">
            <div className="n">247</div>
            <div className="lbl"><span className="dot" />voices and counting</div>
            <div className="sub">Young people from 42 countries are writing to FIFA. New voices every day.</div>
          </div>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="wf-kicker" style={{ fontSize: 10 }}>The starting eleven</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20, letterSpacing: "-0.01em" }}>
            Today's team. Tap a face to listen.
          </div>
          <div className="wf-eleven-hint" style={{ fontSize: 11, marginTop: 0 }}>
            <span className="dot" />Tiles rotate softly every ~12s
          </div>

          <div className="wf-eleven-mobile">
            {ELEVEN.map((p, i) => <Tile key={i} num={i + 1} {...p} />)}
          </div>

          <div className="wf-cta-stack" style={{ marginTop: 16 }}>
            <Btn variant="primary" arrow>Bring on the next eleven</Btn>
            <Btn variant="ghost" arrow>Read the letter</Btn>
          </div>
        </section>
      </div>
      <Footer mobile />
    </div>
  );
}

Object.assign(window, { HomeDesktop, HomeMobile });
