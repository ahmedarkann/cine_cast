import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { get, put, post, resolveImageUrl } from "@/api/api";
import { useLang } from "@/hooks/useLang";
import {
  Search, User, Shield, Mail, Plus, X, Lock, SlidersHorizontal,
  MapPin, CheckCircle2, XCircle, Users, UserCheck,
  UserX, Crown, RotateCcw, Phone, Globe, Calendar,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Pagination } from "@/components/ui/pagination";

const gradient = "linear-gradient(135deg, #ef4136, #fbb040)";

// ── tiny stat card ────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-xl p-4 flex items-center gap-3 shadow-sm dark:shadow-none">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: accent + "18" }}
      >
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <div>
        <div className="font-bold text-zinc-900 dark:text-white leading-none">{value}</div>
        <div className="text-xs text-zinc-400 dark:text-white/30 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

// ── filter pill ───────────────────────────────────────────────────────
function FilterPill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
        active
          ? "text-white border-transparent shadow-sm"
          : "bg-transparent border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-white/40 hover:border-zinc-400 dark:hover:border-white/30 hover:text-zinc-900 dark:hover:text-white",
      ].join(" ")}
      style={active ? { background: gradient } : {}}
    >
      {label}
    </button>
  );
}

// ── user row card ─────────────────────────────────────────────────────
function UserCard({ u, currentUserId, onToggleRole }) {
  const skills = Array.isArray(u.skills) ? u.skills : [];
  const langs = Array.isArray(u.languages) ? u.languages : [];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-xl shadow-sm dark:shadow-none hover:border-zinc-300 dark:hover:border-white/10 transition-all overflow-hidden">
      {/* top strip */}
      <div className="flex items-center gap-4 p-4">
        {/* avatar */}
        <div className="shrink-0 relative">
          {u.profile_image_url ? (
            <img
              src={resolveImageUrl(u.profile_image_url)}
              alt="Profile"
              className="w-12 h-12 rounded-xl object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-white/30">
              <User className="w-5 h-5" />
            </div>
          )}
          {u.is_verified ? (
            <CheckCircle2
              className="absolute -bottom-1 -right-1 w-4 h-4 text-emerald-500 bg-white dark:bg-zinc-900 rounded-full"
            />
          ) : (
            <XCircle
              className="absolute -bottom-1 -right-1 w-4 h-4 text-zinc-300 dark:text-zinc-700 bg-white dark:bg-zinc-900 rounded-full"
            />
          )}
        </div>

        {/* name + email + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            <Link
              to={`/admin/users/${u.id}`}
              className="font-semibold text-sm text-zinc-900 dark:text-white hover:text-red-500 transition-colors"
            >
              {u.full_name || "—"}
            </Link>
            {u.role === "admin" && (
              <span className="flex items-center gap-1 text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                <Crown className="w-2.5 h-2.5" /> Admin
              </span>
            )}
            {u.is_verified ? (
              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                Verified
              </span>
            ) : (
              <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 text-zinc-400 dark:text-white/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                Unverified
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-zinc-400 dark:text-white/30 text-xs">
            <Mail className="w-3 h-3 shrink-0" />
            <span className="truncate">{u.email}</span>
          </div>
        </div>

        {/* actions */}
        {u.id !== currentUserId && (
          <button
            onClick={() => onToggleRole(u)}
            className="shrink-0 text-xs border border-zinc-200 dark:border-white/10 hover:border-zinc-400 dark:hover:border-white/30 text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
          >
            {u.role === "admin" ? "Remove Admin" : "Make Admin"}
          </button>
        )}
      </div>

      {/* detail strip */}
      <div className="px-4 pb-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-zinc-100 dark:border-white/5 pt-2.5">
        {(u.city || u.country) && (
          <span className="flex items-center gap-1 text-xs text-zinc-400 dark:text-white/30">
            <MapPin className="w-3 h-3 shrink-0" />
            {[u.city, u.country].filter(Boolean).join(", ")}
          </span>
        )}
        {u.phone && (
          <span className="flex items-center gap-1 text-xs text-zinc-400 dark:text-white/30">
            <Phone className="w-3 h-3 shrink-0" />
            {u.phone}
          </span>
        )}
        {u.gender && (
          <span className="flex items-center gap-1 text-xs text-zinc-400 dark:text-white/30">
            <User className="w-3 h-3 shrink-0" />
            {u.gender.charAt(0).toUpperCase() + u.gender.slice(1)}
          </span>
        )}
        {langs.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-zinc-400 dark:text-white/30">
            <Globe className="w-3 h-3 shrink-0" />
            {langs.slice(0, 3).join(", ")}
            {langs.length > 3 ? ` +${langs.length - 3}` : ""}
          </span>
        )}
        {skills.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-zinc-400 dark:text-white/30">
            <Shield className="w-3 h-3 shrink-0" />
            {skills.length} skill{skills.length !== 1 ? "s" : ""}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs text-zinc-400 dark:text-white/30 ml-auto">
          <Calendar className="w-3 h-3 shrink-0" />
          {new Date(u.created_at || u.created_date).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────
const PAGE_SIZE = 20;

export default function AdminUsers() {
  const { t } = useLang();
  const { user: currentUser } = useAuth();

  // server-side data
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // search & filter state
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // add-user modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({ full_name: "", email: "", password: "", role: "user" });

  // stats (fetched separately without pagination so counts are always accurate)
  const [stats, setStats] = useState({ total: 0, admins: 0, verified: 0, unverified: 0 });

  // single effect — debounce only on search text; page/filter changes are instant
  useEffect(() => {
    const delay = search ? 300 : 0;
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: PAGE_SIZE,
        sort: sortBy,
        ...(search.trim() && { search: search.trim() }),
        ...(roleFilter !== "all" && { role: roleFilter }),
        ...(verifiedFilter !== "all" && { verified: verifiedFilter }),
        ...(genderFilter !== "all" && { gender: genderFilter }),
      });
      get(`/api/users?${params}`)
        .then((res) => {
          setUsers(res.data || []);
          setMeta({ total: res.total ?? 0, page: res.page ?? 1, totalPages: res.totalPages ?? 1 });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, delay);
    return () => clearTimeout(timer);
  }, [page, search, roleFilter, verifiedFilter, genderFilter, sortBy]);

  // fetch global stats once (no filters)
  useEffect(() => {
    Promise.all([
      get("/api/users?page=1&limit=1"),
      get("/api/users?page=1&limit=1&role=admin"),
      get("/api/users?page=1&limit=1&verified=verified"),
      get("/api/users?page=1&limit=1&verified=unverified"),
    ]).then(([all, admins, verified, unverified]) => {
      setStats({
        total: all.total,
        admins: admins.total,
        verified: verified.total,
        unverified: unverified.total,
      });
    }).catch(() => {});
  }, []);

  const filtered = users; // filtering is now server-side
  const totalUsers = stats.total;

  const anyFilterActive = roleFilter !== "all" || verifiedFilter !== "all" || genderFilter !== "all";
  const resetFilters = () => {
    setRoleFilter("all");
    setVerifiedFilter("all");
    setGenderFilter("all");
    setSortBy("newest");
    setPage(1);
  };

  const toggleRole = async (u) => {
    const newRole = u.role === "admin" ? "user" : "admin";
    if (!confirm(`Change ${u.full_name || u.email}'s role to ${newRole}?`)) return;
    await put(`/api/users/${u.id}`, { role: newRole });
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: newRole } : x)));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setCreating(true);
    try {
      const newUser = await post("/api/users", formData);
      setUsers([newUser, ...users]);
      setShowAddModal(false);
      setFormData({ full_name: "", email: "", password: "", role: "user" });
    } catch (err) {
      setFormError(err.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const inp =
    "w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white shadow-sm dark:shadow-none focus:outline-none focus:border-red-500/50";
  const lbl = "text-xs text-zinc-500 dark:text-white/40 block mb-1";

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 text-zinc-900 dark:text-white space-y-5">
      {/* ── stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Users" value={stats.total} icon={Users} accent="#6366f1" />
        <StatCard label="Admins" value={stats.admins} icon={Crown} accent="#ef4136" />
        <StatCard label="Verified" value={stats.verified} icon={UserCheck} accent="#10b981" />
        <StatCard label="Unverified" value={stats.unverified} icon={UserX} accent="#f59e0b" />
      </div>

      {/* ── search + actions bar ── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-white/30" />
          <input
            type="text"
            placeholder="Search by name, email, city, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-white/30 focus:outline-none focus:border-red-500/50 shadow-sm dark:shadow-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={[
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-all",
            showFilters || anyFilterActive
              ? "border-red-500/40 text-red-500 bg-red-500/5"
              : "border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-white/40 hover:border-zinc-400 dark:hover:border-white/30 hover:text-zinc-900 dark:hover:text-white",
          ].join(" ")}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {anyFilterActive && (
            <span className="w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: gradient }}>
              !
            </span>
          )}
        </button>

        <button
          onClick={() => setShowAddModal(true)}
          className="text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-600/20 hover:opacity-90"
          style={{ background: gradient }}
        >
          <Plus className="w-4 h-4" /> {t("admin", "add_user")}
        </button>
      </div>

      {/* ── filter panel ── */}
      {showFilters && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-xl p-4 space-y-4 shadow-sm dark:shadow-none">
          <div className="flex flex-wrap gap-4">
            {/* Role */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-zinc-500 dark:text-white/40 uppercase tracking-wider">Role</div>
              <div className="flex gap-1.5">
                {["all", "user", "admin"].map((r) => (
                  <FilterPill key={r} label={r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)} active={roleFilter === r} onClick={() => { setRoleFilter(r); setPage(1); }} />
                ))}
              </div>
            </div>

            {/* Verified */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-zinc-500 dark:text-white/40 uppercase tracking-wider">Verified</div>
              <div className="flex gap-1.5">
                {[["all", "All"], ["verified", "Verified"], ["unverified", "Unverified"]].map(([v, l]) => (
                  <FilterPill key={v} label={l} active={verifiedFilter === v} onClick={() => { setVerifiedFilter(v); setPage(1); }} />
                ))}
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-zinc-500 dark:text-white/40 uppercase tracking-wider">Gender</div>
              <div className="flex gap-1.5">
                {[["all", "All"], ["male", "Male"], ["female", "Female"], ["other", "Other"]].map(([v, l]) => (
                  <FilterPill key={v} label={l} active={genderFilter === v} onClick={() => { setGenderFilter(v); setPage(1); }} />
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-zinc-500 dark:text-white/40 uppercase tracking-wider">Sort</div>
              <div className="flex gap-1.5">
                {[["newest", "Newest"], ["oldest", "Oldest"], ["name", "Name A–Z"]].map(([v, l]) => (
                  <FilterPill key={v} label={l} active={sortBy === v} onClick={() => { setSortBy(v); setPage(1); }} />
                ))}
              </div>
            </div>
          </div>

          {anyFilterActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-white/30 hover:text-red-500 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset filters
            </button>
          )}
        </div>
      )}

      {/* ── result count ── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-400 dark:text-white/30">
          Showing <span className="font-semibold text-zinc-900 dark:text-white">{users.length}</span> of <span className="font-semibold text-zinc-900 dark:text-white">{meta.total}</span> users
          {meta.totalPages > 1 && <span> · page {meta.page} of {meta.totalPages}</span>}
        </p>
        {anyFilterActive && (
          <button type="button" onClick={resetFilters} className="text-xs text-red-500 hover:underline">
            Clear all
          </button>
        )}
      </div>

      {/* ── user list ── */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 dark:text-white/30">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No users match your filters.</p>
          </div>
        ) : (
          filtered.map((u) => (
            <UserCard
              key={u.id}
              u={u}
              currentUserId={currentUser?.id}
              onToggleRole={toggleRole}
            />
          ))
        )}
      </div>

      {/* ── pagination ── */}
      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        onPageChange={(p) => { setPage(p); fetchUsers(p); }}
        className="pt-2"
      />

      {/* ── add-user modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-zinc-900 dark:text-white">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("admin", "add_user")}</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-2.5 text-sm flex items-center justify-between">
                  {formError}
                  <button type="button" onClick={() => setFormError("")}><X className="w-4 h-4" /></button>
                </div>
              )}
              <div>
                <label className={lbl}>{t("profile", "first_name")} & {t("profile", "last_name")}</label>
                <input required className={inp} value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>{t("profile", "email")}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-white/20" />
                  <input required type="email" className={inp + " pl-10"} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={lbl}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-white/20" />
                  <input required type="password" className={inp + " pl-10"} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={lbl}>Role</label>
                <select className={inp + " appearance-none"} value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full disabled:opacity-50 text-white font-bold py-3 rounded-lg text-sm tracking-wider uppercase mt-2 transition-all shadow-lg shadow-red-600/20 hover:opacity-90"
                style={{ background: gradient }}
              >
                {creating ? "Creating…" : "Create User"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
