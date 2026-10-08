import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

// Three.js loads async — hero text + aura paint instantly, the bot fades in when ready.
const OrbBot = lazy(() => import('./OrbBot'));

const LOGO_INTRO = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDaNHUwUAso5g3wjXNo8iisJmpPWEydtAUQ5UFhGmxP9XUYsLhR4-yRWXAHm34BkRiEXlnd1zbcZhnf-TBEDzV-tKwp9_Mic18OwN1vFyjKEha3hH_g72NkzLWncIQ7kqJiRFRnmmybvpH9h0a0zLv5pZ2L4e5EfxSuq0IWjEHmZoRh_DdY9LeHMrs32K-35Wt2hk0av-5qtqGYJ4eGer9vEzGRg4WVJkgu2JN0hkVwixAZghKM3l_H5Z5GXnM1jqIOQ';

const PULSES = [
  { track: 'track-whatsapp', color: '#34d399' },
  { track: 'track-chatbot', color: '#c084fc' },
  { track: 'track-instagram', color: '#f472b6' },
  { track: 'track-voice', color: '#38bdf8' },
  { track: 'track-bookings', color: '#22d3ee' },
  { track: 'track-email', color: '#fb923c', amber: true },
  { track: 'track-crm', color: '#a855f7' },
  { track: 'track-escalations', color: '#2dd4bf' },
];

function Node({ className, style, icon, label, dot }) {
  return (
    <div className={`absolute flex flex-col items-center group z-20 ${className}`} style={style}>
      <div className="relative">
        {dot && <span className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${dot}`} />}
        <div className="node-box w-[58px] h-[58px] rounded-xl flex items-center justify-center backdrop-blur-md cursor-pointer">
          {icon}
        </div>
      </div>
      <span className="mt-2 text-[11px] font-medium text-slate-300 tracking-wide">{label}</span>
    </div>
  );
}

/**
 * Cinematic hero.
 *  - Intro overlay (logo + wordmark, auto-dismiss, reduced-motion safe)
 *  - Interactive OrbBot 3D backdrop (cursor-tracking eyes, drag to spin, click to wink)
 *  - Circuit schematic with synchronized node glow + travelling pulses
 *  - Mouse parallax (aura, flare, haze, orbs, spotlight)
 */
export default function CinematicHero() {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const spotlightRef = useRef(null);
  const [introGone, setIntroGone] = useState(false);

  /* intro safety: never trap the user behind the overlay */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIntroGone(true);
      return;
    }
    const t = setTimeout(() => setIntroGone(true), 5200);
    return () => clearTimeout(t);
  }, []);

  /* mouse parallax spring */
  useEffect(() => {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 3;
    let curX = mouseX;
    let curY = mouseY;
    let moving = false;
    let raf = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      moving = true;
      if (spotlightRef.current) {
        spotlightRef.current.style.setProperty('--mouse-x', `${(mouseX / window.innerWidth) * 100}%`);
        spotlightRef.current.style.setProperty('--mouse-y', `${(mouseY / window.innerHeight) * 100}%`);
      }
    };
    const onLeave = () => { moving = false; };

    const tick = () => {
      const ease = 0.075;
      curX += (mouseX - curX) * ease;
      curY += (mouseY - curY) * ease;
      const dx = curX - window.innerWidth / 2;
      const dy = curY - window.innerHeight / 2;
      const set = (id, transform, opacity) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.transform = transform;
        if (opacity !== undefined) el.style.opacity = opacity;
      };
      set('cursor-light-aura', `translate3d(${curX}px, ${curY}px, 0)`, moving ? '1' : '0.6');
      set('interactive-flare', `rotate(33deg) translate3d(${dx * 0.045}px, ${dy * 0.035}px, 0)`);
      set('interactive-haze', `translate3d(${dx * -0.04}px, ${dy * -0.04}px, 0)`);
      set('layer-purple-orb', `translate3d(${dx * 0.02}px, ${dy * 0.02}px, 0)`);
      set('layer-amber-orb', `translate3d(${dx * -0.025}px, ${dy * -0.025}px, 0)`);
      set('circuit-grid-pattern', `translate3d(${dx * 0.012}px, ${dy * 0.012}px, 0)`);
      raf = requestAnimationFrame(tick);
    };

    if (!reduced) {
      window.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('mouseleave', onLeave);
      raf = requestAnimationFrame(tick);
    }
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* Hero backdrop is the interactive OrbBot (Three.js) — no frame assets,
     no preload, no scroll engine. Eyes follow the visitor's cursor. */

  return (
    <>
      {/* intro overlay */}
      {!introGone && (
        <div aria-hidden="true" id="intro-overlay">
          <div className="flex items-center justify-center">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 flex items-center justify-center bg-transparent border-0" id="intro-logo-emblem">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-600/40 via-blue-500/20 to-pink-500/30 blur-2xl pointer-events-none" />
              <img alt="Sangam.ai Logo" className="relative z-10 w-full h-full object-contain blend-logo-clean drop-shadow-[0_0_24px_rgba(168,85,247,0.85)]" src={LOGO_INTRO} />
            </div>
            <div className="flex flex-col justify-center" id="intro-wordmark-container">
              <div className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white flex items-center gap-0.5 leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Sangam<span className="text-[#a78bfa] drop-shadow-[0_0_24px_rgba(167,139,250,0.85)]">.ai</span>
              </div>
              <div className="mt-2.5 text-[11px] sm:text-xs uppercase font-mono tracking-[0.32em] text-slate-400 font-medium">Autonomous Enterprise Core</div>
            </div>
          </div>
        </div>
      )}

      <div id="hero-dashboard-container" ref={containerRef}>
        <section className="relative overflow-hidden" data-purpose="hero-banner">
          {/* orb-bot background (interactive 3D) + dark aura fallback */}
          <div id="scroll-frame-background" aria-hidden="true">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_35%,rgba(124,58,237,0.20),rgba(5,5,5,0.9)_78%)]" />
            <Suspense fallback={null}>
              <OrbBot />
            </Suspense>
            <div id="spotlight-mask" ref={spotlightRef} />
            <div id="scroll-frame-vignette" />
          </div>

          <div className="optical-flare-beam animate-beam-drift" id="interactive-flare" />
          <div className="secondary-haze" id="interactive-haze" />

          {/* hero text — trust-navy glass: safety + premium depth */}
          <div className="relative z-30 max-w-4xl mx-auto px-4 text-center hero-text-container" ref={textRef}>
            <div className="bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0a1628]/92 via-[#0a1628]/72 to-transparent rounded-3xl p-8 border border-sky-400/10">
              <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight mb-4 drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
                Inference at the Edge
              </h1>
              <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 font-normal leading-relaxed mb-6 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                Boost your business speed and efficiency globally and locally in Nepal by bringing autonomous AI employees
                directly into WhatsApp, Instagram, CRM, and omnichannel nodes. Native Devanagari &amp; Romanized NLP with
                sub-300ms Kathmandu edge latency.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <Link to="/register" className="px-9 py-3.5 rounded-full bg-gradient-to-r from-[#FF4D00] to-[#FF6B00] hover:from-[#ff5e1a] hover:to-[#ff7b1a] text-white font-semibold text-sm shadow-[0_0_28px_rgba(255,77,0,0.55)] transition-all duration-200 transform hover:-translate-y-0.5">
                  Get started — it&apos;s free
                </Link>
                <a href="#employees" className="px-8 py-3 rounded-full bg-sky-400/5 hover:bg-sky-400/10 border border-sky-400/25 hover:border-sky-300/50 text-sky-200 font-medium text-sm backdrop-blur-md transition-all duration-200 flex items-center justify-center gap-1.5">
                  <span>Explore AI employees</span>
                  <svg className="w-3.5 h-3.5 text-sky-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
                </a>
              </div>
              {/* safety cues: risk reversal beside the spend trigger */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[12.5px]">
                <span className="flex items-center gap-1.5 text-emerald-300"><span className="material-symbols-outlined text-[16px]">shield</span> No credit card</span>
                <span className="flex items-center gap-1.5 text-emerald-300"><span className="material-symbols-outlined text-[16px]">verified</span> 14-day money-back</span>
                <span className="flex items-center gap-1.5 text-sky-300"><span className="material-symbols-outlined text-[16px]">support_agent</span> Nepali support</span>
              </div>
            </div>
          </div>

          {/* circuit schematic */}
          <div className="relative max-w-5xl mx-auto px-4 mt-8" data-purpose="circuit-neural-schematic" id="architecture">
            <div className="relative w-full h-[480px] sm:h-[500px] bg-[#0a1628]/25 backdrop-blur-[2px] rounded-3xl border border-sky-400/20 overflow-hidden shadow-[0_0_80px_rgba(56,189,248,0.12),0_0_80px_rgba(0,0,0,0.5)]" id="circuit-stage-card">
              <div className="absolute inset-0 bg-[radial-gradient(#27263d_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" id="circuit-grid-pattern" />
              <svg className="absolute inset-0 w-full h-full pointer-events-none" fill="none" viewBox="0 0 1000 460" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter height="300%" id="beamGlow" width="300%" x="-100%" y="-100%"><feGaussianBlur result="blur" stdDeviation="4.5" /><feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                  <filter height="300%" id="pulseGlowAmber" width="300%" x="-100%" y="-100%"><feGaussianBlur result="blur" stdDeviation="5" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>
                <circle cx="500" cy="230" opacity="0.15" r="180" stroke="#6366f1" strokeDasharray="4 6" strokeWidth="1" />
                <circle cx="500" cy="230" opacity="0.1" r="240" stroke="#8b5cf6" strokeDasharray="3 8" strokeWidth="1" />
                <path className="circuit-track" d="M 500 165 L 500 75" id="track-whatsapp" />
                <path className="circuit-track" d="M 435 195 L 330 195 L 230 135 L 230 75" id="track-chatbot" />
                <path className="circuit-track" d="M 565 195 L 670 195 L 770 135 L 770 75" id="track-instagram" />
                <path className="circuit-track" d="M 435 230 L 175 230" id="track-voice" stroke="#3b3a56" strokeWidth="2.2" />
                <path className="circuit-track" d="M 565 230 L 825 230" id="track-bookings" stroke="#3b3a56" strokeWidth="2.2" />
                <path className="circuit-track" d="M 435 265 L 330 265 L 230 325 L 230 385" id="track-email" />
                <path className="circuit-track" d="M 500 295 L 500 385" id="track-crm" />
                <path className="circuit-track" d="M 565 265 L 670 265 L 770 325 L 770 385" id="track-escalations" />
                {PULSES.map((p) => (
                  <g key={p.track} filter={p.amber ? 'url(#pulseGlowAmber)' : 'url(#beamGlow)'}>
                    <circle cx="0" cy="0" fill={p.color} r="5">
                      <animateMotion begin="0s" dur="2.8s" repeatCount="indefinite" rotate="auto"><mpath href={`#${p.track}`} /></animateMotion>
                      <animate attributeName="opacity" begin="0s" dur="2.8s" keyTimes="0;0.1;0.8;0.9;1" repeatCount="indefinite" values="0;1;1;0;0" />
                    </circle>
                    <circle cx="0" cy="0" fill="#ffffff" r="2.5">
                      <animateMotion begin="0s" dur="2.8s" repeatCount="indefinite" rotate="auto"><mpath href={`#${p.track}`} /></animateMotion>
                    </circle>
                  </g>
                ))}
              </svg>

              <Node className="node-active-0 top-[16px] left-1/2 -translate-x-1/2" label="WhatsApp"
                icon={<svg className="w-6 h-6 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 2.083.824 3.228.825l.003-.001c3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.768-5.766m6.73 5.766c.002 3.71-3.018 6.731-6.73 6.731-1.168 0-2.308-.303-3.308-.881l-3.693.968.985-3.599c-.642-1.04-.984-2.235-.984-3.219.002-3.71 3.023-6.731 6.73-6.731 3.708 0 6.73 3.021 6.73 6.731z" /></svg>} />
              <Node className="node-active-1 top-[16px] left-[23%] -translate-x-1/2" label="AI Chatbot"
                icon={<svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z" /></svg>} />
              <Node className="node-active-2 top-[16px] left-[77%] -translate-x-1/2" label="Instagram"
                icon={<svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><rect height="20" rx="5" ry="5" width="20" x="2" y="2" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>} />
              <Node className="node-active-3 top-[230px] left-[14%] -translate-y-1/2 -translate-x-1/2" label="Voice AI"
                dot="-right-2 bg-sky-400 shadow-[0_0_8px_#38bdf8]"
                icon={<svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>} />
              <Node className="node-active-4 top-[230px] left-[86%] -translate-y-1/2 -translate-x-1/2" label="Bookings"
                dot="-left-2 bg-cyan-400 shadow-[0_0_8px_#22d3ee]"
                icon={<svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><rect height="18" rx="2" ry="2" width="18" x="3" y="4" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /><circle cx="8" cy="15" fill="currentColor" r="1" /><circle cx="12" cy="15" fill="currentColor" r="1" /><circle cx="16" cy="15" fill="currentColor" r="1" /></svg>} />
              <Node className="node-active-5 bottom-[16px] left-[23%] -translate-x-1/2" label="Email"
                icon={<svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>} />
              <Node className="node-active-6 bottom-[16px] left-1/2 -translate-x-1/2" label="CRM Sync"
                icon={<svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>} />
              <Node className="node-active-7 bottom-[16px] left-[77%] -translate-x-1/2" label="Escalations"
                icon={<svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>} />

              {/* central AI chip */}
              <div className="absolute left-1/2 top-[230px] -translate-x-1/2 -translate-y-1/2 z-30" data-purpose="central-ai-processor">
                <div className="relative w-36 h-36 rounded-2xl bg-gradient-to-b from-[#181628] via-[#100f1c] to-[#0a0912] border-2 border-purple-500/60 shadow-[0_0_60px_rgba(168,85,247,0.5),inset_0_0_25px_rgba(168,85,247,0.2)] flex flex-col items-center justify-center">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-1.5">{[0, 1, 2, 3].map((i) => <span key={i} className="w-1.5 h-3 bg-purple-400 rounded-full shadow-[0_0_6px_#c084fc]" />)}</div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">{[0, 1, 2, 3].map((i) => <span key={i} className="w-1.5 h-3 bg-purple-400 rounded-full shadow-[0_0_6px_#c084fc]" />)}</div>
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
                    <span className="h-1.5 w-3 bg-sky-400 rounded-full shadow-[0_0_7px_#38bdf8]" /><span className="h-1.5 w-3 bg-purple-400 rounded-full shadow-[0_0_6px_#c084fc]" /><span className="h-1.5 w-3 bg-sky-400 rounded-full shadow-[0_0_7px_#38bdf8]" /><span className="h-1.5 w-3 bg-purple-400 rounded-full shadow-[0_0_6px_#c084fc]" />
                  </div>
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
                    <span className="h-1.5 w-3 bg-cyan-400 rounded-full shadow-[0_0_7px_#22d3ee]" /><span className="h-1.5 w-3 bg-purple-400 rounded-full shadow-[0_0_6px_#c084fc]" /><span className="h-1.5 w-3 bg-cyan-400 rounded-full shadow-[0_0_7px_#22d3ee]" /><span className="h-1.5 w-3 bg-purple-400 rounded-full shadow-[0_0_6px_#c084fc]" />
                  </div>
                  <div className="absolute inset-1.5 rounded-xl border border-purple-500/20 pointer-events-none" />
                  <svg className="w-8 h-8 text-purple-300 drop-shadow-[0_0_10px_rgba(216,180,254,0.9)] mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" /></svg>
                  <span className="text-3xl font-black tracking-wider text-white drop-shadow-[0_0_14px_rgba(255,255,255,0.8)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>AI</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
