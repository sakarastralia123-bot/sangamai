import { useState } from 'react';
import { Link } from 'react-router-dom';
import CinematicHero from '../components/CinematicHero';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import SectionHeading from '../components/SectionHeading';
import {
  STATS, TICKER_ITEMS, AI_EMPLOYEES, INDUSTRIES,
  PRICING, INTEGRATIONS, TESTIMONIALS, FAQS,
} from '../data/content';

const COLOR_MAP = {
  violet: 'from-violet-500/25 to-fuchsia-500/10 border-violet-500/30 text-violet-300',
  cyan: 'from-cyan-500/25 to-sky-500/10 border-cyan-500/30 text-cyan-300',
  orange: 'from-orange-500/25 to-amber-500/10 border-orange-500/30 text-orange-300',
  emerald: 'from-emerald-500/25 to-teal-500/10 border-emerald-500/30 text-emerald-300',
  amber: 'from-amber-500/25 to-yellow-500/10 border-amber-500/30 text-amber-300',
};

function Ticker() {
  const row = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="relative overflow-hidden border-y border-white/5 bg-white/[0.015] py-3">
      <div className="flex w-max animate-[ticker_36s_linear_infinite] gap-10 whitespace-nowrap" style={{ animationName: 'ticker' }}>
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-2 text-[13px] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {t}
          </span>
        ))}
      </div>
      <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

/* ── PAGE ────────────────────────────────────────────────────── */
export default function Landing() {
  const [billing, setBilling] = useState('yearly');
  const [faqOpen, setFaqOpen] = useState(0);
  const [demoSent, setDemoSent] = useState(false);
  const [contactSent, setContactSent] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#050505] text-slate-200">
      <Navbar />

      {/* ═══ HERO — cinematic scroll-linked 300-frame experience ═══ */}
      <CinematicHero />

      {/* trust + stats strip right under the cinema */}
      <section className="relative border-b border-white/5 bg-[#050505] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[12px] font-medium text-slate-300 backdrop-blur">
                <span className="flex -space-x-2">
                  {['AS', 'RT', 'PM'].map((x) => (
                    <span key={x} className="flex h-5 w-5 items-center justify-center rounded-full border border-black bg-gradient-to-br from-violet-500 to-cyan-500 text-[8px] font-bold text-white">{x}</span>
                  ))}
                </span>
                Trusted by 480+ Nepali businesses
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[12px] font-semibold text-amber-300">
                ★ 4.9/5 from 212 reviews
              </span>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur">
                  <div className="font-display text-xl font-bold text-white">{s.value}</div>
                  <div className="mt-0.5 text-[12px] font-medium text-slate-300">{s.label}</div>
                  <div className="text-[11px] text-slate-500">{s.sub}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <Ticker />

      {/* ═══ 12 AI EMPLOYEES ═══ */}
      <section id="employees" className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <SectionHeading
          eyebrow="The team you hire tonight"
          title={<>12 AI employees. Zero salary, zero sick leave, <span className="bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent">zero missed customers.</span></>}
          sub="Pick one to start — most businesses begin with Receptionist + Booking, then add Closers as revenue grows. Each comes pre-trained on Nepali business conversations."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {AI_EMPLOYEES.map((e, i) => (
            <Reveal key={e.id} delay={(i % 4) * 80}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-[#121218]/80 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/40 hover:shadow-[0_16px_50px_rgba(139,92,246,0.25)]">
                <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${e.color === 'cyan' ? 'via-cyan-400' : e.color === 'orange' ? 'via-orange-400' : e.color === 'emerald' ? 'via-emerald-400' : e.color === 'amber' ? 'via-amber-400' : 'via-violet-400'} to-transparent opacity-60`} />
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-gradient-to-br ${COLOR_MAP[e.color]}`}>
                  <span className="material-symbols-outlined text-[22px]">{e.icon}</span>
                </div>
                <h3 className="mt-4 font-display text-[16px] font-bold text-white">{e.name}</h3>
                <p className="text-[12px] font-medium text-cyan-300/90">{e.tag}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{e.desc}</p>
                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="font-mono text-[11.5px] font-semibold text-emerald-300">{e.metric}</span>
                  <span className="text-[11px] text-slate-500">{e.channels.join(' · ')}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10 text-center">
          <p className="text-sm text-slate-400">Not sure where to start? <a href="#demo" className="font-semibold text-cyan-300 underline underline-offset-4 hover:text-cyan-200">Get a free AI staffing plan →</a> we audit your missed messages and recommend 2–3 employees.</p>
        </Reveal>
      </section>

      {/* ═══ HOW IT WORKS + AI BRAIN ═══ */}
      <section id="how" className="relative border-y border-white/5 bg-[#08080c] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="From chaos to autopilot in 48 hours"
            title="Live in 3 steps. No developers needed."
            sub="White-glove onboarding: we connect your channels, train AI on your menu / price list / FAQs, and test in Nepali + English with you watching."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              { n: '01', t: 'Connect your channels', d: 'WhatsApp number, Instagram page, Gmail, calendar, eSewa/Khalti. OAuth in minutes — keep your existing accounts.', icon: 'hub' },
              { n: '02', t: 'Train on your business', d: 'Upload menus, rates, FAQs, policies. RAG grounds every answer in YOUR truth — AI never hallucinates prices.', icon: 'school' },
              { n: '03', t: 'Go live + watch revenue', d: 'AI answers in <8s, books, reminds, collects. You approve handoffs and read the 7 AM brief. That’s it.', icon: 'rocket_launch' },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <div className="relative h-full rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                  <span className="font-display text-5xl font-extrabold text-white/10">{s.n}</span>
                  <span className="material-symbols-outlined mt-2 block text-[28px] text-violet-300">{s.icon}</span>
                  <h3 className="mt-3 font-display text-lg font-bold text-white">{s.t}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-slate-400">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* AI brain */}
          <div className="mt-14 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <Reveal>
              <div className="card-glass h-full p-7">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-300">🧠 The brain — AI layer</span>
                <h3 className="mt-3 font-display text-2xl font-bold text-white">Orchestrated, grounded, obedient.</h3>
                <ul className="mt-5 space-y-3.5">
                  {[
                    ['neurology', 'LLM Orchestrator', 'GPT-4 · Claude · Gemini routed per task — fast model for FAQs, smart model for objections.'],
                    ['translate', 'Nepali NLP pipeline', 'Devanagari + Roman + code-mixed. “hajur, appointment milcha?” just works.'],
                    ['database', 'RAG knowledge base', 'Your price lists, policies, SOPs. Every answer cites YOUR source.'],
                    ['build', 'Tool calling', 'Books slots, creates CRM contacts, sends payment links, triggers reminders.'],
                    ['handshake', 'Human handoff', 'Anger / VIP / confusion → human in <30s with transcript + suggested reply.'],
                  ].map(([icon, t, d]) => (
                    <li key={t} className="flex gap-3">
                      <span className="material-symbols-outlined mt-0.5 text-[20px] text-cyan-300">{icon}</span>
                      <div><div className="text-sm font-semibold text-white">{t}</div><div className="text-[13px] text-slate-400">{d}</div></div>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="card-glass h-full p-7">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">🙌 The hands — integration layer</span>
                <h3 className="mt-3 font-display text-2xl font-bold text-white">Where your customers already are.</h3>
                <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {INTEGRATIONS.map((g) => (
                    <div key={g.name} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-3">
                      <span className="material-symbols-outlined text-[20px] text-slate-300">{g.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[13px] font-semibold text-white">{g.name}
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">{g.status}</span>
                        </div>
                        <div className="truncate text-[11.5px] text-slate-500">{g.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3.5 text-[12.5px] text-slate-400">
                  + Webhooks & API on Scale — push bookings to your HIS, POS or custom CRM.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ INDUSTRIES ═══ */}
      <section id="industries" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <SectionHeading
          eyebrow="Built for your street, not Silicon Valley"
          title="6 industries. One shared pain: the phone that never stops."
          sub="Identity psychology: each playbook mirrors how YOUR customers actually talk — festival rushes, load-shedding reschedules, Roman-Nepali haggling."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((ind, i) => (
            <Reveal key={ind.name} delay={(i % 3) * 90}>
              <div className="group h-full rounded-2xl border border-white/10 bg-[#101016] p-6 transition hover:border-orange-500/30">
                <span className="material-symbols-outlined text-[30px] text-orange-300">{ind.icon}</span>
                <h3 className="mt-3 font-display text-lg font-bold text-white">{ind.name}</h3>
                <p className="mt-2 text-[13px] italic leading-relaxed text-rose-300/80">“{ind.pain}”</p>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{ind.fix}</p>
                <div className="mt-4 inline-block rounded-full bg-emerald-500/10 px-3 py-1 font-mono text-[11.5px] font-semibold text-emerald-300">{ind.result}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ PRICING — anchoring + loss aversion ═══ */}
      <section id="pricing" className="relative border-y border-white/5 bg-[#08080c] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Pricing that pays for itself"
            title={<>One recovered customer covers <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">the whole month.</span></>}
            sub="A single missed root-canal (Rs. 15,000) costs more than Growth. Cancel anytime. 14-day money-back guarantee — if AI doesn't book, you don't pay."
          />
          <Reveal className="mt-8 flex justify-center">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 text-sm">
              {['monthly', 'yearly'].map((m) => (
                <button
                  key={m}
                  onClick={() => setBilling(m)}
                  className={`rounded-full px-5 py-2 font-medium capitalize transition ${billing === m ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}
                >
                  {m}{m === 'yearly' && ' · −23%'}
                </button>
              ))}
            </div>
          </Reveal>
          <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-3">
            {PRICING.map((p, i) => {
              const price = billing === 'monthly' ? p.monthly : p.yearly;
              return (
                <Reveal key={p.name} delay={i * 100} className="h-full">
                  <div className={`relative flex h-full flex-col rounded-2xl p-7 ${p.highlight ? 'border-2 border-violet-500/60 bg-gradient-to-b from-violet-600/15 to-[#121218] shadow-[0_20px_70px_rgba(139,92,246,0.35)]' : 'border border-white/10 bg-[#101016]'}`}>
                    {p.badge && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-1 text-[11px] font-bold text-white shadow-lg">
                        {p.badge}
                      </span>
                    )}
                    <h3 className="font-display text-xl font-bold text-white">{p.name}</h3>
                    <p className="mt-1 text-[13px] text-slate-400">{p.tagline}</p>
                    <div className="mt-5 flex items-end gap-1.5">
                      <span className="text-sm text-slate-400">{p.currency}</span>
                      <span className="font-display text-4xl font-extrabold text-white">{price.toLocaleString('en-IN')}</span>
                      <span className="pb-1 text-[12px] text-slate-500">/ mo{billing === 'yearly' ? ', billed yearly' : ''}</span>
                    </div>
                    <Link to="/register" className={`${p.highlight ? 'btn-primary shimmer-btn' : 'btn-secondary'} mt-6 w-full`}>{p.cta}</Link>
                    <ul className="mt-6 space-y-2.5 text-[13px]">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-2.5 text-slate-300"><span className="text-emerald-400">✓</span> {f}</li>
                      ))}
                      {p.notIncluded.map((f) => (
                        <li key={f} className="flex gap-2.5 text-slate-600"><span>✕</span> {f}</li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <Reveal className="mt-8 text-center text-[13px] text-slate-500">
            All plans: Nepali + English · human handoff · cancel anytime · VAT invoice available · eSewa / Khalti / bank transfer accepted
          </Reveal>
        </div>
      </section>

      {/* ═══ TESTIMONIALS — social proof ═══ */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <SectionHeading eyebrow="Loved across the valley" title="Businesses like yours already stopped missing customers." />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <figure className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#101016] p-6">
                <div className="flex gap-1 text-amber-300">{'★★★★★'}</div>
                <blockquote className="mt-3 flex-1 text-[14px] leading-relaxed text-slate-300">“{t.quote}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-white/5 pt-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-[12px] font-bold text-white">{t.initials}</span>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-[12px] text-slate-500">{t.role}</div>
                  </div>
                  <span className="ml-auto rounded-full bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-300">{t.metric}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ DEMO + CONTACT ═══ */}
      <section id="demo" className="relative border-t border-white/5 bg-[#08080c] py-24">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <div className="card-glass h-full p-7 sm:p-8">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300">🎯 Request demo — free staffing plan</span>
              <h3 className="mt-3 font-display text-2xl font-bold text-white">See YOUR missed revenue, calculated live.</h3>
              <p className="mt-2 text-[13.5px] text-slate-400">20-min call. We audit your WhatsApp/IG, show the rupees you’re losing monthly, and map your first 2 AI employees. No pitch-slapping — promise.</p>
              {demoSent ? (
                <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-200">
                  ✓ Request received! We reply in <strong>&lt; 4 working hours</strong> (Sun–Fri, 10–6 NPT). Check your inbox + WhatsApp.
                </div>
              ) : (
                <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); setDemoSent(true); }}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input required placeholder="Your name" className="input-field !pl-4" />
                    <input required placeholder="Business name" className="input-field !pl-4" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input required type="email" placeholder="Email" className="input-field !pl-4" />
                    <input required placeholder="WhatsApp (+977-…)" className="input-field !pl-4" />
                  </div>
                  <select className="input-field !pl-4 text-slate-300" defaultValue="Clinic / Hospital">
                    {['Clinic / Hospital', 'Restaurant / Café', 'Gym / Studio', 'School / Consultancy', 'Retail / Fashion', 'Real Estate', 'Other'].map((o) => <option key={o} className="bg-[#121218]">{o}</option>)}
                  </select>
                  <button className="btn-primary shimmer-btn w-full !py-3.5">Book my free demo →</button>
                  <p className="text-center text-[11.5px] text-slate-500">Join 120+ demos this month · no spam, ever</p>
                </form>
              )}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div id="contact" className="card-glass h-full p-7 sm:p-8">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">✉️ Contact — humans reply</span>
              <h3 className="mt-3 font-display text-2xl font-bold text-white">Talk to the Kathmandu team.</h3>
              <div className="mt-4 grid gap-2.5 text-[13px]">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"><span className="material-symbols-outlined text-cyan-300">mail</span> namaste@sangam.ai <span className="ml-auto text-slate-500">&lt; 4h reply</span></div>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"><span className="material-symbols-outlined text-emerald-300">chat</span> WhatsApp: +977-9800000000 <span className="ml-auto text-slate-500">Sun–Fri 10–6</span></div>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"><span className="material-symbols-outlined text-violet-300">location_on</span> Pulchowk, Lalitpur, Nepal</div>
              </div>
              {contactSent ? (
                <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-200">✓ Message sent. A human (yes, real) will reply shortly.</div>
              ) : (
                <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); setContactSent(true); }}>
                  <input required placeholder="Your email" type="email" className="input-field !pl-4" />
                  <textarea required rows={4} placeholder="How can we help? (e.g. missed calls after 7 PM…)" className="input-field !pl-4 resize-none" />
                  <button className="btn-secondary w-full !py-3.5">Send message</button>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ FAQ — objection busting ═══ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
        <SectionHeading eyebrow="Objections, answered" title="Fair questions. Straight answers." />
        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => {
            const open = faqOpen === i;
            return (
              <Reveal key={f.q} delay={i * 40}>
                <div className={`overflow-hidden rounded-2xl border transition ${open ? 'border-violet-500/40 bg-white/[0.03]' : 'border-white/10 bg-white/[0.015]'}`}>
                  <button onClick={() => setFaqOpen(open ? -1 : i)} className="flex w-full items-center gap-3 px-5 py-4 text-left">
                    <span className="flex-1 text-[14.5px] font-semibold text-white">{f.q}</span>
                    <span className={`material-symbols-outlined transition-transform ${open ? 'rotate-180 text-violet-300' : 'text-slate-500'}`}>expand_more</span>
                  </button>
                  {open && <p className="px-5 pb-5 text-[13.5px] leading-relaxed text-slate-400">{f.a}</p>}
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative overflow-hidden border-t border-white/5 py-24">
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_90deg,rgba(139,92,246,0.25),rgba(6,182,212,0.18),rgba(255,85,0,0.16),rgba(139,92,246,0.25))] blur-[110px]" />
        <Reveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-extrabold text-white sm:text-5xl text-balance">
            Tonight, someone will message you at <span className="bg-gradient-to-r from-orange-400 to-fuchsia-400 bg-clip-text text-transparent">11 PM.</span>
            <br />Will anyone answer?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[15px] text-slate-400">
            Your competitors’ AI already does. Hire yours tonight — wake up to bookings, not missed calls.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/register" className="btn-primary shimmer-btn !px-9 !py-4 text-base">Start free — live in 48h →</Link>
            <a href="#demo" className="btn-secondary !px-9 !py-4">Book a demo first</a>
          </div>
          <p className="mt-5 text-[12px] text-slate-500">14-day trial · No credit card · Cancel anytime · Rs. 0 risk</p>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
