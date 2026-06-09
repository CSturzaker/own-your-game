/* global React, Header, Footer, Wordmark, Tile, PLAYERS */
const { useState, useEffect } = React;

// ============================================================
// MONTAGE POSTER — the 9:16 campaign film, click-to-play.
// No autoplay (youth safeguarding); tapping play opens the
// player modal (full-screen native player on mobile).
// The image-slot is a drop target for the real poster frame.
// ============================================================
const MontagePoster = ({ slotId, w = 400 }) => {
  const h = Math.round((w * 16) / 9);
  return (
    <div style={{
      position:"relative", width: w, height: h, borderRadius: 4,
      overflow:"hidden", background:"var(--c-paper-2)", flexShrink: 0
    }}>
      <image-slot
        id={slotId}
        shape="rect"
        placeholder="Campaign film poster (9:16)"
        style={{ width: w, height: h, display:"block" }}
      ></image-slot>
      <button
        aria-label="Play the campaign film, 1 minute 32 seconds"
        onClick={()=>window.gotoPage?.("player")}
        style={{
          position:"absolute", top:"50%", left:"50%",
          transform:"translate(-50%,-50%)",
          width: 76, height: 76, borderRadius: 999, border: 0,
          background:"rgba(245,240,232,0.94)", cursor:"pointer",
          boxShadow:"0 8px 28px rgba(20,14,0,0.28)",
          display:"flex", alignItems:"center", justifyContent:"center"
        }}
      >
        <span style={{
          width: 0, height: 0, marginLeft: 6,
          borderLeft:"20px solid var(--c-ink)",
          borderTop:"13px solid transparent",
          borderBottom:"13px solid transparent"
        }}></span>
      </button>
      <div style={{
        position:"absolute", left: 14, bottom: 14,
        background:"rgba(15,18,22,0.78)", color:"#FFFFFF",
        padding:"5px 12px", borderRadius: 999,
        fontFamily:"var(--font-display)", fontWeight: 600, fontSize: 12,
        letterSpacing:"0.06em", fontVariantNumeric:"tabular-nums",
        pointerEvents:"none"
      }}>▶ 1:32</div>
    </div>
  );
};

// ============================================================
// COUNTRY COUNTER — moved out of the hero into its own
// full-width band; headline metric changed from voices to
// countries. Static treatment (no live pulse) — the country
// count grows in steps, not ticks, so a "live" dot would read
// as stalled most of the time.
// ============================================================
const CountryCounterBand = ({ variant = "default", loading = false, mobile = false }) => {
  const offline = variant === "error-counter";
  const pad = mobile ? 24 : 48;
  return (
    <section style={{
      background: offline ? "var(--c-paper-2)" : "var(--c-brand-cyan)",
      color: offline ? "var(--c-ink)" : "#FFFFFF",
      padding: pad, borderRadius: 4, position:"relative", overflow:"hidden",
      border: offline ? "1px solid var(--c-rule)" : "none",
      display:"grid",
      gridTemplateColumns: mobile ? "1fr" : "auto 1fr",
      gap: mobile ? 16 : 64, alignItems:"end"
    }}>
      {!offline && (
        <div style={{
          position:"absolute", top: mobile ? -40 : -60, right: mobile ? -40 : -60,
          width: mobile ? 140 : 200, height: mobile ? 140 : 200,
          borderRadius: 999, background:"rgba(255,255,255,0.10)"
        }} aria-hidden="true"></div>
      )}
      <div style={{position:"relative"}}>
        <div style={{
          fontFamily:"var(--font-display)", fontWeight: 600, fontSize: mobile ? 11 : 12,
          letterSpacing:"0.16em", textTransform:"uppercase",
          color: offline ? "var(--c-ink-3)" : "rgba(255,255,255,0.78)"
        }}>
          The country counter
        </div>
        <div style={{
          fontFamily:"var(--font-display)", fontWeight: 700,
          fontSize: mobile ? 72 : 124, lineHeight: 0.92, letterSpacing:"-0.04em",
          fontVariantNumeric:"tabular-nums", marginTop: mobile ? 12 : 16
        }}>
          {loading ? <span style={{opacity:0.4}}>16</span> : "16"}
        </div>
      </div>
      <div style={{
        position:"relative", fontFamily:"var(--font-body)",
        fontSize: mobile ? 14 : 15, lineHeight: 1.55,
        opacity: offline ? 1 : 0.9, maxWidth:"40ch",
        paddingBottom: mobile ? 0 : 6,
        color: offline ? "var(--c-ink-2)" : "inherit"
      }}>
        {offline ?
          "Live counter temporarily offline. The number above was correct at 09:42 GMT today." :
          "Young people from 16 countries — every voice aged 11–18, each with a video and a name on the letter."}
      </div>
    </section>
  );
};

// ============================================================
// HOME DESKTOP
// Variants: default | mid-rotation | reduced-motion | sticky | loading
// Hero uses the V5 "fold-aware overlap": the 9:16 film poster is
// the hero's right-hand element and spans down past the fold into
// the second beat, so the fold crops it mid-frame at every common
// viewport height — the scroll cue.
// ============================================================
const HomeDesktop = ({ variant = "default", count = 50, sticky = false }) => {
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

        {/* HERO + CAMPAIGN FILM — V5 overlap. Left column carries two
           beats (hero copy, then "In their own words"); the poster spans
           both. One CTA per beat: hero → letter, film → squad. */}
        <section style={{display:"grid", gridTemplateColumns:"1fr 400px", gap: 96, alignItems:"start"}}>
          <div>
            <div className="kicker" style={{marginBottom: 28}}>An open letter · 2026 World Cup</div>

            <Wordmark size="hero" height={160}/>

            <div className="tagline" style={{
              fontSize: 40, lineHeight: 1.1, marginTop: 24, maxWidth: "22ch"
            }}>Whose game is it anyway?</div>

            <p style={{
              fontFamily:"var(--font-body)", fontWeight:400, fontSize: 18,
              lineHeight: 1.55, color:"var(--c-ink-2)", marginTop: 24, maxWidth: "42ch"
            }}>
              Young people from 16 countries. One open letter to FIFA. About
              community, friendship, confidence, joy, belonging — and the
              future of the game we love.
            </p>
            <div style={{display:"flex", marginTop: 36}}>
              <button className="btn btn--lg" onClick={()=>window.gotoPage?.("letter")}>
                Read the letter <span className="arr">→</span>
              </button>
            </div>

            {/* Second beat — the film answers the tagline above. */}
            <div style={{marginTop: 88, maxWidth: 560}}>
              <div className="kicker">In their own words</div>
              <h2 style={{
                fontFamily:"var(--font-display)", fontWeight:700, fontStretch:"85%",
                textTransform:"uppercase", letterSpacing:"0.03em",
                fontSize: 56, lineHeight: 1.02, margin:"20px 0 0",
                textWrap:"balance"
              }}>Hear it from the players themselves.</h2>
              <div style={{display:"flex", marginTop: 40}}>
                <button className="btn btn--lg" onClick={()=>window.gotoPage?.("squad")}>
                  Meet the team <span className="arr">→</span>
                </button>
              </div>
            </div>
          </div>

          <MontagePoster slotId={`home-montage-${variant}`} w={400}/>
        </section>

        {/* COUNTRY COUNTER — full-width brand band */}
        <CountryCounterBand variant={variant} loading={loading}/>

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
              50 young people across 16 countries recorded their thoughts and
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
// Single column — the overlap doesn't apply, but the fold logic
// does: hero is deliberately tight (smaller wordmark, no standfirst
// paragraph) so the film's top edge peeks ~250px above a ~660px
// fold. 9:16 reads natively on a portrait phone; tapping play
// hands off to the device's full-screen player.
// ============================================================
const HomeMobile = ({ variant = "default", count = 50 }) => {
  const eleven = PLAYERS.slice(0, 8);
  const loading = variant === "loading";
  const reducedMotion = variant === "reduced-motion";

  return (
    <>
      <Header mobile count={loading ? "—" : count}/>
      <main style={{padding: "24px 16px 48px", display:"flex", flexDirection:"column", gap: 40}}>

        {/* Tight hero — one beat, one CTA. The tagline carries the
           standfirst; the paragraph moved to the "Why this letter" band. */}
        <section>
          <div className="kicker" style={{fontSize: 10, marginBottom: 16}}>An open letter · 2026</div>
          <Wordmark size="hero" height={96}/>
          <div className="tagline" style={{
            fontSize: 24, lineHeight: 1.15, marginTop: 16, maxWidth:"22ch"
          }}>Whose game is it anyway?</div>
          <button className="btn" style={{justifyContent:"center", width:"100%", marginTop: 24}}
                  onClick={()=>window.gotoPage?.("letter")}>
            Read the letter <span className="arr">→</span>
          </button>
        </section>

        {/* CAMPAIGN FILM — second beat */}
        <section style={{display:"flex", flexDirection:"column", gap: 28}}>
          <MontagePoster slotId={`home-m-montage-${variant}`} w={343}/>
          <div>
            <div className="kicker" style={{fontSize: 10}}>In their own words</div>
            <h2 style={{
              fontFamily:"var(--font-display)", fontWeight:700, fontStretch:"85%",
              textTransform:"uppercase", letterSpacing:"0.03em",
              fontSize: 28, lineHeight: 1.05, margin:"12px 0 0", textWrap:"balance"
            }}>Hear it from the players themselves.</h2>
            <button className="btn" style={{justifyContent:"center", width:"100%", marginTop: 24}}
                    onClick={()=>window.gotoPage?.("squad")}>
              Meet the team <span className="arr">→</span>
            </button>
          </div>
        </section>

        {/* COUNTRY COUNTER */}
        <CountryCounterBand variant={variant} loading={loading} mobile/>

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
