// Page 5 — About & Partners. Informational only. No submission entry point.

function StatCards({ mobile }) {
  return (
    <div className="wf-stats" style={mobile ? { gridTemplateColumns: "1fr" } : undefined}>
      <div className="wf-stat">
        <div className="n">247</div>
        <div className="lbl">Voices &amp; counting</div>
      </div>
      <div className="wf-stat">
        <div className="n">42</div>
        <div className="lbl">Countries</div>
      </div>
      <div className="wf-stat">
        <div className="n">6</div>
        <div className="lbl">Themes</div>
      </div>
    </div>
  );
}

function AboutDesktop() {
  return (
    <div className="oyg-app">
      <Header mobile={false} showCounter={true} activeNav="about" voiceCount={247} />
      <div className="wf-body" style={{ maxWidth: 1080, margin: "0 auto", padding: "56px 56px 80px" }}>
        <section className="wf-about-section">
          <Kicker>Section 1</Kicker>
          <h2>ABOUT OWN YOUR GAME</h2>
          <p>
            Own Your Game is a UNICEF youth-led campaign in the lead-up to the FIFA World Cup 2026. Around three hundred young people from forty-two countries have recorded thirty- to forty-five-second videos on what the game means to them — what it has given them, what it has taught them, and what they are asking the adults who run it to protect.
          </p>
          <p>
            Their voices are organised around six themes: fairness, belonging, friendship, confidence, family, and community. Together, the recordings form one continuous letter to the FIFA Committee. The letter grows every time a new voice is added, and is delivered at the end of the tournament.
          </p>
          <p>
            This site is the home of those voices. It is also the live letter itself. Tap any face to listen. Read what the team is saying. Watch the team grow.
          </p>
        </section>

        <section className="wf-about-section">
          <Kicker>Section 2</Kicker>
          <h2>THE MOVEMENT IN NUMBERS</h2>
          <StatCards />
        </section>

        <section className="wf-about-section">
          <Kicker>Section 3</Kicker>
          <h2>FOR PARTNERS AND DONORS</h2>
          <div className="wf-partners">
            <p style={{ maxWidth: "62ch" }}>
              Own Your Game is supported by UNICEF country offices, broadcast partners, and a small number of foundation funders. If you represent an organisation that would like to support the campaign — financially, editorially, or through distribution — we would like to hear from you.
            </p>
            <div className="wf-cta-row">
              <Btn variant="primary">Download partner brief (PDF)</Btn>
              <Btn variant="ghost" arrow>Contact the campaign team</Btn>
            </div>
            <div className="wf-box" style={{ marginTop: 8 }}>
              Note: this page is informational only. No submission entry point for young people lives here.
            </div>
          </div>
        </section>

        <section className="wf-about-section">
          <Kicker>Section 4</Kicker>
          <h2>THE LETTER TO FIFA</h2>
          <div className="wf-letter-banner">
            <div>
              <h3>One letter. Two hundred and forty-seven names. And counting.</h3>
              <p>
                The letter is read aloud at a UNICEF event during the FIFA World Cup 2026 final week, and delivered to the FIFA Committee at the end of the tournament. Until then, it grows here, in public.
              </p>
            </div>
            <div>
              <Btn variant="amber" arrow>Read the letter</Btn>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}

function AboutMobile() {
  return (
    <div className="oyg-app">
      <Header mobile showCounter={true} voiceCount={247} />
      <div className="wf-body wf-body--mobile">
        <section className="wf-about-section wf-about-section--mobile">
          <Kicker>Section 1</Kicker>
          <h2>ABOUT OWN YOUR GAME</h2>
          <p>
            Own Your Game is a UNICEF youth-led campaign in the lead-up to the FIFA World Cup 2026. About three hundred young people from forty-two countries have recorded short videos on what the game means to them.
          </p>
          <p>
            Their voices are organised around six themes: fairness, belonging, friendship, confidence, family, and community — together they form one continuous letter to the FIFA Committee.
          </p>
          <p>
            This site is the home of those voices. It is also the live letter itself.
          </p>
        </section>

        <section className="wf-about-section wf-about-section--mobile">
          <Kicker>Section 2</Kicker>
          <h2>THE MOVEMENT IN NUMBERS</h2>
          <StatCards mobile />
        </section>

        <section className="wf-about-section wf-about-section--mobile">
          <Kicker>Section 3</Kicker>
          <h2>FOR PARTNERS AND DONORS</h2>
          <div className="wf-partners wf-partners--mobile">
            <p>
              Own Your Game is supported by UNICEF country offices and a small number of partners. If you represent an organisation that would like to support the campaign, we would like to hear from you.
            </p>
            <div className="wf-cta-stack">
              <Btn variant="primary">Download partner brief (PDF)</Btn>
              <Btn variant="ghost" arrow>Contact the campaign team</Btn>
            </div>
          </div>
        </section>

        <section className="wf-about-section wf-about-section--mobile">
          <Kicker>Section 4</Kicker>
          <h2>THE LETTER TO FIFA</h2>
          <div className="wf-letter-banner wf-letter-banner--mobile">
            <div>
              <h3 style={{ fontSize: 22 }}>One letter. 247 names. And counting.</h3>
              <p style={{ fontSize: 14 }}>
                Delivered to the FIFA Committee at the end of the World Cup. Until then, it grows here.
              </p>
            </div>
            <div className="wf-cta-stack">
              <Btn variant="amber" arrow>Read the letter</Btn>
            </div>
          </div>
        </section>
      </div>
      <Footer mobile />
    </div>
  );
}

Object.assign(window, { AboutDesktop, AboutMobile });
