// Shared primitives, data, and chrome (header/footer) for wireframes.
// Loaded as a Babel script — exports onto window for sibling files.

const THEMES = ["fairness", "belonging", "friendship", "confidence", "family", "community"];

// Eleven starting names — first name + country code + theme
const ELEVEN = [
{ name: "Amara", cc: "GH", theme: "belonging" },
{ name: "Lior", cc: "IL", theme: "fairness" },
{ name: "Kenji", cc: "JP", theme: "confidence" },
{ name: "Sofía", cc: "AR", theme: "friendship" },
{ name: "Idris", cc: "MA", theme: "community" },
{ name: "Mei", cc: "CN", theme: "family" },
{ name: "Théo", cc: "FR", theme: "fairness" },
{ name: "Nadia", cc: "EG", theme: "belonging" },
{ name: "Carlos", cc: "MX", theme: "community" },
{ name: "Anya", cc: "IN", theme: "confidence" },
{ name: "Olu", cc: "NG", theme: "friendship" }];


// A broader squad sample for squad page
const SQUAD_SAMPLE = [
...ELEVEN,
{ name: "Yusra", cc: "SY", theme: "belonging" },
{ name: "Bashir", cc: "PK", theme: "family" },
{ name: "Lena", cc: "DE", theme: "fairness" },
{ name: "Diego", cc: "BR", theme: "community" },
{ name: "Aisha", cc: "KE", theme: "confidence" },
{ name: "Tomás", cc: "PT", theme: "friendship" },
{ name: "Hana", cc: "KR", theme: "family" },
{ name: "Oren", cc: "AU", theme: "fairness" },
{ name: "Priya", cc: "IN", theme: "belonging" },
{ name: "Marco", cc: "IT", theme: "community" },
{ name: "Zara", cc: "ZA", theme: "confidence" },
{ name: "Niko", cc: "GR", theme: "friendship" },
{ name: "Ada", cc: "TR", theme: "family" },
{ name: "Joon", cc: "KR", theme: "fairness" },
{ name: "Lucia", cc: "ES", theme: "belonging" },
{ name: "Femi", cc: "NG", theme: "community" },
{ name: "Ravi", cc: "LK", theme: "confidence" }];


// ----- Chrome ----------------------------------------------------

function Header({ mobile, showCounter = true, voiceCount = 247, activeNav }) {
  if (mobile) {
    return (
      <header className="wf-header wf-header--mobile" style={{ justifyContent: "flex-start" }}>
        <div className="wf-unicef-logo">UNICEF</div>
        {showCounter &&
        <div className="wf-header-counter">
            <span className="wf-live-dot" />
            <b>{voiceCount}</b>
            <span>voices</span>
          </div>
        }
        <div className="wf-menu">
          <span /><span /><span />
        </div>
      </header>);

  }
  return (
    <header className="wf-header">
      <div className="wf-logo-lockup">
        <div className="wf-unicef-logo">UNICEF</div>
      </div>
      <div className="wf-wordmark">
        <span className="wf-O" />WN YOUR GAME
      </div>
      {showCounter &&
      <div className="wf-header-counter">
          <span className="wf-live-dot" />
          <b>{voiceCount}</b>
          <span>voices and counting</span>
        </div>
      }
      <nav className="wf-nav">
        <a style={{ color: activeNav === "about" ? "var(--c-ink)" : undefined, fontWeight: activeNav === "about" ? 600 : 500 }}>About</a>
        <a style={{ color: activeNav === "letter" ? "var(--c-ink)" : undefined, fontWeight: activeNav === "letter" ? 600 : 500 }}>The Letter</a>
        <a style={{ color: activeNav === "squad" ? "var(--c-ink)" : undefined, fontWeight: activeNav === "squad" ? 600 : 500 }}>The Squad</a>
        <a style={{ color: activeNav === "contact" ? "var(--c-ink)" : undefined, fontWeight: activeNav === "contact" ? 600 : 500 }}>Contact</a>
      </nav>
    </header>);

}

function Footer({ mobile }) {
  return (
    <footer className={"wf-footer" + (mobile ? " wf-footer--mobile" : "")}>
      <div>
        <h5>Own Your Game</h5>
        <p>A UNICEF youth-led campaign ahead of the FIFA World Cup 2026. The letter is delivered at the end of the tournament.</p>
        <div className="wf-lang">🌐 English</div>
      </div>
      <div>
        <h5>Campaign</h5>
        <a>About</a><a>The Letter</a><a>The Squad</a><a>The themes</a>
      </div>
      <div>
        <h5>For partners</h5>
        <a>Partner brief (PDF)</a><a>Press</a><a>Contact the team</a>
      </div>
      <div>
        <h5>UNICEF</h5>
        <a>unicef.org</a><a>Privacy</a><a>Terms</a><a>Safeguarding</a>
      </div>
      <div className="wf-footer-foot">
        <span>© UNICEF 2026 — Own Your Game</span>
        <span>The team writing to FIFA. Meet the team.</span>
      </div>
    </footer>);

}

// ----- Primitives ------------------------------------------------

function Portrait({ className = "" }) {
  return <div className={"wf-portrait " + className} />;
}

function Tile({ num, name, cc, theme, tagged = false, className = "" }) {
  return (
    <div className={"wf-tile " + className}>
      <Portrait />
      <div className="wf-tile-num">{num != null ? String(num).padStart(2, "0") : ""}</div>
      {tagged && theme &&
      <div className="wf-tile-tag">{theme}</div>
      }
      <div className="wf-tile-meta">
        <div className="wf-tile-name">{name}</div>
        <div className="wf-tile-country">
          <span className="wf-tile-flag" />{cc}
        </div>
      </div>
    </div>);

}

function Avatar({ size = "" }) {
  return <div className={"wf-avatar " + (size ? "wf-avatar--" + size : "")} />;
}

function VideoPlaceholder({ label = "Video — 16:9", duration = "0:42" }) {
  return (
    <div className="wf-video">
      <div className="wf-video-label">{label}</div>
      <div className="wf-video-play" />
      <div className="wf-video-duration">{duration}</div>
    </div>);

}

function Btn({ children, variant = "primary", arrow = false }) {
  const cls = variant === "ghost" ? "wf-btn wf-btn--ghost" :
  variant === "amber" ? "wf-btn wf-btn--amber" :
  "wf-btn";
  return <span className={cls}>{children}{arrow && <span className="arr">→</span>}</span>;
}

function Pl({ width = "full" }) {
  return <div className={"wf-pl wf-pl--" + width} />;
}

// Three lines of placeholder text — used for body paragraphs in wireframes
function PlBlock({ lines = 3, lastShort = true, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, ...style }}>
      {Array.from({ length: lines }).map((_, i) =>
      <Pl key={i} width={i === lines - 1 && lastShort ? "mid" : "full"} />
      )}
    </div>);

}

function Kicker({ children }) {
  return <div className="wf-kicker">{children}</div>;
}

function Tag({ theme, children }) {
  return <span className={"wf-tag wf-tag--" + theme}>{children || theme}</span>;
}

// Frame wrapper
function Frame({ viewport, page, children }) {
  const widthLabel = viewport === "desktop" ? "1440 × auto" : "375 × auto";
  return (
    <div className="frame">
      <div className="frame-label">
        <span>{page} · {viewport}</span>
        <span className="frame-w">{widthLabel}</span>
      </div>
      <div className={"frame-canvas frame--" + viewport}>
        {children}
      </div>
    </div>);

}

// Section divider for the letter
function Divider({ children }) {
  return (
    <div className="wf-divider">
      <span className="line" />
      <span>── ON {children} ──</span>
      <span className="line" />
    </div>);

}

Object.assign(window, {
  THEMES, ELEVEN, SQUAD_SAMPLE,
  Header, Footer,
  Portrait, Tile, Avatar, VideoPlaceholder, Btn, Pl, PlBlock, Kicker, Tag, Frame, Divider
});