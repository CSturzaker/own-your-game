/* global React, Header, Footer, Portrait, PLAYERS */
const { useState } = React;

// ============================================================
// THE LETTER — page 3
// Variants: default | tooltip-open | share-expanded
// ------------------------------------------------------------
// Replacement copy pass · May 2026
// The previous six-theme structure is gone. The new letter is a
// single flowing piece of writing whose editorial weight comes
// from rhetorical rhythm: the call-and-response of the central
// question, the list of values, the direct ask, the sign-off.
//
// Designed moments preserved:
//   · drop-cap opener (Deep Cyan)
//   · the central "Whose game is it anyway?" — twin to the About page
//   · five-line values list, each line keyed to a theme palette dot
//   · the ask, in display face, set apart
//   · one signed-by row + "+239 more" link to the squad
//   · sign-off in team-sheet style
//   · live counter, share block (unchanged)
// ============================================================

// Navigator anchors — four rhetorical waypoints replacing the
// previous six themes. Active waypoint is the one the reader is
// closest to (here we hand-set "The question" as the active state).
const NAV_POINTS = [
  { key: "opening",  label: "Opening" },
  { key: "question", label: "The question" },
  { key: "ask",      label: "The ask" },
  { key: "signoff",  label: "Sign-off" },
];

// Five-values list — keyed to the theme palette. The mapping is
// a deliberate nod to the previous six themes, lightly: one dot
// per line, drawn from the same palette so the row still reads as
// a multicoloured signature line. Order follows the letter.
const VALUES = [
  { word: "community",  color: "var(--c-community)"  }, // ink
  { word: "friendship", color: "var(--c-friendship)" }, // deep cyan
  { word: "confidence", color: "var(--c-confidence)" }, // deep rust
  { word: "joy",        color: "var(--c-belonging)"  }, // functional orange
  { word: "belonging",  color: "var(--c-fairness)"   }, // functional cyan
];

// Single signed-by row, drawn from across the theme palette so
// the row reads as a multicoloured signature line. 8 thumbnails
// + "+239 more" → 247 total (matching the counter).
const SIGNERS = ["s-com1","s-fri2","s-con3","s-joy4","s-bel5","s-com6","s-fri7","s-con8"];

const SignedByRow = ({ tooltipOnIdx = -1 }) => (
  <div style={{
    display:"flex", alignItems:"center", gap: 14, flexWrap:"wrap",
    paddingTop: 24, borderTop:"1px solid var(--c-rule-soft)", position:"relative"
  }}>
    <div style={{
      fontFamily:"var(--font-display)", fontWeight:600, fontSize: 11,
      letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-ink-3)",
      marginRight: 4
    }}>
      Signed by
    </div>
    <div style={{display:"flex", position:"relative"}}>
      {SIGNERS.map((s,i)=>(
        <div key={s} style={{
          position:"relative", marginLeft: i===0 ? 0 : -10,
          border:"2px solid var(--c-paper)", borderRadius: 999, overflow:"hidden",
          width: 40, height: 40
        }}>
          <div style={{width:40, height:50, transform:"translateY(-4px)"}}>
            <Portrait seed={s}/>
          </div>
          {tooltipOnIdx === i && (
            <div style={{
              position:"absolute", left: "50%", bottom: "calc(100% + 12px)",
              transform:"translateX(-50%)", zIndex: 10,
              background:"var(--c-ink)", color:"var(--c-paper)",
              padding:"12px 14px", borderRadius: 4, width: 200,
              boxShadow:"0 8px 24px rgba(20,14,0,0.24)"
            }}>
              <div style={{
                fontFamily:"var(--font-display)", fontWeight:700,
                letterSpacing:"0.03em", fontSize: 14, textTransform:"uppercase"
              }}>Aïsha, 14</div>
              <div style={{fontSize: 11, color:"rgba(245,240,232,0.7)", marginTop: 2, letterSpacing:"0.04em"}}>
                Dakar, Senegal
              </div>
              <a href="#" style={{
                display:"inline-flex", alignItems:"center", gap: 4,
                fontSize: 12, color:"var(--c-amber)", marginTop: 8,
                textDecoration:"none", fontWeight: 600
              }}>View her story →</a>
              <div style={{
                position:"absolute", left:"50%", bottom: -6, transform:"translateX(-50%) rotate(45deg)",
                width: 12, height: 12, background:"var(--c-ink)"
              }}/>
            </div>
          )}
        </div>
      ))}
    </div>
    <a href="#" onClick={(e)=>{e.preventDefault();window.gotoPage?.("squad")}} style={{
      marginLeft: 6,
      fontFamily:"var(--font-body)", fontSize: 14, color:"var(--c-ink)",
      textDecoration:"underline", textUnderlineOffset:3, fontWeight: 600
    }}>+ 239 more — the full squad</a>
  </div>
);

const LetterDesktop = ({ variant = "default" }) => {
  const showTooltip = variant === "tooltip-open";
  const shareOpen = variant === "share-expanded";
  const activeKey = "question"; // mid-letter scroll position for the prototype

  return (
    <>
      <Header active="letter"/>

      {/* Right-rail four-point progress navigator. Replaces the previous
         six-theme nav. The letter has no themed sections any more — these
         four rhetorical waypoints give a structural read at a glance and
         anchor to scroll position in production. */}
      <div style={{
        position:"absolute", right: 32, top: 200, zIndex: 4,
        display:"flex", flexDirection:"column", gap: 4,
        padding:"20px 18px 20px 14px", background:"var(--c-paper)",
        border:"1px solid var(--c-rule-soft)", borderRadius: 4,
        minWidth: 168
      }}>
        <div style={{
          fontFamily:"var(--font-display)", fontWeight:700, fontSize: 10,
          letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--c-ink-3)",
          marginBottom: 10, paddingLeft: 18
        }}>Read the letter</div>
        {NAV_POINTS.map((n,i)=>{
          const active = n.key === activeKey;
          return (
            <div key={n.key} style={{
              display:"flex", alignItems:"center", gap: 12, padding:"7px 6px",
              cursor:"pointer", position:"relative"
            }}>
              <span style={{
                display:"inline-flex", alignItems:"center", justifyContent:"center",
                width: 18, height: 18, borderRadius: 999,
                border: active ? "0" : "1px solid var(--c-rule)",
                background: active ? "var(--c-amber)" : "var(--c-paper)",
                color: active ? "#FFFFFF" : "var(--c-ink-3)",
                fontFamily:"var(--font-display)", fontWeight: 700, fontSize: 10,
                fontVariantNumeric:"tabular-nums", flexShrink: 0
              }}>{i+1}</span>
              <span style={{
                fontFamily:"var(--font-display)",
                fontWeight: active ? 700 : 500,
                fontSize: 12, letterSpacing:"0.02em",
                color: active ? "var(--c-ink)" : "var(--c-ink-3)",
                whiteSpace:"nowrap"
              }}>{n.label}</span>
            </div>
          );
        })}
      </div>

      <main id="main" style={{
        maxWidth: 760, margin: "0 auto", padding: "56px 24px 80px",
        display:"flex", flexDirection:"column", gap: 44
      }}>
        {/* Letter header */}
        <header style={{display:"flex", flexDirection:"column", gap: 16, paddingBottom: 28, borderBottom:"2px solid var(--c-ink)"}}>
          <div className="kicker">An open letter from young people</div>
          <h1 style={{
            fontFamily:"var(--font-display)", fontWeight:700,
            letterSpacing:"-0.02em", lineHeight: 1, fontSize: 72, margin: 0
          }}>The letter.</h1>
          <p style={{
            fontFamily:"var(--font-display)", fontWeight: 500, fontSize: 22,
            lineHeight: 1.3, color:"var(--c-ink-2)", margin: 0
          }}>From the young people of the world.</p>
          <div style={{
            fontFamily:"var(--font-body)", fontSize: 13, color:"var(--c-ink-3)",
            display:"flex", alignItems:"center", gap: 10, letterSpacing:"0.02em",
            marginTop: 8
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: 999, background:"var(--c-amber)",
              boxShadow:"0 0 0 4px rgba(243,108,33,0.25)",
              animation:"pulse 2s ease-in-out infinite"
            }}/>
            <b style={{color:"var(--c-ink)", fontWeight:600}}>247</b> signatures — and growing daily
            <span style={{color:"var(--c-rule)"}}>·</span>
            Last voice added 2 hours ago
          </div>
        </header>

        {/* Salutation */}
        <div style={{
          fontFamily:"var(--font-body)", fontSize: 20, fontWeight: 500,
          color:"var(--c-ink)", margin: 0
        }} data-nav="opening">Dear FIFA,</div>

        {/* Opener with drop cap */}
        <p style={{
          fontFamily:"var(--font-body)", fontSize: 19, lineHeight: 1.75,
          color:"var(--c-ink)", margin: 0
        }}>
          <span style={{
            fontFamily:"var(--font-display)", fontWeight: 700,
            fontSize: 96, float:"left", lineHeight: 0.85,
            marginRight: 14, marginTop: 6, marginBottom: -4,
            color:"var(--c-deep-900)", letterSpacing:"-0.02em"
          }}>W</span>
          e are writing to you as young people who love football.
        </p>

        <p style={{fontFamily:"var(--font-body)", fontSize: 19, lineHeight: 1.75, margin: 0, color:"var(--c-ink)"}}>
          Not just the big tournaments, but everything around it too.
          The local teams. The friendships. The families on the sidelines.
          The feeling of belonging somewhere.
        </p>

        <p style={{fontFamily:"var(--font-body)", fontSize: 19, lineHeight: 1.75, margin: 0, color:"var(--c-ink)"}}>
          Football gives children and young people confidence. It brings communities
          together. It teaches fairness, teamwork and respect without needing to
          say the words out loud.
        </p>

        {/* Reframing line — slightly weightier than body, set in display
           face. A small designed pause before the turn. */}
        <p style={{
          fontFamily:"var(--font-display)", fontWeight: 500, fontSize: 22,
          lineHeight: 1.45, color:"var(--c-ink)", margin: "4px 0",
          maxWidth: "44ch", textWrap:"balance"
        }}>
          That is what sport, and the 2026 FIFA World Cup, means to us.
        </p>

        <p style={{fontFamily:"var(--font-body)", fontSize: 19, lineHeight: 1.75, margin: 0, color:"var(--c-ink)"}}>
          Yet more and more, the spaces we love are filled with advertising and
          sponsorship from junk food and drink companies. And lately, many young
          people have started asking the same question:
        </p>

        {/* THE central question. Twinned with the About page treatment so
           the two read as one campaign moment, asked twice. Full display
           italic at h1 scale, amber hairline left, generous whitespace
           above and below. The typography carries it — no quotation marks. */}
        <div data-nav="question" style={{
          margin: "24px 0", paddingLeft: 32,
          borderLeft: "3px solid var(--c-amber)"
        }}>
          <div className="tagline" style={{
            fontSize: 88, lineHeight: 1.0, color:"var(--c-ink)",
            letterSpacing:"-0.015em", margin: 0, maxWidth: "16ch"
          }}>Whose game is it anyway?</div>
        </div>

        <p style={{fontFamily:"var(--font-body)", fontSize: 19, lineHeight: 1.75, margin: 0, color:"var(--c-ink)"}}>
          Because sometimes it feels like the joy, energy and community that
          football creates are being used to sell products that do not have our
          best interests at heart. The foods that you promote don’t fuel our
          game, they make us sick. And the companies that promote them do not
          often play fair.
        </p>

        <p style={{fontFamily:"var(--font-body)", fontSize: 19, lineHeight: 1.75, margin: 0, color:"var(--c-ink)"}}>
          We grow up seeing these brands everywhere in football, around the
          pitch, on our screens, on the shirts of players we look up to, until
          it starts to feel like they are part of the game itself.
        </p>

        {/* Pivot — heavier weight, set apart with whitespace. */}
        <p style={{
          fontFamily:"var(--font-display)", fontWeight: 600, fontSize: 28,
          lineHeight: 1.3, color:"var(--c-ink)", margin: "12px 0 4px",
          letterSpacing:"-0.01em", maxWidth: "26ch"
        }}>
          But football should be about people first.
        </p>

        {/* Five-values list. Each line is its own typographic moment in
           team-sheet style (Space Grotesk Bold, tracked, all-caps), keyed
           to a small filled theme-palette dot. This recovers the previous
           design's six-theme visual signal lightly, without forcing the
           new letter into structure it doesn't have. */}
        <ul style={{
          listStyle:"none", padding: 0, margin: "8px 0",
          display:"flex", flexDirection:"column", gap: 14
        }}>
          {VALUES.map(v => (
            <li key={v.word} style={{display:"flex", alignItems:"center", gap: 20}}>
              <span aria-hidden="true" style={{
                display:"inline-block", width: 14, height: 14, borderRadius: 999,
                background: v.color, flexShrink: 0
              }}/>
              <span style={{
                fontFamily:"var(--font-display)", fontWeight: 700,
                letterSpacing:"0.04em", textTransform:"uppercase",
                fontSize: 26, color:"var(--c-ink)", lineHeight: 1
              }}>About {v.word}.</span>
            </li>
          ))}
        </ul>

        {/* Vision */}
        <p style={{fontFamily:"var(--font-body)", fontSize: 19, lineHeight: 1.75, margin: "8px 0 0", color:"var(--c-ink)"}}>
          We want a future where the world’s biggest football tournaments reflect
          the values they inspire in children and young people every day. A future
          where children grow up associating football with fair play, friendship
          and community, not unhealthy food and drink brands.
        </p>

        {/* Direct address */}
        <p style={{
          fontFamily:"var(--font-body)", fontSize: 19, lineHeight: 1.75,
          margin: 0, color:"var(--c-ink)", fontWeight: 500
        }} data-nav="ask">
          So this is our message to you:
        </p>

        {/* THE ask — the line of the letter that gets quoted. Display
           face, larger than body, generous whitespace, anchored by the
           amber hairline so it visually rhymes with the central question. */}
        <div style={{
          margin: "12px 0", padding: "8px 0 8px 32px",
          borderLeft: "3px solid var(--c-amber)"
        }}>
          <p style={{
            fontFamily:"var(--font-display)", fontWeight: 600,
            fontSize: 42, lineHeight: 1.15, color:"var(--c-ink)",
            margin: 0, letterSpacing:"-0.015em", maxWidth: "20ch",
            textWrap:"balance"
          }}>
            Please help protect the spirit of football.
          </p>
        </div>

        <p style={{fontFamily:"var(--font-body)", fontSize: 19, lineHeight: 1.75, margin: 0, color:"var(--c-ink)"}}>
          Help create a game that reflects the values we are taught every time
          we step onto a pitch: fairness, respect, community and care for
          one another.
        </p>

        {/* Closing call — slightly weightier than body. */}
        <p style={{
          fontFamily:"var(--font-body)", fontSize: 21, fontWeight: 600,
          lineHeight: 1.55, color:"var(--c-ink)", margin: "8px 0 0",
          textWrap:"pretty"
        }}>
          It is time to kick junk food and drink marketing out of football,
          and give the game back to young people and communities.
        </p>

        {/* Single signed-by row + link to the full squad. The previous
           version had six rows (one per theme); this is the only place
           where the design's link between "the letter" and "the team"
           survives on this page. */}
        <SignedByRow tooltipOnIdx={showTooltip ? 4 : -1}/>

        {/* Sign-off — two lines, "Ours," with a soft pause, then the
           campaign name in team-sheet display style. Echoes the previous
           "— signed, the 247" treatment. */}
        <section data-nav="signoff" style={{
          display:"flex", flexDirection:"column", gap: 4, marginTop: 16
        }}>
          <div style={{
            fontFamily:"var(--font-display)", fontWeight: 500, fontStyle:"italic",
            fontSize: 26, color:"var(--c-ink)", lineHeight: 1.2
          }}>Ours,</div>
          <div style={{
            fontFamily:"var(--font-display)", fontWeight: 700,
            letterSpacing:"0.08em", textTransform:"uppercase",
            fontSize: 28, color:"var(--c-ink)", marginTop: 4
          }}>Own Your Game</div>
        </section>

        {/* Share CTA — UNCHANGED from previous pass. */}
        <section style={{
          marginTop: 24, padding: shareOpen ? 32 : 24,
          background:"var(--c-paper-2)", borderRadius: 4,
          display:"flex", flexDirection: shareOpen ? "column" : "row",
          alignItems: shareOpen ? "stretch" : "center", justifyContent:"space-between",
          gap: shareOpen ? 20 : 16
        }}>
          <div style={{display:"flex", flexDirection:"column", gap: 4}}>
            <div style={{
              fontFamily:"var(--font-display)", fontWeight:700, fontSize: 18,
              letterSpacing:"0.02em", color:"var(--c-ink)"
            }}>Share the letter</div>
            <div style={{fontSize: 13, color:"var(--c-ink-2)"}}>
              {shareOpen ? "Pick a way — and thank you." : "The point of an open letter is that it travels."}
            </div>
          </div>
          {shareOpen ? (
            <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap: 12}}>
              <button className="chip" style={{justifyContent:"flex-start", padding:"14px 16px"}}>
                🔗  Copy link
                <span style={{marginLeft:"auto", fontSize: 11, color:"var(--c-ink-3)"}}>ownyourgame.io/letter</span>
              </button>
              <button className="chip" style={{justifyContent:"flex-start", padding:"14px 16px"}}>
                🖼️  Share as image
                <span style={{marginLeft:"auto", fontSize: 11, color:"var(--c-ink-3)"}}>PNG · 1200×630</span>
              </button>
              <button className="chip" style={{justifyContent:"flex-start", padding:"14px 16px"}}>
                📄  Download as PDF
                <span style={{marginLeft:"auto", fontSize: 11, color:"var(--c-ink-3)"}}>PDF · 480KB</span>
              </button>
            </div>
          ) : (
            <button className="btn btn--amber">
              Share the letter <span className="arr">↓</span>
            </button>
          )}
        </section>
      </main>

      <Footer/>
    </>
  );
};
window.LetterDesktop = LetterDesktop;

// ============================================================
// LETTER MOBILE
// Same structure, tighter scale, no right-rail (the letter is
// short enough to read end-to-end on mobile without navigation).
// ============================================================
const LetterMobile = () => (
  <>
    <Header mobile/>
    <main style={{padding:"24px 16px 56px", display:"flex", flexDirection:"column", gap: 28}}>
      <header style={{display:"flex", flexDirection:"column", gap: 10, paddingBottom: 18, borderBottom:"2px solid var(--c-ink)"}}>
        <div className="kicker" style={{fontSize: 10}}>An open letter from young people</div>
        <h1 style={{
          fontFamily:"var(--font-display)", fontWeight:700,
          letterSpacing:"-0.02em", lineHeight: 1, fontSize: 46, margin: 0
        }}>The letter.</h1>
        <p style={{
          fontFamily:"var(--font-display)", fontWeight: 500, fontSize: 17,
          lineHeight: 1.3, color:"var(--c-ink-2)", margin: 0
        }}>From the young people of the world.</p>
        <div style={{
          fontSize: 12, color:"var(--c-ink-3)",
          display:"flex", alignItems:"center", gap: 8, marginTop: 4,
          flexWrap:"wrap"
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: 999, background:"var(--c-amber)",
            boxShadow:"0 0 0 3px rgba(243,108,33,0.25)"
          }}/>
          <b style={{color:"var(--c-ink)", fontWeight:600}}>247</b> signatures — growing daily
          <span style={{color:"var(--c-rule)"}}>·</span>
          Last voice added 2 hours ago
        </div>
      </header>

      <div style={{
        fontFamily:"var(--font-body)", fontSize: 17, fontWeight: 500,
        color:"var(--c-ink)"
      }}>Dear FIFA,</div>

      <p style={{fontFamily:"var(--font-body)", fontSize: 16, lineHeight: 1.75, margin: 0}}>
        <span style={{
          fontFamily:"var(--font-display)", fontWeight: 700,
          fontSize: 64, float:"left", lineHeight: 0.85,
          marginRight: 10, marginTop: 4, color:"var(--c-deep-900)",
          letterSpacing:"-0.02em"
        }}>W</span>
        e are writing to you as young people who love football.
      </p>

      <p style={{fontSize: 16, lineHeight: 1.75, margin: 0, color:"var(--c-ink)"}}>
        Not just the big tournaments, but everything around it too. The local teams. The friendships. The families on the sidelines. The feeling of belonging somewhere.
      </p>

      <p style={{fontSize: 16, lineHeight: 1.75, margin: 0, color:"var(--c-ink)"}}>
        Football gives children and young people confidence. It brings communities together. It teaches fairness, teamwork and respect without needing to say the words out loud.
      </p>

      <p style={{
        fontFamily:"var(--font-display)", fontWeight: 500, fontSize: 19,
        lineHeight: 1.4, color:"var(--c-ink)", margin: 0, textWrap:"balance"
      }}>
        That is what sport, and the 2026 FIFA World Cup, means to us.
      </p>

      <p style={{fontSize: 16, lineHeight: 1.75, margin: 0, color:"var(--c-ink)"}}>
        Yet more and more, the spaces we love are filled with advertising and sponsorship from junk food and drink companies. And lately, many young people have started asking the same question:
      </p>

      {/* Central question — same designed moment, scaled for mobile */}
      <div style={{
        margin: "8px 0", paddingLeft: 18,
        borderLeft: "3px solid var(--c-amber)"
      }}>
        <div className="tagline" style={{
          fontSize: 44, lineHeight: 1.0, color:"var(--c-ink)",
          letterSpacing:"-0.015em", margin: 0
        }}>Whose game is it anyway?</div>
      </div>

      <p style={{fontSize: 16, lineHeight: 1.75, margin: 0, color:"var(--c-ink)"}}>
        Because sometimes it feels like the joy, energy and community that football creates are being used to sell products that do not have our best interests at heart. The foods that you promote don’t fuel our game, they make us sick. And the companies that promote them do not often play fair.
      </p>

      <p style={{fontSize: 16, lineHeight: 1.75, margin: 0, color:"var(--c-ink)"}}>
        We grow up seeing these brands everywhere in football, around the pitch, on our screens, on the shirts of players we look up to, until it starts to feel like they are part of the game itself.
      </p>

      <p style={{
        fontFamily:"var(--font-display)", fontWeight: 600, fontSize: 22,
        lineHeight: 1.3, color:"var(--c-ink)", margin: "4px 0",
        letterSpacing:"-0.01em"
      }}>
        But football should be about people first.
      </p>

      <ul style={{
        listStyle:"none", padding: 0, margin: 0,
        display:"flex", flexDirection:"column", gap: 12
      }}>
        {[
          { word:"community",  color:"var(--c-community)"  },
          { word:"friendship", color:"var(--c-friendship)" },
          { word:"confidence", color:"var(--c-confidence)" },
          { word:"joy",        color:"var(--c-belonging)"  },
          { word:"belonging",  color:"var(--c-fairness)"   },
        ].map(v => (
          <li key={v.word} style={{display:"flex", alignItems:"center", gap: 14}}>
            <span aria-hidden="true" style={{
              display:"inline-block", width: 11, height: 11, borderRadius: 999,
              background: v.color, flexShrink: 0
            }}/>
            <span style={{
              fontFamily:"var(--font-display)", fontWeight: 700,
              letterSpacing:"0.04em", textTransform:"uppercase",
              fontSize: 19, color:"var(--c-ink)", lineHeight: 1
            }}>About {v.word}.</span>
          </li>
        ))}
      </ul>

      <p style={{fontSize: 16, lineHeight: 1.75, margin: 0, color:"var(--c-ink)"}}>
        We want a future where the world’s biggest football tournaments reflect the values they inspire in children and young people every day. A future where children grow up associating football with fair play, friendship and community, not unhealthy food and drink brands.
      </p>

      <p style={{fontSize: 16, lineHeight: 1.75, margin: 0, color:"var(--c-ink)", fontWeight: 500}}>
        So this is our message to you:
      </p>

      {/* The ask */}
      <div style={{
        margin: "4px 0", padding: "4px 0 4px 18px",
        borderLeft: "3px solid var(--c-amber)"
      }}>
        <p style={{
          fontFamily:"var(--font-display)", fontWeight: 600,
          fontSize: 26, lineHeight: 1.2, color:"var(--c-ink)",
          margin: 0, letterSpacing:"-0.015em", textWrap:"balance"
        }}>
          Please help protect the spirit of football.
        </p>
      </div>

      <p style={{fontSize: 16, lineHeight: 1.75, margin: 0, color:"var(--c-ink)"}}>
        Help create a game that reflects the values we are taught every time we step onto a pitch: fairness, respect, community and care for one another.
      </p>

      <p style={{
        fontSize: 17, fontWeight: 600, lineHeight: 1.55,
        color:"var(--c-ink)", margin: 0, textWrap:"pretty"
      }}>
        It is time to kick junk food and drink marketing out of football, and give the game back to young people and communities.
      </p>

      <SignedByRow/>

      {/* Sign-off */}
      <section style={{display:"flex", flexDirection:"column", gap: 2, marginTop: 8}}>
        <div style={{
          fontFamily:"var(--font-display)", fontWeight: 500, fontStyle:"italic",
          fontSize: 22, color:"var(--c-ink)", lineHeight: 1.2
        }}>Ours,</div>
        <div style={{
          fontFamily:"var(--font-display)", fontWeight: 700,
          letterSpacing:"0.08em", textTransform:"uppercase",
          fontSize: 22, color:"var(--c-ink)", marginTop: 4
        }}>Own Your Game</div>
      </section>

      <section style={{
        padding: 18, background:"var(--c-paper-2)", borderRadius: 4, marginTop: 8
      }}>
        <div style={{fontFamily:"var(--font-display)", fontWeight:700, fontSize: 16, marginBottom: 4}}>Share the letter</div>
        <div style={{fontSize: 13, color:"var(--c-ink-2)", marginBottom: 14}}>The point of an open letter is that it travels.</div>
        <button className="btn btn--amber" style={{width:"100%", justifyContent:"center"}}>
          Share <span className="arr">↓</span>
        </button>
      </section>
    </main>
    <Footer mobile/>
  </>
);
window.LetterMobile = LetterMobile;
