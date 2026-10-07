import { useEffect, useRef } from 'react';

/**
 * Scroll-driven ambient orb — NOT a loop.
 * Lives absolutely behind its section; every pixel of motion comes from
 * the user's scroll position: the orb drifts, breathes and shifts hue
 * only while the page moves. Stop scrolling → the scene freezes.
 */
export default function ScrollOrb({ range = 140 }) {
  const wrapRef = useRef(null);
  const orbRef = useRef(null);
  const ringRef = useRef(null);
  const washRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const section = wrap.closest('section');
    if (!section) return;

    let raf = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const paint = (p) => {
      const mid = Math.sin(p * Math.PI); // 0 → 1 → 0 across the traverse
      if (orbRef.current) {
        orbRef.current.style.transform =
          `translate3d(-50%, calc(-50% + ${(0.5 - p) * range * 2}px), 0) scale(${1 + mid * 0.22})`;
        orbRef.current.style.opacity = String(0.55 + mid * 0.35);
      }
      if (ringRef.current) {
        ringRef.current.style.transform =
          `translate(-50%, -50%) rotate(${p * 140 - 70}deg)`;
        ringRef.current.style.opacity = String(0.25 + mid * 0.45);
      }
      if (washRef.current) {
        washRef.current.style.opacity = String(0.5 + mid * 0.5);
        washRef.current.style.transform =
          `translate3d(${(p - 0.5) * -80}px, ${(0.5 - p) * range}px, 0)`;
      }
    };

    const update = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 = section just entering from bottom, 1 = just leaving at top
      const p = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      paint(p);
    };

    const request = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    if (reduced) {
      paint(0.5);
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
  }, [range]);

  return (
    <div ref={wrapRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* ambient color wash (trust violet → safety cyan, scroll-shifted) */}
      <div
        ref={washRef}
        className="absolute left-1/2 top-1/3 h-[560px] w-[900px] -translate-x-1/2 rounded-full blur-[130px]"
        style={{
          background:
            'radial-gradient(ellipse at 35% 50%, rgba(139,92,246,0.20), transparent 60%), radial-gradient(ellipse at 65% 50%, rgba(6,182,212,0.14), transparent 60%)',
        }}
      />
      {/* the smart orb: bright core + halo */}
      <div ref={orbRef} className="absolute left-1/2 top-[8%] h-[420px] w-[420px]">
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
      {/* slow conic ring, rotated BY scroll */}
      <div
        ref={ringRef}
        className="absolute left-1/2 top-[8%] h-[560px] w-[560px] rounded-full blur-[46px]"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, rgba(139,92,246,0.35) 60deg, transparent 120deg, transparent 180deg, rgba(6,182,212,0.30) 240deg, transparent 300deg)',
          transform: 'translate(-50%, -50%)',
        }}
      />
      {/* faint grid for depth */}
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
