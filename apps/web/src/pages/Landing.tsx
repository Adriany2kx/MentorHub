import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Check } from "lucide-react";
import { listMentors, listPrograms } from "../lib/api";
import type { MentorListItem, Program } from "../lib/api";
import MentorCard from "../components/MentorCard";
import ProgramCard from "../components/ProgramCard";
import StarRating from "../components/StarRating";

const HERO_SIGNALS = [
  "Most people book their first session within 72 hours.",
  "Mentors are usually online in the evening local time.",
  "Small weekly sessions beat one-off advice every time.",
];

export default function Landing() {
  const [featuredMentors, setFeaturedMentors] = useState<MentorListItem[]>([]);
  const [featuredPrograms, setFeaturedPrograms] = useState<Program[]>([]);
  const [search, setSearch] = useState("");
  const [heroSignalIndex, setHeroSignalIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    listMentors({ limit: 4 })
      .then((d) => setFeaturedMentors(d.mentors))
      .catch(() => {});
    listPrograms({ limit: 3 })
      .then((d) => setFeaturedPrograms(d.programs))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const reveals = document.querySelectorAll(".wf-reveal:not(.is-visible)");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -60px 0px" }
    );
    reveals.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [featuredMentors, featuredPrograms]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHeroSignalIndex((current) => (current + 1) % HERO_SIGNALS.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/mentors${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""}`);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>

      {/* HERO */}
      <section style={{ background: "var(--color-hero-bg)", borderBottom: "1px solid rgba(255,255,255,0.08)", position: "relative", overflow: "hidden" }}>
        {/* Organic warm blob — Nature Distilled accent */}
        <div aria-hidden="true" className="wf-hero-drift" style={{
          position: "absolute", top: "-120px", right: "-80px",
          width: "480px", height: "480px",
          background: "rgba(105,168,154,0.2)",
          borderRadius: "60% 40% 70% 30% / 50% 60% 40% 50%",
          pointerEvents: "none",
        }} />
        <div aria-hidden="true" className="wf-hero-drift-alt" style={{
          position: "absolute", bottom: "-160px", left: "-120px",
          width: "460px", height: "460px",
          background: "rgba(201,110,74,0.24)",
          borderRadius: "58% 42% 35% 65% / 40% 35% 65% 60%",
          pointerEvents: "none",
        }} />
        <div className="wf-page py-24 lg:py-28 grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-10 lg:gap-12 items-end" style={{ position: "relative" }}>
          <div>
            <h1 className="hero-enter" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(40px, 5vw, 62px)", fontWeight: 450, color: "#FFFFFF", lineHeight: 1.08, letterSpacing: "-0.012em", maxWidth: 820, marginBottom: 20, animationDelay: "0ms" }}>
              Whatever you studied, your career deserves
              <em style={{ fontStyle: "italic", fontWeight: 420, color: "#A5B4FC", marginLeft: 8 }}>
                calm, expert guidance.
              </em>
            </h1>
            <p className="wf-text max-w-xl mb-9 hero-enter" style={{ color: "rgba(255,255,255,0.72)", fontSize: 17, lineHeight: 1.72, animationDelay: "80ms" }}>
              Connect with mentors across law, medicine, finance, education, tech, and beyond — people who've already walked your path.
              Practical guidance, structured programs, and momentum you can feel.
            </p>

            <div className="wf-glass-panel hero-enter p-4 sm:p-5 max-w-2xl" style={{ animationDelay: "160ms" }}>
              <div className="wf-live-signal" aria-live="polite">
                <span className="wf-live-dot" aria-hidden="true" />
                <span key={heroSignalIndex} className="wf-rotating-copy">
                  {HERO_SIGNALS[heroSignalIndex]}
                </span>
              </div>
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-4">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by skill, role or industry..."
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.14)",
                    border: "1px solid rgba(255,255,255,0.24)",
                    borderRadius: "var(--radius-sm)",
                    padding: "10px 14px",
                    fontSize: 16,
                    color: "#fff",
                    outline: "none",
                  }}
                  onFocus={e => (e.target.style.borderColor = "rgba(255,255,255,0.5)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.24)")}
                />
                <button type="submit" className="wf-btn wf-btn-primary wf-btn-mentor-glow" style={{ flexShrink: 0 }}>
                  Find a Mentor
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-2">
                <span className="wf-text-xs" style={{ color: "rgba(255,255,255,0.54)" }}>Try:</span>
                {["solicitor", "chartered accountant", "nursing", "marketing", "career change"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="wf-suggestion-pill"
                    onClick={() => navigate(`/mentors?search=${encodeURIComponent(s)}`)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="hero-enter" style={{ animationDelay: "240ms" }}>
            <div className="wf-glass-panel p-5 sm:p-6" style={{ color: "#fff" }}>
              <p className="wf-eyebrow mb-3" style={{ color: "rgba(255,255,255,0.68)", letterSpacing: "0.09em" }}>Momentum snapshot</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div style={{ border: "1px solid rgba(255,255,255,0.18)", borderRadius: 10, padding: "10px 12px", background: "rgba(255,255,255,0.08)" }}>
                  <p style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1 }}>4.9</p>
                  <p className="wf-text-xs" style={{ color: "rgba(255,255,255,0.72)" }}>avg mentor rating</p>
                </div>
                <div style={{ border: "1px solid rgba(255,255,255,0.18)", borderRadius: 10, padding: "10px 12px", background: "rgba(255,255,255,0.08)" }}>
                  <p style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1 }}>72h</p>
                  <p className="wf-text-xs" style={{ color: "rgba(255,255,255,0.72)" }}>typical first booking</p>
                </div>
              </div>
              <p className="wf-text-sm" style={{ color: "rgba(255,255,255,0.78)", lineHeight: 1.55 }}>
                For every graduate, in every field — with a tone that stays human, not corporate.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* TRUST SIGNALS */}
      <section style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}>
        <div className="wf-page py-6 wf-reveal">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {[
              "Every mentor vetted by hand",
              "Private & confidential sessions",
              "No minimum commitment",
            ].map((claim) => (
              <div key={claim} className="wf-trust-card flex items-center gap-2.5">
                <Check size={16} style={{ color: "var(--color-blue)", flexShrink: 0 }} aria-hidden="true" />
                <span className="wf-text-sm font-medium" style={{ color: "var(--color-ink)", lineHeight: 1.45 }}>{claim}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BROWSE BY FIELD */}
      <section style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div className="wf-page py-16 wf-reveal">
          <div className="mb-10">
            <p className="wf-eyebrow mb-2">Browse by field</p>
            <h2 style={{
              fontFamily: "var(--font-display), serif",
              fontSize: "clamp(28px, 3vw, 38px)",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              color: "var(--color-ink)",
              maxWidth: 540,
            }}>
              Find a mentor in your industry
            </h2>
            <p className="wf-text mt-3" style={{ color: "var(--color-ink-2)", maxWidth: 480 }}>
              Tap a field to browse mentors with direct experience in your area.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { icon: "⚖️", label: "Law & Legal",          description: "Solicitors, barristers, legal execs and in-house counsel", query: "law" },
              { icon: "🏥", label: "Healthcare",            description: "Doctors, nurses, allied health and NHS careers",            query: "healthcare" },
              { icon: "💰", label: "Finance & Accounting",  description: "Chartered accountancy, investment banking, financial planning", query: "finance" },
              { icon: "📚", label: "Education",             description: "Teaching, educational leadership and academia",             query: "education" },
              { icon: "📣", label: "Marketing & Comms",     description: "Brand strategy, PR, digital marketing and content",        query: "marketing" },
              { icon: "🏗️", label: "Engineering",           description: "Civil, mechanical, electrical and structural engineers",    query: "engineering" },
              { icon: "💻", label: "Tech & Software",       description: "Developers, data scientists, product and UX professionals", query: "technology" },
              { icon: "🏢", label: "Business & Strategy",   description: "Consulting, operations, entrepreneurship and management",  query: "business" },
              { icon: "🎨", label: "Creative & Design",     description: "Graphic design, architecture, fashion and arts careers",   query: "design" },
              { icon: "🌿", label: "Environment & Science", description: "Research, sustainability, ecology and STEM careers",       query: "science" },
            ].map((cat) => (
              <button
                key={cat.label}
                type="button"
                className="wf-trust-card text-left"
                style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 6 }}
                onClick={() => navigate(`/mentors?search=${encodeURIComponent(cat.query)}`)}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }} aria-hidden="true">{cat.icon}</span>
                <span className="wf-text-sm font-semibold" style={{ color: "var(--color-ink)", lineHeight: 1.3 }}>
                  {cat.label}
                </span>
                <span className="wf-text-xs" style={{ color: "var(--color-ink-3)", lineHeight: 1.4 }}>
                  {cat.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div className="wf-page py-20 wf-reveal">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-12 lg:gap-20 items-start">
            {/* Left: editorial display heading */}
            <div style={{ position: "sticky", top: 32 }}>
              <h2 style={{
                fontFamily: "var(--font-display), serif",
                fontSize: "clamp(30px, 3.5vw, 44px)",
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                color: "var(--color-ink)",
                marginBottom: 16,
              }}>
                Built around your growth
              </h2>
              <p className="wf-text" style={{ color: "var(--color-ink-2)", maxWidth: 320 }}>
                Everything you need to find the right mentor in your field and make real progress — whatever industry you're heading into.
              </p>
            </div>
            {/* Right: feature list — no cards, spacing creates grouping */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
              {[
                { title: "Verified Mentors", text: "Every mentor is reviewed and approved before joining the platform." },
                { title: "Flexible Scheduling", text: "Book sessions that fit your timezone and weekly rhythm." },
                { title: "Secure Payments", text: "Pay safely per session or per program. No hidden fees." },
                { title: "Goal Tracking", text: "Set milestones and track your growth alongside your mentor." },
              ].map((vp) => (
                <div key={vp.title} style={{ paddingTop: 20, borderTop: "1px solid var(--color-border)" }}>
                  <h3 className="wf-h3 mb-2">{vp.title}</h3>
                  <p className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>{vp.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}>
        <div className="wf-page py-16 wf-reveal">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 lg:gap-20 items-start">
            {/* Left: sticky heading */}
            <div style={{ position: "sticky", top: 32 }}>
              <h2 style={{
                fontFamily: "var(--font-display), serif",
                fontSize: "clamp(28px, 3vw, 40px)",
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                color: "var(--color-ink)",
                marginBottom: 12,
              }}>
                From search to progress
              </h2>
              <p className="wf-text" style={{ color: "var(--color-ink-2)", maxWidth: 280 }}>
                Four steps. No onboarding maze.
              </p>
            </div>
            {/* Right: stacked step rows — not a grid */}
            <div>
              {[
                { n: "1", title: "Find the right mentor", text: "Search by field, role, or skill — from accountancy to zoology. Filter by price and availability. Every profile includes real reviews from real mentees." },
                { n: "2", title: "Book a session or program", text: "A single 60-minute session to test the fit, or commit to a structured program with clear outcomes and milestones." },
                { n: "3", title: "Meet on your schedule", text: "Sessions happen where you prefer — video, audio, or async. Your mentor comes prepared." },
                { n: "4", title: "Track your growth", text: "Set goals, mark milestones, and review your progress over time. The work doesn't disappear after the session ends." },
              ].map((s, i, arr) => (
                <div
                  key={s.n}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "52px 1fr",
                    columnGap: 28,
                    alignItems: "start",
                    paddingTop: i === 0 ? 4 : 28,
                    paddingBottom: 28,
                    borderBottom: i < arr.length - 1 ? "1px solid var(--color-border)" : "none",
                  }}
                >
                  <span style={{
                    fontFamily: "var(--font-display), serif",
                    fontSize: 48,
                    fontWeight: 300,
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                    color: "var(--color-blue)",
                    opacity: 0.38,
                    userSelect: "none",
                    marginTop: -4,
                  }}>
                    {s.n}
                  </span>
                  <div>
                    <h3 className="wf-h3 mb-1.5">{s.title}</h3>
                    <p className="wf-text-sm" style={{ color: "var(--color-ink-2)", lineHeight: 1.6 }}>{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED MENTORS */}
      {featuredMentors.length > 0 && (
        <section style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="wf-page py-16 wf-reveal">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="wf-h2">Meet our mentors</h2>
                <p className="wf-text-sm mt-1" style={{ color: "var(--color-ink-2)" }}>Experienced professionals across every field, ready to help you grow.</p>
              </div>
              <Link to="/mentors" className="wf-btn wf-btn-secondary">
                Browse all
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredMentors.map((mentor) => (
                <MentorCard key={mentor.id} mentor={mentor} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* POPULAR PROGRAMS */}
      {featuredPrograms.length > 0 && (
        <section style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}>
          <div className="wf-page py-12 wf-reveal">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="wf-h2">Popular programs</h2>
                <p className="wf-text-sm mt-1" style={{ color: "var(--color-ink-2)" }}>Structured paths with clear outcomes.</p>
              </div>
              <Link to="/programs" className="wf-btn wf-btn-secondary">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredPrograms.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      <section style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div className="wf-page py-20 wf-reveal">
          <h2 className="wf-h2 mb-12">What mentees say</h2>

          {/* Featured quote — large, editorial, no container */}
          <div style={{ marginBottom: 48, maxWidth: 700 }}>
            <StarRating value={5} readonly size="sm" />
            <p style={{
              fontFamily: "var(--font-display), serif",
              fontSize: "clamp(20px, 2.5vw, 26px)",
              lineHeight: 1.55,
              fontStyle: "italic",
              color: "var(--color-ink)",
              margin: "16px 0",
            }}>
              "Within two months I had a clear plan for my training pathway and an NHS role lined up. I didn't expect this level of practical support."
            </p>
            <p className="wf-text-sm">
              <span style={{ fontWeight: 600 }}>Amara O.</span>
              <span style={{ color: "var(--color-ink-3)" }}> — Newly Qualified Doctor</span>
            </p>
          </div>

          {/* Supporting quotes — two columns, rule dividers only */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { quote: "My mentor helped me navigate the SQE and negotiate my first training contract. Worth every session.", name: "James R.", role: "Trainee Solicitor" },
              { quote: "I finally understand the route into chartered accountancy. Having someone explain the ICAEW pathway from experience made all the difference.", name: "Priya N.", role: "Graduate Accountant" },
            ].map((t) => (
              <div key={t.name} style={{ paddingTop: 24, borderTop: "1px solid var(--color-border)" }}>
                <p className="wf-text" style={{ fontStyle: "italic", color: "var(--color-ink-2)", marginBottom: 12 }}>
                  "{t.quote}"
                </p>
                <p className="wf-text-sm">
                  <span style={{ fontWeight: 600 }}>{t.name}</span>
                  <span style={{ color: "var(--color-ink-3)" }}> — {t.role}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section style={{ background: "var(--color-hero-bg)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="wf-page py-24 text-center wf-reveal" style={{ position: "relative", overflow: "hidden" }}>
          <div aria-hidden="true" style={{ position: "absolute", top: "-90px", left: "50%", transform: "translateX(-50%)", width: 420, height: 240, background: "rgba(105,168,154,0.26)", borderRadius: 9999, pointerEvents: "none", filter: "blur(36px)" }} />
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 500, color: "#fff", letterSpacing: "-0.015em", marginBottom: 12, position: "relative" }}>
            Start your journey today
          </h2>
          <p className="wf-text mb-8 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
            Join graduates from every field growing with MentorHub. Sign up free — no card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="wf-btn wf-btn-primary">
              Get started free
            </Link>
            <Link
              to="/mentors"
              className="wf-btn"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
              }}
            >
              Browse mentors
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "var(--color-surface)", borderTop: "1px solid var(--color-border)" }}>
        <div className="wf-page py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            <div>
              <p className="wf-eyebrow mb-4">Platform</p>
              <ul className="space-y-2">
                <li><Link to="/mentors" className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>Find Mentors</Link></li>
                <li><Link to="/programs" className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>Programs</Link></li>
                <li><Link to="/register" className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>Become a Mentor</Link></li>
              </ul>
            </div>
            <div>
              <p className="wf-eyebrow mb-4">Resources</p>
              <ul className="space-y-2">
                <li><Link to="/resources" className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>Resource Library</Link></li>
                <li><Link to="/goals" className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>Goal Tracker</Link></li>
              </ul>
            </div>
            <div>
              <p className="wf-eyebrow mb-4">Account</p>
              <ul className="space-y-2">
                <li><Link to="/login" className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>Log In</Link></li>
                <li><Link to="/register" className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>Sign Up</Link></li>
                <li><Link to="/forgot-password" className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>Reset Password</Link></li>
              </ul>
            </div>
            <div>
              <p className="wf-eyebrow mb-4">Company</p>
              <ul className="space-y-2">
                <li><Link to="/about" className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>About</Link></li>
                <li><Link to="/privacy" className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>Privacy</Link></li>
                <li><Link to="/terms" className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>Terms</Link></li>
              </ul>
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-blue)" }}>MentorHub</span>
            <span className="wf-text-xs">&copy; {new Date().getFullYear()} MentorHub. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
