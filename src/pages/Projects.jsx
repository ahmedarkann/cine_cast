import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { get, post, setToken, clearToken, uploadFile, resolveImageUrl } from '@/api/api';
import { useQuery } from "@tanstack/react-query";
import { useLang } from "@/hooks/useLang";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Search, MapPin, Calendar, Users, Film, ArrowRight } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { motion } from "framer-motion";

const TYPE_OPTIONS = ["all", "movie", "tv_series", "commercial", "documentary", "music_video", "other", "live_casting"];
const TYPE_LABELS = { movie: "Film", tv_series: "TV Series", commercial: "Commercial", documentary: "Documentary", music_video: "Music Video", other: "Other", live_casting: "Live Casting" };
const STATUS_COLORS = { open: "text-green-400", full: "text-yellow-400", closed: "text-red-400", draft: "text-white/40", archived: "text-white/30" };

export default function Projects() {
  const { t } = useLang();
  usePageMeta({ title: "Browse Productions", description: "Browse open film, TV, and commercial casting calls in Slovakia." });
  const [projects, setProjects] = useState([]);
  const [positions, setPositions] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [pubPage, setPubPage] = useState(1);
  const PUB_PAGE_SIZE = 12;

  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects', 'open', 'all'],
    queryFn: () => get('/api/projects?status=open&sort=-created_at'),
  });

  const { data: positionsData, isLoading: isLoadingPositions } = useQuery({
    queryKey: ['positions', 'all'],
    queryFn: () => get('/api/positions?sort=-created_at&limit=200'),
  });

  useEffect(() => {
    setProjects(projectsData || []);
    setPositions(positionsData || []);
    setLoading(isLoadingProjects || isLoadingPositions);
  }, [projectsData, positionsData, isLoadingProjects, isLoadingPositions]);

  const spotsForProject = (projectId) => {
    const pos = positions.filter((p) => p.project_id === projectId);
    const total = pos.reduce((a, b) => a + (b.spots_total || 0), 0);
    const filled = pos.reduce((a, b) => a + (b.spots_filled || 0), 0);
    return { total, available: Math.max(0, total - filled), count: pos.length };
  };

  const filtered = projects.filter((p) => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.short_description?.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || p.type === typeFilter;
    return matchSearch && matchType;
  });

  const pubTotalPages = Math.ceil(filtered.length / PUB_PAGE_SIZE);
  const pagedProjects = filtered.slice((pubPage - 1) * PUB_PAGE_SIZE, pubPage * PUB_PAGE_SIZE);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white pt-6 pb-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <p className="text-red-500 text-xs font-bold tracking-widest uppercase mb-1">{t("projects", "subtitle")}</p>
          <h1 className="text-3xl font-black tracking-tight uppercase text-zinc-900 dark:text-white">{t("projects", "title")}</h1>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 mb-8">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-white/25 pointer-events-none" />
            <input
              type="text"
              placeholder={t("projects", "search_placeholder")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPubPage(1); }}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-white/25 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/15 transition-colors"
            />
          </div>
          {/* Type filter rail */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1 pb-0.5">
            {TYPE_OPTIONS.map((type) => {
              const active = typeFilter === type;
              return (
                <button
                  key={type}
                  onClick={() => { setTypeFilter(type); setPubPage(1); }}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase transition-all ${
                    active
                      ? "bg-red-600 text-white"
                      : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-white/25"
                  }`}
                >
                  {type === "all" ? t("projects", "filter_all") : TYPE_LABELS[type]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-zinc-900 dark:text-white">
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="bg-zinc-200 dark:bg-zinc-900 rounded-2xl h-80 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-zinc-400 dark:text-white/40">
            <Film className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">{t("projects", "no_results")}</p>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pagedProjects.map((project) => {
              const { available, total, count } = spotsForProject(project.id);
              const isFull = available <= 0 && total > 0;
              return (
                <Link key={project.id} to={`/projects/${project.id}`}>
                  <motion.div
                    whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.18)" }}
                    transition={{ type: "spring", stiffness: 340, damping: 26 }}
                    className="overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] h-full flex flex-col cursor-pointer"
                  >
                    {/* Image */}
                    <div className="relative h-56 shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      {project.image_url ? (
                        <img src={resolveImageUrl(project.image_url)} alt={project.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-white/10">
                          <Film className="w-14 h-14" />
                        </div>
                      )}
                      {/* Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                      {/* Type badge — top left */}
                      <div className="absolute top-3 left-3">
                        <span className="bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {TYPE_LABELS[project.type] || project.type}
                        </span>
                      </div>

                      {/* Status badge — top right */}
                      <div className="absolute top-3 right-3">
                        {isFull ? (
                          <span className="bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Full</span>
                        ) : total > 0 ? (
                          <span className="bg-green-500/80 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">{available} open</span>
                        ) : null}
                      </div>

                      {/* Bottom-left: location on image */}
                      {project.location && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white/80 text-xs">
                          <MapPin className="w-3 h-3" />
                          {project.location}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1 gap-3">
                      <div>
                        <h3 className="font-bold text-base text-zinc-900 dark:text-white leading-snug">{project.name}</h3>
                        {project.short_description && (
                          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 line-clamp-2 leading-relaxed">{project.short_description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500 mt-auto">
                        {project.shooting_start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />{project.shooting_start_date}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />{count} {t("projects", "positions")}
                        </span>
                      </div>

                      {/* CTA row */}
                      <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-white/[0.06]">
                        <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                          {project.status === "open" ? "Accepting applications" : project.status}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold text-red-500 group-hover:gap-2 transition-all">
                          View <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          <Pagination
            page={pubPage}
            totalPages={pubTotalPages}
            onPageChange={setPubPage}
            className="mt-10"
          />
          </>
        )}
      </div>
    </div>
  );
}