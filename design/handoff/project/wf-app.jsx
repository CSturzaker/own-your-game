// Wireframes canvas — 5×2 grid (rows = page, columns = desktop / mobile).

function Canvas() {
  return (
    <div className="canvas">
      <header className="canvas-head">
        <h1><span className="canvas-O" />WN YOUR GAME — WIREFRAMES</h1>
        <p>
          Mid-fidelity wireframes for the five public-facing pages of the digital space. Real typography, real components, real spacing. Placeholder portraits and dummy copy where final content will go. Treat this set as the brief for a development team — structure first, polish later.
        </p>
        <div className="canvas-meta">
          <span><b>5 pages</b> × 2 viewports</span>
          <span><b>Desktop</b> 1440 px</span>
          <span><b>Mobile</b> 375 px</span>
          <span>Design system · Own Your Game</span>
        </div>
      </header>

      <section className="page-row">
        <div className="page-row-head">
          <span className="page-no">Page 01</span>
          <h2>Home — the team sheet</h2>
          <span className="page-tag">A donor reads it in five seconds. A young person wants to tap a face.</span>
        </div>
        <div className="page-row-frames">
          <Frame viewport="desktop" page="Home"><HomeDesktop /></Frame>
          <Frame viewport="mobile"  page="Home"><HomeMobile  /></Frame>
        </div>
      </section>

      <section className="page-row">
        <div className="page-row-head">
          <span className="page-no">Page 02</span>
          <h2>Player card</h2>
          <span className="page-tag">Modal overlay on desktop · full-screen on mobile.</span>
        </div>
        <div className="page-row-frames">
          <Frame viewport="desktop" page="Player card"><PlayerDesktop /></Frame>
          <Frame viewport="mobile"  page="Player card"><PlayerMobile  /></Frame>
        </div>
      </section>

      <section className="page-row">
        <div className="page-row-head">
          <span className="page-no">Page 03</span>
          <h2>The letter</h2>
          <span className="page-tag">The spine of the site. Six themes. No submission entry point.</span>
        </div>
        <div className="page-row-frames">
          <Frame viewport="desktop" page="Letter"><LetterDesktop /></Frame>
          <Frame viewport="mobile"  page="Letter"><LetterMobile  /></Frame>
        </div>
      </section>

      <section className="page-row">
        <div className="page-row-head">
          <span className="page-no">Page 04</span>
          <h2>The full squad</h2>
          <span className="page-tag">All voices, browsable and filterable. 8-col desktop · 3-col mobile.</span>
        </div>
        <div className="page-row-frames">
          <Frame viewport="desktop" page="Squad"><SquadDesktop /></Frame>
          <Frame viewport="mobile"  page="Squad"><SquadMobile  /></Frame>
        </div>
      </section>

      <section className="page-row">
        <div className="page-row-head">
          <span className="page-no">Page 05</span>
          <h2>About &amp; partners</h2>
          <span className="page-tag">Campaign context · numbers · partner contact · closing letter banner.</span>
        </div>
        <div className="page-row-frames">
          <Frame viewport="desktop" page="About"><AboutDesktop /></Frame>
          <Frame viewport="mobile"  page="About"><AboutMobile  /></Frame>
        </div>
      </section>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Canvas />);
