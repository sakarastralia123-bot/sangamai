import { useEffect, useRef } from 'react';

/**
 * Journey orb — one continuous ambience across every section.
 * Pose is a PURE function of page scroll (no loops, no timers):
 * the orb sinks as you descend, breathes and shifts hue with progress.
 * Stop scrolling → everything freezes. Multiple instances share the same
 * global phase, so it reads as one entity travelling down the page.
 */
export default function ScrollOrb({ range = 150, align = 'center', tone = 0 }) {
  const orbRef = useRef(null);
  const ringRef = useRef(null);
  const washRef = useRef(null);

  useEffect(() => {
    let raf = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const paint = (p) => {
      // descend with the page + gentle deterministic breathing (no time loop)
      const breathe = Math.sin(p * Math.PI * 3 + tone);
      if (orbRef.current) {
        orbRef.current.style.transform =
          `translate3d(0, ${(p - 0.35) * range}px, 0) scale(${1 + breathe * 0.1 + p * 0.08})`;
        orbRef.current.style.opacity = String(0.5 + 0.3 * Math.sin(p * Math.PI + tone));
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `rotate(${p * 220 + tone * 40}deg)`;
        ringRef.current.style.opacity = String(0.22 + 0.3 * Math.abs(breathe));
      }
      if (washRef.current) {
        washRef.current.style.opacity = String(0.45 + 0.35 * Math.sin(p * Math.PI * 2 + tone));
        washRef.current.style.transform = `translate3d(${(p - 0.5) * -60}px, ${(p - 0.35) * range * 0.6}px, 0)`;
      }
    };

    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      paint(p);
    };

    const request = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    if (reduced) {
      paint(0.4);
    } else {
      update();
      window.addEventListener('scroll', request, { passive: true });
      window.addEventListener('resize', request);
    }
    return () => {
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
      cancelAnimationFrame(raf);
    };
  }, [range, tone]);

  // negative-margin centering (transforms carry motion only — never layout)
  const pos =
    align === 'left'
      ? { left: '18%', marginLeft: -450, orbMl: -210, ringMl: -280 }
      : align === 'right'
        ? { left: '82%', marginLeft: -450, orbMl: -210, ringMl: -280 }
        : { left: '50%', marginLeft: -450, orbMl: -210, ringMl: -280 };

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        ref={washRef}
        className="absolute top-1/3 h-[560px] w-[900px] max-w-none rounded-full blur-[130px]"
        style={{ left: pos.left, marginLeft: pos.marginLeft }}
        style={{
          background:
            'radial-gradient(ellipse at 35% 50%, rgba(139,92,246,0.20), transparent 60%), radial-gradient(ellipse at 65% 50%, rgba(6,182,212,0.14), transparent 60%)',
        }}
      />
      <div ref={orbRef} className="absolute top-[10%] h-[420px] w-[420px]" style={{ left: pos.left, marginLeft: pos.orbMl }}>
        <div
          className="absolute inset-0 rounded-full blur-[70px]"
          style={{
            background:
              'radial-gradient(circle at 50% 42%, rgba(237,233,255,0.85) 0%, rgba(167,139,250,0.55) 22%, rgba(139,92,246,0.38) 42%, rgba(6,182,212,0.16) 65%, transparent 78%)',
          }}
        />
        <div
          className="absolute inset-[86px] rounded-full blur-[26px]"
          style={{
            background:
              'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.9), rgba(196,181,253,0.5) 55%, transparent 75%)',
          }}
        />
      </div>
      <div
        ref={ringRef}
        className="absolute top-[10%] h-[560px] w-[560px] rounded-full blur-[46px]"
        style={{
          left: pos.left,
          marginLeft: pos.ringMl,
          background:
            'conic-gradient(from 0deg, transparent 0deg, rgba(139,92,246,0.35) 60deg, transparent 120deg, transparent 180deg, rgba(6,182,212,0.30) 240deg, transparent 300deg)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.25) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 70% 55% at 50% 25%, black 20%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 25%, black 20%, transparent 70%)',
        }}
      />
    </div>
  );
}
