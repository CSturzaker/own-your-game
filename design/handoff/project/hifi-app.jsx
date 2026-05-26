/* global React, ReactDOM, Frame, HomeDesktop, HomeMobile, PlayerCard, LetterDesktop, LetterMobile, SquadDesktop, SquadMobile, AboutDesktop, AboutMobile, Tile, Portrait, Header, Footer, PLAYERS, DesignCanvas, DCSection, DCArtboard, ChangesBanner, AppendixSpacing, AppendixRadius, AppendixComponents, AppendixColourMatrix, AppendixNavMap, AppendixBreakpoints, AppendixLoading */
const { useState, useEffect } = React;

// ============================================================
// SUMMARY ARTBOARD — one-page system overview
// ============================================================
const SystemSummary = () => (
  <div style={{
    background:"var(--c-paper)", padding: "56px 56px 48px", width: 2400,
    display:"flex", flexDirection:"column", gap: 40
  }}>
    {/* Title */}
    <header style={{display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap: 40, paddingBottom: 24, borderBottom:"2px solid var(--c-ink)"}}>
      <div style={{display:"flex", flexDirection:"column", gap: 20}}>
        <div style={{
          fontFamily:"var(--font-display)", fontWeight: 700,
          fontSize: 11, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--c-ink-3)"
        }}>Hi-fi prototype · Agency brand re-skin · May 2026</div>
        <div style={{display:"flex", alignItems:"center", gap: 28}}>
          <img src="assets/own-your-game-logo.svg" alt="Own Your Game" style={{height: 96, width:"auto", display:"block"}}/>
          <h1 className="tagline" style={{
            fontFamily:"var(--font-display)", fontWeight: 500, fontStyle:"italic",
            fontSize: 44, lineHeight: 1.05, margin: 0, color:"var(--c-ink)",
            borderLeft:"3px solid var(--c-amber)", paddingLeft: 20, maxWidth: "14ch"
          }}>Whose game is it anyway?</h1>
        </div>
      </div>
      <div style={{textAlign:"right", maxWidth: "44ch"}}>
        <div style={{fontFamily:"var(--font-display)", fontWeight: 600, fontSize: 14, color:"var(--c-ink)", marginBottom: 4}}>5 pages · 2 viewports · 16 states</div>
        <div style={{fontSize: 13, color:"var(--c-ink-2)"}}>
          Independent youth campaign · 247 voices · 42 countries · 26 languages — published ahead of the 2026 World Cup.
        </div>
      </div>
    </header>

    {/* Desktop row — scaled down */}
    <section>
      <div style={{
        fontFamily:"var(--font-display)", fontWeight:700, fontStretch:"85%",
        textTransform:"uppercase", letterSpacing:"0.14em", fontSize: 12,
        color:"var(--c-ink-3)", marginBottom: 16
      }}>Desktop — 1440px</div>
      <div style={{display:"flex", gap: 16}}>
        {[
          {label:"01 · Home", w: 1440, content: <HomeDesktop/>},
          {label:"02 · Player card", w: 1440, content: <PlayerCard variant="playing-controls"/>},
          {label:"03 · The letter", w: 1440, content: <LetterDesktop/>},
          {label:"04 · The squad", w: 1440, content: <SquadDesktop variant="filtered"/>},
          {label:"05 · About", w: 1440, content: <AboutDesktop/>},
        ].map((c,i)=>(
          <div key={i} style={{flex: 1, display:"flex", flexDirection:"column", gap: 8}}>
            <div style={{
              fontFamily:"var(--font-display)", fontWeight:600, fontSize: 11,
              letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-ink)"
            }}>{c.label}</div>
            <div style={{
              width: "100%", aspectRatio: "1440 / 2200",
              outline:"1px solid var(--c-rule)", boxShadow:"0 6px 18px rgba(20,14,0,0.08)",
              overflow:"hidden", position:"relative", background:"var(--c-paper)"
            }}>
              <div style={{
                width: 1440, transform: `scale(${440/1440})`,
                transformOrigin: "top left", height: 2200
              }}>
                <div className="pg" style={{width: 1440, minHeight: 2200, position:"relative"}}>
                  {c.content}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* Mobile row */}
    <section>
      <div style={{
        fontFamily:"var(--font-display)", fontWeight:700, fontStretch:"85%",
        textTransform:"uppercase", letterSpacing:"0.14em", fontSize: 12,
        color:"var(--c-ink-3)", marginBottom: 16
      }}>Mobile — 375px</div>
      <div style={{display:"flex", gap: 24, justifyContent:"flex-start"}}>
        {[
          {label:"01 · Home", content: <HomeMobile/>},
          {label:"02 · Player", content: <PlayerCard variant="poster" mobile/>},
          {label:"03 · Letter", content: <LetterMobile/>},
          {label:"04 · Squad", content: <SquadMobile/>},
          {label:"05 · About", content: <AboutMobile/>},
        ].map((c,i)=>(
          <div key={i} style={{display:"flex", flexDirection:"column", gap: 8, width: 280}}>
            <div style={{
              fontFamily:"var(--font-display)", fontWeight:600, fontSize: 11,
              letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-ink)"
            }}>{c.label}</div>
            <div style={{
              width: 280, height: 580,
              borderRadius: 24, border:"6px solid #2A2724",
              boxShadow:"0 12px 32px rgba(20,14,0,0.16)",
              overflow:"hidden", position:"relative", background:"var(--c-paper)"
            }}>
              <div style={{
                width: 375, transform: `scale(${268/375})`,
                transformOrigin: "top left"
              }}>
                <div className="pg" style={{width: 375, minHeight: 820, position:"relative"}}>{c.content}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* Palette + type strip */}
    <section style={{
      display:"grid", gridTemplateColumns:"1.5fr 1fr 1.1fr", gap: 32,
      paddingTop: 32, borderTop:"2px solid var(--c-ink)"
    }}>
      {/* Palette */}
      <div>
        <div style={{fontFamily:"var(--font-display)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.14em", fontSize: 12, color:"var(--c-ink-3)", marginBottom: 16}}>Colour system — brand + functional</div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap: 10}}>
          {[
            {n:"Process Cyan",     v:"#00AEEF", role:"Brand fill"},
            {n:"Pantone 1505",     v:"#F36C21", role:"Brand accent"},
            {n:"Functional Cyan",  v:"#007FB8", role:"Link text"},
            {n:"Functional Orange",v:"#C04A12", role:"Theme tag"},
            {n:"Deep Cyan",        v:"#074661", role:"Anchor"},
            {n:"Deep Rust",        v:"#7A2F08", role:"Anchor"},
            {n:"Ink",              v:"#1A1A1A", role:"Body text"},
            {n:"Ink 2",            v:"#4A4640", role:"Secondary"},
            {n:"Paper",            v:"#F5F0E8", role:"Page bg", border:true},
            {n:"Paper 2",          v:"#EDE6D7", role:"Alt bg", border:true},
            {n:"Rule",             v:"#D9D2C7", role:"Hairline", border:true},
            {n:"Rule soft",        v:"#ECE6DA", role:"Faint", border:true},
          ].map((c,i)=>(
            <div key={i} style={{display:"flex", flexDirection:"column", gap: 6}}>
              <div style={{
                width:"100%", aspectRatio:"1.4/1", background: c.v, borderRadius: 2,
                border: c.border ? "1px solid var(--c-rule)" : "0"
              }}/>
              <div style={{fontFamily:"var(--font-display)", fontWeight:700, fontSize: 10, letterSpacing:"0.06em", textTransform:"uppercase", color:"var(--c-ink-2)", lineHeight: 1.1}}>{c.n}</div>
              <div style={{fontFamily:"var(--font-mono, monospace)", fontSize: 9, color:"var(--c-ink-3)"}}>{c.v}</div>
              <div style={{fontSize: 9, color:"var(--c-ink-3)"}}>{c.role}</div>
            </div>
          ))}
        </div>

        {/* Theme tag swatches */}
        <div style={{marginTop: 22, display:"flex", flexDirection:"column", gap: 8}}>
          <div style={{fontFamily:"var(--font-display)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.14em", fontSize: 11, color:"var(--c-ink-3)"}}>Six theme tags — filled brand colour, white text</div>
          <div style={{display:"flex", flexWrap:"wrap", gap: 6}}>
            <div className="tag fairness">Fairness</div>
            <div className="tag belonging">Belonging</div>
            <div className="tag friendship">Friendship</div>
            <div className="tag confidence">Confidence</div>
            <div className="tag family">Family</div>
            <div className="tag community">Community</div>
          </div>
        </div>
      </div>

      {/* Type */}
      <div>
        <div style={{fontFamily:"var(--font-display)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.14em", fontSize: 12, color:"var(--c-ink-3)", marginBottom: 16}}>Typography</div>
        <div style={{display:"flex", flexDirection:"column", gap: 22}}>
          <div>
            <div style={{fontFamily:"var(--font-display)", fontWeight:700, letterSpacing:"-0.02em", fontSize: 56, lineHeight: 0.95}}>Space Grotesk</div>
            <div style={{fontFamily:"var(--font-display)", fontWeight: 500, fontStyle:"italic", fontSize: 22, lineHeight: 1.15, color:"var(--c-ink-2)", marginTop: 6}}>Whose game is it anyway?</div>
            <div style={{fontSize: 11, color:"var(--c-ink-3)", marginTop: 8}}>Display · weights 400/500/600/700 · supports Latin Extended, Cyrillic, Vietnamese</div>
          </div>
          <div>
            <div style={{fontFamily:"var(--font-body)", fontSize: 17, lineHeight: 1.55, color:"var(--c-ink)"}}>Noto Sans — the body face. Quiet, readable at 17px on warm paper. Used for the letter, captions, and all running prose.</div>
            <div style={{fontSize: 11, color:"var(--c-ink-3)", marginTop: 8}}>Body · weights 400/500/600/700 · near-universal script coverage</div>
          </div>
        </div>
      </div>

      {/* Components shortlist */}
      <div>
        <div style={{fontFamily:"var(--font-display)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.14em", fontSize: 12, color:"var(--c-ink-3)", marginBottom: 16}}>Components</div>
        <div style={{display:"flex", flexDirection:"column", gap: 14}}>
          <div style={{display:"flex", gap: 8, flexWrap:"wrap"}}>
            <button className="btn btn--sm">Primary</button>
            <button className="btn btn--ghost btn--sm" style={{borderColor:"var(--c-ink)"}}>Ghost</button>
            <button className="btn btn--amber btn--sm">Orange</button>
            <button className="btn btn--deep btn--sm">Cyan</button>
          </div>
          <div style={{display:"flex", gap: 8, flexWrap:"wrap"}}>
            <div className="chip">Filter</div>
            <div className="chip active">Active filter</div>
          </div>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:8, alignSelf:"flex-start",
            padding:"6px 12px", border:"1px solid var(--c-rule)",
            borderRadius:999, fontFamily:"var(--font-display)", fontWeight:600, fontSize: 12
          }}>
            <span style={{width: 7, height: 7, borderRadius: 999, background:"var(--c-amber)", boxShadow:"0 0 0 3px rgba(243,108,33,0.30)"}}/>
            <b>247</b> <span style={{color:"var(--c-ink-3)"}}>voices and counting</span>
          </div>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:8, alignSelf:"flex-start",
            padding:"6px 14px", borderRadius:999,
            background:"var(--c-brand-cyan)", color:"#FFFFFF",
            fontFamily:"var(--font-display)", fontWeight:600, fontSize: 12, letterSpacing:"0.04em"
          }}>
            Process Cyan fill — white only
          </div>
          <a href="#" style={{fontSize: 14, color:"var(--c-fn-cyan)", textDecoration:"underline", textUnderlineOffset:3}}>An inline link in Functional Cyan</a>
        </div>
      </div>
    </section>
  </div>
);
window.SystemSummary = SystemSummary;

// ============================================================
// ACCESSIBILITY DEMO FRAME — single artboard
// ============================================================
const A11yDemo = () => (
  <div style={{padding: 32, background:"var(--c-paper-2)", display:"flex", flexDirection:"column", gap: 32}}>
    <div>
      <div className="kicker">Accessibility · evidenced</div>
      <h2 style={{
        fontFamily:"var(--font-display)", fontWeight:700, fontStretch:"85%",
        textTransform:"uppercase", letterSpacing:"0.03em", lineHeight: 1,
        fontSize: 32, margin:"12px 0 0"
      }}>Four explicit states</h2>
    </div>

    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap: 24}}>
      {/* Focus state on tile */}
      <div style={{
        background:"var(--c-paper)", borderRadius: 4, padding: 24,
        outline:"1px solid var(--c-rule)"
      }}>
        <div style={{fontFamily:"var(--font-display)", fontWeight:700, fontSize: 13, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--c-ink)"}}>Keyboard focus on a tile</div>
        <div style={{fontSize: 12, color:"var(--c-ink-3)", marginBottom: 14}}>Amber 3px ring with 3px offset · WCAG AA 3:1 against paper</div>
        <div style={{width: 200, outline:"3px solid var(--c-fn-cyan)", outlineOffset: 3}}>
          <Tile player={PLAYERS[2]}/>
        </div>
      </div>

      {/* Skip link */}
      <div style={{
        background:"var(--c-paper)", borderRadius: 4, padding: 24,
        outline:"1px solid var(--c-rule)", position:"relative"
      }}>
        <div style={{fontFamily:"var(--font-display)", fontWeight:700, fontSize: 13, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--c-ink)"}}>Skip-to-content link</div>
        <div style={{fontSize: 12, color:"var(--c-ink-3)", marginBottom: 14}}>Visible only on first Tab press · keyboard-only users</div>
        <div style={{
          background:"linear-gradient(180deg, var(--c-paper), var(--c-paper-2))",
          height: 100, position:"relative", borderRadius: 2, border:"1px solid var(--c-rule-soft)"
        }}>
          <div style={{
            position:"absolute", top: 8, left: 8,
            background:"var(--c-ink)", color:"var(--c-paper)",
            padding:"10px 16px", borderRadius: 4,
            fontFamily:"var(--font-body)", fontWeight:600, fontSize: 13,
            boxShadow:"0 4px 12px rgba(20,14,0,0.18)"
          }}>Skip to content</div>
          <div style={{
            position:"absolute", top: 8, right: 12, fontSize: 10,
            color:"var(--c-ink-3)", fontFamily:"var(--font-mono, monospace)"
          }}>↹ Tab</div>
        </div>
      </div>

      {/* Captions */}
      <div style={{
        background:"var(--c-paper)", borderRadius: 4, padding: 24,
        outline:"1px solid var(--c-rule)"
      }}>
        <div style={{fontFamily:"var(--font-display)", fontWeight:700, fontSize: 13, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--c-ink)"}}>Caption styling</div>
        <div style={{fontSize: 12, color:"var(--c-ink-3)", marginBottom: 14}}>17px Noto Sans on rgba(15,18,22,0.78) — contrast 12.3:1</div>
        <div style={{
          background:"#1a1714", borderRadius: 2, padding: 24,
          display:"flex", alignItems:"center", justifyContent:"center"
        }}>
          <div style={{
            background:"rgba(15,18,22,0.78)", color:"var(--c-paper)",
            padding:"10px 16px", borderRadius: 4, fontSize: 17, lineHeight: 1.4,
            textAlign:"center", maxWidth: "30ch"
          }}>We learn the world through who we play with.</div>
        </div>
      </div>

      {/* Reduced motion */}
      <div style={{
        background:"var(--c-paper)", borderRadius: 4, padding: 24,
        outline:"1px solid var(--c-rule)"
      }}>
        <div style={{fontFamily:"var(--font-display)", fontWeight:700, fontSize: 13, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--c-ink)"}}>Reduced-motion variant</div>
        <div style={{fontSize: 12, color:"var(--c-ink-3)", marginBottom: 14}}>Rotation paused · pulses replaced with static dots · counter shown without tick animation</div>
        <div style={{
          display:"flex", flexDirection:"column", gap: 10,
          padding: 16, background:"var(--c-paper-2)", borderRadius: 2
        }}>
          <div className="tag friendship" style={{
            background:"var(--c-paper)", color:"var(--c-ink-2)", border:"1px solid var(--c-rule)", alignSelf:"flex-start"
          }}>Reduced motion — rotation paused</div>
          <div style={{
            display:"inline-flex", alignItems:"center", gap: 8, padding:"6px 12px",
            border:"1px solid var(--c-rule)", borderRadius: 999, background:"var(--c-paper)",
            fontFamily:"var(--font-display)", fontWeight: 600, fontSize: 12, alignSelf:"flex-start"
          }}>
            <span style={{width: 7, height: 7, borderRadius: 999, background:"var(--c-amber)"}}/>
            <b>247</b> <span style={{color:"var(--c-ink-3)"}}>voices and counting</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
window.A11yDemo = A11yDemo;

// ============================================================
// APP — design canvas with all artboards
// ============================================================
const App = () => {
  // Page-level nav for prototype: when user clicks tiles/CTAs inside an artboard,
  // we open the focus-mode of the corresponding artboard.
  React.useEffect(() => {
    window.gotoPage = (page) => {
      const map = { home: "home-d", letter: "letter-d", squad: "squad-d", about: "about-d", player: "player-poster" };
      const id = map[page];
      if (!id) return;
      // Use the DC focus event
      window.dispatchEvent(new CustomEvent("dc:focus", { detail: { id } }));
    };
  }, []);

  return (
    <DesignCanvas title="Own Your Game — Hi-fi Prototype" subtitle="5 pages · 2 viewports · all key states · cleanup pass + dev hand-off appendix">

      <DCSection id="changes" title="Copy-consistency pass · May 2026"
                 description="What changed on Home, Player Card and Squad to align with the new Letter and About copy.">
        <DCArtboard id="changes-banner" label="Summary of changes · per page" width={2400} height={680}>
          <ChangesBanner/>
        </DCArtboard>
      </DCSection>

      <DCSection id="summary" title="Summary artboard"
                 description="For press, partner briefs, and stakeholder presentations. The whole system at a glance.">
        <DCArtboard id="summary-board" label="System summary — all pages, palette, type" width={2400} height={2400}>
          <SystemSummary/>
        </DCArtboard>
      </DCSection>

      <DCSection id="home" title="Page 01 — Home"
                 description="Hero · voice counter · starting-eleven 1-4-3-3 rotation · why this letter.">
        <DCArtboard id="home-d" label="Desktop — default" width={1440} height={3500}><HomeDesktop/></DCArtboard>
        <DCArtboard id="home-d-rot" label="Desktop — mid-rotation (new tile flashes)" width={1440} height={3500}><HomeDesktop variant="mid-rotation"/></DCArtboard>
        <DCArtboard id="home-d-trans" label="Desktop — full eleven transition" width={1440} height={3500}><HomeDesktop variant="transition"/></DCArtboard>
        <DCArtboard id="home-d-sticky" label="Desktop — sticky header on scroll" width={1440} height={3500}><HomeDesktop sticky/></DCArtboard>
        <DCArtboard id="home-d-rm" label="Desktop — reduced motion" width={1440} height={3500}><HomeDesktop variant="reduced-motion"/></DCArtboard>
        <DCArtboard id="home-d-load" label="Desktop — initial loading" width={1440} height={3500}><HomeDesktop variant="loading"/></DCArtboard>
        <DCArtboard id="home-d-err" label="Desktop — counter offline" width={1440} height={3500}><HomeDesktop variant="error-counter"/></DCArtboard>
        <DCArtboard id="home-m" label="Mobile — default" width={375} height={3000}><HomeMobile/></DCArtboard>
        <DCArtboard id="home-m-rot" label="Mobile — mid-rotation" width={375} height={3000}><HomeMobile variant="mid-rotation"/></DCArtboard>
        <DCArtboard id="home-m-rm" label="Mobile — reduced motion" width={375} height={3000}><HomeMobile variant="reduced-motion"/></DCArtboard>
      </DCSection>

      <DCSection id="player" title="Page 02 — Player card"
                 description="Opens as modal over the home page · video, captions, language, prev/next.">
        <DCArtboard id="player-poster" label="Desktop — poster, ready to play" width={1440} height={1100}><PlayerCard variant="poster"/></DCArtboard>
        <DCArtboard id="player-playing" label="Desktop — playing with controls" width={1440} height={1100}><PlayerCard variant="playing-controls"/></DCArtboard>
        <DCArtboard id="player-faded" label="Desktop — controls faded after 3s" width={1440} height={1100}><PlayerCard variant="playing-faded"/></DCArtboard>
        <DCArtboard id="player-dropdown" label="Desktop — caption language dropdown open" width={1440} height={1100}><PlayerCard variant="dropdown"/></DCArtboard>
        <DCArtboard id="player-transition" label="Desktop — next/previous transition" width={1440} height={1100}><PlayerCard variant="transition"/></DCArtboard>
        <DCArtboard id="player-error" label="Desktop — video failed to load" width={1440} height={1100}><PlayerCard variant="error"/></DCArtboard>
        <DCArtboard id="player-m" label="Mobile — swipe-enabled full-screen" width={375} height={900}><PlayerCard mobile/></DCArtboard>
      </DCSection>

      <DCSection id="letter" title="Page 03 — The letter"
                 description="Drop-cap opener · six themes · signer rows · right-rail section nav · share CTA.">
        <DCArtboard id="letter-d" label="Desktop — default" width={1440} height={3700}><LetterDesktop/></DCArtboard>
        <DCArtboard id="letter-d-tooltip" label="Desktop — signer tooltip open" width={1440} height={3700}><LetterDesktop variant="tooltip-open"/></DCArtboard>
        <DCArtboard id="letter-d-share" label="Desktop — share options expanded" width={1440} height={3800}><LetterDesktop variant="share-expanded"/></DCArtboard>
        <DCArtboard id="letter-m" label="Mobile — default" width={375} height={4000}><LetterMobile/></DCArtboard>
      </DCSection>

      <DCSection id="squad" title="Page 04 — The full squad"
                 description="Filterable grid · 247 voices · empty state handled with care.">
        <DCArtboard id="squad-d" label="Desktop — default unfiltered" width={1440} height={1600}><SquadDesktop/></DCArtboard>
        <DCArtboard id="squad-d-open" label="Desktop — country filter open with search" width={1440} height={1600}><SquadDesktop variant="filter-open"/></DCArtboard>
        <DCArtboard id="squad-d-filtered" label="Desktop — filtered to Friendship (38 of 38)" width={1440} height={2200}><SquadDesktop variant="filtered"/></DCArtboard>
        <DCArtboard id="squad-d-load" label="Desktop — load-more, staggered fade-in" width={1440} height={1900}><SquadDesktop variant="load-more"/></DCArtboard>
        <DCArtboard id="squad-d-empty" label="Desktop — empty state (3 filters, 0 matches)" width={1440} height={1400}><SquadDesktop variant="empty"/></DCArtboard>
        <DCArtboard id="squad-m" label="Mobile — default" width={375} height={1200}><SquadMobile/></DCArtboard>
      </DCSection>

      <DCSection id="about" title="Page 05 — About & partners"
                 description="Project story · numbers · partners · closing crescendo.">
        <DCArtboard id="about-d" label="Desktop — default" width={1440} height={3500}><AboutDesktop/></DCArtboard>
        <DCArtboard id="about-d-anim" label="Desktop — numbers mid count-up" width={1440} height={3500}><AboutDesktop variant="numbers-animating"/></DCArtboard>
        <DCArtboard id="about-m" label="Mobile — default" width={375} height={2200}><AboutMobile/></DCArtboard>
      </DCSection>

      <DCSection id="a11y" title="Accessibility evidence"
                 description="Four explicit states: focus ring on a tile, skip-link, captions contrast, reduced-motion variant.">
        <DCArtboard id="a11y-1" label="Accessibility states" width={1200} height={900}><A11yDemo/></DCArtboard>
      </DCSection>

      {/* ========= APPENDIX FRAMES — developer hand-off ========= */}
      <DCSection id="appendix-a" title="Appendix A — Spacing tokens"
                 description="4px base scale, where each step is used, and rules of thumb.">
        <DCArtboard id="appx-spacing" label="Spacing scale · 4, 8, 12, 16, 24, 32, 48, 64, 96, 128" width={1600} height={1100}><AppendixSpacing/></DCArtboard>
      </DCSection>

      <DCSection id="appendix-b" title="Appendix B — Radius tokens"
                 description="Three values: card, field, pill.">
        <DCArtboard id="appx-radius" label="Radius tokens · 4 · 2 · 999px" width={1600} height={900}><AppendixRadius/></DCArtboard>
      </DCSection>

      <DCSection id="appendix-c" title="Appendix C — Component inventory"
                 description="Every reusable component at production size with its name, props, and states.">
        <DCArtboard id="appx-components" label="Components · production size" width={2200} height={2400}><AppendixComponents/></DCArtboard>
      </DCSection>

      <DCSection id="appendix-d" title="Appendix D — Colour usage matrix"
                 description="Cheat sheet: which token can appear in which context.">
        <DCArtboard id="appx-colour" label="Colour × context grid" width={2000} height={1400}><AppendixColourMatrix/></DCArtboard>
      </DCSection>

      <DCSection id="appendix-e" title="Appendix E — Page-to-page navigation"
                 description="Every link between pages, and the modal overlay behaviour of the player card.">
        <DCArtboard id="appx-nav" label="Page-to-page map · 5 pages + 1 modal" width={1800} height={1200}><AppendixNavMap/></DCArtboard>
      </DCSection>

      <DCSection id="appendix-f" title="Appendix F — Responsive breakpoints"
                 description="Mobile ≤ 480 · Tablet 481–1024 · Desktop ≥ 1025.">
        <DCArtboard id="appx-breakpoints" label="Breakpoints · 3 ranges" width={1800} height={1100}><AppendixBreakpoints/></DCArtboard>
      </DCSection>

      <DCSection id="appendix-g" title="Appendix G — Loading skeletons"
                 description="The first 1–2 seconds on slow connections, across all five pages.">
        <DCArtboard id="appx-loading" label="Loading states · all pages" width={2000} height={1000}><AppendixLoading/></DCArtboard>
      </DCSection>

    </DesignCanvas>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
