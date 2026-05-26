/* global React, Header, Footer */
const { useState } = React;

// ============================================================
// ABOUT — page 5
// Variants: default | numbers-animating
// ------------------------------------------------------------
// Replacement copy pass · May 2026
// The page is now: hero, the question/answer pair as a designed
// moment, three paragraphs of body, two closing lines, the
// numbers block, footer. Generous whitespace is the answer to
// the page being shorter than the previous version — do not pad.
// ============================================================
const AboutDesktop = ({ variant = "default" }) => {
  const animating = variant === "numbers-animating";
  return (
    <>
      <Header active="about"/>
      <main id="main" style={{
        maxWidth: 1120, margin:"0 auto",
        padding: "56px 56px 96px", display:"flex", flexDirection:"column", gap: 96
      }}>

        {/* Hero */}
        <section style={{display:"flex", flexDirection:"column", gap: 28, maxWidth: 980}}>
          <div className="kicker">A youth-led campaign · 2026 World Cup</div>
          <h1 style={{
            fontFamily:"var(--font-display)", fontWeight:700,
            letterSpacing:"-0.02em", lineHeight: 0.95,
            fontSize: 104, margin: 0, textWrap: "balance"
          }}>About Own Your Game.</h1>
          <p style={{
            fontFamily:"var(--font-display)", fontWeight: 500, fontSize: 26,
            lineHeight: 1.35, color:"var(--c-ink-2)", margin: "12px 0 0",
            maxWidth: "44ch"
          }}>
            Own Your Game is a youth-led global campaign built around
            one simple question:
          </p>
        </section>

        {/* The question/answer pair — the page's emotional centrepiece.
           Designed as a call-and-response. The question carries the
           established amber hairline tagline treatment, at hero scale.
           The answer is offset visually — set down and to the right,
           Deep Cyan, italic, with a directional hairline that runs from
           the question to the reply. The aim is for the two lines to
           feel like one designed moment, not two stacked quotes. */}
        <section style={{
          display:"flex", flexDirection:"column", gap: 0, position:"relative"
        }}>
          <blockquote className="tagline" style={{
            margin: 0, fontSize: 120, lineHeight: 1.0, color:"var(--c-ink)",
            borderLeft:"3px solid var(--c-amber)", paddingLeft: 32,
            maxWidth: "18ch", letterSpacing:"-0.015em"
          }}>Whose game is it anyway?</blockquote>

          <p style={{
            fontFamily:"var(--font-body)", fontSize: 17, lineHeight: 1.65,
            color:"var(--c-ink-2)", margin: "48px 0 0", maxWidth: "52ch",
            paddingLeft: 35
          }}>
            The power of the question is not the question itself,
            but the answer young people give back:
          </p>

          {/* Answer block — offset to the right, smaller than the question
             but in the same family. A short horizontal hairline above it
             acts as a directional cue connecting it to the question. */}
          <div style={{
            display:"flex", flexDirection:"column", alignItems:"flex-start",
            alignSelf:"flex-end", marginTop: 28, marginRight: 40,
            maxWidth: "32ch"
          }}>
            <span style={{
              width: 64, height: 2, background:"var(--c-deep-900)",
              marginBottom: 18
            }} aria-hidden="true"/>
            <div className="tagline" style={{
              fontSize: 88, lineHeight: 1.0, color:"var(--c-deep-900)",
              letterSpacing:"-0.015em"
            }}>It’s ours.</div>
          </div>
        </section>

        {/* Body paragraphs — comfortable measure, generous leading.
           Three paragraphs, set in the body face. */}
        <section style={{
          display:"flex", flexDirection:"column", gap: 28,
          maxWidth: "62ch", margin: "0 auto"
        }}>
          <p style={{fontFamily:"var(--font-body)", fontSize: 19, lineHeight: 1.7, color:"var(--c-ink)", margin: 0}}>
            Own Your Game is part of <em>Fix My Food</em>, a growing global youth
            movement supported by UNICEF that brings together young people calling
            for healthier, fairer and more supportive food environments.
          </p>
          <p style={{fontFamily:"var(--font-body)", fontSize: 19, lineHeight: 1.7, color:"var(--c-ink)", margin: 0}}>
            For young people around the world, football and sport are about more than
            just the game itself. It is friendship. Community. Confidence. Belonging.
            It is the local teams, the families on the sidelines, the feeling of being
            part of something bigger than yourself. Sport is also where many of us
            learn about teamwork, effort, respect and fair play — the idea that the
            game should be fair for everyone.
          </p>
          <p style={{fontFamily:"var(--font-body)", fontSize: 19, lineHeight: 1.7, color:"var(--c-ink)", margin: 0}}>
            But more and more, the spaces we love are being overshadowed by junk food
            and drink marketing. Sometimes it feels like the joy, energy and community
            that football creates are being used to market products that do not always
            have our best interests at heart, and that some parts of the food and drink
            industry are not always playing fair.
          </p>
          <p style={{fontFamily:"var(--font-body)", fontSize: 19, lineHeight: 1.7, color:"var(--c-ink)", margin: 0}}>
            Own Your Game brings together young people from across countries and
            communities to share what football and sport really mean to us, and why
            we want the game to put people and communities first.
          </p>
          <p style={{fontFamily:"var(--font-body)", fontSize: 19, lineHeight: 1.7, color:"var(--c-ink)", margin: 0}}>
            This website brings together our stories, videos and voices ahead of the
            2026 FIFA World Cup. Every new voice added becomes part of a growing
            global team asking what football should stand for, and who the game
            really belongs to.
          </p>
        </section>

        {/* Closing pair — the two lines the page wants to leave the reader
           with. Set apart with extra space, weight slightly heavier than
           body, larger size. These are not pull-quotes — they're closing
           statements, plain and confident. */}
        <section style={{
          maxWidth: "52ch", margin: "0 auto",
          display:"flex", flexDirection:"column", gap: 28,
          paddingTop: 32, borderTop:"1px solid var(--c-rule-soft)"
        }}>
          <p style={{
            fontFamily:"var(--font-body)", fontSize: 24, fontWeight: 600,
            lineHeight: 1.45, color:"var(--c-ink)", margin: 0, textWrap:"pretty"
          }}>
            Because football belongs to players, fans, families and communities.
          </p>
          <p style={{
            fontFamily:"var(--font-body)", fontSize: 24, fontWeight: 600,
            lineHeight: 1.45, color:"var(--c-ink)", margin: 0, textWrap:"pretty"
          }}>
            And young people deserve a say in the future of the game they love.
          </p>
        </section>

        {/* Movement in numbers — KEPT FROM PREVIOUS PASS, unchanged. */}
        <section>
          <h2 style={{
            fontFamily:"var(--font-display)", fontWeight:700,
            letterSpacing:"-0.01em", lineHeight: 1, fontSize: 32, margin: 0,
            paddingTop: 12, borderTop:"2px solid var(--c-ink)",
            alignSelf:"flex-start", display:"inline-block",
            marginBottom: 32
          }}>The movement in numbers</h2>

          <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap: 24}}>
            {[
              {n: animating ? "183" : "247", suffix: animating ? " ↑" : "", label: "Young voices", sub: animating ? "counting up…" : "aged 11 to 18, all signatories"},
              {n: animating ? "31" : "42", suffix: animating ? " ↑" : "", label: "Countries", sub: animating ? "counting up…" : "on six continents"},
              {n: animating ? "19" : "26", suffix: animating ? " ↑" : "", label: "Languages", sub: animating ? "counting up…" : "every video captioned"},
            ].map((s,i)=>(
              <div key={i} style={{
                background:"var(--c-paper-2)", borderRadius: 4, padding: 36,
                display:"flex", flexDirection:"column", gap: 6,
                position: "relative", overflow:"hidden"
              }}>
                <div style={{
                  fontFamily:"var(--font-display)", fontWeight:700,
                  fontSize: 96, lineHeight: 0.95, letterSpacing:"-0.04em",
                  color:"var(--c-deep-900)", fontVariantNumeric:"tabular-nums",
                  display:"flex", alignItems:"baseline", gap: 8
                }}>
                  {s.n}
                  {s.suffix && <span style={{fontSize: 22, color:"var(--c-amber)"}}>{s.suffix}</span>}
                </div>
                <div style={{
                  fontFamily:"var(--font-display)", fontWeight: 700,
                  letterSpacing:"0.08em", textTransform:"uppercase", fontSize: 13,
                  color:"var(--c-ink)"
                }}>{s.label}</div>
                <div style={{fontSize: 13, color:"var(--c-ink-2)"}}>{s.sub}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer/>
    </>
  );
};
window.AboutDesktop = AboutDesktop;

// ============================================================
// ABOUT MOBILE
// Same structure, tighter type, same designed moment for the
// question/answer pair (stacked, with the answer indented right).
// ============================================================
const AboutMobile = () => (
  <>
    <Header mobile/>
    <main style={{padding:"24px 16px 56px", display:"flex", flexDirection:"column", gap: 48}}>

      {/* Hero */}
      <section>
        <div className="kicker" style={{fontSize:10}}>A youth-led campaign · 2026 World Cup</div>
        <h1 style={{
          fontFamily:"var(--font-display)", fontWeight:700,
          letterSpacing:"-0.02em", lineHeight: 0.95,
          fontSize: 52, margin: "12px 0 0", textWrap:"balance"
        }}>About Own Your Game.</h1>
        <p style={{
          fontFamily:"var(--font-display)", fontWeight: 500, fontSize: 18,
          lineHeight: 1.35, color:"var(--c-ink-2)", margin:"20px 0 0"
        }}>Own Your Game is a youth-led global campaign built around one simple question:</p>
      </section>

      {/* Question / Answer pair */}
      <section>
        <blockquote className="tagline" style={{
          margin: 0, fontSize: 48, lineHeight: 1.0, color:"var(--c-ink)",
          borderLeft:"3px solid var(--c-amber)", paddingLeft: 18,
          letterSpacing:"-0.015em"
        }}>Whose game is it anyway?</blockquote>
        <p style={{
          fontFamily:"var(--font-body)", fontSize: 14, lineHeight: 1.6,
          color:"var(--c-ink-2)", margin: "24px 0 0", paddingLeft: 21
        }}>The power of the question is not the question itself, but the answer young people give back:</p>
        <div style={{
          display:"flex", flexDirection:"column", alignItems:"flex-start",
          marginTop: 18, marginLeft: "auto", maxWidth: "20ch",
          paddingLeft: 24
        }}>
          <span style={{
            width: 40, height: 2, background:"var(--c-deep-900)", marginBottom: 12
          }} aria-hidden="true"/>
          <div className="tagline" style={{
            fontSize: 40, lineHeight: 1.0, color:"var(--c-deep-900)",
            letterSpacing:"-0.015em"
          }}>It’s ours.</div>
        </div>
      </section>

      {/* Body */}
      <section style={{display:"flex", flexDirection:"column", gap: 18}}>
        <p style={{fontSize: 16, lineHeight: 1.7, color:"var(--c-ink)", margin: 0}}>
          Own Your Game is part of <em>Fix My Food</em>, a growing global youth movement supported by UNICEF that brings together young people calling for healthier, fairer and more supportive food environments.
        </p>
        <p style={{fontSize: 16, lineHeight: 1.7, color:"var(--c-ink)", margin: 0}}>
          For young people around the world, football and sport are about more than just the game itself. It is friendship. Community. Confidence. Belonging. It is the local teams, the families on the sidelines, the feeling of being part of something bigger than yourself. Sport is also where many of us learn about teamwork, effort, respect and fair play — the idea that the game should be fair for everyone.
        </p>
        <p style={{fontSize: 16, lineHeight: 1.7, color:"var(--c-ink)", margin: 0}}>
          But more and more, the spaces we love are being overshadowed by junk food and drink marketing. Sometimes it feels like the joy, energy and community that football creates are being used to market products that do not always have our best interests at heart, and that some parts of the food and drink industry are not always playing fair.
        </p>
        <p style={{fontSize: 16, lineHeight: 1.7, color:"var(--c-ink)", margin: 0}}>
          Own Your Game brings together young people from across countries and communities to share what football and sport really mean to us, and why we want the game to put people and communities first.
        </p>
        <p style={{fontSize: 16, lineHeight: 1.7, color:"var(--c-ink)", margin: 0}}>
          This website brings together our stories, videos and voices ahead of the 2026 FIFA World Cup. Every new voice added becomes part of a growing global team asking what football should stand for, and who the game really belongs to.
        </p>
      </section>

      {/* Closing pair */}
      <section style={{
        display:"flex", flexDirection:"column", gap: 18,
        paddingTop: 24, borderTop:"1px solid var(--c-rule-soft)"
      }}>
        <p style={{fontSize: 19, fontWeight: 600, lineHeight: 1.45, color:"var(--c-ink)", margin: 0, textWrap:"pretty"}}>
          Because football belongs to players, fans, families and communities.
        </p>
        <p style={{fontSize: 19, fontWeight: 600, lineHeight: 1.45, color:"var(--c-ink)", margin: 0, textWrap:"pretty"}}>
          And young people deserve a say in the future of the game they love.
        </p>
      </section>

      {/* Numbers */}
      <section>
        <h2 style={{
          fontFamily:"var(--font-display)", fontWeight:700,
          letterSpacing:"-0.01em", fontSize: 22,
          paddingTop:8, borderTop:"2px solid var(--c-ink)",
          display:"inline-block", margin: 0
        }}>The movement in numbers</h2>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12, marginTop: 16}}>
          {[
            {n:"247", l:"Voices", s:"aged 11 to 18, all signatories"},
            {n:"42",  l:"Countries", s:"on six continents"},
            {n:"26",  l:"Languages", s:"every video captioned"},
            {n:"1",   l:"Letter", s:"signed by all of us"}
          ].map((s,i)=>(
            <div key={i} style={{background:"var(--c-paper-2)", borderRadius:4, padding: 16}}>
              <div style={{fontFamily:"var(--font-display)", fontWeight:700, fontSize:42, lineHeight:1, color:"var(--c-deep-900)", letterSpacing:"-0.03em"}}>{s.n}</div>
              <div style={{fontFamily:"var(--font-display)", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", fontSize:11, color:"var(--c-ink)", marginTop: 10}}>{s.l}</div>
              <div style={{fontSize:11, color:"var(--c-ink-2)", marginTop:2}}>{s.s}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
    <Footer mobile/>
  </>
);
window.AboutMobile = AboutMobile;
