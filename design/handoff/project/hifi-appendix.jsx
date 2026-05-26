/* global React, Tile, PLAYERS */

// ============================================================
// APPENDIX FRAMES — for developer hand-off
// Six reference artboards (A–F) sitting at the end of the canvas.
// All sized to be read at production scale, then scaled by the
// design canvas frame when zoomed out.
// ============================================================

const FrameHeader = ({ tag, title, sub }) => (
  <div style={{display:"flex", flexDirection:"column", gap: 10, paddingBottom: 24, borderBottom:"2px solid var(--c-ink)", marginBottom: 32}}>
    <div style={{
      fontFamily:"var(--font-display)", fontWeight:700, fontSize:11,
      letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--c-amber-700)"
    }}>{tag}</div>
    <h2 style={{
      fontFamily:"var(--font-display)", fontWeight:700, fontStretch:"85%",
      textTransform:"uppercase", letterSpacing:"0.03em", lineHeight: 1,
      fontSize: 48, margin: 0, color:"var(--c-ink)"
    }}>{title}</h2>
    {sub && <p style={{fontFamily:"var(--font-body)", fontSize: 15, color:"var(--c-ink-2)", margin:"4px 0 0", maxWidth:"70ch"}}>{sub}</p>}
  </div>
);

const SubHead = ({ children, style }) => (
  <div style={{
    fontFamily:"var(--font-display)", fontWeight:700, fontSize:11,
    letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--c-ink-3)",
    marginBottom: 16, ...style
  }}>{children}</div>
);

// ============================================================
// A — SPACING TOKENS
// ============================================================
const AppendixSpacing = () => {
  const sizes = [4, 8, 12, 16, 24, 32, 48, 64, 96, 128];
  return (
    <div style={{background:"var(--c-paper)", padding: 56, width: 1600, minHeight: 1100}}>
      <FrameHeader tag="Appendix A" title="Spacing tokens" sub="A 4px base scale, used for padding, gap, and vertical rhythm across every page. Reach for these names in code rather than hand-typed pixel values."/>

      <SubHead>The scale</SubHead>
      <div style={{display:"flex", flexDirection:"column", gap: 18}}>
        {sizes.map(s => (
          <div key={s} style={{display:"grid", gridTemplateColumns:"120px 200px 1fr", gap: 24, alignItems:"center"}}>
            <code style={{
              fontFamily:"var(--font-mono)", fontSize: 13, color:"var(--c-ink)",
              fontVariantNumeric:"tabular-nums"
            }}>--space-{s}</code>
            <div style={{
              fontFamily:"var(--font-display)", fontSize: 14, fontWeight: 600,
              color:"var(--c-ink)", fontVariantNumeric:"tabular-nums"
            }}>{s}px</div>
            <div style={{
              height: s < 16 ? 24 : Math.max(s, 24), width: s, background:"var(--c-amber)",
              borderRadius: 2, position:"relative",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)"
            }}/>
          </div>
        ))}
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap: 40, marginTop: 56}}>
        <div>
          <SubHead>Where each step is used</SubHead>
          <table style={{width:"100%", borderCollapse:"collapse", fontFamily:"var(--font-body)", fontSize: 13, color:"var(--c-ink)"}}>
            <tbody>
              {[
                ["4", "Inside chips, tag dots, tile portrait padding"],
                ["8", "Filter row gaps, button icon spacing"],
                ["12", "Form field interior, chip pill padding"],
                ["16", "Card padding (small), grid gap on dense grids"],
                ["24", "Card padding (default), section internal gaps"],
                ["32", "Section internal vertical rhythm"],
                ["48", "Top-level section gap on desktop"],
                ["64", "Page padding (desktop)"],
                ["96", "Between major bands on long pages"],
                ["128", "Closing-band vertical padding (about)"],
              ].map(([t, d]) => (
                <tr key={t} style={{borderTop:"1px solid var(--c-rule-soft)"}}>
                  <td style={{padding:"10px 12px 10px 0", fontFamily:"var(--font-mono)", color:"var(--c-amber-700)", fontWeight:600, width: 60}}>{t}</td>
                  <td style={{padding:"10px 0", color:"var(--c-ink-2)"}}>{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <SubHead>Rules of thumb</SubHead>
          <ul style={{fontFamily:"var(--font-body)", fontSize: 14, lineHeight: 1.65, color:"var(--c-ink-2)", paddingLeft: 18, margin: 0}}>
            <li>Never use a value not on this scale. If it doesn't fit, pick the nearest step.</li>
            <li>Vertical gaps between sections scale with viewport: 48 on mobile, 80 on desktop.</li>
            <li>Touch targets are never below 44px tall — see button and chip components.</li>
            <li>The starting-eleven tile grid uses an 18px gap (one off the scale) — historical, do not extend this exception.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
window.AppendixSpacing = AppendixSpacing;

// ============================================================
// B — RADIUS TOKENS
// ============================================================
const AppendixRadius = () => (
  <div style={{background:"var(--c-paper)", padding: 56, width: 1600, minHeight: 900}}>
    <FrameHeader tag="Appendix B" title="Radius tokens" sub="Three values do all the work. Editorial 4px on cards and modals; tight 2px on form fields; full pill on buttons, tags, and the voice counter."/>

    <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap: 32}}>
      {[
        {name: "--radius-card", value: "4px", use: "Portrait tiles, partner cards, modal panels, alert bands.", demo: (
          <div style={{
            width: 220, height: 140, background:"var(--c-paper-2)",
            border:"1px solid var(--c-rule)", borderRadius: 4,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:"var(--font-display)", fontWeight:600, fontSize:13, color:"var(--c-ink-3)"
          }}>4px corner</div>
        )},
        {name: "--radius-field", value: "2px", use: "Inputs, select, textarea. The closest to a square corner the system uses.", demo: (
          <input className="input" defaultValue="Search 42 countries…" style={{width: 220}}/>
        )},
        {name: "--radius-pill", value: "999px", use: "Buttons, theme tags, filter chips, voice-counter pill, language selector.", demo: (
          <div style={{display:"flex", flexDirection:"column", gap: 12, alignItems:"flex-start"}}>
            <button className="btn btn--sm">Read the letter</button>
            <div className="tag belonging">Belonging</div>
            <div className="chip">Filter</div>
          </div>
        )},
      ].map(r => (
        <div key={r.name} style={{
          background:"var(--c-paper-2)", padding: 28, borderRadius: 2,
          display:"flex", flexDirection:"column", gap: 18
        }}>
          <div style={{display:"flex", alignItems:"baseline", justifyContent:"space-between"}}>
            <code style={{
              fontFamily:"var(--font-mono)", fontSize: 13, color:"var(--c-ink)"
            }}>{r.name}</code>
            <div style={{
              fontFamily:"var(--font-display)", fontWeight: 700, fontSize: 18,
              color:"var(--c-amber-700)", fontVariantNumeric:"tabular-nums"
            }}>{r.value}</div>
          </div>
          <div style={{
            background:"var(--c-paper)", padding: 24, borderRadius: 2,
            border:"1px solid var(--c-rule-soft)",
            display:"flex", alignItems:"center", justifyContent:"center",
            minHeight: 180
          }}>{r.demo}</div>
          <div style={{fontSize: 13, color:"var(--c-ink-2)", lineHeight: 1.55}}>{r.use}</div>
        </div>
      ))}
    </div>

    <div style={{marginTop: 48, padding: 24, background:"var(--c-paper-2)", borderRadius: 2, border:"1px solid var(--c-rule-soft)"}}>
      <SubHead style={{marginBottom: 10}}>Not in the system</SubHead>
      <div style={{fontFamily:"var(--font-body)", fontSize: 14, color:"var(--c-ink-2)", lineHeight: 1.6, maxWidth:"80ch"}}>
        No 6, 8, 12, 16, 24px radii. No "soft rectangle". The portrait tile is editorial — slightly pillowy reads as a different brand.
      </div>
    </div>
  </div>
);
window.AppendixRadius = AppendixRadius;

// ============================================================
// C — COMPONENT INVENTORY
// ============================================================
const InvCell = ({ title, sub, children, span }) => (
  <div style={{
    background:"var(--c-paper)", padding: 22, borderRadius: 2,
    border:"1px solid var(--c-rule-soft)",
    display:"flex", flexDirection:"column", gap: 14,
    gridColumn: span ? `span ${span}` : "auto"
  }}>
    <div style={{display:"flex", flexDirection:"column", gap: 2}}>
      <div style={{
        fontFamily:"var(--font-display)", fontWeight: 700, fontSize: 13,
        color:"var(--c-ink)"
      }}>{title}</div>
      {sub && <div style={{
        fontFamily:"var(--font-mono)", fontSize: 11, color:"var(--c-ink-3)"
      }}>{sub}</div>}
    </div>
    <div style={{
      flex: 1, display:"flex", alignItems:"center", justifyContent:"center",
      padding: 12, background:"var(--c-paper-2)", borderRadius: 2,
      minHeight: 140
    }}>{children}</div>
  </div>
);

const AppendixComponents = () => (
  <div style={{background:"var(--c-paper)", padding: 56, width: 2200, minHeight: 2400}}>
    <FrameHeader tag="Appendix C" title="Component inventory" sub="Every reusable piece at production size, with its props and any interactive states. Reach for these names in the eventual codebase rather than rebuilding."/>

    {/* --- Tile --- */}
    <SubHead>Portrait tile · &lt;Tile player position flash skeleton onClick /&gt;</SubHead>
    <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap: 16, marginBottom: 40}}>
      <InvCell title="Default" sub="Resting state">
        <div style={{width: 180}}><Tile player={PLAYERS[2]} position={3}/></div>
      </InvCell>
      <InvCell title="Hover" sub="2px amber inset, lift 4px">
        <div style={{
          width: 180, transform:"translateY(-4px)",
          boxShadow:"0 12px 24px rgba(20,14,0,0.18)",
          outline:"2px solid var(--c-amber)", outlineOffset:"-2px"
        }}><Tile player={PLAYERS[1]} position={2}/></div>
      </InvCell>
      <InvCell title="Focus (keyboard)" sub="3px cyan ring, 3px offset">
        <div style={{width: 180, outline:"3px solid var(--c-fn-cyan)", outlineOffset: 3}}>
          <Tile player={PLAYERS[0]} position={1}/>
        </div>
      </InvCell>
      <InvCell title="Skeleton" sub="Loading, pulsing">
        <div style={{width: 180}}><Tile skeleton/></div>
      </InvCell>
    </div>

    {/* --- Theme tag --- */}
    <SubHead>Theme tag · &lt;.tag.themeName&gt; · six colours, white text only</SubHead>
    <div style={{display:"flex", flexWrap:"wrap", gap: 10, padding: 18, background:"var(--c-paper-2)", borderRadius: 2, marginBottom: 40}}>
      <div className="tag fairness">Fairness</div>
      <div className="tag belonging">Belonging</div>
      <div className="tag friendship">Friendship</div>
      <div className="tag confidence">Confidence</div>
      <div className="tag family">Family</div>
      <div className="tag community">Community</div>
      <div style={{width:"100%"}}/>
      <div className="tag fairness tag--out" style={{borderColor:"var(--c-fairness)", color:"var(--c-fairness)", background:"transparent"}}>Fairness · outline</div>
      <div className="tag belonging tag--out" style={{borderColor:"var(--c-belonging)", color:"var(--c-belonging)", background:"transparent"}}>Belonging · outline</div>
    </div>

    {/* --- Buttons --- */}
    <SubHead>Buttons · &lt;button.btn .btn--ghost .btn--amber .btn--deep .btn--sm .btn--lg /&gt;</SubHead>
    <div style={{display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap: 14, marginBottom: 40}}>
      <InvCell title="Primary" sub=".btn"><button className="btn">Read the letter</button></InvCell>
      <InvCell title="Ghost" sub=".btn.btn--ghost"><button className="btn btn--ghost" style={{borderColor:"var(--c-ink)"}}>Meet all 247</button></InvCell>
      <InvCell title="Amber" sub=".btn.btn--amber · Pantone 1505"><button className="btn btn--amber">Share the letter</button></InvCell>
      <InvCell title="Deep cyan" sub=".btn.btn--deep · Process Cyan"><button className="btn btn--deep">Sign as supporter</button></InvCell>
      <InvCell title="Text link" sub="Functional Cyan · underline on hover">
        <a href="#" style={{color:"var(--c-fn-cyan)", textDecoration:"underline", textUnderlineOffset: 3, fontSize:14, fontWeight: 600}}>Read more about the project →</a>
      </InvCell>
    </div>

    {/* --- Chips, dropdowns, share, language --- */}
    <SubHead>Filters & menus</SubHead>
    <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap: 14, marginBottom: 40}}>
      <InvCell title="Chip · default" sub=".chip"><div style={{display:"flex", gap: 8, flexDirection:"column"}}><button className="chip">Theme: All</button><button className="chip">Country: All</button></div></InvCell>
      <InvCell title="Chip · active" sub=".chip.active"><div style={{display:"flex", gap: 8, flexDirection:"column"}}><button className="chip active">Theme: Friendship</button><button className="chip active">Country: Argentina</button></div></InvCell>
      <InvCell title="Country search dropdown" sub="Within the country chip">
        <div style={{width: 220, background:"var(--c-paper)", border:"1px solid var(--c-rule)", borderRadius: 2}}>
          <div style={{padding:"10px 12px", borderBottom:"1px solid var(--c-rule-soft)"}}>
            <input className="input" placeholder="Search 42 countries…" style={{width:"100%", fontSize:12, padding:"6px 10px", minHeight: 30}}/>
          </div>
          <div style={{padding:"6px 0"}}>
            {["Argentina","Brazil","Egypt"].map((c,i)=>(
              <div key={c} style={{padding:"6px 12px", fontSize:12, color: i===0?"var(--c-ink)":"var(--c-ink-2)", background: i===0?"var(--c-amber-50)":"transparent"}}>{i===0 ? "☑ " : "☐ "}{c}</div>
            ))}
          </div>
        </div>
      </InvCell>
      <InvCell title="Language selector · footer" sub=".f-lang">
        <div className="f-lang">English (United Kingdom)</div>
      </InvCell>
    </div>

    {/* --- Sticky header + share button + counter --- */}
    <SubHead>Header bar · default & sticky · share button always top-right</SubHead>
    <div style={{display:"flex", flexDirection:"column", gap: 12, marginBottom: 40}}>
      <div style={{background:"var(--c-paper)", border:"1px solid var(--c-rule-soft)", borderRadius: 2, overflow:"hidden"}}>
        <div style={{
          display:"flex", alignItems:"center", gap: 24, padding:"0 28px", height: 72,
          background:"var(--c-paper)"
        }}>
          <img src="assets/own-your-game-logo.svg" alt="" style={{height: 40}}/>
          <div style={{display:"flex", gap: 20, marginLeft: 8, fontSize:13, color:"var(--c-ink-2)"}}>
            <span style={{color:"var(--c-ink)", fontWeight:600, borderBottom:"2px solid var(--c-amber)", paddingBottom: 2}}>Home</span>
            <span>The Letter</span>
            <span>The Squad</span>
            <span>About</span>
          </div>
          <div style={{marginLeft:"auto", display:"flex", gap: 12, alignItems:"center"}}>
            <div className="h-counter" style={{margin:0}}>
              <span className="dot"/><b>247</b><span className="lbl">voices and counting</span>
            </div>
            <button className="h-cta">Share ↗</button>
          </div>
        </div>
        <div style={{padding:"4px 28px 8px", fontSize: 11, color:"var(--c-ink-3)", fontFamily:"var(--font-display)", letterSpacing:"0.14em", textTransform:"uppercase"}}>Default · 72px tall · transparent over paper</div>
      </div>
      <div style={{background:"var(--c-paper)", border:"1px solid var(--c-rule)", borderRadius: 2, overflow:"hidden", boxShadow:"0 6px 20px rgba(20,14,0,0.05)"}}>
        <div style={{
          display:"flex", alignItems:"center", gap: 24, padding:"0 28px", height: 60,
          background:"rgba(245,240,232,0.94)", backdropFilter:"blur(8px)", borderBottom:"1px solid var(--c-rule)"
        }}>
          <img src="assets/own-your-game-logo.svg" alt="" style={{height: 32}}/>
          <div style={{display:"flex", gap: 20, marginLeft: 8, fontSize:13, color:"var(--c-ink-2)"}}>
            <span style={{color:"var(--c-ink)", fontWeight:600}}>Home</span>
            <span>The Letter</span>
            <span>The Squad</span>
            <span>About</span>
          </div>
          <div style={{marginLeft:"auto", display:"flex", gap: 12, alignItems:"center"}}>
            <div className="h-counter" style={{margin:0}}>
              <span className="dot"/><b>247</b><span className="lbl">voices and counting</span>
            </div>
            <button className="h-cta">Share ↗</button>
          </div>
        </div>
        <div style={{padding:"4px 28px 8px", fontSize: 11, color:"var(--c-ink-3)", fontFamily:"var(--font-display)", letterSpacing:"0.14em", textTransform:"uppercase"}}>Sticky on scroll · 60px tall · 8px backdrop blur · counter pill must stay visible</div>
      </div>
    </div>

    {/* --- Voice counter card --- */}
    <SubHead>Voice counter card (hero) · process cyan fill · white-only content</SubHead>
    <div style={{
      background:"var(--c-brand-cyan)", color:"#FFFFFF", padding: 28, borderRadius: 4,
      width: 520, marginBottom: 40, position:"relative", overflow:"hidden"
    }}>
      <div style={{position:"absolute", top:-40, right:-40, width:160, height:160, borderRadius:999, background:"rgba(255,255,255,0.10)"}}/>
      <div style={{fontFamily:"var(--font-display)", fontWeight:600, fontSize:11, letterSpacing:"0.16em", textTransform:"uppercase", color:"rgba(255,255,255,0.78)", position:"relative"}}>The voice counter</div>
      <div style={{fontFamily:"var(--font-display)", fontWeight:700, fontSize: 88, lineHeight: 0.95, letterSpacing:"-0.04em", fontVariantNumeric:"tabular-nums", marginTop: 10, position:"relative"}}>247</div>
      <div style={{display:"flex", alignItems:"center", gap: 8, marginTop: 10, fontFamily:"var(--font-display)", fontWeight:600, fontSize:11, letterSpacing:"0.14em", textTransform:"uppercase", position:"relative"}}>
        <span style={{width:7, height:7, borderRadius:999, background:"var(--c-amber)", boxShadow:"0 0 0 3px rgba(243,108,33,0.45)"}}/>
        Young voices — and counting
      </div>
    </div>

    {/* --- Letter section header + signature row --- */}
    <SubHead>Letter section header + signature row</SubHead>
    <div style={{padding: 28, background:"var(--c-paper-2)", borderRadius: 2, marginBottom: 40, maxWidth: 760}}>
      <div style={{display:"flex", alignItems:"center", gap: 12, marginBottom: 12}}>
        <div className="tag friendship">On friendship</div>
        <span style={{fontFamily:"var(--font-display)", fontWeight:600, fontSize:11, letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-ink-3)"}}>3rd of six</span>
      </div>
      <h3 style={{
        fontFamily:"var(--font-display)", fontWeight:700, fontStretch:"85%",
        textTransform:"uppercase", letterSpacing:"0.03em", lineHeight: 1.05,
        fontSize: 28, margin: 0
      }}>We learn the world through who we play with.</h3>
      <div style={{display:"flex", alignItems:"center", gap: 10, paddingTop: 16, marginTop: 16, borderTop:"1px solid var(--c-rule-soft)"}}>
        <div style={{fontFamily:"var(--font-display)", fontWeight:600, fontSize:11, letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-ink-3)"}}>Signed by</div>
        <div style={{display:"flex"}}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{
              width:32, height:32, borderRadius:999, marginLeft: i===0?0:-8,
              border:"2px solid var(--c-paper-2)",
              background:`linear-gradient(180deg, hsl(${30+i*30} 25% 70%), hsl(${30+i*30} 20% 55%))`
            }}/>
          ))}
        </div>
        <div style={{fontSize:13, color:"var(--c-ink-2)"}}>+ 33 others — <a href="#" style={{color:"var(--c-ink)", textDecoration:"underline"}}>see all</a></div>
      </div>
    </div>

    {/* --- Empty state, error state, loading row --- */}
    <SubHead>State-specific components · empty, error, loading</SubHead>
    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap: 16}}>
      <InvCell title="Empty state · squad" sub="Filters return 0 matches">
        <div style={{padding: 18, textAlign:"center", border:"1px dashed var(--c-rule)", borderRadius: 2, background:"var(--c-paper-2)", fontSize: 13, color:"var(--c-ink-2)"}}>
          <div style={{fontFamily:"var(--font-display)", fontWeight:700, fontSize: 14, color:"var(--c-ink)", marginBottom: 6}}>No voices yet for this combination.</div>
          Try fewer filters.
          <div style={{marginTop: 10}}><button className="btn btn--sm">Clear filters</button></div>
        </div>
      </InvCell>
      <InvCell title="Error state · player card" sub="Video failed to load">
        <div style={{padding: 18, textAlign:"center", border:"1px solid var(--c-rule)", borderRadius: 2, background:"var(--c-paper)", fontSize: 13, color:"var(--c-ink-2)"}}>
          <div style={{fontFamily:"var(--font-display)", fontWeight:700, fontSize: 14, color:"var(--c-ink)", marginBottom: 6}}>This video isn't loading right now.</div>
          <a href="#" style={{color:"var(--c-fn-cyan)", fontWeight:600, textDecoration:"underline"}}>Try again →</a>
        </div>
      </InvCell>
      <InvCell title="Loading skeleton · tile" sub="Pulsing, hero text already visible">
        <div style={{width: 140}}><Tile skeleton/></div>
      </InvCell>
    </div>
  </div>
);
window.AppendixComponents = AppendixComponents;

// ============================================================
// D — COLOUR USAGE MATRIX
// ============================================================
const COLOURS = [
  {token:"--c-deep / Process Cyan",  swatch:"#00AEEF", text:"#FFFFFF", body:"✗", link:"✗", display:"✗", btn:"✓", tag:"✗", border:"✗", icon:"✗", note:"Large brand fills only. White content."},
  {token:"--c-deep-700 / Fn Cyan",   swatch:"#007FB8", text:"#FFFFFF", body:"✗", link:"✓", display:"✓", btn:"✓", tag:"✓", border:"✓", icon:"✓", note:"Body links + Fairness theme."},
  {token:"--c-deep-900 / Deep Cyan", swatch:"#074661", text:"#FFFFFF", body:"✗", link:"✗", display:"✓", btn:"✗", tag:"✓", border:"✗", icon:"✗", note:"Drop cap, Friendship theme."},
  {token:"--c-amber / Pantone 1505", swatch:"#F36C21", text:"#FFFFFF", body:"✗", link:"✗", display:"✗", btn:"✓", tag:"✗", border:"✓", icon:"✓", note:"Accent only — counter dot, tile hover."},
  {token:"--c-amber-700 / Fn Orange",swatch:"#C04A12", text:"#FFFFFF", body:"✗", link:"✗", display:"✗", btn:"✗", tag:"✓", border:"✗", icon:"✗", note:"Belonging theme. Never below 24px text."},
  {token:"--c-amber-50",             swatch:"#FDE8D6", text:"#1A1A1A", body:"✗", link:"✗", display:"✗", btn:"✗", tag:"✗", border:"✗", icon:"✗", note:"Active-filter chip background only."},
  {token:"--c-ink",                  swatch:"#1A1A1A", text:"#FFFFFF", body:"✓", link:"✓", display:"✓", btn:"✓", tag:"✓", border:"✓", icon:"✓", note:"Default text + primary button fill."},
  {token:"--c-ink-2",                swatch:"#4A4640", text:"#FFFFFF", body:"✓", link:"✗", display:"✗", btn:"✗", tag:"✗", border:"✗", icon:"✗", note:"Secondary text, captions."},
  {token:"--c-ink-3",                swatch:"#6D685F", text:"#FFFFFF", body:"✗", link:"✗", display:"✗", btn:"✗", tag:"✗", border:"✗", icon:"✓", note:"Meta, hint text, ≥13px only."},
  {token:"--c-rule",                 swatch:"#D9D2C7", text:"#1A1A1A", body:"✗", link:"✗", display:"✗", btn:"✗", tag:"✗", border:"✓", icon:"✗", note:"Default 1px border."},
  {token:"--c-rule-soft",            swatch:"#ECE6DA", text:"#1A1A1A", body:"✗", link:"✗", display:"✗", btn:"✗", tag:"✗", border:"✓", icon:"✗", note:"Faint internal divider."},
  {token:"--c-paper",                swatch:"#F5F0E8", text:"#1A1A1A", body:"✗", link:"✗", display:"✗", btn:"✗", tag:"✗", border:"✗", icon:"✗", note:"Page background. Foreground on dark fills."},
  {token:"--c-paper-2",              swatch:"#EDE6D7", text:"#1A1A1A", body:"✗", link:"✗", display:"✗", btn:"✗", tag:"✗", border:"✗", icon:"✗", note:"Alt band background (about, share)."},
];

const AppendixColourMatrix = () => (
  <div style={{background:"var(--c-paper)", padding: 56, width: 2000, minHeight: 1400}}>
    <FrameHeader tag="Appendix D" title="Colour usage matrix" sub="A cheat sheet for build time. Each token has rules about which contexts it can appear in — this grid makes the no-go cells unambiguous."/>

    <div style={{
      background:"var(--c-paper-2)", borderRadius: 2, border:"1px solid var(--c-rule-soft)",
      overflow:"hidden"
    }}>
      <table style={{width:"100%", borderCollapse:"collapse", fontFamily:"var(--font-body)", fontSize: 13}}>
        <thead>
          <tr style={{background:"var(--c-paper)", textAlign:"left"}}>
            {["Token","Body text","Link","Display","Button fill","Tag fill","Border","Icon","Notes"].map((h, i) => (
              <th key={h} style={{
                padding:"14px 14px", fontFamily:"var(--font-display)", fontWeight:700,
                fontSize: 11, letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-ink-3)",
                textAlign: i === 0 || i === 8 ? "left" : "center",
                borderBottom:"2px solid var(--c-ink)"
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COLOURS.map((c, i) => (
            <tr key={c.token} style={{
              background: i % 2 ? "var(--c-paper)" : "transparent",
              borderTop:"1px solid var(--c-rule-soft)"
            }}>
              <td style={{padding:"14px", display:"flex", alignItems:"center", gap: 12, minWidth: 220}}>
                <div style={{
                  width: 28, height: 28, borderRadius: 2, background: c.swatch,
                  border: c.swatch === "#F5F0E8" || c.swatch === "#EDE6D7" || c.swatch === "#D9D2C7" || c.swatch === "#ECE6DA" || c.swatch === "#FDE8D6" ? "1px solid var(--c-rule)" : "0"
                }}/>
                <div>
                  <div style={{fontFamily:"var(--font-mono)", fontSize: 12, color:"var(--c-ink)"}}>{c.token}</div>
                  <div style={{fontFamily:"var(--font-mono)", fontSize: 11, color:"var(--c-ink-3)"}}>{c.swatch}</div>
                </div>
              </td>
              {[c.body, c.link, c.display, c.btn, c.tag, c.border, c.icon].map((v, k) => (
                <td key={k} style={{
                  padding:"14px", textAlign:"center",
                  fontFamily:"var(--font-display)", fontWeight: 700, fontSize: 18,
                  color: v === "✓" ? "var(--c-deep-700)" : "var(--c-ink-4)"
                }}>{v}</td>
              ))}
              <td style={{padding:"14px", color:"var(--c-ink-2)", fontSize: 12, maxWidth: 280, lineHeight: 1.5}}>{c.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div style={{
      marginTop: 32, padding: 20, background:"var(--c-paper-2)", borderRadius: 2,
      display:"flex", gap: 32, flexWrap:"wrap", fontSize: 13, color:"var(--c-ink-2)"
    }}>
      <div><b style={{color:"var(--c-deep-700)"}}>✓</b> &nbsp;permitted in this context</div>
      <div><b style={{color:"var(--c-ink-4)"}}>✗</b> &nbsp;do not use in this context</div>
      <div style={{flex:1, textAlign:"right"}}>Process Cyan is reserved for the two largest brand surfaces only — the home voice counter and the about closing band.</div>
    </div>
  </div>
);
window.AppendixColourMatrix = AppendixColourMatrix;

// ============================================================
// E — PAGE-TO-PAGE NAVIGATION MAP
// ============================================================
const NavNode = ({ x, y, w, h, label, sub, color = "var(--c-paper-2)", border = "var(--c-rule)" }) => (
  <div style={{
    position:"absolute", left: x, top: y, width: w, height: h,
    background: color, border: `1px solid ${border}`, borderRadius: 4,
    display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", gap: 6,
    padding: 12, textAlign:"center"
  }}>
    <div style={{
      fontFamily:"var(--font-display)", fontWeight: 700, fontStretch:"85%",
      textTransform:"uppercase", letterSpacing:"0.04em", fontSize: 15, color:"var(--c-ink)"
    }}>{label}</div>
    {sub && <div style={{fontSize: 11, color:"var(--c-ink-3)", lineHeight: 1.4}}>{sub}</div>}
  </div>
);

const NavArrow = ({ x1, y1, x2, y2, label, dashed = false, color = "var(--c-ink-2)" }) => {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx*dx + dy*dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  return (
    <>
      <div style={{
        position:"absolute", left: x1, top: y1 - 1,
        width: len, height: 2,
        background: color,
        backgroundImage: dashed ? `repeating-linear-gradient(90deg, ${color} 0 6px, transparent 6px 12px)` : "none",
        transformOrigin: "0 50%", transform: `rotate(${angle}deg)`
      }}/>
      <div style={{
        position:"absolute", left: x2 - 8, top: y2 - 6,
        width: 0, height: 0,
        borderLeft: `10px solid ${color}`,
        borderTop: "6px solid transparent",
        borderBottom: "6px solid transparent",
        transformOrigin: "0 50%", transform: `rotate(${angle}deg)`
      }}/>
      {label && (
        <div style={{
          position:"absolute",
          left: (x1+x2)/2, top: (y1+y2)/2 - 22,
          transform:"translateX(-50%)",
          fontFamily:"var(--font-display)", fontWeight: 600, fontSize: 10,
          letterSpacing:"0.12em", textTransform:"uppercase",
          color: color, background:"var(--c-paper)", padding:"2px 8px", borderRadius: 2,
          whiteSpace:"nowrap"
        }}>{label}</div>
      )}
    </>
  );
};

const AppendixNavMap = () => (
  <div style={{background:"var(--c-paper)", padding: 56, width: 1800, minHeight: 1200}}>
    <FrameHeader tag="Appendix E" title="Page-to-page navigation map" sub="Five pages, one modal overlay. Every primary link a user can take is drawn explicitly. Dashed arrows show the modal overlay behaviour of the player card — it sits above whichever page it was opened from."/>

    <div style={{position:"relative", height: 800, marginTop: 24, background:"var(--c-paper-2)", border:"1px solid var(--c-rule-soft)", borderRadius: 2, padding: 0, overflow:"hidden"}}>

      {/* Home — center anchor */}
      <NavNode x={720} y={60} w={320} h={120} label="01 · Home" sub="Hero · counter · starting eleven" color="var(--c-paper)" border="var(--c-ink)"/>

      {/* Letter */}
      <NavNode x={260} y={320} w={300} h={110} label="02 · The letter" sub="Six themes · signatures · share" color="var(--c-paper)"/>

      {/* Squad */}
      <NavNode x={1200} y={320} w={300} h={110} label="03 · The squad" sub="247 voices · filters · empty state" color="var(--c-paper)"/>

      {/* About */}
      <NavNode x={720} y={620} w={320} h={120} label="05 · About & partners" sub="Story · numbers · partners · closing band" color="var(--c-paper)"/>

      {/* Player card — modal */}
      <NavNode x={720} y={340} w={320} h={120} label="04 · Player card" sub="Modal overlay · video · transcript · prev/next" color="#FFF9F0" border="var(--c-amber)"/>

      {/* Arrows */}
      <NavArrow x1={880} y1={180} x2={410} y2={320} label="Read the letter"/>
      <NavArrow x1={880} y1={180} x2={1350} y2={320} label="Meet all 247"/>
      <NavArrow x1={880} y1={180} x2={880} y2={620} label="About this project"/>

      <NavArrow x1={560} y1={400} x2={720} y2={400} label="Signature → voice" color="var(--c-amber-700)" dashed/>
      <NavArrow x1={1200} y1={400} x2={1040} y2={400} label="Tile → voice" color="var(--c-amber-700)" dashed/>
      <NavArrow x1={880} y1={620} x2={880} y2={460} label="Read the letter" color="var(--c-ink-2)"/>
      <NavArrow x1={410} y1={430} x2={720} y2={620} label="View squad" color="var(--c-ink-3)"/>
      <NavArrow x1={1350} y1={430} x2={1040} y2={620} label="About" color="var(--c-ink-3)"/>

      {/* legend */}
      <div style={{position:"absolute", left: 28, bottom: 24, display:"flex", flexDirection:"column", gap: 10, padding: 16, background:"var(--c-paper)", border:"1px solid var(--c-rule)", borderRadius: 2}}>
        <div style={{fontFamily:"var(--font-display)", fontWeight: 700, fontSize: 10, letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-ink-3)"}}>Legend</div>
        <div style={{display:"flex", alignItems:"center", gap: 10, fontSize: 12, color:"var(--c-ink-2)"}}>
          <span style={{width: 36, height: 2, background:"var(--c-ink-2)"}}/> Page → page navigation
        </div>
        <div style={{display:"flex", alignItems:"center", gap: 10, fontSize: 12, color:"var(--c-ink-2)"}}>
          <span style={{width: 36, height: 2, backgroundImage:"repeating-linear-gradient(90deg, var(--c-amber-700) 0 6px, transparent 6px 12px)"}}/> Opens player card modal over current page
        </div>
      </div>

      {/* Header CTAs note */}
      <div style={{position:"absolute", right: 28, bottom: 24, padding: 16, background:"var(--c-paper)", border:"1px solid var(--c-rule)", borderRadius: 2, maxWidth: 320, fontSize: 12, color:"var(--c-ink-2)", lineHeight: 1.5}}>
        <div style={{fontFamily:"var(--font-display)", fontWeight: 700, fontSize: 10, letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-ink-3)", marginBottom: 6}}>Always available</div>
        Header logo → Home, Share ↗ pill (top-right of every page including behind the modal), language selector in footer.
      </div>
    </div>

    {/* Modal behaviour */}
    <div style={{marginTop: 32, padding: 24, background:"var(--c-paper-2)", borderRadius: 2, border:"1px solid var(--c-rule-soft)"}}>
      <SubHead style={{marginBottom: 12}}>Player card modal contract</SubHead>
      <ul style={{margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.65, color:"var(--c-ink-2)"}}>
        <li>Opens with the underlying page dimmed at 62% scrim with a 6px backdrop blur.</li>
        <li>Closes via Esc, the × button, or clicking outside the modal — never automatically.</li>
        <li>URL updates to <code style={{fontFamily:"var(--font-mono)", fontSize:13, background:"var(--c-paper)", padding:"2px 6px"}}>/voice/p03</code> so it's shareable and back-button works.</li>
        <li>Prev / Next arrows traverse the player's <i>theme</i> set — not the global 247. Counter at bottom shows "n of N family voices".</li>
        <li>On mobile, modal becomes full-screen with swipe gestures replacing prev/next buttons.</li>
      </ul>
    </div>
  </div>
);
window.AppendixNavMap = AppendixNavMap;

// ============================================================
// F — RESPONSIVE BREAKPOINTS
// ============================================================
const AppendixBreakpoints = () => (
  <div style={{background:"var(--c-paper)", padding: 56, width: 1800, minHeight: 1100}}>
    <FrameHeader tag="Appendix F" title="Responsive breakpoints" sub="Three breakpoints. Mobile-first. Layout flips happen at the boundaries below; type and spacing scale continuously within each range."/>

    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap: 24}}>
      {[
        {
          name:"Mobile",
          range:"≤ 480px",
          width: 360,
          designed: "375px reference",
          notes: [
            "Header height 56px",
            "Starting eleven → 2-column grid (no 1-4-3-3)",
            "Letter stays single-column, ~32ch measure",
            "Squad → 3-column tile grid",
            "Modal becomes full-screen with swipe prev/next",
            "Footer columns stack",
          ]
        },
        {
          name:"Tablet",
          range:"481 – 1024px",
          width: 700,
          designed: "(not designed)",
          notes: [
            "Reflows smoothly from mobile rules",
            "Starting eleven → 3-column grid (still no formation)",
            "Squad → 5- or 6-column tile grid",
            "Player modal centred, but allowed to fill most of the width",
            "Header navigation may collapse into a menu icon below 720px",
          ]
        },
        {
          name:"Desktop",
          range:"≥ 1025px",
          width: 1200,
          designed: "1440px reference",
          notes: [
            "Header height 72px → 60px sticky",
            "Starting eleven → 1-4-3-3 formation",
            "Letter at 760px max-width, centred",
            "Squad → 8-column tile grid",
            "Player modal at 1240px max",
            "Footer in 5 columns",
          ]
        },
      ].map((bp, i) => (
        <div key={bp.name} style={{
          background:"var(--c-paper-2)", borderRadius: 2,
          border:"1px solid var(--c-rule-soft)",
          display:"flex", flexDirection:"column", gap: 18, padding: 24
        }}>
          <div>
            <div style={{
              fontFamily:"var(--font-display)", fontWeight: 700, fontSize: 11,
              letterSpacing:"0.18em", textTransform:"uppercase",
              color:"var(--c-amber-700)"
            }}>0{i+1} · {bp.name}</div>
            <div style={{
              fontFamily:"var(--font-display)", fontWeight: 700, fontSize: 36,
              color:"var(--c-ink)", letterSpacing:"-0.02em", marginTop: 4
            }}>{bp.range}</div>
            <div style={{fontSize: 12, color:"var(--c-ink-3)", marginTop: 4}}>Reference width: <b style={{color:"var(--c-ink-2)"}}>{bp.designed}</b></div>
          </div>

          <div style={{
            height: 200, background:"var(--c-paper)", borderRadius: 2,
            border:"1px solid var(--c-rule)", position:"relative", overflow:"hidden",
            display:"flex", alignItems:"center", justifyContent:"center"
          }}>
            <div style={{
              width: Math.min(bp.width * 0.4, 280),
              height: 160, background:"var(--c-paper-2)",
              border:"1px solid var(--c-rule)", borderRadius: 2,
              display:"flex", flexDirection:"column", padding: 12, gap: 8
            }}>
              <div style={{height: 10, background:"var(--c-rule)", borderRadius: 1}}/>
              <div style={{flex: 1, display:"grid",
                gridTemplateColumns: bp.name === "Mobile" ? "1fr 1fr" : bp.name === "Tablet" ? "1fr 1fr 1fr" : "1fr 1fr 1fr 1fr",
                gap: 4
              }}>
                {Array.from({length: bp.name === "Mobile" ? 4 : bp.name === "Tablet" ? 6 : 8}).map((_, i) => (
                  <div key={i} style={{background:"var(--c-amber-200)", borderRadius: 1}}/>
                ))}
              </div>
              <div style={{height: 6, background:"var(--c-rule-soft)", borderRadius: 1, width:"70%"}}/>
            </div>
          </div>

          <ul style={{margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.55, color:"var(--c-ink-2)"}}>
            {bp.notes.map(n => <li key={n} style={{marginBottom: 4}}>{n}</li>)}
          </ul>
        </div>
      ))}
    </div>

    <div style={{
      marginTop: 32, padding: 24, background:"var(--c-paper-2)", borderRadius: 2,
      border:"1px solid var(--c-rule-soft)"
    }}>
      <SubHead style={{marginBottom: 10}}>Breakpoint CSS</SubHead>
      <pre style={{
        margin: 0, fontFamily:"var(--font-mono)", fontSize: 12, color:"var(--c-ink)",
        background:"var(--c-paper)", padding: 16, borderRadius: 2, border:"1px solid var(--c-rule)",
        overflow:"auto", lineHeight: 1.7
      }}>{`/* Mobile-first \u2014 base styles target \u2264 480px */
@media (min-width: 481px) { /* Tablet rules */ }
@media (min-width: 1025px) { /* Desktop rules */ }`}</pre>
    </div>
  </div>
);
window.AppendixBreakpoints = AppendixBreakpoints;

// ============================================================
// LOADING STATES — one frame showing each page's skeleton
// (the home page also has a dedicated full-page loading variant
// in the Home section; this is the consolidated reference for
// developers building the 1–2-second-first-paint experience.)
// ============================================================
const LoadingMini = ({ label, children }) => (
  <div style={{display:"flex", flexDirection:"column", gap: 12}}>
    <div style={{
      fontFamily:"var(--font-display)", fontWeight: 700, fontSize: 11,
      letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--c-ink-3)"
    }}>{label}</div>
    <div style={{
      background:"var(--c-paper)", border:"1px solid var(--c-rule-soft)",
      borderRadius: 2, padding: 20, minHeight: 320,
      display:"flex", flexDirection:"column", gap: 14
    }}>{children}</div>
  </div>
);

const SkelBar = ({ w = "100%", h = 14, mt = 0 }) => (
  <div style={{
    width: w, height: h, marginTop: mt,
    background:"var(--c-rule-soft)", borderRadius: 2,
    animation:"skel 1.8s ease-in-out infinite"
  }}/>
);

const SkelTile = () => (
  <div style={{aspectRatio:"4/5", background:"var(--c-rule-soft)", borderRadius: 2, animation:"skel 1.8s ease-in-out infinite"}}/>
);

const AppendixLoading = () => (
  <div style={{background:"var(--c-paper)", padding: 56, width: 2000, minHeight: 1000}}>
    <FrameHeader tag="Appendix G" title="Loading skeletons" sub="What users on slow connections see for the first 1–2 seconds. Hero copy renders immediately; the voice counter shows the last known number; portrait tiles pulse softly until they resolve."/>

    <div style={{display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap: 18}}>
      <LoadingMini label="01 · Home">
        <SkelBar w="40%" h={10}/>
        <div style={{fontFamily:"var(--font-display)", fontWeight: 700, fontSize: 26, lineHeight: 1, color:"var(--c-ink)"}}>Whose game is it&nbsp;anyway?</div>
        <SkelBar w="80%" h={10} mt={4}/>
        <SkelBar w="60%" h={10} mt={4}/>
        <div style={{background:"var(--c-brand-cyan)", color:"#FFF", padding: 12, borderRadius: 4, marginTop: 6}}>
          <div style={{fontSize: 9, letterSpacing:"0.16em", textTransform:"uppercase", opacity: 0.8}}>The voice counter</div>
          <div style={{fontFamily:"var(--font-display)", fontWeight: 700, fontSize: 40, lineHeight: 1, opacity: 0.7}}>247</div>
          <div style={{fontSize: 9, opacity: 0.7, marginTop: 4}}>Last known · 09:42 GMT</div>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap: 4, marginTop: 8}}>
          {Array.from({length: 6}).map((_,i) => <SkelTile key={i}/>)}
        </div>
      </LoadingMini>

      <LoadingMini label="02 · Letter">
        <SkelBar w="40%" h={10}/>
        <div style={{fontFamily:"var(--font-display)", fontWeight: 700, fontSize: 28, lineHeight: 1, color:"var(--c-ink)"}}>The letter.</div>
        <SkelBar w="80%" h={10} mt={4}/>
        <SkelBar w="60%" h={10} mt={2}/>
        <div style={{display:"flex", flexDirection:"column", gap: 6, marginTop: 10}}>
          <SkelBar w="100%" h={8}/>
          <SkelBar w="95%" h={8}/>
          <SkelBar w="92%" h={8}/>
          <SkelBar w="40%" h={8}/>
        </div>
        <div style={{height: 10}}/>
        <div className="tag friendship" style={{opacity: 0.5}}>On friendship</div>
        <SkelBar w="80%" h={14}/>
        <SkelBar w="55%" h={14}/>
      </LoadingMini>

      <LoadingMini label="03 · Squad">
        <SkelBar w="40%" h={10}/>
        <div style={{fontFamily:"var(--font-display)", fontWeight: 700, fontSize: 22, lineHeight: 1, color:"var(--c-ink)"}}>Two hundred and forty-seven.</div>
        <SkelBar w="80%" h={10}/>
        <div style={{display:"flex", gap: 6, marginTop: 4}}>
          {Array.from({length: 4}).map((_,i) => <div key={i} style={{height: 22, flex: 1, background:"var(--c-rule-soft)", borderRadius: 999, animation:"skel 1.8s ease-in-out infinite"}}/>)}
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap: 4, marginTop: 8}}>
          {Array.from({length: 12}).map((_,i) => <SkelTile key={i}/>)}
        </div>
      </LoadingMini>

      <LoadingMini label="04 · Player card">
        <div style={{aspectRatio:"16/10", background:"#1a1714", borderRadius: 2, animation:"skel 1.8s ease-in-out infinite", display:"flex", alignItems:"center", justifyContent:"center"}}>
          <div style={{
            width: 36, height: 36, borderRadius: 999, border:"3px solid rgba(255,255,255,0.4)",
            borderTopColor:"#FFF", animation:"spin 1s linear infinite"
          }}/>
        </div>
        <div className="tag family" style={{alignSelf:"flex-start", opacity: 0.5}}>Family</div>
        <div style={{fontFamily:"var(--font-display)", fontWeight: 700, fontSize: 18, color:"var(--c-ink)"}}>№ 03</div>
        <SkelBar w="60%" h={20}/>
        <SkelBar w="80%" h={10} mt={4}/>
        <SkelBar w="60%" h={10} mt={2}/>
      </LoadingMini>

      <LoadingMini label="05 · About">
        <SkelBar w="40%" h={10}/>
        <div style={{fontFamily:"var(--font-display)", fontWeight: 700, fontSize: 22, lineHeight: 1.05, color:"var(--c-ink)"}}>A letter, written together.</div>
        <SkelBar w="90%" h={10} mt={4}/>
        <SkelBar w="60%" h={10} mt={2}/>
        <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap: 6, marginTop: 8}}>
          {["247","42","26"].map(n => (
            <div key={n} style={{padding: 10, background:"var(--c-paper-2)", borderRadius: 2}}>
              <div style={{fontFamily:"var(--font-display)", fontWeight:700, fontSize: 24, color:"var(--c-deep-900)"}}>{n}</div>
              <SkelBar w="80%" h={6} mt={4}/>
            </div>
          ))}
        </div>
      </LoadingMini>
    </div>

    <div style={{marginTop: 32, padding: 20, background:"var(--c-paper-2)", borderRadius: 2, border:"1px solid var(--c-rule-soft)", fontSize: 13, lineHeight: 1.6, color:"var(--c-ink-2)", maxWidth: 1200}}>
      <b style={{color:"var(--c-ink)"}}>Rules across pages:</b> Hero copy and the in-header counter never skeleton — they paint immediately from cached HTML. The counter shows the last-known number with a "Last known · 09:42 GMT" sub-line until live data resolves. Skeletons pulse on a 1.8s ease-in-out loop. After 8 seconds without resolution, fall through to the error counter variant.
    </div>

    <style dangerouslySetInnerHTML={{__html:`@keyframes spin { to { transform: rotate(360deg); } }`}}/>
  </div>
);
window.AppendixLoading = AppendixLoading;

// ============================================================
// CHANGES BANNER — top-of-canvas summary of this pass
// ============================================================
const ChangesBanner = () => (
  <div style={{
    background:"var(--c-paper)", padding: 48, width: 2400, minHeight: 540,
    display:"flex", flexDirection:"column", gap: 24
  }}>
    <div style={{display:"flex", alignItems:"baseline", gap: 16, paddingBottom: 16, borderBottom:"2px solid var(--c-ink)"}}>
      <div style={{
        fontFamily:"var(--font-display)", fontWeight: 700, fontSize: 11,
        letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--c-amber-700)"
      }}>Copy-consistency pass · May 2026</div>
      <div style={{flex: 1}}/>
      <div style={{fontSize: 12, color:"var(--c-ink-3)"}}>Aligning Home, Player Card and Squad with the new Letter · About copy.</div>
    </div>

    <h1 style={{
      fontFamily:"var(--font-display)", fontWeight: 700, fontStretch:"85%",
      textTransform:"uppercase", letterSpacing:"0.03em", lineHeight: 1,
      fontSize: 56, margin: 0, color:"var(--c-ink)", maxWidth:"40ch"
    }}>What changed in this pass.</h1>

    <p style={{fontFamily:"var(--font-body)", fontSize: 16, color:"var(--c-ink-2)", margin: 0, maxWidth:"80ch", lineHeight: 1.6}}>
      The Letter and About pages were rewritten to focus on the campaign’s actual advocacy ask — protecting football from junk food and drink marketing — organised around the question “Whose game is it anyway?” and the five values community / friendship / confidence / joy / belonging. Home, Player Card and Squad have been swept for copy that contradicted or duplicated that direction. Layout, system tokens, and interaction patterns are unchanged.
    </p>

    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap: 24, marginTop: 16}}>
      {[
        {
          group: "Home page",
          items: [
            ["H1", "Hero body line beneath the question rewritten: “247 young people. One open letter to FIFA. About community, friendship, confidence, joy, belonging — and the future of the game we love.” Replaces the previous “fairness, belonging, and the games we share” framing."],
            ["H2", "Starting-eleven heading replaced: “New Players. New Stories. Same Question.” (was “Eleven voices, rotating.”)."],
            ["H3", "Starting-eleven supporting line rewritten to end on the campaign question; reinforces the hero rather than introducing new framing."],
            ["H4", "Voice counter footnote: “recorded a video, wrote a paragraph, and signed the letter” → “recorded a video and added their name to the letter.” ‘Wrote a paragraph’ referred to the old six-theme structure that no longer exists."],
          ]
        },
        {
          group: "Player Card",
          items: [
            ["P1", "Theme tag, header chrome and footer indicator changed from Family to Friendship. The pull-quote (‘who hands us the ball back when we fall’) pairs with Friendship, not Family."],
            ["P2", "Confirmed: theme palette retains all six tags (fairness, belonging, friendship, confidence, family, community) for video browsing on Player Card + Squad. The Letter’s five-values list is a rhetorical moment, not a nav structure."],
            ["P3", "All other Player Card content unchanged — video chrome, captions, language dropdown, prev/next, error state."],
          ]
        },
        {
          group: "Squad page",
          items: [
            ["S1", "Hero supporting line: “signed the letter” → “added their name to the letter.” (desktop + mobile)"],
            ["S2", "Filter chips (Theme · Country · Language · Age) retained as-is. Theme filter still surfaces the original six themes."],
            ["S3", "Footer ‘Sign the letter’ link confirmed absent. Footer columns: THE LETTER · THE SQUAD · PROJECT · UNICEF."],
          ]
        }
      ].map(col => (
        <div key={col.group} style={{display:"flex", flexDirection:"column", gap: 12}}>
          <div style={{
            fontFamily:"var(--font-display)", fontWeight: 700, fontSize: 11,
            letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--c-ink-3)",
            paddingBottom: 8, borderBottom:"1px solid var(--c-rule)"
          }}>{col.group}</div>
          {col.items.map(([n, t]) => (
            <div key={n} style={{display:"grid", gridTemplateColumns:"56px 1fr", gap: 12, alignItems:"baseline"}}>
              <code style={{
                fontFamily:"var(--font-mono)", fontSize: 11, color:"var(--c-amber-700)",
                fontWeight: 600
              }}>{n}</code>
              <div style={{fontFamily:"var(--font-body)", fontSize: 13, lineHeight: 1.55, color:"var(--c-ink)"}}>{t}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);
window.ChangesBanner = ChangesBanner;
