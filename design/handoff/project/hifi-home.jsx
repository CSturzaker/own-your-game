/* global React, Header, Footer, Wordmark, Tile, PLAYERS */
const { useState, useEffect } = React;

// ============================================================
// HOME DESKTOP
// Variants: default | mid-rotation | reduced-motion | sticky | loading
// ============================================================
const HomeDesktop = ({ variant = "default", count = 247, sticky = false }) => {
  const eleven = PLAYERS.slice(0, 11);
  // Identify which tile would be "flashing" mid-rotation:
  const flashIdx = variant === "mid-rotation" ? 5 : -1;
  const loading = variant === "loading";
  const reducedMotion = variant === "reduced-motion";

  return (
    <>
      <Header sticky={sticky} active="home" count={loading ? "—" : count}
              showSkip={variant === "a11y"}/>

      <main id="main" style={{padding: "48px 56px 80px", display:"flex", flexDirection:"column", gap: 80}}>

        {/* HERO */}
        <section style={{display:"grid", gridTemplateColumns:"1.25fr 1fr", gap: 56, alignItems:"end"}}>
          <div>
            <div className="kicker" style={{marginBottom: 32}}>An open letter · 2026 World Cup</div>

            {/* The logo replaces the CSS wordmark, set at hero scale. */}
            <Wordmark size="hero" height={200}/>

            {/* The campaign tagline — display face, near-black, 1 of 3 placements. */}
            <div className="tagline" style={{
              fontSize: 40, lineHeight: 1.1, marginTop: 28, maxWidth: "22ch"
            }}>Whose game is it anyway?</div>

            <p style={{
              fontFamily:"var(--font-body)", fontWeight:400, fontSize: 18,
              lineHeight: 1.55, color:"var(--c-ink-2)", marginTop: 28, maxWidth: "42ch"
            }}>
              247 young people. One open letter to FIFA. About community,
              friendship, confidence, joy, belonging — and the future of the
              game we love.
            </p>
            <div style={{display:"flex", gap: 16, marginTop: 40, flexWrap:"wrap"}}>
              <button className="btn btn--lg" onClick={()=>window.gotoPage?.("letter")}>
                Read the letter <span className="arr">→</span>
              </button>
              <button className="btn btn--ghost btn--lg" onClick={()=>window.gotoPage?.("squad")}>
                Meet all 247
              </button>
            </div>
          </div>

          {/* Counter card — Process Cyan #00AEEF fill, white-only content.
             One of two largest brand moments on the site (the other is the
             "ONE LETTER" closing band on About). It should feel like
             punctuation, not background. */}
          <div style={{
            background: variant === "error-counter" ? "var(--c-paper-2)" : "var(--c-brand-cyan)",
            color: variant === "error-counter" ? "var(--c-ink)" : "#FFFFFF",
            padding: 36, borderRadius: 4, alignSelf:"stretch",
            display:"flex", flexDirection:"column", justifyContent:"flex-end",
            position: "relative", overflow:"hidden",
            border: variant === "error-counter" ? "1px solid var(--c-rule)" : "none"
          }}>
            {variant !== "error-counter" && (
              <div style={{
                position:"absolute", top: -60, right: -60, width: 200, height: 200,
                borderRadius: 999, background:"rgba(255,255,255,0.10)"
              }} aria-hidden="true"/>
            )}
            <div style={{
              fontFamily:"var(--font-display)", fontWeight:600, fontSize: 12,
              letterSpacing:"0.16em", textTransform:"uppercase",
              color: variant === "error-counter" ? "var(--c-ink-3)" : "rgba(255,255,255,0.78)",
              position:"relative"
            }}>
              The voice counter
            </div>
            <div style={{
              fontFamily:"var(--font-display)", fontWeight:700,
              fontSize: 124, lineHeight: 0.92, letterSpacing:"-0.04em",
              fontVariantNumeric:"tabular-nums", marginTop: 16, position:"relative"
            }}>
              {loading ? <span style={{opacity:0.4}}>246</span> :
               variant === "tick-start" ? "246" :
               variant === "mid-rotation" ? "247" :
               count}
            </div>
            <div style={{
              display:"flex", alignItems:"center", gap: 10, marginTop: 16,
              fontFamily:"var(--font-display)", fontWeight:600, fontSize: 12,
              letterSpacing:"0.14em", textTransform:"uppercase",
              color: variant === "error-counter" ? "var(--c-ink-2)" : "rgba(255,255,255,0.92)",
              position:"relative"
            }}>
              {variant === "error-counter" ? (
                <>
                  <span style={{width:8, height:8, borderRadius:999, background:"var(--c-ink-3)"}}/>
                  As of 09:42 GMT — reconnecting
                </>
              ) : reducedMotion ? (
                <>
                  <span style={{width:8, height:8, borderRadius:999, background:"var(--c-amber)"}}/>
                  Voices and counting
                </>
              ) : (
                <>
                  <span style={{
                    width:8, height:8, borderRadius:999, background:"var(--c-amber)",
                    boxShadow:"0 0 0 4px rgba(243,108,33,0.45)",
                    animation:"pulse 2s ease-in-out infinite"
                  }}/>
                  Young voices — and counting
                </>
              )}
            </div>
            <div style={{
              fontFamily:"var(--font-body)", fontSize: 14, lineHeight: 1.55,
              opacity: variant === "error-counter" ? 1 : 0.88, marginTop: 16,
              maxWidth: "32ch", position:"relative",
              color: variant === "error-counter" ? "var(--c-ink-2)" : "inherit"
            }}>
              {variant === "error-counter" ?
                "Live counter temporarily offline. The number above was correct at 09:42 GMT today." :
                "Every voice is a young person aged 11–18 who recorded a video and added their name to the letter."}
            </div>
          </div>
        </section>

        {/* STARTING ELEVEN */}
        <section>
          <div style={{display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom: 32, flexWrap:"wrap", gap: 16}}>
            <div>
              <div className="kicker">Today's starting eleven</div>
              <h2 style={{
                fontFamily:"var(--font-display)", fontWeight:700, fontStretch:"85%",
                textTransform:"uppercase", letterSpacing:"0.03em",
                fontSize: 48, lineHeight: 1, margin: "16px 0 0"
              }}>New Players. New Stories. Same Question.</h2>
              <p style={{fontSize: 15, color:"var(--c-ink-2)", maxWidth: "60ch", margin:"12px 0 0"}}>
                Every twelve seconds, another young person enters the game. Watch
                their videos. Hear why they are asking: whose game is it anyway?
              </p>
            </div>
            {!reducedMotion && (
              <div style={{display:"flex", flexDirection:"column", alignItems:"flex-end", gap: 10}}>
                <button className="btn btn--ghost btn--sm" style={{borderColor:"var(--c-rule)"}}>
                  Pause rotation ⏸
                </button>
                {/* Reduced-motion accommodation — the countdown that users with
                   motion sensitivities are most likely to read. Bumped from 12px
                   to body size (15px) and weight 500. */}
                <div style={{
                  fontFamily:"var(--font-body)", fontSize: 15, fontWeight: 500,
                  color:"var(--c-ink)", display:"flex", alignItems:"center", gap: 10,
                  fontVariantNumeric:"tabular-nums"
                }}>
                  <span style={{
                    width: 8, height: 8, background:"var(--c-amber)", borderRadius: 999,
                    boxShadow:"0 0 0 3px rgba(243,108,33,0.20)"
                  }}/>
                  Next rotation in {variant === "mid-rotation" ? "11" : "8"}s
                </div>
              </div>
            )}
            {reducedMotion && (
              <div style={{
                fontFamily:"var(--font-body)", fontSize: 12, fontWeight:600,
                padding:"6px 14px", borderRadius: 999,
                background:"var(--c-paper-2)", color:"var(--c-ink-2)",
                border:"1px solid var(--c-rule)"
              }}>
                Reduced motion — rotation paused
              </div>
            )}
          </div>

          {/* 1-4-3-3 formation — tile numbers are POSITION (01–11), not kit number. */}
          <div style={{display:"flex", flexDirection:"column", gap: 18}}>
            <div style={{display:"grid", gridTemplateColumns:"1fr", padding:"0 42%"}}>
              <ElevenTile p={eleven[0]} position={1} loading={loading}/>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap: 18}}>
              {eleven.slice(1,5).map((p,i)=>(<ElevenTile key={p.id} p={p} position={i+2} loading={loading}/>))}
            </div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap: 18, padding:"0 11%"}}>
              {eleven.slice(5,8).map((p,i)=>(
                <ElevenTile key={p.id} p={p} position={i+6} loading={loading} flash={i===0 && flashIdx === 5}/>
              ))}
            </div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap: 18, padding:"0 17%"}}>
              {eleven.slice(8,11).map((p,i)=>(<ElevenTile key={p.id} p={p} position={i+9} loading={loading}/>))}
            </div>
          </div>

          <div style={{display:"flex", justifyContent:"center", marginTop: 40}}>
            <button className="btn btn--amber btn--lg">
              Bring on the next eleven <span className="arr">↻</span>
            </button>
          </div>

          {variant === "transition" && (
            <div style={{
              position:"absolute", top: "55%", left:"50%", transform:"translateX(-50%)",
              background:"var(--c-ink)", color:"var(--c-paper)", padding:"10px 18px",
              borderRadius: 999, fontSize: 13, fontFamily:"var(--font-display)",
              fontWeight: 600, letterSpacing:"0.06em", textTransform:"uppercase",
              zIndex: 10, boxShadow:"0 8px 24px rgba(20,14,0,0.3)"
            }}>
              Rotating — 6 of 11 changing
            </div>
          )}
        </section>

        {/* WHY THIS, WHY NOW band */}
        <section style={{
          background:"var(--c-paper-2)", borderRadius: 4, padding: 56,
          display:"grid", gridTemplateColumns:"1fr 1.4fr", gap: 56, alignItems:"start"
        }}>
          <div>
            <div className="kicker">Why this letter</div>
            <h2 style={{
              fontFamily:"var(--font-display)", fontWeight:700, fontStretch:"85%",
              textTransform:"uppercase", letterSpacing:"0.03em",
              fontSize: 36, lineHeight: 1.05, margin:"16px 0 0"
            }}>The biggest stage. The youngest authors.</h2>
          </div>
          <div style={{display:"flex", flexDirection:"column", gap: 16, fontSize: 17, lineHeight: 1.65, color:"var(--c-ink)"}}>
            <p style={{margin:0}}>
              Every four years the planet turns its attention to one sport. We
              thought that was a good moment to ask young people what the game
              looks like from where they stand.
            </p>
            <p style={{margin:0}}>
              247 young people across 21 countries recorded their thoughts and
              signed the letter you are about to read. They talk about fairness
              on and off the pitch. About belonging. About community. About
              what sport should feel like.
            </p>
            <p style={{margin:0, color:"var(--c-ink-2)"}}>
              Because the game belongs to more than brands, sponsors and
              broadcasters. It belongs to players, fans, families and
              communities too.
            </p>
            <a href="#" onClick={(e)=>{e.preventDefault();window.gotoPage?.("about")}}
               style={{color:"var(--c-ink)", textDecoration:"underline", textUnderlineOffset:4, fontWeight:600, marginTop: 8}}>
              Read more about the project →
            </a>
          </div>
        </section>

      </main>

      <Footer/>
    </>
  );
};

const ElevenTile = ({ p, position, loading, flash }) => {
  if (loading) return <Tile skeleton/>;
  return <Tile player={p} position={position} flash={flash}/>;
};

window.HomeDesktop = HomeDesktop;

// ============================================================
// HOME MOBILE
// ============================================================
const HomeMobile = ({ variant = "default", count = 247 }) => {
  const eleven = PLAYERS.slice(0, 8);
  const loading = variant === "loading";
  const reducedMotion = variant === "reduced-motion";

  return (
    <>
      <Header mobile count={loading ? "—" : count}/>
      <main style={{padding: "24px 16px 48px", display:"flex", flexDirection:"column", gap: 40}}>

        <section>
          <div className="kicker" style={{fontSize: 10, marginBottom: 16}}>An open letter · 2026</div>
          <Wordmark size="hero" height={120}/>
          <div className="tagline" style={{
            fontSize: 24, lineHeight: 1.15, marginTop: 20, maxWidth:"22ch"
          }}>Whose game is it anyway?</div>
          <p style={{
            fontFamily:"var(--font-body)", fontWeight:400, fontSize:15,
            lineHeight: 1.55, color:"var(--c-ink-2)", margin:"20px 0 0", maxWidth:"32ch"
          }}>
            247 young people. One open letter to FIFA. About community, friendship, confidence, joy, belonging — and the future of the game we love.
          </p>
        </section>

        {/* Counter — Process Cyan brand fill */}
        <section style={{
          background:"var(--c-brand-cyan)", color:"#FFFFFF",
          padding: 24, borderRadius: 4, position:"relative", overflow:"hidden"
        }}>
          <div style={{
            position:"absolute", top: -40, right: -40, width: 140, height: 140,
            borderRadius: 999, background:"rgba(255,255,255,0.10)"
          }} aria-hidden="true"/>
          <div style={{
            fontFamily:"var(--font-display)", fontWeight:600, fontSize: 11,
            letterSpacing:"0.16em", textTransform:"uppercase", color:"rgba(255,255,255,0.78)",
            position:"relative"
          }}>The voice counter</div>
          <div style={{
            fontFamily:"var(--font-display)", fontWeight:700, fontSize: 72,
            lineHeight: 0.95, letterSpacing:"-0.04em", marginTop: 12, fontVariantNumeric:"tabular-nums",
            position:"relative"
          }}>{loading ? <span style={{opacity:0.4}}>246</span> : count}</div>
          <div style={{
            display:"flex", alignItems:"center", gap:8, marginTop: 12,
            fontFamily:"var(--font-display)", fontWeight:600, fontSize: 11,
            letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(255,255,255,0.92)",
            position:"relative"
          }}>
            <span style={{
              width:7, height:7, borderRadius:999, background:"var(--c-amber)",
              boxShadow:"0 0 0 3px rgba(243,108,33,0.45)",
              animation: reducedMotion ? "none" : "pulse 2s ease-in-out infinite"
            }}/>
            Voices and counting
          </div>
        </section>

        {/* CTAs */}
        <section style={{display:"flex", flexDirection:"column", gap: 10}}>
          <button className="btn" style={{justifyContent:"center"}}
                  onClick={()=>window.gotoPage?.("letter")}>
            Read the letter <span className="arr">→</span>
          </button>
          <button className="btn btn--ghost" style={{justifyContent:"center"}}
                  onClick={()=>window.gotoPage?.("squad")}>
            Meet all 247
          </button>
        </section>

        {/* Eleven */}
        <section>
          <div className="kicker" style={{fontSize:10}}>Today's starting eleven</div>
          <h2 style={{
            fontFamily:"var(--font-display)", fontWeight:700, fontStretch:"85%",
            textTransform:"uppercase", letterSpacing:"0.03em",
            fontSize: 26, lineHeight: 1, margin:"12px 0 16px"
          }}>New Players. New Stories. Same Question.</h2>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap: 8}}>
            {eleven.map((p,i)=>(
              loading ? <Tile key={p.id} skeleton/> :
              <Tile key={p.id} player={p} position={i+1} flash={variant==="mid-rotation" && i===3}/>
            ))}
          </div>
          {!reducedMotion ? (
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              marginTop: 16, gap: 12
            }}>
              <span style={{
                fontFamily:"var(--font-body)", fontSize: 15, fontWeight: 500,
                color:"var(--c-ink)", display:"inline-flex", alignItems:"center", gap: 8,
                fontVariantNumeric:"tabular-nums"
              }}>
                <span style={{width:7, height:7, background:"var(--c-amber)", borderRadius:999}}/>
                Next rotation in 8s
              </span>
              <button className="btn btn--ghost btn--sm" style={{borderColor:"var(--c-rule)"}}>Pause ⏸</button>
            </div>
          ) : (
            <div className="tag friendship" style={{
              background:"var(--c-paper-2)", color:"var(--c-ink-2)",
              border:"1px solid var(--c-rule)", marginTop: 16
            }}>Reduced motion — rotation paused</div>
          )}
        </section>
      </main>

      <Footer mobile/>
    </>
  );
};

window.HomeMobile = HomeMobile;
