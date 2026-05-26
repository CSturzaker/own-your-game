// Page 3 — The Letter. Desktop + Mobile. Long single column, six theme sections.

const THEME_INTROS = {
  fairness: "We learned about fairness on a pitch, before we learned about it in a book. A referee's whistle is the first law that ever felt like ours.",
  belonging: "A team is the smallest country we have ever been a citizen of. It does not check our papers. It only checks that we showed up to training.",
  friendship: "The friendships we have made through the game are not extras. They are the reason we keep playing in the rain, in the wind, in the dark before school.",
  confidence: "When we play, we are bigger than we are in the rest of our lives. We are louder. We take up more space. Then we carry that home with us.",
  family: "Our families gave us the game, or the game gave us a family. For many of us, the line is not clean. Both are true at once.",
  community: "The pitch in our neighbourhood is the place where everyone meets. It is the meeting room our towns never built for us. We are asking you to protect it.",
};

function ThemeSection({ theme, mobile }) {
  return (
    <section className="wf-theme">
      <Divider>{theme.toUpperCase()}</Divider>
      <div className="wf-theme-body">
        <p>{THEME_INTROS[theme]}</p>
        <p style={{ color: "var(--c-ink-2)" }}>
          {/* Placeholder body */}
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. — A paragraph of 3–5 sentences in the final letter, woven from real quotes.
        </p>
      </div>
      <div className="wf-theme-signers">
        <span className="label">Signed by</span>
        {Array.from({ length: mobile ? 6 : 8 }).map((_, i) => <Avatar key={i} size="sm" />)}
        <span className="more">+ 31 more</span>
      </div>
    </section>
  );
}

function LetterDesktop() {
  return (
    <div className="oyg-app">
      <Header mobile={false} showCounter={true} activeNav="letter" voiceCount={247} />
      <div className="wf-body" style={{ padding: "56px 80px 80px" }}>
        <div className="wf-letter-page">
          <header className="wf-letter-head">
            <Kicker>A letter to the FIFA Committee</Kicker>
            <h1 style={{ marginTop: 12 }}>A LETTER TO THE FIFA COMMITTEE</h1>
            <p className="sub">From the young people of the world.</p>
            <div className="sig-count">
              <span className="dot" />
              Signed by <b>247 voices.</b> Growing daily.
            </div>
          </header>

          <p className="wf-letter-opener">
            Dear FIFA Committee, We are the young people who play, watch, and love football. We are writing to you from forty-two countries — from cities and villages, from pitches and parking lots, from quiet kitchens where a match is on a phone. We are writing as one team. What follows is what the game has taught us, and what we are asking you to protect.
          </p>

          {THEMES.map(t => <ThemeSection key={t} theme={t} />)}

          <div style={{ paddingTop: 32, borderTop: "2px solid var(--c-ink)", display: "flex", flexDirection: "column", gap: 8 }}>
            <p className="wf-letter-close">With hope and respect,</p>
            <p className="wf-letter-signoff">The young people of the world.</p>
          </div>

          <div style={{ display: "flex", justifyContent: "center", paddingTop: 24 }}>
            <Btn variant="primary" arrow>Share the letter</Btn>
          </div>

          <div className="wf-box" style={{ alignSelf: "center", marginTop: 8 }}>
            Note: no submission entry point on this page. Voices are added via the contributor flow elsewhere.
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function LetterMobile() {
  return (
    <div className="oyg-app">
      <Header mobile showCounter={true} voiceCount={247} />
      <div className="wf-body wf-body--mobile">
        <header className="wf-letter-head" style={{ paddingBottom: 16 }}>
          <Kicker>A letter to FIFA</Kicker>
          <h1 style={{ marginTop: 8, fontSize: 28 }}>A LETTER TO THE FIFA COMMITTEE</h1>
          <p className="sub" style={{ fontSize: 15 }}>From the young people of the world.</p>
          <div className="sig-count">
            <span className="dot" />
            Signed by <b>247 voices.</b> Growing daily.
          </div>
        </header>

        <p className="wf-letter-opener" style={{ fontSize: 16, lineHeight: 1.65 }}>
          Dear FIFA Committee, We are the young people who play, watch, and love football. We are writing from forty-two countries — from pitches and parking lots, from quiet kitchens. What follows is what the game has taught us.
        </p>

        {THEMES.map(t => <ThemeSection key={t} theme={t} mobile />)}

        <div style={{ paddingTop: 24, borderTop: "2px solid var(--c-ink)", display: "flex", flexDirection: "column", gap: 4 }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 16, margin: 0 }}>With hope and respect,</p>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 19, margin: 0 }}>The young people of the world.</p>
        </div>

        <div className="wf-cta-stack" style={{ paddingTop: 16 }}>
          <Btn variant="primary" arrow>Share the letter</Btn>
        </div>
      </div>
      <Footer mobile />
    </div>
  );
}

Object.assign(window, { LetterDesktop, LetterMobile, ThemeSection });
