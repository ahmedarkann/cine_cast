import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { get, put } from '@/api/api';
import { useLang } from "@/hooks/useLang";
import { useAuth } from "@/lib/AuthContext";
import OnboardingModal, { useOnboarding } from "@/components/OnboardingModal";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  Film, Bell, BellOff, Calendar, CalendarOff, Clock, CheckCircle, XCircle,
  AlertCircle, MapPin, ChevronRight, Sparkles, Send, Inbox, Search, X, Loader2, UserCircle,
} from "lucide-react";

const STATUS_CONFIG = {
  pending:   { labelKey: "status_pending",   color: "text-yellow-500 bg-yellow-400/10 border-yellow-400/20", icon: Clock },
  accepted:  { labelKey: "status_accepted",  color: "text-green-500 bg-green-400/10 border-green-400/20",   icon: CheckCircle },
  rejected:  { labelKey: "status_rejected",  color: "text-red-400 bg-red-400/10 border-red-400/20",         icon: XCircle },
  waitlist:  { labelKey: "status_waitlist",  color: "text-blue-400 bg-blue-400/10 border-blue-400/20",      icon: AlertCircle },
  cancelled: { labelKey: "status_cancelled", color: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",      icon: XCircle },
};

function EmptyState({ icon: Icon, accent, text, hint, children }) {
  return (
    <div className="text-center py-16 px-6 flex flex-col items-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${accent}`}>
        <Icon className="w-7 h-7" />
      </div>
      <p className="text-zinc-700 dark:text-zinc-300 text-sm font-semibold">{text}</p>
      {hint && <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-1.5 max-w-xs">{hint}</p>}
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { t } = useLang();
  const { user } = useAuth();
  usePageMeta({ title: "My Dashboard" });
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [projects, setProjects]         = useState([]);
  const [positions, setPositions]       = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState("applied");
  const [appSearch, setAppSearch]       = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState("all");
  const [withdrawingId, setWithdrawingId] = useState(null);
  const { shouldShow: showOnboarding, dismiss: dismissOnboarding } = useOnboarding();
  const [nudgeDismissed, setNudgeDismissed] = useState(
    () => !!localStorage.getItem(`cinecast_nudge_${user?.id}`)
  );
  const dismissNudge = () => {
    localStorage.setItem(`cinecast_nudge_${user?.id}`, "1");
    setNudgeDismissed(true);
  };
  const completionFields = ['full_name', 'phone', 'city', 'birthdate', 'gender', 'bio', 'profile_image_url'];
  const completionPct = user
    ? Math.round(completionFields.filter(f => user[f]).length / completionFields.length * 100)
    : 100;
  const showNudge = !nudgeDismissed && completionPct < 100 && !showOnboarding;

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [apps, notifs] = await Promise.all([
          get(`/api/applications?user_id=${user.id}`),
          get(`/api/notifications?user_id=${user.id}&limit=20`),
        ]);
        setApplications(apps);
        setNotifications(notifs);
        if (apps.length > 0) {
          const projectIds  = [...new Set(apps.map(a => a.project_id))];
          const positionIds = [...new Set(apps.map(a => a.position_id))];
          const [projs, posits] = await Promise.all([
            get('/api/projects?limit=100'),
            get('/api/positions?limit=200'),
          ]);
          setProjects(projs.filter(p => projectIds.includes(p.id)));
          setPositions(posits.filter(p => positionIds.includes(p.id)));
        }
      } catch { navigate('/login'); }
      finally  { setLoading(false); }
    })();
  }, [user]);

  const markRead = async (notif) => {
    if (notif.read) return;
    await put(`/api/notifications/${notif.id}`, { read: true });
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
  };

  const getProject  = id => projects.find(p => p.id === id);
  const getPosition = id => positions.find(p => p.id === id);

  const upcoming = applications
    .filter(a => a.status === 'accepted')
    .map(a => ({ ...a, pos: getPosition(a.position_id), project: getProject(a.project_id) }))
    .filter(a => a.pos?.shooting_date);

  const withdrawApplication = async (appId) => {
    if (!confirm("Withdraw this application?")) return;
    setWithdrawingId(appId);
    try {
      await put(`/api/applications/${appId}`, { status: "cancelled" });
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: "cancelled" } : a));
    } finally {
      setWithdrawingId(null);
    }
  };

  const filteredApps = useMemo(() => {
    const q = appSearch.toLowerCase();
    return applications.filter(a => {
      const proj = getProject(a.project_id);
      const pos  = getPosition(a.position_id);
      const matchSearch = !q ||
        proj?.name?.toLowerCase().includes(q) ||
        pos?.title?.toLowerCase().includes(q);
      const matchStatus = appStatusFilter === "all" || a.status === appStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [applications, appSearch, appStatusFilter, projects, positions]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const tabs = [
    { id: "applied",       label: t("dashboard", "applied"),       count: applications.length },
    { id: "upcoming",      label: t("dashboard", "upcoming"),      count: upcoming.length },
    { id: "notifications", label: t("dashboard", "notifications"), count: unreadCount },
  ];

  const initials = (user?.full_name || user?.email || "?").slice(0, 2).toUpperCase();
  const firstName = user?.full_name?.split(" ")[0];

  if (loading) return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-10 animate-pulse">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 rounded-xl bg-zinc-200 dark:bg-zinc-800 shrink-0" />
          <div className="space-y-2">
            <div className="h-2.5 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-5 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
        <div className="h-9 w-64 rounded-lg bg-zinc-200 dark:bg-zinc-900 mb-6" />
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-[72px] rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06]" />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
    {showOnboarding && (
      <OnboardingModal onClose={() => dismissOnboarding(user?.id)} />
    )}
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-10">

        {/* ── HEADER — flat, no card ── */}
        <div className="flex items-center gap-4 mb-8">
          {user?.profile_image_url ? (
            <img
              src={user.profile_image_url}
              alt={user.full_name}
              className="w-16 h-16 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-black text-base shrink-0"
              style={{ background: "linear-gradient(135deg, #ef4136, #fbb040)" }}
            >
              {initials}
            </div>
          )}
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-red-500 leading-none mb-1">
              {t("dashboard", "subtitle")}
            </p>
            <h1 className="text-xl font-black tracking-tight leading-tight">
              {firstName ? t("dashboard", "greeting").replace("{name}", firstName) : t("dashboard", "title")}
              {firstName && <span className="ml-1.5">👋</span>}
            </h1>
          </div>
        </div>

        {/* ── PROFILE COMPLETION NUDGE ── */}
        {showNudge && (
          <div className="mb-6 flex items-center gap-3 bg-white dark:bg-zinc-900 border border-amber-400/25 rounded-xl px-4 py-3">
            <UserCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-none">
                  Profile {completionPct}% complete
                </p>
                <div className="flex-1 h-1 rounded-full bg-zinc-100 dark:bg-white/10 overflow-hidden max-w-[80px]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${completionPct}%`, background: "linear-gradient(135deg,#ef4136,#fbb040)" }}
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Casting directors see complete profiles more often.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/profile"
                className="text-xs font-bold text-white px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: "linear-gradient(135deg,#ef4136,#fbb040)" }}
              >
                Complete
              </Link>
              <button onClick={dismissNudge} className="text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── TABS ── */}
        <div className="flex gap-1 mb-6 bg-zinc-200 dark:bg-zinc-900 p-1 rounded-xl w-fit overflow-x-auto max-w-full">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.id
                    ? "bg-white/20"
                    : "bg-zinc-300 dark:bg-white/10 text-zinc-600 dark:text-white/60"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT ── */}
        <div key={activeTab} className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200">

          {/* ── APPLICATION HISTORY ── */}
          {activeTab === "applied" && (
            <div className="space-y-4">
              {applications.length === 0 ? (
                <EmptyState
                  icon={Send}
                  accent="bg-red-500/10 text-red-500"
                  text={t("dashboard", "no_applied")}
                  hint={t("dashboard", "no_applied_hint")}
                >
                  <Link
                    to="/projects"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-white px-4 py-2 rounded-xl transition-transform hover:scale-[1.03]"
                    style={{ background: "linear-gradient(135deg, #ef4136, #fbb040)" }}
                  >
                    {t("dashboard", "browse_projects")} <ChevronRight className="w-4 h-4" />
                  </Link>
                </EmptyState>
              ) : (
                <>
                  {/* Search + status filter */}
                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-white/30 pointer-events-none" />
                      <input
                        value={appSearch}
                        onChange={e => setAppSearch(e.target.value)}
                        placeholder="Search project or role…"
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-white/30 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20"
                      />
                      {appSearch && (
                        <button onClick={() => setAppSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                      {["all", "pending", "accepted", "waitlist", "rejected", "cancelled"].map(s => {
                        const count = s !== "all" ? applications.filter(a => a.status === s).length : null;
                        const isActive = appStatusFilter === s;
                        return (
                          <button
                            key={s}
                            onClick={() => setAppStatusFilter(s)}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-all border ${
                              isActive
                                ? "bg-red-600 text-white border-red-600"
                                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-white/50 hover:border-zinc-400 dark:hover:border-white/30 hover:text-zinc-800 dark:hover:text-white"
                            }`}
                          >
                            {s === "all" ? "All" : s}
                            {count !== null && (
                              <span className={`text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 ${
                                isActive ? "bg-white/20 text-white" : "bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-white/40"
                              }`}>
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Result count */}
                  <p className="text-xs text-zinc-400 dark:text-white/30 px-1">
                    {filteredApps.length} application{filteredApps.length !== 1 ? "s" : ""}
                    {appStatusFilter !== "all" || appSearch ? " matching" : ""}
                  </p>

                  {filteredApps.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400 dark:text-white/30 text-sm">
                      No applications match your filters.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredApps.map(app => {
                        const project  = getProject(app.project_id);
                        const position = getPosition(app.position_id);
                        const cfg  = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                        const Icon = cfg.icon;
                        const canWithdraw = app.status === "pending";
                        return (
                          <div
                            key={app.id}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-xl p-4 hover:border-zinc-300 dark:hover:border-white/10 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Link to={`/projects/${app.project_id}`} className="shrink-0">
                                {project?.image_url ? (
                                  <img src={project.image_url} alt={project.name} className="w-11 h-11 rounded-lg object-cover hover:opacity-80 transition-opacity" />
                                ) : (
                                  <div className="w-11 h-11 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                    <Film className="w-5 h-5 text-zinc-400 dark:text-zinc-600" />
                                  </div>
                                )}
                              </Link>

                              <div className="flex-1 min-w-0">
                                <Link to={`/projects/${app.project_id}`} className="block hover:text-red-500 transition-colors">
                                  <p className="font-semibold text-sm text-zinc-900 dark:text-white truncate">
                                    {project?.name || t("dashboard", "unknown_project")}
                                  </p>
                                </Link>
                                <p className="text-zinc-500 dark:text-zinc-400 text-xs truncate mt-0.5">
                                  {position?.title || t("dashboard", "unknown_position")}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400 dark:text-zinc-500 flex-wrap">
                                  {app.created_date && <span>{app.created_date}</span>}
                                  {position?.shooting_date && (
                                    <span className="flex items-center gap-0.5">
                                      <Calendar className="w-3 h-3" /> {position.shooting_date}
                                    </span>
                                  )}
                                  {position?.location && (
                                    <span className="flex items-center gap-0.5">
                                      <MapPin className="w-3 h-3" /> {position.location}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                                  <Icon className="w-3 h-3" />
                                  {t("dashboard", cfg.labelKey)}
                                </div>
                                {canWithdraw && (
                                  <button
                                    onClick={() => withdrawApplication(app.id)}
                                    disabled={withdrawingId === app.id}
                                    className="flex items-center gap-1 text-[11px] text-zinc-400 dark:text-white/25 hover:text-red-400 transition-colors disabled:opacity-50"
                                  >
                                    {withdrawingId === app.id
                                      ? <Loader2 className="w-3 h-3 animate-spin" />
                                      : <X className="w-3 h-3" />}
                                    Withdraw
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Admin note */}
                            {app.admin_notes && (
                              <div className="mt-3 flex items-start gap-2 rounded-lg bg-zinc-50 dark:bg-white/[0.04] px-3 py-2.5">
                                <AlertCircle className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-0.5">
                                    {t("dashboard", "admin_note")}
                                  </p>
                                  <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed">
                                    {app.admin_notes}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── UPCOMING ── */}
          {activeTab === "upcoming" && (
            <div className="space-y-2">
              {upcoming.length === 0 ? (
                <EmptyState
                  icon={CalendarOff}
                  accent="bg-green-500/10 text-green-500"
                  text={t("dashboard", "no_upcoming")}
                  hint={t("dashboard", "no_upcoming_hint")}
                />
              ) : upcoming.map(item => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-xl p-4 flex items-center gap-3"
                >
                  {item.project?.image_url ? (
                    <img src={item.project.image_url} alt={item.project.name} className="w-11 h-11 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-zinc-900 dark:text-white truncate">{item.project?.name || t("dashboard", "unknown_project")}</p>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs truncate mt-0.5">{item.pos?.title || t("dashboard", "unknown_position")}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400 dark:text-zinc-500 flex-wrap">
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" />{item.pos?.shooting_date}
                      </span>
                      {item.pos?.location && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />{item.pos.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-green-600 dark:text-green-500 text-xs font-bold bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {t("dashboard", "confirmed")}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === "notifications" && (
            <div className="space-y-1.5">
              {notifications.length === 0 ? (
                <EmptyState
                  icon={BellOff}
                  accent="bg-blue-500/10 text-blue-500"
                  text={t("dashboard", "no_notifications")}
                  hint={t("dashboard", "no_notifications_hint")}
                />
              ) : notifications.map(notif => (
                <button
                  key={notif.id}
                  onClick={() => markRead(notif)}
                  className={`w-full text-left bg-white dark:bg-zinc-900 border rounded-xl p-4 transition-colors flex items-start gap-3 ${
                    !notif.read
                      ? "border-red-500/25 dark:border-red-500/15"
                      : "border-zinc-200 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/10"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    !notif.read ? "bg-red-500/10 text-red-500" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
                  }`}>
                    {notif.read ? <Inbox className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className={`text-sm font-semibold ${
                        !notif.read ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"
                      }`}>
                        {notif.title || notif.message}
                      </p>
                      {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-2" />}
                    </div>
                    {notif.title && notif.message && (
                      <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-0.5 line-clamp-2">{notif.message}</p>
                    )}
                    <p className="text-zinc-300 dark:text-zinc-600 text-xs mt-1.5">{notif.created_date || "—"}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
    </>
  );
}
