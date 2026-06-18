import React, { useState } from "react";
import { get, post, put, del, resolveImageUrl } from "@/api/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLang } from "@/hooks/useLang";
import { Search, Plus, Edit2, Trash2, Eye, Film, Armchair, CheckCircle2, FolderOpen } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { Link } from "react-router-dom";

function ProjectStatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-xl p-4 flex items-center gap-3 shadow-sm dark:shadow-none">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: accent + "18" }}>
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <div>
        <div className="font-bold text-zinc-900 dark:text-white leading-none">{value}</div>
        <div className="text-xs text-zinc-400 dark:text-white/30 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

const STATUS_COLORS = { 
  open: "text-green-400 bg-green-400/10 border-green-400/20", 
  full: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", 
  closed: "text-red-400 bg-red-400/10 border-red-400/20", 
  draft: "text-white/30 bg-white/5 border-white/10", 
  archived: "text-white/20 bg-white/5 border-white/5" 
};

const TYPE_LABELS = { movie: "Film", tv_series: "TV Series", commercial: "Commercial", documentary: "Documentary", music_video: "Music Video", other: "Other", live_casting: "Live Casting" };

const gradient = "linear-gradient(135deg, #ef4136, #fbb040)";

export default function AdminProjects() {
  const { t } = useLang();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [projPage, setProjPage] = useState(1);
  const PROJ_PAGE_SIZE = 15;
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    try {
      await del(`/api/projects/${confirmDelete.id}`);
      queryClient.setQueryData(['admin', 'projects'], (old) =>
        old ? old.filter((p) => p.id !== confirmDelete.id) : old
      );
    } catch (err) {
      alert(err.message || "Failed to delete project");
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['admin', 'projects'],
    queryFn: () => get('/api/projects?sort=-created_at'),
  });

  const { data: positions = [] } = useQuery({
    queryKey: ['admin', 'positions'],
    queryFn: () => get('/api/positions'),
  });

  const filteredProjects = projects.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
                       p.director?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchType = typeFilter === "all" || p.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const projTotalPages = Math.ceil(filteredProjects.length / PROJ_PAGE_SIZE);
  const pagedProjects = filteredProjects.slice((projPage - 1) * PROJ_PAGE_SIZE, projPage * PROJ_PAGE_SIZE);

  const getSpots = (projectId) => {
    const pos = positions.filter(p => p.project_id === projectId);
    const total = pos.reduce((a, b) => a + (b.spots_total || 0), 0);
    const filled = pos.reduce((a, b) => a + (b.spots_filled || 0), 0);
    return { total, available: Math.max(0, total - filled), count: pos.length };
  };

  // project stats
  const openProjects = projects.filter((p) => p.status === "open").length;
  const draftProjects = projects.filter((p) => p.status === "draft").length;
  const totalSpots = positions.reduce((a, b) => a + (b.spots_total || 0), 0);
  const filledSpots = positions.reduce((a, b) => a + (b.spots_filled || 0), 0);

  if (isLoading) return <div className="h-64 flex items-center justify-center"><div className="w-6 h-6 border-2 border-white/10 border-t-red-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* project stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ProjectStatCard label="Total Projects" value={projects.length} icon={Film} accent="#6366f1" />
        <ProjectStatCard label="Open" value={openProjects} icon={FolderOpen} accent="#10b981" />
        <ProjectStatCard label="Drafts" value={draftProjects} icon={Edit2} accent="#f59e0b" />
        <ProjectStatCard label="Spots Filled" value={`${filledSpots} / ${totalSpots}`} icon={Armchair} accent="#ef4136" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex flex-1 w-full gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-white/30" />
            <input
              type="text"
              placeholder="Search projects by name or director..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setProjPage(1); }}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-white/30 focus:outline-none focus:border-red-500/50 transition-colors shadow-sm dark:shadow-none"
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setProjPage(1); }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-red-500/50 shadow-sm dark:shadow-none appearance-none"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="full">Full</option>
            <option value="closed">Closed</option>
            <option value="draft">Draft</option>
          </select>
          <select 
            value={typeFilter} 
            onChange={(e) => { setTypeFilter(e.target.value); setProjPage(1); }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-red-500/50 shadow-sm dark:shadow-none appearance-none"
          >
            <option value="all">All Types</option>
            {Object.entries(TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <Link to="/admin/projects/new" className="text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-600/20 hover:opacity-90" style={{ background: gradient }}>
          <Plus className="w-4 h-4" /> New Project
        </Link>
      </div>

      {/* Projects List */}
      <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-white/5 text-[10px] uppercase tracking-widest text-zinc-500 dark:text-white/40 font-black border-b border-zinc-200 dark:border-white/5">
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Spots</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
              {pagedProjects.map((p) => {
                const { available, total, count } = getSpots(p.id);
                return (
                  <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {p.image_url ? (
                          <img src={resolveImageUrl(p.image_url)} className="w-10 h-10 rounded-lg object-cover" alt="" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-300 dark:text-white/20"><Film className="w-5 h-5" /></div>
                        )}
                        <div>
                          <p className="font-bold text-sm text-zinc-900 dark:text-white">{p.name}</p>
                          <p className="text-xs text-zinc-500 dark:text-white/30">{p.director || "No director"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-zinc-600 dark:text-white/60">{TYPE_LABELS[p.type] || p.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md border ${STATUS_COLORS[p.status] || STATUS_COLORS.draft}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-xs font-bold text-zinc-900 dark:text-white">
                        {total > 0 ? (
                          <span className={available > 0 ? "text-green-400" : "text-red-400"}>
                            {total - available} / {total}
                          </span>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 dark:text-white/30 uppercase">{count} roles</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/projects/${p.id}`} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white" title="View Public Page">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link to={`/admin/projects/${p.id}/edit`} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white" title="Edit Project">
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setConfirmDelete(p)}
                          disabled={deletingId === p.id}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg transition-colors text-zinc-500 dark:text-white/40 hover:text-red-400 disabled:opacity-40"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pagedProjects.length === 0 && !isLoading && (
          <div className="p-12 text-center text-white/20">
            <Film className="w-10 h-10 mx-auto mb-4 opacity-10" />
            <p className="text-sm font-medium">No projects found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* ── pagination ── */}
      {projTotalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-white/30">
          <span>
            Showing {(projPage - 1) * PROJ_PAGE_SIZE + 1}–{Math.min(projPage * PROJ_PAGE_SIZE, filteredProjects.length)} of {filteredProjects.length}
          </span>
          <Pagination page={projPage} totalPages={projTotalPages} onPageChange={setProjPage} />
        </div>
      )}

      {/* ── delete confirmation modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-zinc-900 dark:text-white">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-center mb-1">Delete project?</h3>
            <p className="text-sm text-zinc-500 dark:text-white/40 text-center mb-6">
              <span className="font-semibold text-zinc-900 dark:text-white">"{confirmDelete.name}"</span> will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 text-sm font-semibold text-zinc-600 dark:text-white/60 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!!deletingId}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {deletingId ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}