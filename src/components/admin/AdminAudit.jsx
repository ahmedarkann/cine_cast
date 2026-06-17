import { useState, useEffect, useMemo } from "react";
import { get } from "@/api/api";
import { Activity, AlertCircle, RotateCw, Layers, CalendarDays, TrendingUp, Clock, Search, X } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

const ACTION_COLORS = {
  create: "text-green-400 bg-green-400/10",
  update: "text-blue-400 bg-blue-400/10",
  delete: "text-red-400 bg-red-400/10",
  archive: "text-yellow-400 bg-yellow-400/10",
  accepted: "text-green-400 bg-green-400/10",
  rejected: "text-red-400 bg-red-400/10",
  waitlist: "text-blue-400 bg-blue-400/10",
};

// Human-readable, past-tense labels for the raw action enums stored on each log.
const ACTION_LABELS = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  archive: "Archived",
  accepted: "Accepted",
  rejected: "Rejected",
  waitlist: "Waitlisted",
};

const labelFor = (action) =>
  ACTION_LABELS[action] || (action ? action.charAt(0).toUpperCase() + action.slice(1) : "Action");

// Relative time ("2 hours ago"), locale-aware. Falls back to absolute if needed.
const RTF = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
const UNITS = [["year", 31557600], ["month", 2629800], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]];
const relativeTime = (iso) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const diff = Math.round((d.getTime() - Date.now()) / 1000); // negative = past
  for (const [unit, secs] of UNITS) {
    if (Math.abs(diff) >= secs || unit === "second") return RTF.format(Math.round(diff / secs), unit);
  }
  return "";
};

function AuditStatCard({ label, value, icon: Icon, accent, sub }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-xl p-4 flex items-center gap-3 shadow-sm dark:shadow-none">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: accent + "18" }}>
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <div>
        <div className="font-bold text-zinc-900 dark:text-white leading-none">{value}</div>
        <div className="text-xs text-zinc-400 dark:text-white/30 mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-zinc-400 dark:text-white/20 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

const PAGE_SIZE = 25;
const ACTIONS = ["all", "create", "update", "delete", "archive", "accepted", "rejected", "waitlist"];
const ENTITY_TYPES = ["all", "project", "position", "application", "user"];

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border",
        active
          ? "text-white border-transparent"
          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/30"
      )}
      style={active ? { background: "linear-gradient(135deg,#ef4136,#fbb040)" } : {}}
    >
      {label}
    </button>
  );
}

export default function AdminAudit() {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  // global stats fetched once (no filters — always reflects real totals)
  const [allLogs, setAllLogs] = useState([]);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ page, limit: PAGE_SIZE });
    if (actionFilter !== "all") params.set("action", actionFilter);
    if (entityFilter !== "all") params.set("entity_type", entityFilter);
    get(`/api/audit-logs?${params}`)
      .then((res) => {
        setLogs(res.data || []);
        setMeta({ total: res.total ?? 0, page: res.page ?? 1, totalPages: res.totalPages ?? 1 });
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [page, actionFilter, entityFilter]);

  // reset page when filters change
  const setAction = (v) => { setActionFilter(v); setPage(1); };
  const setEntity = (v) => { setEntityFilter(v); setPage(1); };
  const clearFilters = () => { setActionFilter("all"); setEntityFilter("all"); setPage(1); };
  const anyFilter = actionFilter !== "all" || entityFilter !== "all";

  // fetch all logs once for stats
  useEffect(() => {
    get("/api/audit-logs?page=1&limit=100")
      .then((res) => setAllLogs(res.data || []))
      .catch(() => {});
  }, []);

  // derive stats from the first 100 logs (good enough approximation)
  const auditStats = useMemo(() => {
    if (!meta.total) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = allLogs.filter((l) => new Date(l.created_at || l.created_date) >= today).length;

    const actionCounts = {};
    allLogs.forEach((l) => { actionCounts[l.action] = (actionCounts[l.action] || 0) + 1; });
    const topAction = Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0];

    const latest = logs[0];
    const latestLabel = latest ? relativeTime(latest.created_at || latest.created_date) : "—";

    return { total: meta.total, todayCount, topAction, latestLabel };
  }, [meta.total, allLogs, logs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-zinc-500 dark:text-white/40 text-sm">
        <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        Loading activity…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400/80" />
        <p className="text-zinc-700 dark:text-white/70 font-medium">Couldn’t load the audit trail</p>
        <p className="text-sm text-zinc-500 dark:text-white/40 mt-1 mb-5">Check your connection and try again.</p>
        <button
          onClick={() => { setError(false); setPage(p => p); }}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-800 dark:text-white hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors"
        >
          <RotateCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* audit stats */}
      {auditStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <AuditStatCard label="Total Events" value={auditStats.total} icon={Layers} accent="#6366f1" />
          <AuditStatCard label="Today" value={auditStats.todayCount} icon={CalendarDays} accent="#ef4136" />
          <AuditStatCard
            label="Top Action"
            value={auditStats.topAction ? ACTION_LABELS[auditStats.topAction[0]] || auditStats.topAction[0] : "—"}
            icon={TrendingUp}
            accent="#10b981"
            sub={auditStats.topAction ? `${auditStats.topAction[1]} times` : undefined}
          />
          <AuditStatCard label="Last Activity" value={auditStats.latestLabel} icon={Clock} accent="#f59e0b" />
        </div>
      )}

      {/* ── filter toolbar ── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-xl p-4 space-y-3 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/30">Action</span>
          {anyFilter && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-zinc-400 dark:text-white/30 hover:text-red-400 transition-colors">
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ACTIONS.map((a) => (
            <FilterChip key={a} label={a === "all" ? "All" : ACTION_LABELS[a] || a} active={actionFilter === a} onClick={() => setAction(a)} />
          ))}
        </div>
        <div className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/30 pt-1">Entity Type</div>
        <div className="flex flex-wrap gap-1.5">
          {ENTITY_TYPES.map((e) => (
            <FilterChip key={e} label={e === "all" ? "All" : e.charAt(0).toUpperCase() + e.slice(1)} active={entityFilter === e} onClick={() => setEntity(e)} />
          ))}
        </div>
      </div>

      {/* ── results count ── */}
      <div className="text-xs text-zinc-400 dark:text-white/30">
        {loading ? "Loading…" : `${meta.total} event${meta.total !== 1 ? "s" : ""}${anyFilter ? " matching filters" : ""}`}
      </div>

      {/* ── log list ── */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16">
          <Activity className="w-10 h-10 mx-auto mb-3 text-zinc-400 dark:text-white/25" />
          <p className="text-zinc-700 dark:text-white/70 font-medium">
            {anyFilter ? "No events match these filters" : "No activity yet"}
          </p>
          {anyFilter && (
            <button onClick={clearFilters} className="mt-3 text-sm text-red-400 hover:underline">Clear filters</button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const ts = log.created_at || log.created_date;
            return (
              <div key={log.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-3 flex items-center gap-4 shadow-sm dark:shadow-none text-zinc-900 dark:text-white">
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded shrink-0 ${ACTION_COLORS[log.action] || "text-zinc-500 bg-zinc-500/10 dark:text-white/50 dark:bg-white/5"}`}>
                  {labelFor(log.action)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-800 dark:text-white/80 truncate">
                    {log.details || labelFor(log.action)}
                  </p>
                  {log.entity_type && (
                    <p className="text-xs text-zinc-500 dark:text-white/45 truncate">
                      {log.entity_type}
                      {log.entity_id && <span className="font-mono text-zinc-400 dark:text-white/35"> · {log.entity_id.slice(0, 8)}</span>}
                    </p>
                  )}
                </div>
                {ts && (
                  <time
                    dateTime={ts}
                    title={new Date(ts).toLocaleString()}
                    className="text-xs text-zinc-500 dark:text-white/40 shrink-0 tabular-nums"
                  >
                    {relativeTime(ts)}
                  </time>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        onPageChange={setPage}
        className="pt-2"
      />
    </div>
  );
}
