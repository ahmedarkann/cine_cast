import React, { useEffect, useRef, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { Film, Users, Award, Star, History, Target, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const gradient = "linear-gradient(135deg, #ef4136, #fbb040)";

const TIMELINE_DATA = [
  {
    year: "2025",
    projects: [
      { title: "Vojna s mlkomi", type: "Feature Film" },
      { title: "Dreamteam", type: "TV Series" },
      { title: "Štúr", type: "Historical Drama" },
      { title: "Psoty", type: "Feature Film" },
      { title: "Cowgirl", type: "Feature Film" },
      { title: "General Golian", type: "Documentary / Drama" },
      { title: "Horizonty", type: "Feature Film" },
      { title: "Reklamy / Commercials", type: "Chemistry, FCIO, DU KANST, Techniker Krankenkasse" },
    ]
  },
  {
    year: "2024",
    projects: [
      { title: "Neuer", type: "Crime / Thriller" },
    ]
  },
  {
    year: "2023",
    projects: [
      { title: "Ema a smrtihlav", type: "Historical Drama" },
    ]
  }
];

export default function AboutUs() {
  const { lang, t } = useLang();
  const [visibleItems, setVisibleItems] = useState([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleItems((prev) => [...new Set([...prev, entry.target.dataset.id])]);
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll("[data-animate]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const isVisible = (id) => visibleItems.includes(id);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-500/30">
      {/* ── HERO SECTION ── */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=2000&q=80" 
            className="w-full h-full object-cover opacity-40 grayscale"
            alt="Cinema background"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <span className="inline-block text-xs tracking-[0.4em] uppercase mb-4 text-red-500 font-bold">
            {lang === "sk" ? "O NÁS" : "ABOUT US"}
          </span>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-6 leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            {lang === "sk" ? "TVORÍME FILMOVÚ" : "SHAPING THE FILM"}<br />
            <span style={{ background: gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {lang === "sk" ? "BUDÚCNOSŤ" : "FUTURE"}
            </span>
          </h1>
          <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            {lang === "sk" 
              ? "Sme popredná castingová agentúra so sídlom v Bratislave, ktorá spája výnimočné talenty s tými najväčšími filmovými a reklamnými produkciami v regióne."
              : "We are a premier casting agency based in Bratislava, connecting exceptional talent with the region's largest film and commercial productions."}
          </p>
        </div>
      </section>

      {/* ── COMPANY INFO ── */}
      <section className="py-24 px-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div data-id="info-text" data-animate className={`transition-all duration-1000 transform ${isVisible('info-text') ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h2 className="text-4xl font-black uppercase mb-8" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            {lang === "sk" ? "Kto sme a čo robíme" : "Who we are & What we do"}
          </h2>
          <div className="space-y-6 text-white/60 leading-relaxed">
            <p>
              [Váš text sem: Tu môžete napísať o vzniku vašej agentúry. Napríklad: CineCast vznikol z vášne pre film a potreby priniesť na slovenský trh profesionálny a transparentný prístup k castingu komparzu a epizódnych postáv.]
            </p>
            <p>
              [Placeholder Info: Naším poslaním je zabezpečiť, aby každý projekt, na ktorom pracujeme, mal presne tie tváre, ktoré príbeh potrebuje. Či už ide o historickú drámu z druhej svetovej vojny alebo modernú reklamu pre nadnárodnú korporáciu, ku každému zadaniu pristupujeme s rovnakou precíznosťou.]
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4 text-white">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-5 h-5 text-red-500" /> Professionalism
              </div>
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-5 h-5 text-red-500" /> Reliability
              </div>
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-5 h-5 text-red-500" /> Diversity
              </div>
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-5 h-5 text-red-500" /> Passion
              </div>
            </div>
          </div>
        </div>
        <div data-id="info-img" data-animate className={`relative transition-all duration-1000 delay-300 transform ${isVisible('info-img') ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <div className="aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1000&q=80" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" 
              alt="On set"
            />
          </div>
          <div className="absolute -bottom-6 -right-6 bg-red-600 p-8 rounded-2xl hidden md:block">
            <History className="w-8 h-8 mb-2" />
            <div className="text-3xl font-black" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>50+</div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-bold">Projects Done</div>
          </div>
        </div>
      </section>

      {/* ── PROJECT TIMELINE ── */}
      <section className="py-24 px-6 bg-zinc-950/50 relative overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black uppercase mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              {lang === "sk" ? "HISTÓRIA PROJEKTOV" : "PROJECT HISTORY"}
            </h2>
            <p className="text-white/40 tracking-[0.2em] uppercase text-xs font-bold">Our journey through the years</p>
          </div>

          <div className="relative border-l-2 border-white/5 ml-4 md:ml-0">
            {TIMELINE_DATA.map((item, yearIndex) => (
              <div 
                key={item.year} 
                data-id={`year-${item.year}`} 
                data-animate 
                className={`mb-20 last:mb-0 relative pl-10 md:pl-20 transition-all duration-1000 transform ${isVisible(`year-${item.year}`) ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}
              >
                {/* Year Marker */}
                <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-black border-2 border-red-500 shadow-[0_0_15px_rgba(239,65,54,0.5)] z-10" />
                
                <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-6 mb-8">
                  <span className="text-5xl md:text-7xl font-black leading-none opacity-20" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    {item.year}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent hidden md:block" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {item.projects.map((project, i) => (
                    <div 
                      key={i} 
                      className="p-6 rounded-xl bg-white/[0.03] border border-white/5 hover:border-red-500/30 transition-all group"
                    >
                      <h4 className="text-xl font-bold mb-1 group-hover:text-red-400 transition-colors uppercase" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                        {project.title}
                      </h4>
                      <p className="text-xs text-white/30 tracking-widest uppercase font-medium">
                        {project.type}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION ── */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-2xl mx-auto">
          <h3 className="text-4xl md:text-5xl font-black uppercase mb-8 leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            {lang === "sk" ? "Staňte sa súčasťou nášho príbehu" : "Become part of our story"}
          </h3>
          <p className="text-white/50 mb-10 leading-relaxed">
            {lang === "sk"
              ? "Hľadáme nové tváre pre pripravované projekty v roku 2025. Registrácia je bezplatná a otvára dvere do sveta filmu."
              : "We are looking for new faces for upcoming projects in 2025. Registration is free and opens the door to the world of cinema."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-block px-10 py-4 font-bold text-xs tracking-[0.2em] uppercase transition-all hover:scale-105"
              style={{ background: gradient, borderRadius: 2 }}
            >
              {lang === "sk" ? "Registrovať sa" : "Register Now"}
            </Link>
            <Link
              to="/projects"
              className="inline-block px-10 py-4 font-bold text-xs tracking-[0.2em] uppercase border border-white/20 hover:border-white transition-all"
              style={{ borderRadius: 2 }}
            >
              {lang === "sk" ? "Aktuálne castingy" : "Current Castings"}
            </Link>
          </div>

        </div>
      </section>

      {/* Custom Styles for simple fade-in animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-up {
          animation: fadeInUp 0.8s ease forwards;
        }
      `}</style>
    </div>
  );
}