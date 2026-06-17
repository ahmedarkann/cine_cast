import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { get, post, setToken, clearToken, uploadFile } from '@/api/api';
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useLang } from "@/hooks/useLang";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Film, Mic, Bell } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// Expand an inclusive YYYY-MM-DD range into individual day strings (UTC-safe to avoid TZ drift).
const expandDateRange = (start, end) => {
  if (!start) return [];
  const s = new Date(`${start}T00:00:00Z`);
  const e = new Date(`${end || start}T00:00:00Z`);
  if (isNaN(s) || isNaN(e) || e < s) return [start];
  const out = [];
  for (let d = new Date(s); d <= e; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().split("T")[0]);
  }
  return out;
};

export default function CalendarPage() {
  const { t } = useLang();
  usePageMeta({ title: "My Calendar" });
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const { user, isLoadingAuth, authChecked } = useAuth(); // Assuming useAuth is available
  const isAdmin = user?.role === "admin";

  const { data: applicationsData, isLoading: isLoadingApplications } = useQuery({
    queryKey: ['applications', 'user', user?.id],
    queryFn: () => get(`/api/applications?user_id=${user.id}`),
    enabled: !!user?.id,
  });

  const { data: allProjectsData, isLoading: isLoadingAllProjects } = useQuery({
    queryKey: ['projects', 'all'],
    queryFn: () => get('/api/projects?sort=-created_at&limit=100'),
    enabled: !!user?.id && (isAdmin || !!applicationsData?.length),
  });

  const positionIds = [...new Set((applicationsData || []).map(a => a.position_id).filter(Boolean))];
  const { data: allPositionsData, isLoading: isLoadingAllPositions } = useQuery({
    queryKey: ['positions', 'byIds', positionIds.join(',')],
    queryFn: () => get(`/api/positions?${positionIds.map(id => `id=${id}`).join('&')}`),
    enabled: !!user?.id && positionIds.length > 0,
  });

  const slotIds = [...new Set((applicationsData || []).map((a) => a.slot_id).filter(Boolean))];

  const { data: slotsData, isLoading: isLoadingSlots } = useQuery({
    queryKey: ['casting-slots', 'byIds', slotIds.join(',')],
    queryFn: () => get(`/api/casting-slots?ids=${slotIds.join(',')}`),
    enabled: !!slotIds.length,
  });

  const { data: notificationsData, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['notifications', 'user', user?.id],
    queryFn: () => get(`/api/notifications?user_id=${user.id}&limit=200`),
    enabled: !!user?.id,
  });

  useEffect(() => {
    // Admins: show every project, spread across its shooting date range.
    if (isAdmin) {
      if (allProjectsData) {
        const evts = allProjectsData.flatMap((proj) =>
          expandDateRange(proj.shooting_start_date, proj.shooting_end_date).map((d) => ({
            type: 'project', date: d, proj,
          }))
        ).sort((a, b) => a.date.localeCompare(b.date));
        setEvents(evts);
      }
      setLoading(isLoadingAuth || isLoadingAllProjects);
      return;
    }

    // Users: show their own applications (any active status — only rejected/cancelled are hidden).
    if (user && applicationsData && allProjectsData) {
      const projIds = [...new Set(applicationsData.map((a) => a.project_id))];
      const filteredPos = allPositionsData || [];
      const filteredProj = allProjectsData.filter((p) => projIds.includes(p.id));

      const releasingStatuses = ['rejected', 'cancelled'];
      const evts = applicationsData.flatMap((app) => {
        const pos  = filteredPos.find((p) => p.id === app.position_id);
        const proj = filteredProj.find((p) => p.id === app.project_id);
        if (releasingStatuses.includes(app.status)) return [];

        // Live casting: show the booked slot date
        if (app.slot_id) {
          const slot = (slotsData || []).find((s) => s.id === app.slot_id);
          return slot ? [{ type: 'interview', date: slot.slot_date, slot, pos, proj, app }] : [];
        }

        // Position has its own shooting date
        if (pos?.shooting_date) {
          return [{ type: 'shoot', date: pos.shooting_date, pos, proj, app }];
        }

        // Fall back to project shooting range — expand into individual days
        if (proj?.shooting_start_date) {
          return expandDateRange(proj.shooting_start_date, proj.shooting_end_date)
            .map(d => ({ type: 'shoot', date: d, pos, proj, app }));
        }

        return [];
      }).sort((a, b) => a.date.localeCompare(b.date));
      setEvents(evts);
    }
    setLoading(isLoadingAuth || isLoadingApplications || isLoadingAllProjects || isLoadingAllPositions || isLoadingSlots);
  }, [isAdmin, user, applicationsData, allProjectsData, allPositionsData, slotsData, isLoadingAuth, isLoadingApplications, isLoadingAllProjects, isLoadingAllPositions, isLoadingSlots]);

  useEffect(() => {
    if (!user && !isLoadingAuth && authChecked) navigate("/login");
  }, [user, isLoadingAuth, authChecked, navigate]);

  useEffect(() => {
    if (notificationsData) {
      setLogs(notificationsData.map((n) => ({ date: n.created_date, notif: n })).filter((l) => l.date));
    }
  }, [notificationsData]);

  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dayDateStr = (day) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const eventsOnDay = (day) => events.filter((e) => e.date === dayDateStr(day));
  const logsOnDay = (day) => logs.filter((l) => l.date === dayDateStr(day));

  const selectedEvents = selectedDay ? eventsOnDay(selectedDay) : [];
  const selectedLogs = selectedDay ? logsOnDay(selectedDay) : [];

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingEvents = events.filter((e) => e.date >= todayStr).slice(0, 5);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-white/10 border-t-red-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white pt-6 pb-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <p className="text-red-500 text-xs font-bold tracking-widest uppercase mb-1">{t("calendar", "subtitle")}</p>
          <h1 className="text-3xl font-black tracking-tight uppercase text-zinc-900 dark:text-white">{t("calendar", "title")}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Calendar grid */}
          <div className="md:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-none">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setDate(new Date(year, month - 1))} className="text-zinc-500 dark:text-white/50 hover:text-zinc-900 dark:hover:text-white p-1">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold">{MONTHS[month]} {year}</h2>
              <button onClick={() => setDate(new Date(year, month + 1))} className="text-white/50 hover:text-white p-1">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map((d) => <div key={d} className="text-center text-xs text-zinc-500 dark:text-white/30 font-bold py-1">{d}</div>)}
            </div>
            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEvents = eventsOnDay(day);
                const dayLogs = logsOnDay(day);
                const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all text-zinc-900 dark:text-white ${
                      isSelected ? "bg-red-600 text-white" :
                      isToday ? "bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white font-bold" :
                      "hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-white/70"
                    }`}
                  >
                    {day}
                    {(dayEvents.length > 0 || dayLogs.length > 0) && (
                      <span className="absolute bottom-1 flex items-center gap-0.5">
                        {dayEvents.length > 0 && <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-red-500"}`} />}
                        {dayLogs.length > 0 && <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-blue-400"}`} />}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar: events */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-500 dark:text-white/50 uppercase tracking-wider mb-4">
                {selectedDay ? `${MONTHS[month]} ${selectedDay}` : "Upcoming"}
              </h3>
              {(selectedDay ? selectedEvents : upcomingEvents).length === 0 ? (
                <div className="text-center py-10 text-zinc-400 dark:text-white/20">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t("calendar", "no_events")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(selectedDay ? selectedEvents : upcomingEvents).map((evt, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl p-4 shadow-sm dark:shadow-none">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {evt.type === 'interview' ? <Mic className="w-3 h-3 text-red-500 shrink-0" /> : <Film className="w-3 h-3 text-red-500 shrink-0" />}
                        <h4 className="font-semibold text-sm text-zinc-900 dark:text-white">{evt.proj?.name}</h4>
                      </div>
                      <p className="text-zinc-500 dark:text-white/50 text-xs mb-2">
                        {evt.type === 'interview'
                          ? `Interview · ${evt.pos?.title || 'Role TBD'}`
                          : evt.type === 'project'
                          ? `${(evt.proj?.type || 'project').replace(/_/g, ' ')} · ${evt.proj?.status}`
                          : evt.pos?.title}
                      </p>
                      <div className="space-y-1 text-xs text-zinc-400 dark:text-white/30">
                        {evt.type === 'interview' ? (
                          <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{evt.slot.start_time}–{evt.slot.end_time}</div>
                        ) : evt.type === 'project' ? (
                          <>
                            {evt.proj?.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{evt.proj.location}</div>}
                            {evt.proj?.shooting_start_date && (
                              <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{evt.proj.shooting_start_date}{evt.proj.shooting_end_date && evt.proj.shooting_end_date !== evt.proj.shooting_start_date ? ` → ${evt.proj.shooting_end_date}` : ''}</div>
                            )}
                          </>
                        ) : (
                          <>
                            {evt.pos?.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{evt.pos.location}</div>}
                            {evt.pos?.compensation && <div className="text-green-400 font-semibold">{evt.pos.compensation}</div>}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedDay && selectedLogs.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-zinc-500 dark:text-white/50 uppercase tracking-wider mb-4">Activity</h3>
                <div className="space-y-3">
                  {selectedLogs.map((log, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl p-4 shadow-sm dark:shadow-none flex items-start gap-2">
                      <Bell className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                      <p className="text-zinc-700 dark:text-white/70 text-xs">{log.notif.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}