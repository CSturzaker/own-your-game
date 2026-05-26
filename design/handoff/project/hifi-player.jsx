/* global React, Header, Footer, Tile, Portrait, PLAYERS */
const { useState } = React;

// ============================================================
// PLAYER CARD — modal-style overlay (page 2)
// Variants: poster | playing-controls | playing-faded | transition | error | dropdown | mobile-swipe
// ============================================================
const PlayerCard = ({ variant = "poster", mobile = false }) => {
  const player = PLAYERS[2]; // Sofía, Argentina · tagged Friendship for this card (quote pairing)
  const next = PLAYERS[3];
  const captionLine = "We learn the world through who we play with. Not who plays our position, but who hands us the ball back when we fall.";

  const isPlaying = variant === "playing-controls" || variant === "playing-faded";
  const controlsVisible = variant !== "playing-faded";
  const isError = variant === "error";
  const langOpen = variant === "dropdown";

  if (mobile) {
    return (
      <>
        <Header mobile/>
        <main style={{padding: 0, position:"relative"}}>
          {/* Video */}
          <div style={{position:"relative", background:"#0F1216", aspectRatio:"9/12"}}>
            <div style={{
              position:"absolute", inset:0,
              background:"linear-gradient(180deg, #2a2724 0%, #1a1714 100%)",
              backgroundImage:"linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.03) 75%, transparent 75%, transparent)",
              backgroundSize:"24px 24px"
            }}/>
            {/* Top chrome */}
            <div style={{
              position:"absolute", top:16, left:16, right:16,
              display:"flex", alignItems:"center", justifyContent:"space-between", zIndex:2
            }}>
              <div style={{
                fontFamily:"var(--font-display)", fontWeight:600, fontSize:10,
                letterSpacing:"0.16em", textTransform:"uppercase", color:"rgba(251,247,240,0.7)"
              }}>3 of 38 · Friendship voices</div>
              <button style={{
                width:36, height:36, borderRadius:999, background:"rgba(15,18,22,0.55)",
                color:"var(--c-paper)", border:0, fontSize:18
              }} onClick={()=>window.gotoPage?.("squad")}>×</button>
            </div>
            {/* Play button */}
            <div style={{
              position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
              width:72, height:72, borderRadius:999, background:"rgba(251,247,240,0.95)",
              display:"flex", alignItems:"center", justifyContent:"center"
            }}>
              <div style={{
                width:0, height:0,
                borderLeft:"22px solid var(--c-ink)",
                borderTop:"14px solid transparent",
                borderBottom:"14px solid transparent",
                marginLeft:5
              }}/>
            </div>
            {/* Swipe hint */}
            <div style={{
              position:"absolute", bottom:24, left:0, right:0, textAlign:"center",
              color:"rgba(251,247,240,0.85)", fontFamily:"var(--font-display)",
              fontWeight:500, fontSize:12, letterSpacing:"0.08em", textTransform:"uppercase"
            }}>
              ← swipe ‧ ‧ ‧ ‧ ‧ ‧ →<br/>
              <span style={{fontSize:10, opacity:0.7, letterSpacing:"0.04em"}}>next & previous voice</span>
            </div>
          </div>

          {/* Meta panel */}
          <div style={{padding:"24px 16px", display:"flex", flexDirection:"column", gap:16}}>
            <div className="tag friendship" style={{alignSelf:"flex-start"}}>Friendship</div>
            <h1 style={{
              fontFamily:"var(--font-display)", fontWeight:700, fontStretch:"85%",
              textTransform:"uppercase", letterSpacing:"0.03em", lineHeight:1,
              fontSize: 40, margin:0
            }}>{player.name}, 16</h1>
            <div style={{
              fontFamily:"var(--font-display)", fontWeight:600, fontSize:12,
              letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-ink-3)"
            }}>
              № 03 · Buenos Aires, Argentina · Spanish (orig.)
            </div>
            <blockquote style={{
              fontFamily:"var(--font-display)", fontWeight:500, fontStyle:"italic",
              fontSize: 20, lineHeight: 1.35, margin:0, color:"var(--c-ink)"
            }}>"{captionLine}"</blockquote>

            <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
              <button className="chip">Captions: English</button>
              <button className="chip">Read transcript</button>
            </div>

            <div style={{
              display:"flex", justifyContent:"space-between", gap:8,
              borderTop:"1px solid var(--c-rule)", paddingTop:16
            }}>
              <button className="btn btn--ghost btn--sm" style={{borderColor:"var(--c-rule)"}}>
                ← Previous
              </button>
              <button className="btn btn--sm">
                Next voice <span className="arr">→</span>
              </button>
            </div>
            <div style={{fontSize: 11, color:"var(--c-ink-3)", textAlign:"center"}}>
              3 of 38 in <b style={{color:"var(--c-ink)"}}>Friendship</b>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header active="squad"/>

      {/* Scrim with home dimmed behind */}
      <div style={{
        position:"absolute", inset: 0, top: 72,
        background:"rgba(15,18,22,0.62)",
        display:"flex", alignItems:"flex-start", justifyContent:"center",
        padding:"48px 40px 80px", zIndex: 10, minHeight: "calc(100% - 72px)"
      }}>
        {/* The modal */}
        <div style={{
          background:"var(--c-paper)", borderRadius: 4, width: 1240, maxWidth:"100%",
          boxShadow:"0 24px 64px rgba(20,14,0,0.28)", display:"grid",
          gridTemplateColumns:"1.5fr 1fr", overflow:"hidden", position:"relative"
        }}>
          {/* Close */}
          <button style={{
            position:"absolute", top:14, right:14,
            width:40, height:40, borderRadius:999,
            background:"var(--c-paper)", border:"1px solid var(--c-rule)",
            zIndex:3, fontFamily:"var(--font-display)", fontWeight:600, fontSize:18,
            cursor:"pointer"
          }} aria-label="Close">×</button>

          {/* Left: video */}
          <div style={{padding: 24, background:"var(--c-paper-2)", display:"flex", flexDirection:"column", gap: 16}}>
            <div style={{
              fontFamily:"var(--font-display)", fontWeight:600, fontSize: 11,
              letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--c-ink-3)"
            }}>
              {isError ? "Video — Unavailable" : isPlaying ? "Video — Now Playing" : "Video — Tap to play"}
            </div>
            {isError ? (
              <div style={{
                aspectRatio:"16/9", background:"var(--c-paper-3)",
                border:"1px solid var(--c-rule)", borderRadius: 4,
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                gap: 12, padding: 24
              }}>
                <div style={{
                  width:56, height:56, borderRadius:999,
                  background:"var(--c-paper-2)", border:"1px solid var(--c-rule)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:"var(--font-display)", fontSize: 24, color:"var(--c-ink-2)"
                }}>↺</div>
                <div style={{
                  fontFamily:"var(--font-display)", fontWeight:600, fontSize: 16,
                  color:"var(--c-ink)", textAlign:"center"
                }}>
                  We're having trouble loading this video.
                </div>
                <div style={{fontSize:13, color:"var(--c-ink-2)", textAlign:"center", maxWidth:"38ch"}}>
                  It might be a connection hiccup, not something on your side. The transcript is below if you'd like to read instead.
                </div>
                <button className="btn btn--sm" style={{marginTop: 4}}>Try again</button>
              </div>
            ) : (
              <div style={{
                aspectRatio:"16/9", background:"#0F1216", borderRadius: 4, position:"relative", overflow:"hidden"
              }}>
                {/* Striped poster */}
                <div style={{
                  position:"absolute", inset: 0,
                  background:"linear-gradient(180deg, #2a2724 0%, #1a1714 100%)",
                  backgroundImage:"linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.03) 75%, transparent 75%, transparent)",
                  backgroundSize:"24px 24px"
                }}/>
                {/* Big play button if poster */}
                {variant === "poster" && (
                  <div style={{
                    position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
                    width:80, height:80, borderRadius:999, background:"rgba(251,247,240,0.95)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    cursor:"pointer"
                  }}>
                    <div style={{
                      width:0, height:0,
                      borderLeft:"24px solid var(--c-ink)",
                      borderTop:"16px solid transparent",
                      borderBottom:"16px solid transparent",
                      marginLeft: 6
                    }}/>
                  </div>
                )}
                {/* Captions when playing */}
                {isPlaying && (
                  <div style={{
                    position:"absolute", left:24, right:24, bottom: controlsVisible ? 80 : 24,
                    textAlign:"center"
                  }}>
                    <div style={{
                      display:"inline-block",
                      background:"rgba(15,18,22,0.78)",
                      color:"var(--c-paper)",
                      padding:"10px 16px",
                      borderRadius: 4,
                      fontFamily:"var(--font-body)", fontSize: 17, lineHeight: 1.4,
                      maxWidth: "80%"
                    }}>
                      We learn the world through who we play with.
                    </div>
                  </div>
                )}
                {/* Controls bar */}
                {isPlaying && controlsVisible && (
                  <div style={{
                    position:"absolute", left: 0, right: 0, bottom: 0,
                    padding:"14px 18px",
                    background:"linear-gradient(180deg, transparent, rgba(0,0,0,0.6))",
                    color:"var(--c-paper)",
                    display:"flex", alignItems:"center", gap: 14
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius:999, background:"rgba(251,247,240,0.18)",
                      display:"flex", alignItems:"center", justifyContent:"center"
                    }}>
                      <div style={{width: 3, height: 14, background:"var(--c-paper)", marginRight: 3}}/>
                      <div style={{width: 3, height: 14, background:"var(--c-paper)"}}/>
                    </div>
                    <div style={{fontVariantNumeric:"tabular-nums", fontSize:12}}>0:42</div>
                    <div style={{flex:1, height:3, background:"rgba(251,247,240,0.25)", borderRadius:2, position:"relative"}}>
                      <div style={{position:"absolute", left:0, top:0, bottom:0, width:"38%", background:"var(--c-amber)", borderRadius:2}}/>
                      <div style={{position:"absolute", left:"38%", top:"50%", transform:"translate(-50%,-50%)", width:12, height:12, borderRadius:999, background:"var(--c-paper)"}}/>
                    </div>
                    <div style={{fontVariantNumeric:"tabular-nums", fontSize:12}}>1:48</div>
                    <button style={{background:"transparent", border:0, color:"var(--c-paper)", fontSize:12, fontFamily:"var(--font-display)", fontWeight:600, letterSpacing:"0.08em", cursor:"pointer"}}>CC</button>
                  </div>
                )}
                {variant === "playing-faded" && (
                  <div style={{
                    position:"absolute", top: 12, right: 14,
                    background:"rgba(15,18,22,0.55)", color:"rgba(251,247,240,0.7)",
                    padding:"4px 10px", borderRadius: 999,
                    fontSize: 10, letterSpacing:"0.08em", textTransform:"uppercase"
                  }}>controls hidden — move to show</div>
                )}
              </div>
            )}
            <div style={{fontSize: 12, color:"var(--c-ink-3)"}}>
              Recorded May 2026 · Buenos Aires · 1:48
            </div>
          </div>

          {/* Right: meta — theme = Family (matches the tag, the indicator,
             and the pull-quote framing). Position number № 03, replacing the
             old "KIT 10" convention site-wide. */}
          <div style={{padding:"40px 36px", display:"flex", flexDirection:"column", gap:18, position:"relative"}}>
            <div className="tag friendship" style={{alignSelf:"flex-start"}}>Friendship</div>
            <h1 style={{
              fontFamily:"var(--font-display)", fontWeight:700, fontStretch:"85%",
              textTransform:"uppercase", letterSpacing:"0.03em", lineHeight:0.95,
              fontSize: 52, margin:0
            }}>
              <span style={{
                display:"block", fontSize: 22, letterSpacing:"0.06em",
                color:"var(--c-ink-3)", marginBottom: 6
              }}>№ 03</span>
              {player.name},<br/>aged 16
            </h1>
            <div style={{
              fontFamily:"var(--font-display)", fontWeight:600, fontSize: 12,
              letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-ink-3)"
            }}>Buenos Aires, Argentina · Spanish (orig.)</div>
            <blockquote style={{
              fontFamily:"var(--font-display)", fontWeight:500, fontStyle:"italic",
              fontSize: 22, lineHeight: 1.35, margin:0, color:"var(--c-ink)", maxWidth: "26ch"
            }}>"{captionLine}"</blockquote>

            <div style={{
              display:"flex", flexWrap:"wrap", gap: 8,
              paddingTop: 16, borderTop:"1px solid var(--c-rule-soft)"
            }}>
              <div style={{position:"relative"}}>
                <button className="chip">
                  {langOpen ? "Captions: English ✕" : "Captions: English"}
                </button>
                {langOpen && (
                  <div style={{
                    position:"absolute", top: "calc(100% + 4px)", left: 0, zIndex: 4,
                    background:"var(--c-paper)", border:"1px solid var(--c-rule)",
                    borderRadius: 4, boxShadow:"0 8px 24px rgba(20,14,0,0.16)",
                    width: 240, padding: "8px 0"
                  }}>
                    <div style={{
                      fontFamily:"var(--font-display)", fontSize: 10, letterSpacing:"0.14em",
                      textTransform:"uppercase", color:"var(--c-ink-3)",
                      padding: "8px 14px 4px"
                    }}>Available for this video</div>
                    {["English","Spanish (original)","Portuguese","French","Arabic"].map((l,i)=>(
                      <div key={l} style={{
                        padding:"8px 14px", fontSize: 13, color: i===0 ? "var(--c-ink)" : "var(--c-ink-2)",
                        background: i===0 ? "var(--c-amber-50)" : "transparent",
                        fontWeight: i===0 ? 600 : 400,
                        cursor: "pointer"
                      }}>
                        {l} {i===0 && <span style={{float:"right"}}>✓</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button className="chip">Read transcript</button>
              <button className="chip">Share this voice</button>
            </div>

            {/* Footer controls */}
            <div style={{
              marginTop:"auto", paddingTop: 24, borderTop:"1px solid var(--c-rule-soft)",
              display:"flex", flexDirection:"column", gap: 12
            }}>
              <div style={{
                display:"flex", alignItems:"center", justifyContent:"space-between", gap: 12
              }}>
                <button className="btn btn--ghost btn--sm" style={{borderColor:"var(--c-rule)"}}>
                  ← Previous voice
                </button>
                <button className="btn btn--sm">
                  Next voice <span className="arr">→</span>
                </button>
              </div>
              <div style={{fontSize: 12, color:"var(--c-ink-3)", textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center", gap: 8}}>
                <span style={{display:"inline-flex", gap: 3}}>
                  {[...Array(8)].map((_,i)=>(
                    <span key={i} style={{
                      width: 5, height: 5, borderRadius: 999,
                      background: i === 2 ? "var(--c-amber)" : "var(--c-rule)"
                    }}/>
                  ))}
                </span>
                <b style={{color:"var(--c-ink)", fontWeight: 600}}>3 of 38</b>
                <span>friendship voices</span>
              </div>
            </div>
          </div>

          {/* Mid-transition overlay */}
          {variant === "transition" && (
            <>
              <div style={{
                position:"absolute", inset: 0, background:"var(--c-paper)",
                opacity: 0.6, zIndex: 5
              }}/>
              <div style={{
                position:"absolute", left: -60, top: 0, bottom: 0,
                width: "30%", background:"var(--c-paper-2)", border:"1px solid var(--c-rule)",
                transform:"translateX(0)", zIndex: 4,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:"var(--font-display)", fontWeight:600, fontSize:11,
                letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-ink-3)"
              }}>← Sliding out</div>
              <div style={{
                position:"absolute", right: -60, top: 0, bottom: 0,
                width: "30%", background:"var(--c-paper-2)", border:"1px solid var(--c-rule)",
                zIndex: 4, display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:"var(--font-display)", fontWeight:600, fontSize:11,
                letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--c-ink-3)"
              }}>Next voice →</div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

window.PlayerCard = PlayerCard;
