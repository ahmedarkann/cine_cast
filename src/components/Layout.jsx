import React, { useState, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { get, post, setToken, clearToken, uploadFile } from "@/api/api";
import { useLang } from "@/hooks/useLang";
import { useTheme } from "next-themes";
import logoSrc from "@/assets/logo.svg";
import {
  Menu,
  X,
  User,
  LayoutDashboard,
  Calendar,
  Mail,
  Settings,
  LogOut,
  ChevronDown,
  Home,
  Film,
  Users,
  ShieldAlert,
  FileText,
  Sun,
  Moon,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Info,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import NotificationBell from "@/components/NotificationBell";
import SkyToggle from "@/components/ui/sky-toggle";
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const gradient = "linear-gradient(135deg, #ef4136, #fbb040)";

// Logo SVG matching the cineCAST brand
function CinecastLogo({ height = 52, className = "text-white" }) {
  return (
    <span
      className="font-black tracking-tighter select-none leading-none"
      style={{ fontSize: height * 0.65 }}
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
      <span className={className}>CAST</span>
    </span>
  );
}

export default function Layout() {
  const { lang, setLang, t } = useLang();
  const { user, logout } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    setScrolled(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = () => {
      const scrollPos = window.pageYOffset || window.scrollY || document.documentElement.scrollTop;
      setScrolled(scrollPos > 20);
    };
    handler();
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  const publicNavLinks = [
    { to: "/", label: t("nav", "home"), icon: Home },
    {
      to: "/projects",
      label: t("nav", "projects"),
      icon: Film,
    },
    {
      to: "/about",
      label: t("layout", "about_us"),
      icon: Info,
    },
    {
      to: "/contact",
      label: t("layout", "contact"),
      icon: Mail,
    },
  ];

  const authenticatedNavLinks = [
    {
      to: "/dashboard",
      label: t("nav", "dashboard"),
      icon: LayoutDashboard,
    },
    { to: "/profile", label: t("nav", "profile"), icon: User },
    {
      to: "/calendar",
      label: t("nav", "calendar"),
      icon: Calendar,
    },
    {
      to: "/projects",
      label: t("nav", "projects"),
      icon: Film,
    },
  ];

  if (user?.role === "admin") {
    // Admin specific links that control tabs in Admin.jsx via query params.
    // Ordered: manage people first, then content, then submissions on that
    // content, with the audit trail last as the least-frequented item.
    authenticatedNavLinks.push({
      to: "/admin?tab=users",
      label: t("layout", "users"),
      icon: Users,
    });
    authenticatedNavLinks.push({
      to: "/admin?tab=projects",
      label: t("layout", "admin_projects"),
      icon: Film,
    });
    authenticatedNavLinks.push({
      to: "/admin?tab=applications",
      label: t("layout", "applications"),
      icon: FileText,
    });
    authenticatedNavLinks.push({
      to: "/admin?tab=audit",
      label: t("layout", "audit_logs"),
      icon: ShieldAlert,
    });
  }

  // Helper to determine active state including query parameters
  const isLinkActive = (to) => {
    if (to.includes("?")) {
      return location.pathname + location.search === to;
    }
    return isActive(to);
  };

  // Check if we are on the landing page
  const isHomePage = location.pathname === "/";

  // Determine if the navbar should be transparent and large
  const isTransparentNavbar = isHomePage && !scrolled;

  const commonLayout = (
    <>
      {/* Scroll progress bar */}
      <div
        id="scrollProgress"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: 2,
          background: gradient,
          zIndex: 9999,
          width: "0%",
        }}
      />

      {/* ── NAVBAR ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between transition-all pr-4 ${user ? "md:pl-4 bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-white/10" : "px-12"}`}
        style={{
          paddingTop: isTransparentNavbar ? "16px" : "8px",
          paddingBottom: isTransparentNavbar ? "16px" : "8px",
          background: isTransparentNavbar
            ? "rgba(0,0,0,0.0)" // Transparent when on home page and not scrolled
            : (user // If user is logged in, use a semi-transparent background based on theme
              ? (theme === 'dark' ? "rgba(10,10,12,0.8)" : "rgba(255,255,255,0.8)")
              : "rgba(2,2,3,0.92)"), // Default dark semi-transparent for unauthenticated, scrolled/other pages
          backdropFilter: isTransparentNavbar ? "none" : "blur(20px) saturate(180%)",
          WebkitBackdropFilter: isTransparentNavbar ? "none" : "blur(20px) saturate(180%)",
          borderBottom: isTransparentNavbar
            ? "1px solid transparent" // Transparent border when on home page and not scrolled
            : "1px solid rgba(255,255,255,0.05)", // Default border for other pages/scrolled
          transition: "all 0.3s",
        }}
      >
        {/* Logo */}
        {user ? (
          <Link to="/dashboard" className="md:hidden shrink-0 pl-3">
            <CinecastLogo height={32} className="text-zinc-900 dark:text-white" />
          </Link>
        ) : (
          <Link to="/" className="shrink-0">
            <img
              src={logoSrc}
              alt="CineCast"
              loading="lazy"
              decoding="async"
              className={`w-auto transition-all duration-500 ease-in-out ${isTransparentNavbar ? 'h-14' : 'h-10'}`} />
          </Link>
        )}

        {/* Desktop nav links */}
        {user ? (
          <div className="hidden md:flex items-center gap-4">
            <SidebarTrigger className="text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white" />
            {/* <span className="text-xs font-bold uppercase tracking-widest text-white/20">Menu</span> */}
            <CinecastLogo height={42} className="text-zinc-900 dark:text-white" />
          </div>
        ) : (
          <ul className="hidden md:flex items-center gap-8">
            {publicNavLinks.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="relative text-[13px] font-medium tracking-[0.12em] uppercase transition-all"
                  style={{
                    color: isActive(l.to) ? "#fabb9c" : (resolvedTheme === "dark" ? "rgba(255,255,255,0.8)" : "rgba(24,24,27,0.7)"),
                    opacity: isActive(l.to) ? 1 : 0.8,
                  }}
                >
                  {l.label}
                  {isActive(l.to) && (
                    <span
                      className="absolute -bottom-1 left-0 right-0 h-px"
                      style={{ background: gradient }}
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {/* Lang */}
          <div className="flex items-center bg-zinc-100 dark:bg-white/[0.06] rounded-full p-0.5 border border-zinc-200 dark:border-white/[0.08]">
            {["sk", "en"].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`text-[10px] font-black tracking-[0.15em] uppercase px-3 py-1 rounded-full transition-all duration-200 ${lang !== l ? "text-zinc-400 dark:text-white/45" : ""}`}
                style={lang === l ? { background: gradient, color: "#fff" } : undefined}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {user && <NotificationBell />}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm transition-all bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10"
              >
                <User className="w-4 h-4" style={{ color: "#fabb9c" }} />
                <span className="max-w-[120px] truncate text-zinc-700 dark:text-white/80">
                  {user.full_name || user.email}
                </span>
                <ChevronDown className="w-3 h-3 text-white/40" />
              </button>
              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden shadow-2xl z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10"
                >
                  {[
                    {
                      to: "/profile",
                      icon: <User className="w-4 h-4" />,
                      label: t("nav", "profile"),
                    },
                    {
                      to: "/dashboard",
                      icon: <LayoutDashboard className="w-4 h-4" />,
                      label: t("nav", "dashboard"),
                    },
                    {
                      to: "/calendar",
                      icon: <Calendar className="w-4 h-4" />,
                      label: t("nav", "calendar"),
                    },
                    ...(user.role === "admin"
                      ? [
                          {
                            to: "/admin",
                            icon: <Settings className="w-4 h-4" />,
                            label: t("nav", "admin"),
                          },
                        ]
                      : []),
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 dark:text-white/70 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors shadow-sm dark:shadow-none"
                    >
                      {item.icon} {item.label}
                    </Link>
                  ))}
                  <div className="border-t border-zinc-200 dark:border-white/10" />
                  <button
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-red-500/10"
                    style={{ color: "#ef4136" }}
                  >
                    <LogOut className="w-4 h-4" />{" "}
                    {t("nav", "logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* <SkyToggle /> */}
              <Link
                to="/login"
                className="text-[13px] font-medium tracking-wider text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white transition-colors px-3 py-1.5"
              >
                {t("nav", "login")}
              </Link>
              <Link
                to="/register"
                className="text-[11px] font-semibold tracking-[0.15em] uppercase text-white px-5 py-2.5 rounded-sm transition-all hover:opacity-85 hover:-translate-y-0.5"
                style={{ background: gradient }}
              >
                {t("nav", "register")}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile nav toggle */}
        {user ? (
          <div className="md:hidden flex items-center gap-2">
            <NotificationBell />
            <SidebarTrigger className="w-9 h-9 text-zinc-700 dark:text-white/80 hover:text-zinc-900 dark:hover:text-white z-[1100]" />
          </div>
        ) : (
          <button
            className="md:hidden flex flex-col justify-center gap-1.5 w-9 h-9 p-1 z-[1100]"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? (
              <>
                <span className="block w-full h-0.5 bg-zinc-800 dark:bg-white origin-center rotate-45 translate-y-[8px] transition-all rounded" />
                <span className="block w-0 h-0.5 bg-zinc-800 dark:bg-white opacity-0 transition-all rounded" />
                <span className="block w-full h-0.5 bg-zinc-800 dark:bg-white origin-center -rotate-45 -translate-y-[8px] transition-all rounded" />
              </>
            ) : (
              <>
                <span className="block w-full h-0.5 bg-zinc-800 dark:bg-white transition-all rounded" />
                <span className="block w-full h-0.5 bg-zinc-800 dark:bg-white transition-all rounded" />
                <span className="block w-full h-0.5 bg-zinc-800 dark:bg-white transition-all rounded" />
              </>
            )}
          </button>
        )}
      </nav>
    </>
  );

  if (user) {
    return (
      <SidebarProvider defaultOpen={true}>
        <Sidebar
          className="bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-white/10"
          collapsible="icon"
        >
          <SidebarHeader className="hidden md:flex p-3 items-center justify-center border-b border-zinc-200 dark:border-white/5 mb-4">
            <CinecastLogo height={32} className="text-zinc-900 dark:text-white" />
          </SidebarHeader>
          <SidebarContent className="px-3 pt-4 md:pt-0">
            <SidebarMenu>
              {authenticatedNavLinks.map((l) => (
                <SidebarMenuButton
                  key={l.to}
                  asChild
                  isActive={isLinkActive(l.to)}
                  className="mb-1 py-6 px-4 rounded-xl transition-all text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white data-[active=true]:bg-red-50 dark:data-[active=true]:bg-red-600/20 data-[active=true]:text-red-600 dark:data-[active=true]:text-red-400"
                >
                  <Link to={l.to}>
                    {l.icon &&
                      React.createElement(l.icon, { className: "w-5 h-5 opacity-70" })}
                    <span className="font-semibold tracking-wide">
                      {l.label}
                    </span>
                  </Link>
                </SidebarMenuButton>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-zinc-200 dark:border-white/5">
            <SidebarMenu>
              {/* Theme Toggle */}
              {mounted && (
                <SidebarMenuButton
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="mb-1 py-6 px-4 rounded-xl transition-all text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white data-[active=true]:bg-red-50 dark:data-[active=true]:bg-red-600/20 data-[active=true]:text-red-600 dark:data-[active=true]:text-red-400"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5 opacity-70" /> : <Moon className="w-5 h-5 opacity-70" />}
                  <span className="font-semibold">
                    {theme === 'dark' ? t("layout", "theme_light_mode") : t("layout", "theme_dark_mode")}
                  </span>
                </SidebarMenuButton>
              )}

              <SidebarMenuButton
                onClick={() => logout()}
                className="text-red-500 hover:bg-red-500/10 hover:text-red-400 py-6 px-4 rounded-xl transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-semibold">
                  {t("nav", "logout")}
                </span>
              </SidebarMenuButton>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white relative transition-colors duration-300"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {commonLayout}
          <main className="flex-1 pt-24">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {commonLayout}

      {/* Mobile fullscreen menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[1050] flex flex-col items-center justify-center"
          style={{
            background: "rgba(2,2,3,0.96)",
            backdropFilter: "blur(32px)",
          }}
        >
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute top-8 right-8 p-2 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-9 h-9" />
          </button>
          <ul className="text-center space-y-3 mb-10">
            {[
              ...(user
                ? authenticatedNavLinks.map((l) => ({ ...l, label: l.label }))
                : publicNavLinks.map((l) => ({ ...l, label: l.label }))),
              // Profile link for authenticated users in mobile menu
              ...(user
                ? [
                    {
                      to: "/profile",
                      label: t("nav", "profile"),
                    },
                  ]
                : []),
              // Admin link is already pushed into authenticatedNavLinks
            ].map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  onClick={() => setMenuOpen(false)}
                  className="block font-black leading-none tracking-wide py-2 px-6 opacity-75 hover:opacity-100 transition-all hover:translate-x-2"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "clamp(40px, 10vw, 64px)",
                    color: "#fff",
                  }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div
            className="w-15 h-px mb-6"
            style={{ width: 60, background: gradient }}
          />

          <div className="flex gap-3 mb-8">
            {["sk", "en"].map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLang(l);
                  setMenuOpen(false);
                }}
                className="text-[11px] font-bold tracking-widest uppercase px-4 py-2 rounded-sm transition-all"
                style={
                  lang === l
                    ? {
                        background: gradient,
                        color: "#fff",
                        border: "1px solid transparent",
                      }
                    : {
                        background: "transparent",
                        color: "rgba(255,255,255,0.5)",
                        border: "1px solid rgba(255,255,255,0.2)",
                      }
                }
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {user ? (
            <button
              onClick={() => {
                logout();
                setMenuOpen(false);
              }}
              className="text-[12px] font-semibold tracking-widest uppercase px-10 py-4 rounded-sm"
              style={{ background: gradient, color: "#fff" }}
            >
              {t("nav", "logout")}
            </button>
          ) : (
            <Link
              to="/register"
              onClick={() => setMenuOpen(false)}
              className="text-[12px] font-semibold tracking-widest uppercase px-10 py-4 rounded-sm"
              style={{ background: gradient, color: "#fff" }}
            >
              {t("layout", "register_now")}
            </Link>
          )}
        </div>
      )}

      {/* Page content */}
      <div className={`${user ? "md:ml-[var(--sidebar-width)]" : location.pathname === "/projects" ? "pt-20" : ""}`}>
        <Outlet />
      </div>

      {/* ── FOOTER ── */}
      <footer className="relative overflow-hidden border-t py-16 bg-zinc-100 dark:bg-[rgba(2,2,3,0.97)] border-zinc-200 dark:border-white/5">
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(239,65,54,0.3), rgba(251,176,64,0.3), transparent)",
          }}
        />
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
            <div className="md:col-span-2 space-y-4">
              <CinecastLogo height={60} />
              <p className="text-zinc-600 dark:text-white/60 text-sm leading-relaxed max-w-sm">
                {t("layout", "footer_description")}
              </p>
              <div className="flex space-x-4 pt-4">
                <a href="https://www.facebook.com/cinecast.sk" target="_blank" rel="noreferrer" className="text-zinc-400 dark:text-white/50 hover:text-red-500 transition-colors"><Facebook className="w-5 h-5" /></a>
                <a href="https://www.instagram.com/cinecast_casting" target="_blank" rel="noreferrer" className="text-zinc-400 dark:text-white/50 hover:text-red-500 transition-colors"><Instagram className="w-5 h-5" /></a>
                <a href="#" className="text-zinc-400 dark:text-white/50 hover:text-red-500 transition-colors"><Twitter className="w-5 h-5" /></a>
                <a href="#" className="text-zinc-400 dark:text-white/50 hover:text-red-500 transition-colors"><Linkedin className="w-5 h-5" /></a>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: "#fabb9c" }}>
                {t("layout", "footer_company") || "Company"}
              </h3>
              <p className="text-zinc-700 dark:text-white/70 text-sm font-semibold mb-1">CINECAST s. r. o.</p>
              <p className="text-zinc-500 dark:text-white/40 text-xs leading-relaxed mb-4">
                Športová 99/11<br />
                900 44 Tomášov
              </p>
              <dl className="space-y-1 text-xs">
                {[["IČO","51916673"],["DIČ","2120831218"],["IČ DPH","SK2120831218"]].map(([k,v]) => (
                  <div key={k} className="flex gap-2">
                    <dt className="text-zinc-400 dark:text-white/25 w-14 shrink-0">{k}</dt>
                    <dd className="text-zinc-500 dark:text-white/40 font-mono">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: "#fabb9c" }}>
                {t("layout", "footer_navigation")}
              </h3>
              <ul className="space-y-2 text-sm">
                {[
                  { to: "/", label: t("nav", "home") },
                  {
                    to: "/projects",
                    label: t("nav", "projects"),
                  },
                  {
                    to: "/register",
                    label: t("nav", "register"),
                  },
                ].map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: "#fabb9c" }}>
                {t("layout", "footer_legal_support")}
              </h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/legal?tab=privacy" className="text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white transition-colors">{t("layout", "privacy_policy")}</Link></li>
                <li><Link to="/legal?tab=terms" className="text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white transition-colors">{t("layout", "terms_of_service")}</Link></li>
                <li><Link to="/legal?tab=cookies" className="text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white transition-colors">{t("layout", "cookie_policy")}</Link></li>
                <li><a href="mailto:support@cinecast.sk" className="text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white transition-colors">{t("layout", "support")}</a></li>
              </ul>
            </div>
          </div>
          <div
            className="border-t border-zinc-200 dark:border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <p className="text-xs text-zinc-400 dark:text-white/25">
              © {new Date().getFullYear()} cineCAST.{" "}
              {t("layout", "footer_rights")}
            </p>
            <p className="text-xs text-zinc-400 dark:text-white/20">registracia@cinecast.sk</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
