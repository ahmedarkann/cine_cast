import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useLang } from "@/hooks/useLang";
import { Menu } from "lucide-react";
import SkyToggle from "@/components/ui/sky-toggle";

const gradient = "linear-gradient(135deg, #ef4136, #fbb040)";

export default function Navbar() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [isAtTop, setIsAtTop] = useState(true);
  const location = useLocation();

  // Robust home page check that handles root variants
  const isHomePage = location.pathname === "/" || location.pathname === "";

  useEffect(() => {
    const handleScroll = () => {
      // Cross-browser scroll position detection
      const currentScroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      setIsAtTop(currentScroll < 50);
    };
    handleScroll(); // Run on mount to check current position
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Only be transparent if we are on the Home page AND at the top of the scroll
  const isTransparent = isHomePage && isAtTop;

  const linkClass = "text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-white/50 hover:text-zinc-900 dark:hover:text-white transition-all";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-500 ease-in-out ${
        isTransparent
          ? "bg-transparent py-10 backdrop-blur-none border-transparent"
          : "bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5 py-3 shadow-2xl"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo Section - Scales up when at top */}
        <Link
          to="/"
          className={`flex items-center transition-all duration-500 ease-in-out origin-left ${
            isTransparent ? "scale-150" : "scale-100"
          }`}
        >
          <div className="text-xl font-black tracking-tighter">
            <span style={{ background: gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>cine</span>
            <span className="text-zinc-900 dark:text-white">CAST</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-10">
          <Link to="/projects" className={linkClass}>
            {lang === "sk" ? "Projekty" : "Projects"}
          </Link>
          <Link to="/about" className={linkClass}>
            {lang === "sk" ? "O nás" : "About Us"}
          </Link>
          <Link to="/contact" className={linkClass}>
            {lang === "sk" ? "Kontakt" : "Contact"}
          </Link>
          
          <SkyToggle />

          <Link
            to={user ? "/profile" : "/login"}
            className="px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-600/20"
            style={{ background: gradient, borderRadius: 2 }}
          >
            {user ? (lang === "sk" ? "Môj Profil" : "Dashboard") : (lang === "sk" ? "Pridať sa" : "Join Now")}
          </Link>
        </div>

        {/* Mobile Menu Icon */}
        <button className="md:hidden text-zinc-500 dark:text-white/50 hover:text-zinc-900 dark:hover:text-white transition-colors p-2">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
}