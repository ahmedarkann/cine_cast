import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { get } from "@/api/api";
import { useQuery } from "@tanstack/react-query";
import { ShaderAnimation } from "@/components/ui/shader-animation";
import { CircularTestimonials } from "@/components/ui/circular-testimonials";
import { useLang } from "@/hooks/useLang";
import { useAuth } from "@/lib/AuthContext";
import {
  MapPin,
  Users,
  ChevronRight,
  Mail,
  Phone,
  X,
  Film,
  Clapperboard,
  BookOpen,
  Gift,
} from "lucide-react";

import neuerImg from "@/assets/neuer.jpg";
import emaImg from "@/assets/ema.jpg";
import dreamTeamImg from "@/assets/dream-team.jpg";
import psotyImg from "@/assets/psoty.jpg";
import sturImg from "@/assets/stur.jpg";

import pubresLogo from "@/assets/logo-pubres.svg";
import dnaLogo from "@/assets/logo-dna.svg";
import rtvsLogo from "@/assets/logo-rtvs.svg";
import markizaLogo from "@/assets/logo-markiza.svg";
import jojLogo from "@/assets/logo-joj.svg";
import bontonfilmLogo from "@/assets/logo-bontonfilm.svg";
import continentalLogo from "@/assets/logo-continental.svg";
import wandalLogo from "@/assets/logo-wandal.svg";

const TYPE_LABELS = {
  movie: "Film",
  tv_series: "TV Series",
  commercial: "Commercial",
  documentary: "Documentary",
  music_video: "Music Video",
  other: "Other",
};

const PAST_PROJECTS = [
  {
    id: "past-1",
    name: "Neuer",
    year: "2024",
    director: "Michal Kollár",
    basedOn: "Václav Neuer (kniha)",
    screenplay: "Lukáš Sigmund, Michal Kollár",
    cinematography: "Ivan Finta",
    synopsis:
      "Chief Inspector Peter Ledecký (Marián Miezga) and his colleagues face the darkest sides of human nature every day. There is no room for heroism in their work - victories are quiet, accompanied by fatigue and frustration. They fight not only against murderers but also against a system where rules apply to only one side...",
    image: neuerImg,
  },
  {
    id: "past-2",
    name: "Ema a smrtihlav",
    year: "2023",
    director: "Iveta Grofova",
    basedOn: "Peter Krištúfek (book)",
    screenplay: "Peter Krištúfek, Iveta Grófová",
    cinematography: "Martin Strba",
    synopsis:
      "The story of Hungarian widow Marika, who hides a Jewish boy during World War II and the dramatic era of wartime Slovakia on the Slovak-Hungarian border near Bratislava. (PubRes)",
    image: emaImg,
  },
  {
    id: "past-3",
    name: "Dreamteam",
    year: "2025",
    director: "Jonáš Karásek",
    screenplay: "Peter Krištúfek",
    cinematography: "Martin Žiaran",
    synopsis:
      "Marek (Martin Hofmann) is an unsuccessful basketball coach whose handicapped son dreams of participating in the Paralympics in Rio. Unable to assemble a team of disabled athletes, Marek resorts to fraud and, under the influence of a slightly crazy neighbor (Jakub Prachař), engages healthy basketball players to fake disabilities.",
    image: dreamTeamImg,
  },
  {
    id: "past-4",
    name: "Psoty",
    year: "2025",
    director: "Kacper Lisowski",
    screenplay: "Kacper Lisowski",
    cast: "Aleksandra Zagrodzka, Małgorzata Socha, Borys Szyc, Andrzej Konopka",
    image: psotyImg,
  },
  {
    id: "past-5",
    name: "Štúr",
    year: "2025",
    director: "Mariana Čengel Solčanská",
    screenplay: "Mariana Čengel Solčanská",
    cinematography: "Peter Bencsík",
    cast: "Lukáš Pelč, Ivana Kološová, Richard Autner, Daniel Žulčák, František Kovár, Marko Igonda",
    synopsis:
      "Visiting her uncle in Zemianske Podhradie, Adela, the only daughter of a respected nobleman and owner of the estate in Ostrá Lúka, meets an extraordinary man. Scholar, philosopher, and poet Ľudovít Štúr rebels against social conditions in Hungary and, by pointing out political injustice, balances on the edge of the law. 20-year-old Adela falls passionately in love with him against common sense. She believes that if she manages to get him close to her, that proud and sarcastic man will begin to return her love. She provides him with a temporary home in her manor, pays him for private philosophy lessons, and uses her father's influence to get Štúr elected to the Hungarian Diet. Just when it seems that Adela's plan is starting to succeed, a revolution breaks out and Ľudovít is swept away by a vortex that will forever change Europe and their fate.",
    image: sturImg,
  },
];

const PARTNERS = [
  { name: "PubRes", logo: pubresLogo },
  { name: "DNA Production", logo: dnaLogo },
  { name: "RTVS", logo: rtvsLogo },
  { name: "TV Markíza", logo: markizaLogo },
  { name: "TV JOJ", logo: jojLogo },
  { name: "Bontonfilm", logo: bontonfilmLogo },
  { name: "Continental Film", logo: continentalLogo },
  { name: "Wandal Production", logo: wandalLogo },
];

// ── Animation variants ──────────────────────────────────────────────────────
const expo = [0.16, 1, 0.3, 1];

const vFadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: expo } },
};

const vFadeLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: expo } },
};

const vFadeRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: expo } },
};

// Cinematic clip-wipe: image reveals left-to-right like a film cut
const vClipWipe = {
  hidden: { clipPath: "inset(0 100% 0 0 round 16px)" },
  visible: {
    clipPath: "inset(0 0% 0 0 round 16px)",
    transition: { duration: 0.95, ease: expo },
  },
};

const vStaggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const vStaggerItem = {
  hidden: { opacity: 0, y: 22, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: expo } },
};

const vRailLine = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 1.1, ease: expo, delay: 0.15 } },
};

const vStepStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.35 } },
};

const vStepItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: expo } },
};

// ── Reveal wrapper ──────────────────────────────────────────────────────────
function Reveal({ children, variants = vFadeUp, className, delay = 0, once = true, margin = "-80px" }) {
  const reduced = useReducedMotion();
  const v = reduced
    ? { hidden: {}, visible: {} }
    : delay
    ? { ...variants, visible: { ...variants.visible, transition: { ...variants.visible.transition, delay } } }
    : variants;
  return (
    <motion.div
      className={className}
      initial={reduced ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once, margin }}
      variants={v}
    >
      {children}
    </motion.div>
  );
}

// ── Counter ─────────────────────────────────────────────────────────────────
function useCounter(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function StatCounter({ value, label }) {
  const ref = useRef(null);
  const [started, setStarted] = useState(false);
  const count = useCounter(value, 1800, started);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStarted(true); },
      { threshold: 0.4 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className="stat-item text-center px-8 py-6 border-r border-zinc-200 dark:border-white/[0.08] last:border-r-0"
    >
      <div
        className="stat-number text-7xl font-black leading-none"
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          background: "linear-gradient(135deg, #ef4136, #fbb040)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          filter: "drop-shadow(0 0 20px rgba(239,65,54,0.3))",
        }}
      >
        {count}+
      </div>
      <div className="text-xs tracking-widest uppercase text-zinc-500 dark:text-white/50 mt-2">
        {label}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const { t } = useLang();
  const { user } = useAuth();
  const reduced = useReducedMotion();
  const [selectedPastProject, setSelectedPastProject] = useState(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactStatus, setContactStatus] = useState(null);
  const [contactError, setContactError] = useState("");

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ["projects", "open", "home"],
    queryFn: () => get("/api/projects?status=open&sort=-created_at&limit=3"),
  });

  const { data: positions = [], isLoading: loadingPositions } = useQuery({
    queryKey: ["positions", "home"],
    queryFn: () => get("/api/positions?sort=-created_at&limit=50"),
  });

  const loading = loadingProjects || loadingPositions;

  const spotsForProject = (projectId) => {
    const pos = positions.filter((p) => p.project_id === projectId);
    const total = pos.reduce((a, b) => a + (b.spots_total || 0), 0);
    const filled = pos.reduce((a, b) => a + (b.spots_filled || 0), 0);
    return { total, available: Math.max(0, total - filled) };
  };

  const gradient = "linear-gradient(135deg, #ef4136, #fbb040)";

  async function handleContactSubmit(e) {
    e.preventDefault();
    if (!contactForm.message.trim()) return;
    setContactStatus("sending");
    setContactError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send");
      setContactStatus("ok");
      setContactForm({ name: "", email: "", message: "" });
    } catch (err) {
      setContactStatus("error");
      setContactError(err.message);
    }
  }

  return (
    <div className="bg-white dark:bg-black text-zinc-900 dark:text-white overflow-x-hidden">
      {/* ── GLOBAL PAGE BACKGROUND ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-white dark:bg-black">
        <div
          className="absolute inset-0 opacity-[0.15] hidden dark:block"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div
          className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] rounded-full blur-[120px] opacity-20"
          style={{ background: "radial-gradient(circle, #ef4136 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[100px] opacity-[0.15]"
          style={{ background: "radial-gradient(circle, #fbb040 0%, transparent 70%)" }}
        />
        <div className="absolute inset-0 bg-black/40 dark:block hidden" />
      </div>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <ShaderAnimation />
        </div>
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-1 opacity-40"
          style={{
            background: "repeating-linear-gradient(90deg, #ef4136 0, #ef4136 20px, transparent 20px, transparent 30px)",
          }}
        />

        {/* Hero content — staggered mount animation (not scroll-triggered, always above fold) */}
        <motion.div
          className="relative z-10 text-center px-6 max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.18, delayChildren: 0.1 } } }}
        >
          <motion.div
            className="inline-flex items-center gap-2.5 mb-5"
            variants={reduced ? {} : vFadeUp}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
            </span>
            <span className="text-xs tracking-[0.3em] uppercase" style={{ color: "#fabb9c" }}>
              {t("home", "hero_eyebrow")}
            </span>
          </motion.div>

          <motion.h1
            className="font-black leading-none mb-4"
            style={{ fontSize: "clamp(44px, 7.5vw, 90px)", lineHeight: 0.92, letterSpacing: "-0.03em" }}
            variants={reduced ? {} : vFadeUp}
          >
            <span
              style={{
                background: gradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              cine
            </span>
            CAST
            <br />
            <span style={{ fontSize: "0.55em", opacity: 0.85, whiteSpace: "pre-line" }}>
              {t("home", "hero_title_line2")}
            </span>
          </motion.h1>

          <motion.p
            className="text-sm text-white/60 max-w-xl mx-auto mb-7 leading-relaxed"
            variants={reduced ? {} : vFadeUp}
          >
            {t("home", "hero_subtitle")}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            variants={reduced ? {} : vFadeUp}
          >
            <Link
              to={user ? "/projects" : "/register"}
              className="inline-block font-semibold text-xs tracking-[0.2em] uppercase text-white transition-all hover:-translate-y-0.5"
              style={{ background: gradient, padding: "16px 40px", borderRadius: 2, boxShadow: "0 8px 32px rgba(239,65,54,0.3)" }}
            >
              {user ? t("home", "cta_our_projects") : t("home", "cta_register_long")}
            </Link>
            <Link
              to="/projects"
              className="inline-block font-medium text-xs tracking-[0.2em] uppercase text-white border border-white/30 hover:border-[#fabb9c] hover:text-[#fabb9c] transition-all hover:-translate-y-0.5"
              style={{ padding: "16px 40px", borderRadius: 2 }}
            >
              {t("home", "cta_our_projects")}
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-9 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1.2, duration: 0.8, ease: expo }}
        >
          <div className="w-px h-12" style={{ background: "linear-gradient(180deg, #fabb9c, transparent)" }} />
          <span className="text-[10px] tracking-[0.2em] uppercase text-white/40">
            {t("home", "scroll_hint")}
          </span>
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section className="relative overflow-hidden border-t border-b bg-zinc-100 dark:bg-[rgba(10,10,12,0.8)] border-red-500/10 backdrop-blur-[16px]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3">
            <StatCounter value={5000} label={t("home", "stats_actors")} />
            <StatCounter value={50} label={t("home", "stats_productions")} />
            <StatCounter value={15} label={t("home", "stats_years")} />
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className="py-16 md:py-28 px-6 relative overflow-hidden bg-zinc-100 dark:bg-zinc-950/40 backdrop-blur-sm border-t border-b border-zinc-200 dark:border-white/5">
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 select-none pointer-events-none text-white/[0.02] font-black"
          style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 220, whiteSpace: "nowrap" }}
        >
          cineCAST
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          {/* Left — fade in from left */}
          <Reveal variants={vFadeLeft} margin="-60px">
            <span className="block text-xs tracking-[0.3em] uppercase mb-4" style={{ color: "#fabb9c" }}>
              {t("home", "about_eyebrow")}
            </span>
            <h2
              className="text-5xl md:text-6xl font-black leading-none mb-6"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              {t("home", "about_title_pre")}
              <span
                style={{
                  background: gradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {t("home", "about_title_highlight")}
              </span>
              {t("home", "about_title_post")}
            </h2>
            <p className="text-zinc-600 dark:text-white/60 leading-relaxed text-[15px] mb-10">
              {t("home", "about_body")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr] gap-4">
              <div
                className="relative p-7 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-white/[0.03] overflow-hidden group hover:border-red-500/25 transition-all"
                style={{ backdropFilter: "blur(8px)" }}
              >
                <Clapperboard
                  className="absolute -right-4 -bottom-4 w-28 h-28 text-zinc-900/[0.04] dark:text-white/[0.03] group-hover:text-red-500/[0.06] transition-colors"
                  strokeWidth={1}
                />
                <div
                  className="text-3xl font-black mb-3"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    background: gradient,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  01
                </div>
                <div className="text-sm font-semibold mb-1.5 tracking-wide">
                  {t("home", "about_feature_1_title")}
                </div>
                <div className="text-[13px] text-zinc-500 dark:text-white/50 leading-relaxed">
                  {t("home", "about_feature_1_desc")}
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div
                  className="flex gap-4 items-start p-5 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-white/[0.025] hover:border-red-500/20 transition-all"
                  style={{ backdropFilter: "blur(8px)" }}
                >
                  <Users className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#fabb9c" }} />
                  <div>
                    <div className="text-sm font-semibold mb-1 tracking-wide">{t("home", "about_feature_2_title")}</div>
                    <div className="text-[13px] text-zinc-500 dark:text-white/50 leading-relaxed">{t("home", "about_feature_2_desc")}</div>
                  </div>
                </div>
                <div
                  className="flex gap-4 items-start p-5 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-white/[0.025] hover:border-red-500/20 transition-all"
                  style={{ backdropFilter: "blur(8px)" }}
                >
                  <Gift className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#fabb9c" }} />
                  <div>
                    <div className="text-sm font-semibold mb-1 tracking-wide">{t("home", "about_feature_3_title")}</div>
                    <div className="text-[13px] text-zinc-500 dark:text-white/50 leading-relaxed">{t("home", "about_feature_3_desc")}</div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Right — cinematic clip-wipe reveal */}
          <div className="relative hidden md:block">
            <div
              className="absolute top-0 right-0 w-0.5 h-28"
              style={{ background: "linear-gradient(180deg, #fbb040, transparent)" }}
            />
            <Reveal variants={vClipWipe} margin="-60px">
              <div
                className="rounded-2xl overflow-hidden aspect-[3/4] bg-zinc-900"
                style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)" }}
              >
                <img
                  src={sturImg}
                  alt="Štúr — cineCAST production"
                  className="w-full h-full object-cover"
                  style={{ filter: "grayscale(20%)" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div
                  className="absolute bottom-8 left-8 rounded-md p-4 text-white"
                  style={{ background: gradient }}
                >
                  <div className="text-5xl font-black leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>15</div>
                  <div className="text-xs tracking-widest uppercase opacity-90">{t("home", "about_years_label")}</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── PAST PROJECTS ── */}
      <section className="py-16 md:py-28 px-6 bg-zinc-50 dark:bg-black/50 relative">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <span className="block text-xs tracking-[0.3em] uppercase mb-4" style={{ color: "#fabb9c" }}>
              {t("home", "portfolio_eyebrow")}
            </span>
            <h2
              className="text-5xl md:text-6xl font-black leading-none mb-6"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              {t("home", "portfolio_title")}
            </h2>
          </Reveal>

          {/* Staggered card grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={reduced ? "visible" : "hidden"}
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={vStaggerContainer}
          >
            {PAST_PROJECTS.map((project, idx) => (
              <motion.button
                key={project.id}
                variants={reduced ? {} : vStaggerItem}
                onClick={() => setSelectedPastProject(project)}
                className={`group relative overflow-hidden rounded-2xl bg-zinc-900 cursor-pointer border border-white/5 hover:border-red-500/30 transition-all duration-500 w-full text-left ${
                  idx === 0 ? "lg:col-span-2 aspect-[3/4] lg:aspect-[16/10]" : "aspect-[3/4]"
                }`}
              >
                <img
                  src={project.image}
                  alt={project.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-zinc-800/80 backdrop-blur text-white/50 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-[0.2em] border border-white/10">
                    {t("home", "portfolio_done")}
                  </span>
                  <span className="bg-red-600/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10">
                    {project.year}
                  </span>
                </div>
                <div className="absolute bottom-6 left-6 right-6">
                  <h3
                    className={`font-black uppercase leading-none mb-2 ${idx === 0 ? "text-4xl lg:text-5xl" : "text-3xl"}`}
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-white/40 group-hover:text-[#fabb9c] transition-colors">
                    <Clapperboard className="w-3 h-3" />
                    {project.director}
                  </div>
                </div>
                <div className="absolute inset-0 bg-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.button>
            ))}

            {/* More coming soon */}
            <motion.div
              variants={reduced ? {} : vStaggerItem}
              className="lg:col-span-3 md:col-span-2 rounded-2xl border border-dashed border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 px-10 py-10 bg-white/[0.02] group hover:border-red-500/20 hover:bg-white/[0.04] transition-all"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(239,65,54,0.08)", border: "1px solid rgba(239,65,54,0.15)" }}>
                  <Film className="w-6 h-6 text-red-500/60 group-hover:text-red-500 transition-colors" />
                </div>
                <div>
                  <p className="text-lg font-black uppercase tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    {t("home", "portfolio_more")}
                  </p>
                  <p className="text-white/30 text-sm mt-0.5">New productions added regularly — check back soon.</p>
                </div>
              </div>
              <Link
                to="/projects"
                className="shrink-0 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-white/40 hover:text-white border border-white/10 hover:border-white/30 px-5 py-3 rounded-lg transition-all"
              >
                Browse open castings <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURED PROJECTS ── */}
      <section className="py-16 md:py-28 px-6 bg-zinc-100 dark:bg-zinc-950/40 backdrop-blur-sm border-t border-b border-zinc-200 dark:border-white/5 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-16 flex-wrap gap-4">
            <Reveal variants={vFadeLeft}>
              <span className="block text-xs tracking-[0.3em] uppercase mb-4" style={{ color: "#fabb9c" }}>
                {t("home", "projects_subtitle")}
              </span>
              <h2
                className="text-5xl md:text-6xl font-black leading-none"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                {t("home", "projects_title")}
              </h2>
            </Reveal>
            <Reveal variants={vFadeRight}>
              <Link to="/projects" className="flex items-center gap-2 text-sm font-semibold text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-colors">
                {t("home", "all_projects")} <ChevronRight className="w-4 h-4" />
              </Link>
            </Reveal>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-zinc-900 rounded-xl h-80 animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-20 text-white/30">
              <p className="text-lg">{t("home", "no_open_castings")}</p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-0.5"
              initial={reduced ? "visible" : "hidden"}
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
            >
              {projects.map((project) => {
                const { available, total } = spotsForProject(project.id);
                const isFull = available <= 0 && total > 0;
                return (
                  <motion.div
                    key={project.id}
                    variants={reduced ? {} : vStaggerItem}
                  >
                    <Link
                      to={`/projects/${project.id}`}
                      className="group relative aspect-[2/3] overflow-hidden block rounded-xl bg-zinc-900 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-500"
                    >
                      {project.image_url ? (
                        <img
                          src={project.image_url}
                          alt={project.name}
                          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-[1.06] group-hover:filter-none"
                          style={{ filter: "grayscale(30%)" }}
                        />
                      ) : (
                        <div
                          className="w-full h-full bg-gradient-to-b from-zinc-800 to-zinc-900 flex items-center justify-center text-white/20 font-black text-4xl"
                          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                          {TYPE_LABELS[project.type] || "Film"}
                        </div>
                      )}
                      <div
                        className="absolute inset-0 flex flex-col justify-end p-8"
                        style={{ background: "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.75) 65%, rgba(0,0,0,0.96) 100%)" }}
                      >
                        <span className="block text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: "#fabb9c" }}>
                          {TYPE_LABELS[project.type] || project.type}
                        </span>
                        <h3 className="text-3xl font-black leading-none mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                          {project.name}
                        </h3>
                        <p className="text-white/60 text-xs">
                          {project.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {project.location}
                            </span>
                          )}
                          {!isFull && total > 0 && (
                            <span className="text-green-400 mt-1 block">{available} {t("home", "spots_left")}</span>
                          )}
                          {isFull && <span className="text-red-400 mt-1 block">{t("home", "full")}</span>}
                        </p>
                      </div>
                      {isFull && (
                        <div
                          className="absolute top-4 right-4 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider"
                          style={{ background: "#ef4136" }}
                        >
                          {t("home", "full")}
                        </div>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 md:py-28 px-6 bg-white dark:bg-transparent relative z-10">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-20">
            <span className="block text-xs tracking-[0.3em] uppercase mb-4" style={{ color: "#fabb9c" }}>
              {t("home", "how_eyebrow")}
            </span>
            <h2
              className="text-5xl md:text-6xl font-black leading-none"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              {t("home", "how_title")}
            </h2>
          </Reveal>

          <div className="relative">
            {/* Rail line — draws left to right when section enters view */}
            <div className="hidden lg:block absolute top-[52px] left-0 right-0 h-px bg-white/[0.04] overflow-hidden">
              <motion.div
                className="absolute inset-0 origin-left"
                style={{ background: "linear-gradient(90deg, rgba(239,65,54,0.4), rgba(251,176,64,0.3))" }}
                initial={reduced ? { scaleX: 1 } : "hidden"}
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={vRailLine}
              />
            </div>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              initial={reduced ? "visible" : "hidden"}
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={vStepStagger}
            >
              {[
                { titleKey: "how_step1_title", bodyKey: "how_step1_body" },
                { titleKey: "how_step2_title", bodyKey: "how_step2_body" },
                { titleKey: "how_step3_title", bodyKey: "how_step3_body" },
                { titleKey: "how_step4_title", bodyKey: "how_step4_body" },
              ].map((step, i) => (
                <motion.div key={i} className="relative" variants={reduced ? {} : vStepItem}>
                  <div className="hidden lg:flex justify-center mb-6">
                    <div
                      className="relative w-[26px] h-[26px] rounded-[4px] flex items-center justify-center text-[11px] font-black z-10"
                      style={{
                        background: i === 0 ? gradient : "rgba(255,255,255,0.06)",
                        border: i === 0 ? "none" : "1px solid rgba(255,255,255,0.15)",
                        color: i === 0 ? "#fff" : "rgba(255,255,255,0.4)",
                        fontFamily: "'Bebas Neue', sans-serif",
                      }}
                    >
                      {i + 1}
                    </div>
                  </div>
                  <div
                    className="relative p-8 rounded-xl bg-white/[0.025] border border-white/[0.06] group hover:-translate-y-1 hover:bg-white/[0.05] hover:border-red-500/20 transition-all h-full"
                    style={{ backdropFilter: "blur(12px)" }}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500"
                      style={{ background: gradient }}
                    />
                    <span
                      className="lg:hidden block text-xs tracking-[0.2em] uppercase mb-3"
                      style={{ color: "#fabb9c" }}
                    >
                      {t("home", "how_step")} {i + 1}
                    </span>
                    <div className="text-2xl font-black mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      {t("home", step.titleKey)}
                    </div>
                    <p className="text-[13px] text-zinc-500 dark:text-white/55 leading-relaxed">
                      {t("home", step.bodyKey)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <Reveal delay={0.1} className="mt-16 text-center p-16 rounded-2xl border border-amber-200 dark:border-[rgba(251,176,64,0.12)] relative overflow-hidden bg-amber-50 dark:bg-[rgba(255,255,255,0.02)] backdrop-blur-[16px]">
            <div
              className="absolute top-0 left-1/4 right-1/4 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(251,176,64,0.4), transparent)" }}
            />
            <h3 className="text-4xl font-black mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              {t("home", "how_cta_title")}
            </h3>
            <p className="text-zinc-600 dark:text-white/60 mb-8 text-[15px]">{t("home", "how_cta_body")}</p>
            <Link
              to={user ? "/projects" : "/register"}
              className="inline-block font-semibold text-xs tracking-[0.2em] uppercase text-white transition-all hover:-translate-y-0.5"
              style={{ background: gradient, padding: "16px 48px", borderRadius: 2, boxShadow: "0 8px 32px rgba(239,65,54,0.3)" }}
            >
              {user ? t("home", "cta_our_projects") : t("home", "how_cta_button")}
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-14 px-6 relative overflow-hidden bg-zinc-50 dark:bg-transparent z-10">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-10">
            <span className="block text-xs tracking-[0.3em] uppercase mb-4" style={{ color: "#fabb9c" }}>
              {t("home", "testimonials_eyebrow")}
            </span>
            <h2
              className="text-5xl md:text-6xl font-black leading-none"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              {t("home", "testimonials_title")}
            </h2>
          </Reveal>
          <div>
            <CircularTestimonials
              testimonials={[
                { name: "Anna Kováčová", designation: t("home", "testimonial_1_role"), quote: t("home", "testimonial_1_quote"), src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80" },
                { name: "Peter Novák", designation: t("home", "testimonial_2_role"), quote: t("home", "testimonial_2_quote"), src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80" },
                { name: "Martin Baláž", designation: t("home", "testimonial_4_role"), quote: t("home", "testimonial_4_quote"), src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80" },
                { name: "Zuzana Tóthová", designation: t("home", "testimonial_5_role"), quote: t("home", "testimonial_5_quote"), src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=900&q=80" },
                { name: "Tomáš Varga", designation: t("home", "testimonial_6_role"), quote: t("home", "testimonial_6_quote"), src: "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=900&q=80" },
              ]}
              autoplay={true}
              colors={{ name: "#ffffff", designation: "rgba(255,255,255,0.5)", testimony: "rgba(255,255,255,0.85)", arrowBackground: "rgba(255,255,255,0.06)", arrowForeground: "#ffffff", arrowHoverBackground: "#ef4136" }}
              fontSizes={{ name: "1.5rem", designation: "0.95rem", quote: "1.15rem" }}
            />
          </div>
        </div>
      </section>

      {/* ── PARTNERS ── */}
      <section className="py-16 md:py-28 bg-zinc-100 dark:bg-transparent border-t border-zinc-200 dark:border-white/5 overflow-hidden relative z-10">
        <Reveal className="max-w-6xl mx-auto text-center mb-16 px-6">
          <span className="block text-xs tracking-[0.3em] uppercase mb-4" style={{ color: "#fabb9c" }}>
            {t("home", "partners_eyebrow")}
          </span>
          <h2
            className="text-5xl md:text-6xl font-black leading-none"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            {t("home", "partners_title")}
          </h2>
        </Reveal>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 w-32 md:w-64 bg-gradient-to-r from-zinc-100 dark:from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-32 md:w-64 bg-gradient-to-l from-zinc-100 dark:from-black to-transparent z-10 pointer-events-none" />
          <div className="flex w-max animate-infinite-scroll hover:[animation-play-state:paused]">
            {[1, 2].map((set) => (
              <div key={set} className="flex gap-12 pr-12 items-center">
                {PARTNERS.map((partner, i) => (
                  <div
                    key={`${set}-${i}`}
                    className="h-24 w-60 flex-none bg-zinc-100 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] rounded-2xl flex items-center justify-center p-6 transition-all duration-500 grayscale hover:grayscale-0 hover:bg-white/[0.05] hover:border-red-500/10 cursor-default group"
                  >
                    {partner.logo ? (
                      <img src={partner.logo} alt={partner.name} className="max-h-full max-w-full object-contain opacity-40 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <span className="text-white/10 text-xl font-black uppercase tracking-widest" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                        {partner.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes infinite-scroll {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .animate-infinite-scroll { animation: infinite-scroll 40s linear infinite; }
          @media (prefers-reduced-motion: reduce) {
            .animate-infinite-scroll { animation: none; }
          }
        `}</style>
      </section>

      {/* ── CONTACT ── */}
      <section className="py-16 md:py-28 px-6 bg-white dark:bg-transparent border-t border-zinc-200 dark:border-white/5 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          {/* Left — slide from left */}
          <Reveal variants={vFadeLeft}>
            <span className="block text-xs tracking-[0.3em] uppercase mb-4" style={{ color: "#fabb9c" }}>
              {t("home", "contact_eyebrow")}
            </span>
            <h2
              className="text-5xl md:text-6xl font-black leading-none mb-6"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              {t("home", "contact_title")}
            </h2>
            <p className="text-zinc-600 dark:text-white/60 leading-relaxed mb-10 text-[15px]">
              {t("home", "contact_body")}
            </p>
            <div className="space-y-6 text-zinc-700 dark:text-white/80">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-red-500" />
                <a href="mailto:registracia@cinecast.sk" className="hover:text-red-400 transition-colors">registracia@cinecast.sk</a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-red-500" />
                <a href="tel:+421911316022" className="hover:text-red-400 transition-colors">+421 911 316 022</a>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-red-500" /> Mýtna 28, 811 07 Bratislava
              </div>
            </div>
          </Reveal>

          {/* Right — fade up with a beat of delay */}
          <Reveal variants={vFadeUp} delay={0.15}>
            <div className="rounded-2xl p-12 border bg-white dark:bg-[rgba(255,255,255,0.03)] border-zinc-200 dark:border-[rgba(255,255,255,0.07)] backdrop-blur-[16px] shadow-xl dark:shadow-[0_32px_80px_rgba(0,0,0,0.4)]">
              <h3 className="text-4xl font-black mb-8" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                {t("home", "contact_form_title")}
              </h3>
              {contactStatus === "ok" ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: gradient }}>
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-black" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Message sent!</h4>
                  <p className="text-zinc-500 dark:text-white/50 text-sm">We'll get back to you as soon as possible.</p>
                  <button onClick={() => setContactStatus(null)} className="text-xs text-zinc-400 dark:text-white/30 hover:text-zinc-900 dark:hover:text-white underline underline-offset-2 transition-colors">
                    Send another
                  </button>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleContactSubmit}>
                  <div>
                    <label className="block text-xs tracking-[0.15em] uppercase text-zinc-500 dark:text-white/50 mb-2">{t("home", "contact_name")}</label>
                    <input
                      type="text"
                      placeholder={t("home", "contact_name_placeholder")}
                      value={contactForm.name}
                      onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-white/20 px-4 py-3.5 rounded-lg outline-none transition-all bg-zinc-100 dark:bg-white/[0.04] border border-zinc-300 dark:border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-red-500/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs tracking-[0.15em] uppercase text-zinc-500 dark:text-white/50 mb-2">Email</label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={contactForm.email}
                      onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-white/20 px-4 py-3.5 rounded-lg outline-none transition-all bg-zinc-100 dark:bg-white/[0.04] border border-zinc-300 dark:border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-red-500/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs tracking-[0.15em] uppercase text-zinc-500 dark:text-white/50 mb-2">{t("home", "contact_message")}</label>
                    <textarea
                      rows={4}
                      placeholder={t("home", "contact_message_placeholder")}
                      value={contactForm.message}
                      onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
                      required
                      className="w-full text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-white/20 px-4 py-3.5 rounded-lg outline-none transition-all resize-none bg-zinc-100 dark:bg-white/[0.04] border border-zinc-300 dark:border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-red-500/10"
                    />
                  </div>
                  {contactStatus === "error" && (
                    <p className="text-red-400 text-xs">{contactError || "Something went wrong. Please try again."}</p>
                  )}
                  <button
                    type="submit"
                    disabled={contactStatus === "sending" || !contactForm.message.trim()}
                    className="w-full font-semibold text-xs tracking-[0.2em] uppercase text-white py-4 rounded-sm transition-all hover:opacity-85 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
                    style={{ background: gradient }}
                  >
                    {contactStatus === "sending" ? "Sending…" : t("home", "contact_send")}
                  </button>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PAST PROJECT DETAIL MODAL ── */}
      {selectedPastProject && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-8">
          <motion.div
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            onClick={() => setSelectedPastProject(null)}
          />
          <motion.div
            className="relative bg-zinc-900 border border-white/10 w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col md:flex-row"
            initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: expo }}
          >
            <button
              onClick={() => setSelectedPastProject(null)}
              aria-label="Close"
              className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-full md:w-2/5 h-64 md:h-auto overflow-hidden">
              <img src={selectedPastProject.image} alt={selectedPastProject.name} className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 p-8 md:p-12 overflow-y-auto">
              <div className="mb-8">
                <span className="inline-block text-[10px] tracking-[0.3em] uppercase mb-3 px-2 py-1 rounded bg-white/5 text-white/40 border border-white/5">
                  {t("home", "portfolio_archive")}
                </span>
                <h2
                  className="text-5xl md:text-7xl font-black uppercase leading-none mb-4"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  {selectedPastProject.name}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 border-t border-b border-white/5 py-8">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">{t("home", "portfolio_year")}</p>
                  <p className="font-bold text-red-500">{selectedPastProject.year}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">{t("home", "portfolio_director")}</p>
                  <p className="font-bold">{selectedPastProject.director}</p>
                </div>
                {selectedPastProject.basedOn && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">{t("home", "portfolio_based_on")}</p>
                    <p className="font-bold flex items-center gap-1.5"><BookOpen className="w-3 h-3 opacity-50" /> {selectedPastProject.basedOn}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">{t("home", "portfolio_screenplay")}</p>
                  <p className="font-bold">{selectedPastProject.screenplay}</p>
                </div>
                {selectedPastProject.cinematography && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">{t("home", "portfolio_cinematography")}</p>
                    <p className="font-bold">{selectedPastProject.cinematography}</p>
                  </div>
                )}
                {selectedPastProject.cast && (
                  <div className="sm:col-span-2">
                    <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">{t("home", "portfolio_cast")}</p>
                    <p className="font-bold text-sm leading-relaxed">{selectedPastProject.cast}</p>
                  </div>
                )}
              </div>

              {selectedPastProject.synopsis && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-4" style={{ color: "#fabb9c" }}>
                    {t("home", "portfolio_synopsis")}
                  </h4>
                  <p className="text-white/60 leading-relaxed italic">{selectedPastProject.synopsis}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
