/* global React */
const { useState, useEffect, useRef, useMemo } = React;

// ============================================================
// WORDMARK — the agency's Own Your Game logo SVG.
// Sizes:
//   header  → 48px desktop / 36px mobile (driven by .h-bar.m img CSS)
//   footer  → 64px (CSS)
//   hero    → up to 200px (consumer sets size explicitly)
// ============================================================
const LOGO_SRC = "assets/own-your-game-logo.svg";

const Wordmark = ({ size = "header", height }) => {
  if (size === "hero") {
    return (
      <img
        src={LOGO_SRC}
        alt="Own Your Game"
        style={{ display: "block", height: height ?? 200, width: "auto" }}
      />
    );
  }
  return (
    <button
      className={size === "footer" ? "f-mark" : "h-mark"}
      aria-label="Own Your Game — home"
      onClick={() => window.gotoPage?.("home")}
    >
      <img src={LOGO_SRC} alt="Own Your Game" />
    </button>
  );
};
window.Wordmark = Wordmark;

// ============================================================
// HEADER
// ============================================================
const Header = ({ sticky = false, mobile = false, active = "home", showSkip = false, count = 247 }) => {
  if (mobile) {
    return (
      <header className={`h-bar m ${sticky ? "sticky" : ""}`}>
        {showSkip && <a href="#main" className="skip">Skip to content</a>}
        <Wordmark/>
        <div className="h-counter">
          <span className="dot"/>
          <b>{count}</b><span className="lbl">voices and counting</span>
        </div>
        <button className="menu-btn" aria-label="Open menu">
          <span/><span/><span/>
        </button>
      </header>
    );
  }
  return (
    <header className={`h-bar ${sticky ? "sticky" : ""}`}>
      {showSkip && <a href="#main" className="skip">Skip to content</a>}
      <Wordmark/>
      <nav className="h-nav">
        <button className={active==="home" ? "active" : ""} onClick={()=>window.gotoPage?.("home")}>Home</button>
        <button className={active==="letter" ? "active" : ""} onClick={()=>window.gotoPage?.("letter")}>The Letter</button>
        <button className={active==="squad" ? "active" : ""} onClick={()=>window.gotoPage?.("squad")}>The Squad</button>
        <button className={active==="about" ? "active" : ""} onClick={()=>window.gotoPage?.("about")}>About</button>
      </nav>
      <div className="h-counter">
        <span className="dot"/>
        <b>{count}</b><span className="lbl">voices and counting</span>
      </div>
      <button className="h-cta">Share <span style={{fontSize:"1.1em"}}>↗</span></button>
    </header>
  );
};
window.Header = Header;

// ============================================================
// FOOTER
// Standardised columns: THE LETTER · THE SQUAD · PROJECT · UNICEF
// (For-partners links collapsed into PROJECT; Sign-the-letter
// removed — campaign has no public submission entry point.)
// ============================================================
const Footer = ({ mobile = false }) => (
  <footer className={`f-bar ${mobile ? "m" : ""}`}>
    <div>
      <div style={{display:"flex", alignItems:"center", gap: 28, marginBottom: 16, flexWrap:"wrap"}}>
        <Wordmark size="footer"/>
        <img
          src="assets/unicef-logo.svg"
          alt="UNICEF"
          style={{height: 44, width:"auto", display:"block"}}
        />
      </div>
      <p>Own Your Game, a youth-led campaign</p>
      <div className="f-lang">English (United Kingdom)</div>
    </div>
    <div>
      <h5>The Letter</h5>
      <a href="#">Read the letter</a>
      <a href="#">By theme</a>
      <a href="#">By language</a>
      <a href="#">Download (PDF)</a>
    </div>
    <div>
      <h5>The Squad</h5>
      <a href="#">All 247 voices</a>
      <a href="#">By country</a>
      <a href="#">Starting eleven</a>
      <a href="#">By theme</a>
    </div>
    <div>
      <h5>Project</h5>
      <a href="#">About</a>
      <a href="#">Partners</a>
      <a href="#">For press</a>
      <a href="#">For partners</a>
      <a href="#">Contact</a>
    </div>
    <div>
      <h5>UNICEF</h5>
      <a href="#">UNICEF.org</a>
      <a href="#">Youth advocacy</a>
      <a href="#">Child safeguarding</a>
      <a href="#">Donate</a>
    </div>
    <div className="f-foot">
      <span>© 2026 The Own Your Game collective. Independent youth campaign · in partnership with UNICEF.</span>
      <span>Privacy · Terms · Accessibility</span>
    </div>
  </footer>
);
window.Footer = Footer;

// ============================================================
// PORTRAIT — varied placeholder
// ============================================================
const SILHOUETTES = [
  // simple bust silhouettes — varied posture
  <svg key="a" viewBox="0 0 100 120" preserveAspectRatio="xMidYMax meet">
    <circle cx="50" cy="42" r="20"/>
    <path d="M14 120 C 16 85, 38 70, 50 70 C 62 70, 84 85, 86 120 Z"/>
  </svg>,
  <svg key="b" viewBox="0 0 100 120" preserveAspectRatio="xMidYMax meet">
    <ellipse cx="50" cy="40" rx="19" ry="22"/>
    <path d="M12 120 C 14 82, 36 66, 50 66 C 64 66, 86 82, 88 120 Z"/>
  </svg>,
  <svg key="c" viewBox="0 0 100 120" preserveAspectRatio="xMidYMax meet">
    {/* head with hair */}
    <path d="M30 38 C 30 22, 70 22, 70 40 C 70 50, 70 58, 70 58 L 30 58 C 30 56, 30 50, 30 38 Z"/>
    <circle cx="50" cy="44" r="18"/>
    <path d="M14 120 C 16 84, 38 68, 50 68 C 62 68, 84 84, 86 120 Z"/>
  </svg>,
  <svg key="d" viewBox="0 0 100 120" preserveAspectRatio="xMidYMax meet">
    {/* head with bun */}
    <circle cx="50" cy="30" r="6"/>
    <circle cx="50" cy="44" r="20"/>
    <path d="M16 120 C 18 86, 38 70, 50 70 C 62 70, 82 86, 84 120 Z"/>
  </svg>,
  <svg key="e" viewBox="0 0 100 120" preserveAspectRatio="xMidYMax meet">
    {/* head with cap */}
    <path d="M28 36 C 28 22, 72 22, 72 36 L 76 40 L 24 40 Z"/>
    <circle cx="50" cy="48" r="18"/>
    <path d="M16 120 C 18 84, 38 70, 50 70 C 62 70, 82 84, 84 120 Z"/>
  </svg>,
  <svg key="f" viewBox="0 0 100 120" preserveAspectRatio="xMidYMax meet">
    {/* head with hijab/scarf */}
    <path d="M22 42 C 22 18, 78 18, 78 42 C 78 56, 74 70, 70 76 L 30 76 C 26 70, 22 56, 22 42 Z"/>
    <circle cx="50" cy="48" r="16"/>
    <path d="M16 120 C 18 90, 38 74, 50 74 C 62 74, 82 90, 84 120 Z"/>
  </svg>,
];

// Warm-grey palette pairs (bg gradient) + silhouette tone
const TONES = [
  { a: "#C2B6A2", b: "#A89D8A", s: "#6E6357" },
  { a: "#D6CABA", b: "#B3A593", s: "#7A6E60" },
  { a: "#B8AC97", b: "#9A8E7A", s: "#5E5347" },
  { a: "#CDC1AD", b: "#A99D88", s: "#74685B" },
  { a: "#C8BDA8", b: "#A3987F", s: "#665B4E" },
  { a: "#D2C6B0", b: "#AEA28C", s: "#7F7466" },
  { a: "#BFB29A", b: "#9C8F76", s: "#5A4E42" },
  { a: "#DAC9B1", b: "#B5A48D", s: "#6E6052" },
];

// Hash function for stable variation per seed
const hash = (s) => {
  let h = 0;
  for (let i=0;i<s.length;i++) h = ((h<<5)-h + s.charCodeAt(i))|0;
  return Math.abs(h);
};

const Portrait = ({ seed = "0" }) => {
  const h = hash(String(seed));
  const tone = TONES[h % TONES.length];
  const sil = SILHOUETTES[h % SILHOUETTES.length];
  // off-centre framing
  const offsetX = ((h >> 3) % 5) - 2;     // -2..2
  const offsetY = ((h >> 6) % 4);          // 0..3
  const silW = 72 + (h % 12);              // 72..84
  return (
    <div className="portrait" style={{ "--bg-a": tone.a, "--bg-b": tone.b }}>
      <div className="silhouette" style={{
        "--sil-c": tone.s,
        "--sil-w": `${silW}%`,
        "--sil-x": `${offsetX * 4}%`,
        "--sil-y": `${-offsetY}%`,
      }}>{sil}</div>
    </div>
  );
};
window.Portrait = Portrait;

// ============================================================
// TILE
// ============================================================
// Position numbers are 01–11 within the starting eleven on the home page
// and sequential 001–247 on the squad page. Never the player's "kit number".
const Tile = ({ player, position, size = "md", flash = false, onClick, skeleton = false }) => {
  if (skeleton) return <div className="tile skeleton" style={{aspectRatio:"4/5"}}/>;
  const num = position != null ? position : player.num;
  const pad = num >= 100 ? 3 : 2;
  return (
    <button
      className={`tile ${flash ? "new-flash" : ""}`}
      onClick={onClick}
      style={{background:"transparent", border:0, padding:0, width:"100%", textAlign:"left"}}
      aria-label={`${player.name}, ${player.country || player.cc}, position ${num}`}
    >
      <Portrait seed={player.id}/>
      <div className="t-overlay"/>
      <div className="t-num">{String(num).padStart(pad,"0")}</div>
      <div className="t-play" aria-hidden="true"/>
      <div className="t-meta">
        <div className="t-name">{player.name}</div>
        <div className="t-country">
          <span style={{
            display:"inline-block", width:14, height:10, borderRadius:1,
            background: player.flag || "linear-gradient(90deg,#888 33%,#aaa 33% 66%,#888 66%)"
          }}/>
          {player.cc}
        </div>
      </div>
    </button>
  );
};
window.Tile = Tile;

// ============================================================
// FRAME — viewport label + canvas
// ============================================================
const Frame = ({ label, w, h, children, bg = "var(--c-paper)" }) => (
  <div style={{display:"flex", flexDirection:"column", gap: 10}}>
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      fontFamily:"var(--font-display)", fontWeight:600, fontSize:11,
      letterSpacing:"0.14em", textTransform:"uppercase", color:"#75706A"
    }}>
      <span style={{
        background:"#1A1714", color:"#FBF7F0", padding:"3px 8px",
        borderRadius:2, letterSpacing:"0.04em", fontVariantNumeric:"tabular-nums"
      }}>{w}px</span>
      <span>{label}</span>
    </div>
    <div style={{
      width: w, height: h ? h : "auto", background: bg,
      outline: "1px solid #D9D2C7",
      boxShadow: "0 1px 0 rgba(20,14,0,0.06), 0 12px 30px rgba(20,14,0,0.08)",
      position: "relative", overflow: "hidden"
    }}>
      <div className="pg">{children}</div>
    </div>
  </div>
);
window.Frame = Frame;

// ============================================================
// PLAYER DATA (sample)
// ============================================================
window.PLAYERS = [
  {id:"p01", num:1,  name:"Amara",   country:"Nigeria",  cc:"NGA", theme:"belonging",  flag:"linear-gradient(90deg,#008751 33%,#fff 33% 66%,#008751 66%)"},
  {id:"p02", num:7,  name:"Yusuf",   country:"Egypt",    cc:"EGY", theme:"friendship", flag:"linear-gradient(180deg,#ce1126 33%,#fff 33% 66%,#000 66%)"},
  {id:"p03", num:10, name:"Sofía",   country:"Argentina",cc:"ARG", theme:"family",     flag:"linear-gradient(180deg,#74acdf 33%,#fff 33% 66%,#74acdf 66%)"},
  {id:"p04", num:4,  name:"Mei",     country:"Vietnam",  cc:"VNM", theme:"confidence", flag:"linear-gradient(90deg,#da251d 100%)"},
  {id:"p05", num:9,  name:"Bashir",  country:"Pakistan", cc:"PAK", theme:"community",  flag:"linear-gradient(90deg,#01411c 33%,#fff 33% 100%)"},
  {id:"p06", num:11, name:"Carlos",  country:"Brazil",   cc:"BRA", theme:"fairness",   flag:"linear-gradient(180deg,#009c3b 33%,#ffdf00 33% 66%,#009c3b 66%)"},
  {id:"p07", num:2,  name:"Aïsha",   country:"Senegal",  cc:"SEN", theme:"family",     flag:"linear-gradient(90deg,#00853f 33%,#fdef42 33% 66%,#e31b23 66%)"},
  {id:"p08", num:6,  name:"Liang",   country:"China",    cc:"CHN", theme:"friendship", flag:"linear-gradient(90deg,#de2910 100%)"},
  {id:"p09", num:8,  name:"Rohan",   country:"India",    cc:"IND", theme:"confidence", flag:"linear-gradient(180deg,#ff9933 33%,#fff 33% 66%,#138808 66%)"},
  {id:"p10", num:5,  name:"Talia",   country:"USA",      cc:"USA", theme:"belonging",  flag:"linear-gradient(180deg,#b22234 50%,#fff 50% 100%)"},
  {id:"p11", num:3,  name:"Idris",   country:"Morocco",  cc:"MAR", theme:"community",  flag:"linear-gradient(90deg,#c1272d 100%)"},
  {id:"p12", num:14, name:"Lucia",   country:"Italy",    cc:"ITA", theme:"family",     flag:"linear-gradient(90deg,#009246 33%,#fff 33% 66%,#ce2b37 66%)"},
  {id:"p13", num:13, name:"Kofi",    country:"Ghana",    cc:"GHA", theme:"friendship", flag:"linear-gradient(180deg,#ce1126 33%,#fcd116 33% 66%,#006b3f 66%)"},
  {id:"p14", num:21, name:"Naomi",   country:"Kenya",    cc:"KEN", theme:"fairness",   flag:"linear-gradient(180deg,#000 25%,#ce1126 25% 50%,#fff 50% 75%,#006600 75%)"},
];
