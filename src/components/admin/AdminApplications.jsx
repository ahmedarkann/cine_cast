import { useState, useMemo, useCallback } from "react";
import { get, post, put } from "@/api/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle, XCircle, Clock, AlertCircle, Search, Users,
  Save, ChevronDown, Loader2, Lock, Square, CheckSquare, Minus,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

const STATUS_CFG = {
  pending:   { color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", icon: Clock },
  accepted:  { color: "text-green-400 bg-green-400/10 border-green-400/20",   icon: CheckCircle },
  rejected:  { color: "text-red-400 bg-red-400/10 border-red-400/20",         icon: XCircle },
  waitlist:  { color: "text-blue-400 bg-blue-400/10 border-blue-400/20",      icon: AlertCircle },
  cancelled: { color: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",      icon: XCircle },
};

const gradient = "linear-gradient(135deg,#ef4136,#fbb040)";
const PAGE_SIZE = 15;

function StatCard({ label, value, accent }) {
  return (
    <div className="min-w-[110px] sm:min-w-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-xl p-4 shadow-sm dark:shadow-none flex-1">
      <div className="text-2xl font-bold leading-none" style={{ color: accent }}>{value}</div>
      <div className="text-xs text-zinc-400 dark:text-white/30 mt-1 uppercase tracking-wider font-semibold">{label}</div>
    </div>
  );
}

function ApplicationCard({ app, project, position, selected, onSelect, onStatusChange, onNoteSave, onCastingNoteSave }) {
  const [adminNote, setAdminNote] = useState(app.admin_notes || "");
  const [castingNote, setCastingNote] = useState(app.casting_notes || "");
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [savedAdmin, setSavedAdmin] = useState(false);
  const [savingCasting, setSavingCasting] = useState(false);
  const [savedCasting, setSavedCasting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const cfg = STATUS_CFG[app.status] || STATUS_CFG.pending;
  const Icon = cfg.icon;

  const handleStatus = async (status) => {
    setUpdatingStatus(status);
    try { await onStatusChange(app, status, adminNote); }
    finally { setUpdatingStatus(null); }
  };

  const handleSaveAdmin = async () => {
    setSavingAdmin(true);
    try { await onNoteSave(app.id, adminNote); setSavedAdmin(true); setTimeout(() => setSavedAdmin(false), 2000); }
    finally { setSavingAdmin(false); }
  };

  const handleSaveCasting = async () => {
    setSavingCasting(true);
    try { await onCastingNoteSave(app.id, castingNote); setSavedCasting(true); setTimeout(() => setSavedCasting(false), 2000); }
    finally { setSavingCasting(false); }
  };

  const adminChanged = adminNote !== (app.admin_notes || "");
  const castingChanged = castingNote !== (app.casting_notes || "");

  return (
    <div className={cn(
      "bg-white dark:bg-zinc-900 border rounded-xl p-4 shadow-sm dark:shadow-none transition-all",
      selected
        ? "border-red-500/40 ring-1 ring-red-500/20"
        : "border-zinc-200 dark:border-white/5"
    )}>
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onSelect(app.id)}
          className="mt-0.5 shrink-0 text-zinc-300 dark:text-white/20 hover:text-red-400 transition-colors"
        >
          {selected
            ? <CheckSquare className="w-4 h-4 text-red-500" />
            : <Square className="w-4 h-4" />}
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-sm font-bold text-zinc-500 dark:text-white/40 uppercase">
          {(app.applicant_name || "?").charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + status badge */}
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="font-semibold text-zinc-900 dark:text-white truncate">{app.applicant_name || "Unknown"}</span>
              <span className={cn("inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border shrink-0", cfg.color)}>
                <Icon className="w-3 h-3" /> {app.status}
              </span>
              {app.is_guest === 1 && (
                <span className="text-xs bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-white/40 px-2 py-0.5 rounded shrink-0">Guest</span>
              )}
            </div>
            {/* Date — top-right, hidden on very small screens */}
            <time className="hidden xs:block text-xs text-zinc-400 dark:text-white/30 shrink-0 tabular-nums whitespace-nowrap">
              {app.created_date ? new Date(app.created_date).toLocaleDateString() : "—"}
            </time>
          </div>

          {/* Contact info — date appended inline on xs */}
          <p className="text-xs text-zinc-400 dark:text-white/40">
            {app.applicant_email}{app.applicant_phone ? ` · ${app.applicant_phone}` : ""}
            {/* Date inline on very small screens */}
            {app.created_date && (
              <span className="xs:hidden ml-2 text-zinc-300 dark:text-white/20">
                · {new Date(app.created_date).toLocaleDateString()}
              </span>
            )}
          </p>

          {/* Project / position breadcrumb */}
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {project && <span className="text-xs font-medium text-zinc-600 dark:text-white/60 truncate max-w-[180px]">{project.name}</span>}
            {project && position && <ChevronDown className="w-3 h-3 text-zinc-300 dark:text-white/20 -rotate-90 shrink-0" />}
            {position && <span className="text-xs text-zinc-400 dark:text-white/40 truncate max-w-[140px]">{position.title}</span>}
          </div>
        </div>
      </div>

      {/* Applicant message */}
      {app.message && (
        <p className="mt-3 text-xs text-zinc-500 dark:text-white/50 italic border-l-2 border-zinc-200 dark:border-white/10 pl-3">
          {app.message}
        </p>
      )}

      {/* Status action buttons + notes */}
      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-white/5 flex flex-col gap-3">
        {/* Status buttons — scrollable on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pb-0.5">
          {app.status !== "accepted" && (
            <button onClick={() => handleStatus("accepted")} disabled={!!updatingStatus}
              className="flex items-center gap-1 shrink-0 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50">
              {updatingStatus === "accepted" ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              <span>Accept</span>
            </button>
          )}
          {app.status !== "rejected" && (
            <button onClick={() => handleStatus("rejected")} disabled={!!updatingStatus}
              className="flex items-center gap-1 shrink-0 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50">
              {updatingStatus === "rejected" ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
              <span>Reject</span>
            </button>
          )}
          {app.status !== "waitlist" && (
            <button onClick={() => handleStatus("waitlist")} disabled={!!updatingStatus}
              className="flex items-center gap-1 shrink-0 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50">
              {updatingStatus === "waitlist" ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertCircle className="w-3 h-3" />}
              <span>Waitlist</span>
            </button>
          )}
        </div>

        {/* Note to applicant */}
        <NoteField
          label="Note to applicant"
          sublabel="sent in notification"
          value={adminNote}
          onChange={setAdminNote}
          onSave={handleSaveAdmin}
          saving={savingAdmin}
          saved={savedAdmin}
          changed={adminChanged}
          icon={Save}
          iconClass="text-zinc-400 dark:text-white/30"
          inputClass="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-white/10 focus:border-zinc-300 dark:focus:border-white/30"
          placeholder="Visible to applicant when status changes…"
        />

        {/* Internal casting notes */}
        <NoteField
          label="Internal casting notes"
          sublabel="admin only"
          value={castingNote}
          onChange={setCastingNote}
          onSave={handleSaveCasting}
          saving={savingCasting}
          saved={savedCasting}
          changed={castingChanged}
          icon={Lock}
          iconClass="text-amber-500/70"
          inputClass="bg-amber-50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-500/10 focus:border-amber-400/40"
          savedBtnClass="bg-amber-100/60 dark:bg-amber-500/10 border-amber-300/40 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20"
          placeholder="Private notes for the casting team…"
        />
      </div>
    </div>
  );
}

function NoteField({ label, sublabel, value, onChange, onSave, saving, saved, changed, icon: Icon, iconClass, inputClass, savedBtnClass, placeholder }) {
  return (
    <div className="space-y-1">
      <div className={cn("flex items-center gap-1 text-[10px] font-black uppercase tracking-widest", iconClass)}>
        <Icon className="w-3 h-3" />
        {label}
        {sublabel && <span className="normal-case font-normal text-zinc-300 dark:text-white/20">({sublabel})</span>}
      </div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "flex-1 border rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-white/20 focus:outline-none min-w-0",
            inputClass
          )}
        />
        <button
          onClick={onSave}
          disabled={saving || !changed}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border shrink-0",
            saved
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : changed
              ? savedBtnClass || "bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white/60 hover:border-zinc-300 dark:hover:border-white/30"
              : "opacity-30 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-white/5 text-zinc-400 dark:text-white/20"
          )}
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <CheckCircle className="w-3 h-3" /> : <Save className="w-3 h-3" />}
          <span className="hidden sm:inline">{saved ? "Saved" : "Save"}</span>
        </button>
      </div>
    </div>
  );
}

export default function AdminApplications() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [appPage, setAppPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading: loadingApps } = useQuery({
    queryKey: ["applications", "admin"],
    queryFn: () => get("/api/applications?sort=-created_at"),
  });
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ["projects", "all"],
    queryFn: () => get("/api/projects"),
  });
  const { data: positions = [], isLoading: loadingPositions } = useQuery({
    queryKey: ["positions", "all"],
    queryFn: () => get("/api/positions"),
  });

  const loading = loadingApps || loadingProjects || loadingPositions;
  const getProject = useCallback((id) => projects.find((p) => p.id === id), [projects]);
  const getPosition = useCallback((id) => positions.find((p) => p.id === id), [positions]);

  const stats = useMemo(() => ({
    total:    applications.length,
    pending:  applications.filter((a) => a.status === "pending").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    waitlist: applications.filter((a) => a.status === "waitlist").length,
  }), [applications]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return applications.filter((a) => {
      const proj = getProject(a.project_id);
      const pos  = getPosition(a.position_id);
      const matchSearch = !q ||
        a.applicant_name?.toLowerCase().includes(q) ||
        a.applicant_email?.toLowerCase().includes(q) ||
        proj?.name?.toLowerCase().includes(q) ||
        pos?.title?.toLowerCase().includes(q);
      return matchSearch &&
        (statusFilter  === "all" || a.status === statusFilter) &&
        (projectFilter === "all" || a.project_id === projectFilter);
    });
  }, [applications, search, statusFilter, projectFilter, getProject, getPosition]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((appPage - 1) * PAGE_SIZE, appPage * PAGE_SIZE);
  const pagedIds = paged.map((a) => a.id);
  const allPageSelected = pagedIds.length > 0 && pagedIds.every((id) => selectedIds.has(id));
  const somePageSelected = pagedIds.some((id) => selectedIds.has(id));

  const resetPage = () => setAppPage(1);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) { pagedIds.forEach((id) => next.delete(id)); }
      else { pagedIds.forEach((id) => next.add(id)); }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleStatusChange = async (app, status, adminNote) => {
    await put(`/api/applications/${app.id}`, { status, admin_notes: adminNote });
    await post("/api/audit-logs", { action: status, entity_type: "Application", entity_id: app.id, details: `${app.applicant_name} → ${status}` });
    if (app.user_id && ["accepted", "rejected", "waitlist"].includes(status)) {
      const base = status === "accepted" ? "Your application has been accepted!"
        : status === "rejected" ? "Your application was not selected this time."
        : "You've been placed on the waitlist.";
      await post("/api/notifications", { user_id: app.user_id, message: adminNote ? `${base} Note: ${adminNote}` : base });
    }
    queryClient.invalidateQueries(["applications"]);
    queryClient.invalidateQueries(["positions"]);
  };

  const handleNoteSave = async (id, note) => {
    await put(`/api/applications/${id}`, { admin_notes: note });
    queryClient.invalidateQueries(["applications"]);
  };

  const handleCastingNoteSave = async (id, note) => {
    await put(`/api/applications/${id}`, { casting_notes: note });
    queryClient.invalidateQueries(["applications"]);
  };

  const handleBulkStatus = async (status) => {
    const targets = applications.filter((a) => selectedIds.has(a.id) && a.status !== status);
    if (targets.length === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(targets.map(async (app) => {
        await put(`/api/applications/${app.id}`, { status });
        await post("/api/audit-logs", { action: status, entity_type: "Application", entity_id: app.id, details: `[Bulk] ${app.applicant_name} → ${status}` });
        if (app.user_id && ["accepted", "rejected", "waitlist"].includes(status)) {
          const base = status === "accepted" ? "Your application has been accepted!"
            : status === "rejected" ? "Your application was not selected this time."
            : "You've been placed on the waitlist.";
          await post("/api/notifications", { user_id: app.user_id, message: base });
        }
      }));
      queryClient.invalidateQueries(["applications"]);
      queryClient.invalidateQueries(["positions"]);
      clearSelection();
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-5 text-zinc-900 dark:text-white">
      {/* Stats — horizontal scroll on mobile, 5-col grid on sm+ */}
      <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible sm:pb-0">
        <StatCard label="Total"    value={stats.total}    accent="#6366f1" />
        <StatCard label="Pending"  value={stats.pending}  accent="#facc15" />
        <StatCard label="Accepted" value={stats.accepted} accent="#4ade80" />
        <StatCard label="Rejected" value={stats.rejected} accent="#f87171" />
        <StatCard label="Waitlist" value={stats.waitlist} accent="#60a5fa" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        {/* Search + project select */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-white/30" />
            <input
              type="text"
              placeholder="Search by name, email, project, position…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage(); }}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-white/30 focus:outline-none focus:border-red-500/50 shadow-sm dark:shadow-none"
            />
          </div>
          <select
            value={projectFilter}
            onChange={(e) => { setProjectFilter(e.target.value); resetPage(); }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-red-500/50 shadow-sm dark:shadow-none"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Status chips — horizontal scroll strip, never wraps */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pb-0.5">
          {["all", "pending", "accepted", "rejected", "waitlist"].map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); resetPage(); }}
              className={cn(
                "shrink-0 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border",
                statusFilter === s
                  ? "bg-red-600 text-white border-transparent"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white shadow-sm dark:shadow-none"
              )}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 flex-wrap p-3 rounded-xl border border-red-500/20 bg-red-500/5">
          <span className="text-sm font-semibold text-zinc-700 dark:text-white/70">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2 flex-wrap flex-1">
            <button onClick={() => handleBulkStatus("accepted")} disabled={bulkLoading}
              className="flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50">
              {bulkLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              <span className="hidden xs:inline">Accept All</span>
            </button>
            <button onClick={() => handleBulkStatus("waitlist")} disabled={bulkLoading}
              className="flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50">
              {bulkLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertCircle className="w-3 h-3" />}
              <span className="hidden xs:inline">Waitlist All</span>
            </button>
            <button onClick={() => handleBulkStatus("rejected")} disabled={bulkLoading}
              className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50">
              {bulkLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
              <span className="hidden xs:inline">Reject All</span>
            </button>
          </div>
          <button onClick={clearSelection} className="text-xs text-zinc-400 dark:text-white/30 hover:text-zinc-600 dark:hover:text-white transition-colors ml-auto">
            Clear
          </button>
        </div>
      )}

      {/* Select-page row */}
      {!loading && paged.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-white/40">
          <button onClick={toggleSelectPage} className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-white transition-colors">
            {allPageSelected
              ? <CheckSquare className="w-4 h-4 text-red-500" />
              : somePageSelected
              ? <Minus className="w-4 h-4 text-red-400" />
              : <Square className="w-4 h-4" />}
            {allPageSelected ? "Deselect page" : "Select page"}
          </button>
          <span className="text-zinc-300 dark:text-white/10">·</span>
          <span>{filtered.length} application{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-40 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />)}
        </div>
      ) : paged.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-10 h-10 mx-auto mb-3 text-zinc-300 dark:text-white/20" />
          <p className="text-zinc-500 dark:text-white/40 text-sm">No applications match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paged.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              project={getProject(app.project_id)}
              position={getPosition(app.position_id)}
              selected={selectedIds.has(app.id)}
              onSelect={toggleSelect}
              onStatusChange={handleStatusChange}
              onNoteSave={handleNoteSave}
              onCastingNoteSave={handleCastingNoteSave}
            />
          ))}
        </div>
      )}

      <Pagination page={appPage} totalPages={totalPages} onPageChange={setAppPage} className="pt-2" />
    </div>
  );
}
