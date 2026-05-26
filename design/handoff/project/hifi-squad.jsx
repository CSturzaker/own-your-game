/* global React, Header, Footer, Tile, Portrait, PLAYERS */
const { useState } = React;

// ============================================================
// THE FULL SQUAD — page 4
// Variants: default | filter-open | filtered | empty
// ============================================================
const buildSquad = (count) => {
  const out = [];
  const names = ["Amara","Yusuf","Sofía","Mei","Bashir","Carlos","Aïsha","Liang","Rohan","Talia","Idris","Lucia","Kofi","Naomi","Diego","Fatima","Jin","Ana","Omar","Priya","Luca","Zara","Tomás","Maya","Ade","Niko","Sara","Ravi","Eli","Nour"];
  const ccs = ["NGA","EGY","ARG","VNM","PAK","BRA","SEN","CHN","IND","USA","MAR","ITA","GHA","KEN","MEX","TUR","KOR","COL","SAU","SLK","ESP","UAE","CHL","PER","CIV","JPN","ETH","BAN","ISR","FRA"];
  const themes = ["fairness","belonging","friendship","confidence","family","community"];
  for (let i=0;i<count;i++){
    out.push({
      id:`sq${i}`, num: (i%99)+1,
      name: names[i%names.length],
      cc: ccs[i%ccs.length],
      theme: themes[i%themes.length]
    });
  }
  return out;
};

const SquadDesktop = ({ variant = "default" }) => {
  const isFiltered = variant === "filtered";
  const isEmpty = variant === "empty";
  const isOpen = variant === "filter-open";
  const isLoad = variant === "load-more";

  const allCount = 247;
  const visibleCount = isFiltered ? 38 : isEmpty ? 0 : isLoad ? 32 : 24;
  const squad = buildSquad(visibleCount);

  return (
    <>
      <Header active="squad"/>
      <main id="main" style={{padding:"48px 56px 80px", display:"flex", flexDirection:"column", gap: 32}}>

        {/* Header */}
        <section>
          <div className="kicker">The full squad</div>
          <div style={{display:"flex", alignItems:"baseline", justifyContent:"space-between", flexWrap:"wrap", gap: 24, marginTop: 16}}>
            <h1 style={{
              fontFamily:"var(--font-display)", fontWeight:700, fontStretch:"85%",
              textTransform:"uppercase", letterSpacing:"0.03em", lineHeight: 1,
              fontSize: 72, margin: 0
            }}>Two hundred and forty-seven.</h1>
            <p style={{
              fontFamily:"var(--font-display)", fontWeight: 500, fontSize: 20,
              lineHeight: 1.3, color:"var(--c-ink-2)", margin:0, maxWidth:"30ch"
            }}>Every young person who recorded a video and added their name to the letter.</p>
          </div>
        </section>

        {/* Filter bar */}
        <section style={{
          display:"flex", gap: 12, alignItems:"center", flexWrap:"wrap",
          padding: "16px 0", borderTop:"1px solid var(--c-rule)", borderBottom:"1px solid var(--c-rule)",
          position:"relative"
        }}>
          <span style={{
            fontFamily:"var(--font-display)", fontWeight:700, fontSize: 11,
            letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--c-ink-3)"
          }}>Filter</span>

          {isFiltered ? (
            <>
              <button className="chip active">Theme: Friendship</button>
              <button className="chip">Country: All</button>
              <button className="chip">Language: All</button>
              <button className="chip">Age: All</button>
            </>
          ) : isEmpty ? (
            <>
              <button className="chip active">Theme: Belonging</button>
              <button className="chip active">Country: Argentina</button>
              <button className="chip active">Language: Spanish</button>
              <button className="chip">Age: All</button>
            </>
          ) : (
            <>
              <button className="chip">Theme: All</button>
              <div style={{position:"relative"}}>
                <button className={`chip ${isOpen ? "active" : ""}`} style={isOpen ? {background:"var(--c-paper)", borderColor:"var(--c-ink)"} : {}}>Country: All</button>
                {isOpen && (
                  <div style={{
                    position:"absolute", top:"calc(100% + 6px)", left: 0, zIndex: 6,
                    width: 280, background:"var(--c-paper)", border:"1px solid var(--c-rule)",
                    borderRadius: 4, boxShadow:"0 12px 32px rgba(20,14,0,0.16)",
                    padding: 0
                  }}>
                    <div style={{padding:"12px 14px", borderBottom:"1px solid var(--c-rule-soft)"}}>
                      <input className="input" placeholder="Search 42 countries…" style={{width:"100%", fontSize:13}}/>
                    </div>
                    <div style={{maxHeight: 260, overflow:"auto"}}>
                      {["Argentina","Bangladesh","Brazil","Chile","China","Colombia","Egypt","Ethiopia","France","Ghana","India","Italy"].map((c,i)=>(
                        <label key={c} style={{
                          display:"flex", alignItems:"center", gap: 10,
                          padding:"9px 14px", fontSize: 13, color:"var(--c-ink-2)",
                          cursor:"pointer",
                          background: i===0 ? "var(--c-amber-50)" : "transparent"
                        }}>
                          <input type="checkbox" checked={i===0} readOnly style={{accentColor:"var(--c-amber)"}}/>
                          {c}
                          <span style={{marginLeft:"auto", fontSize: 11, color:"var(--c-ink-3)"}}>
                            {i===0?"12":i===2?"22":i===4?"19":i===10?"18":"6"}
                          </span>
                        </label>
                      ))}
                    </div>
                    <div style={{
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                      padding:"10px 14px", borderTop:"1px solid var(--c-rule-soft)",
                      background:"var(--c-paper-2)"
                    }}>
                      <button style={{background:"transparent", border:0, fontSize:12, color:"var(--c-ink-3)", cursor:"pointer"}}>Clear</button>
                      <button className="btn btn--sm">Apply</button>
                    </div>
                  </div>
                )}
              </div>
              <button className="chip">Language: All</button>
              <button className="chip">Age: All</button>
            </>
          )}

          <div style={{marginLeft:"auto", display:"flex", alignItems:"center", gap: 14, fontSize: 13, color:"var(--c-ink-3)"}}>
            {isFiltered && <span><b style={{color:"var(--c-ink)", fontWeight:600}}>38</b> of 247</span>}
            {!isFiltered && !isEmpty && <span><b style={{color:"var(--c-ink)", fontWeight:600}}>{visibleCount}</b> of 247 shown</span>}
            {isEmpty && <span style={{color:"var(--c-ink-2)"}}>0 voices match</span>}
            <select className="input" style={{padding:"6px 12px", fontSize: 12, minHeight: 32}}>
              <option>Newest first</option>
              <option>Oldest first</option>
              <option>By country (A–Z)</option>
            </select>
          </div>
        </section>

        {/* Grid */}
        {isEmpty ? (
          <section style={{
            padding: "80px 32px", textAlign:"center",
            border:"1px dashed var(--c-rule)", borderRadius: 4,
            background:"var(--c-paper-2)",
            display:"flex", flexDirection:"column", alignItems:"center", gap: 16
          }}>
            <div style={{
              fontFamily:"var(--font-display)", fontWeight:700, fontStretch:"85%",
              textTransform:"uppercase", letterSpacing:"0.03em",
              fontSize: 28, color:"var(--c-ink)"
            }}>No voices yet for this combination.</div>
            <div style={{fontSize: 15, color:"var(--c-ink-2)", maxWidth: "44ch"}}>
              That doesn't mean there are no Spanish-speaking young people in Argentina writing about belonging — it just means none have joined the squad yet. Try removing a filter to widen your search.
            </div>
            <button className="btn" style={{marginTop: 8}}>Clear all filters</button>
          </section>
        ) : (
          <>
            <section style={{display:"grid", gridTemplateColumns:"repeat(8, 1fr)", gap: 12}}>
              {squad.map((p,i)=>(
                <Tile key={p.id} player={p} position={i+1}
                      flash={isLoad && i >= 24}/>
              ))}
            </section>
            {isLoad && (
              <div style={{textAlign:"center", fontSize: 13, color:"var(--c-ink-3)"}}>
                <span style={{display:"inline-flex", alignItems:"center", gap: 8}}>
                  <span style={{
                    width: 16, height: 16, borderRadius: 999,
                    border:"2px solid var(--c-rule)", borderTopColor:"var(--c-amber)",
                    animation:"spin 1s linear infinite", display:"inline-block"
                  }}/>
                  Loading 8 more voices…
                </span>
              </div>
            )}
            {!isEmpty && (
              <div style={{display:"flex", justifyContent:"center"}}>
                <button className="btn btn--ghost" style={{borderColor:"var(--c-ink)"}}>
                  Load 24 more <span className="arr">↓</span>
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer/>
      <style dangerouslySetInnerHTML={{__html:`@keyframes spin{to{transform:rotate(360deg)}}`}}/>
    </>
  );
};
window.SquadDesktop = SquadDesktop;

const SquadMobile = ({ variant = "default" }) => {
  const squad = buildSquad(12);
  return (
    <>
      <Header mobile/>
      <main style={{padding:"24px 16px 48px", display:"flex", flexDirection:"column", gap: 20}}>
        <div className="kicker" style={{fontSize:10}}>The full squad</div>
        <h1 style={{
          fontFamily:"var(--font-display)", fontWeight:700, fontStretch:"85%",
          textTransform:"uppercase", letterSpacing:"0.03em", lineHeight: 1,
          fontSize: 42, margin: 0
        }}>247 voices.</h1>
        <p style={{fontSize: 15, color:"var(--c-ink-2)", margin:0}}>
          Every young person who recorded a video and added their name to the letter.
        </p>

        <div style={{
          display:"flex", gap: 8, padding:"10px 0",
          borderTop:"1px solid var(--c-rule)", borderBottom:"1px solid var(--c-rule)",
          overflow:"auto"
        }}>
          <button className="chip" style={{flexShrink:0, fontSize: 12, padding:"6px 12px"}}>Theme</button>
          <button className="chip" style={{flexShrink:0, fontSize: 12, padding:"6px 12px"}}>Country</button>
          <button className="chip" style={{flexShrink:0, fontSize: 12, padding:"6px 12px"}}>Language</button>
        </div>
        <div style={{fontSize: 12, color:"var(--c-ink-3)"}}>12 of 247 shown</div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap: 8}}>
          {squad.map((p,i)=>(<Tile key={p.id} player={p} position={i+1}/>))}
        </div>
        <button className="btn btn--ghost" style={{borderColor:"var(--c-ink)", justifyContent:"center"}}>Load more</button>
      </main>
      <Footer mobile/>
    </>
  );
};
window.SquadMobile = SquadMobile;
