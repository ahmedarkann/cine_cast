import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { get, post, setToken, clearToken, uploadFile, resolveImageUrl } from '@/api/api';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { useQuery } from "@tanstack/react-query";
import { useLang } from "@/hooks/useLang";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ArrowLeft, MapPin, Calendar, Users, Building, User, ChevronDown, ChevronUp, Film, Image, Clock, CheckCircle2 } from "lucide-react";
import ApplyModal from "@/components/ApplyModal";

const gradient = "linear-gradient(135deg, #ef4136, #fbb040)";

const TYPE_LABELS = { movie: "Film", tv_series: "TV Series", commercial: "Commercial", documentary: "Documentary", music_video: "Music Video", other: "Other", live_casting: "Live Casting" };
const GENDER_LABELS = { any: "Any", male: "Male / Muž", female: "Female / Žena" };

export default function ProjectDetail() {
  const { id } = useParams();
  const { t } = useLang();
  const [project, setProject] = useState(null);
  usePageMeta({
    title: project?.name || "Production",
    description: project?.description
      ? project.description.slice(0, 150)
      : "View casting details and apply for roles in this production.",
  });
  const [positions, setPositions] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [expandedPos, setExpandedPos] = useState(null);
  const [applyModal, setApplyModal] = useState(null); // position object, { liveCasting: true, slot }, or null
  const [selectedDate, setSelectedDate] = useState(null);

  const { data: projectData, isLoading: isLoadingProject } = useQuery({
    queryKey: ['projects', id],
    queryFn: () => get(`/api/projects?id=${id}`).then(res => res[0]), // API returns array, take first
    enabled: !!id, // Only run query if id is available
  });

  const { data: positionsData, isLoading: isLoadingPositions } = useQuery({
    queryKey: ['positions', 'byProject', id],
    queryFn: () => get(`/api/positions?project_id=${id}`),
    enabled: !!id, // Only run query if id is available
  });

  const isLiveCasting = projectData?.type === 'live_casting';
  const { data: slotsData } = useQuery({
    queryKey: ['casting-slots', 'byProject', id],
    queryFn: () => get(`/api/casting-slots?project_id=${id}`),
    enabled: !!id && isLiveCasting,
  });

  useEffect(() => {
    setProject(projectData || null);
    setPositions(positionsData || []);
    setLoading(isLoadingProject || isLoadingPositions);
  }, [id, projectData, positionsData, isLoadingProject, isLoadingPositions]);

  const openSlots = (slotsData || []).filter((s) => s.status === 'open');

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-white/10 border-t-red-500 rounded-full animate-spin" />
    </div>
  );

  if (!project) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white/50">
      Project not found. <Link to="/projects" className="ml-2 text-red-400 hover:underline">Back to projects</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white">
      {/* Hero image */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        {project.image_url ? (
          <img src={resolveImageUrl(project.image_url)} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
            <Film className="w-20 h-20 text-white/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-6 left-0 right-0 px-4 max-w-5xl mx-auto">
          <Link to="/projects" className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-white/50 hover:text-zinc-900 dark:hover:text-white mb-3 transition-colors">
            <ArrowLeft className="w-3 h-3" /> {t("project_detail", "back")}
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-red-600/80 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
              {TYPE_LABELS[project.type] || project.type}
            </span>
            <span className={`text-xs font-bold uppercase tracking-wider ${project.status === "open" ? "text-green-400" : "text-zinc-500 dark:text-white/40"}`}>
              ● {project.status}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase text-zinc-900 dark:text-white">{project.name}</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Main content */}
        <div className="md:col-span-2 space-y-8">
          {project.short_description && (
            <p className="text-lg text-zinc-700 dark:text-white/70 leading-relaxed">{project.short_description}</p>
          )}
          {project.full_description && (
            <p className="text-zinc-600 dark:text-white/50 leading-relaxed">{project.full_description}</p>
          )}

          {/* Positions */}
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-red-500" /> {t("project_detail", "positions_title")}
            </h2>
            {isLiveCasting ? (() => {
              const allSlots = slotsData || [];
              // Group slots by date
              const byDate = allSlots.reduce((acc, s) => {
                if (!acc[s.slot_date]) acc[s.slot_date] = [];
                acc[s.slot_date].push(s);
                return acc;
              }, {});
              const dates = Object.keys(byDate).sort();
              const activeDateKey = selectedDate || dates[0] || null;
              const slotsForDate = activeDateKey ? byDate[activeDateKey] || [] : [];
              const totalOpen = allSlots.filter(s => s.status === 'open').length;
              const totalSlots = allSlots.length;

              return (
                <div className="space-y-4">
                  {/* Summary bar */}
                  <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-xl px-5 py-4 shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{totalOpen} <span className="font-normal text-zinc-500 dark:text-white/40">open slots</span></span>
                    </div>
                    <div className="h-4 w-px bg-zinc-200 dark:bg-white/10" />
                    <div className="flex-1 bg-zinc-100 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: totalSlots ? `${((totalSlots - totalOpen) / totalSlots) * 100}%` : '0%' }} />
                    </div>
                    <span className="text-xs text-zinc-400 dark:text-white/30 tabular-nums">{totalSlots - totalOpen}/{totalSlots} booked</span>
                  </div>

                  {totalSlots === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-xl p-8 text-center shadow-sm dark:shadow-none text-zinc-400 dark:text-white/30">
                      <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No time slots have been set up for this casting yet.</p>
                    </div>
                  ) : (
                    <>
                      {/* Date tabs */}
                      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                        {dates.map((d) => {
                          const dayOpen = byDate[d].filter(s => s.status === 'open').length;
                          const isActive = (activeDateKey === d);
                          const dateObj = new Date(d + 'T00:00:00');
                          return (
                            <button
                              key={d}
                              onClick={() => setSelectedDate(d)}
                              className={`shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                                isActive
                                  ? 'text-white border-transparent shadow-lg shadow-red-600/20'
                                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/30'
                              }`}
                              style={isActive ? { background: gradient } : {}}
                            >
                              <span className="uppercase tracking-wider text-[10px]">{dateObj.toLocaleDateString('en', { weekday: 'short' })}</span>
                              <span className="text-base font-black leading-none my-0.5">{dateObj.getDate()}</span>
                              <span className="text-[10px] uppercase tracking-wider">{dateObj.toLocaleDateString('en', { month: 'short' })}</span>
                              {dayOpen > 0
                                ? <span className="mt-1 text-[9px] font-black">{dayOpen} open</span>
                                : <span className="mt-1 text-[9px] font-black opacity-60">full</span>}
                            </button>
                          );
                        })}
                      </div>

                      {/* Slot grid for active date */}
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-xl p-5 shadow-sm dark:shadow-none">
                        <p className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-white/30 mb-4">
                          {activeDateKey ? new Date(activeDateKey + 'T00:00:00').toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                          {slotsForDate.map((slot) => {
                            const isOpen = slot.status === 'open';
                            return (
                              <button
                                key={slot.id}
                                disabled={!isOpen}
                                onClick={() => setApplyModal({ liveCasting: true, slot })}
                                className={`relative flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                                  isOpen
                                    ? 'bg-green-50 dark:bg-green-500/5 border-green-400/30 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/10 hover:border-green-400/60 hover:scale-105 cursor-pointer'
                                    : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-white/5 text-zinc-300 dark:text-white/15 cursor-not-allowed'
                                }`}
                              >
                                <span className="tabular-nums">{slot.start_time}</span>
                                <span className="text-[10px] opacity-60 tabular-nums">–{slot.end_time}</span>
                                {!isOpen && (
                                  <span className="text-[9px] font-black uppercase tracking-wider mt-1 opacity-50">Booked</span>
                                )}
                                {isOpen && (
                                  <span className="text-[9px] font-black uppercase tracking-wider mt-1 text-green-500">Available</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {slotsForDate.every(s => s.status !== 'open') && (
                          <p className="text-center text-xs text-zinc-400 dark:text-white/30 mt-4">All slots on this date are booked.</p>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400 dark:text-white/30 text-center">
                        Click an available time slot to book your audition.
                      </p>
                    </>
                  )}
                </div>
              );
            })() : positions.length === 0 && !loading ? (
              <p className="text-white/30 text-sm">No positions available.</p>
            ) : (
              <div className="space-y-4">
                {positions.map((pos) => {
                  const available = Math.max(0, (pos.spots_total || 0) - (pos.spots_filled || 0));
                  const isFull = pos.spots_total > 0 && available === 0;
                  const isExpanded = expandedPos === pos.id;
                  return (
                    <div key={pos.id} className={`bg-white dark:bg-zinc-900 border rounded-xl overflow-hidden transition-all shadow-sm dark:shadow-none ${isFull ? "border-zinc-200 dark:border-white/10 opacity-70" : "border-zinc-200 dark:border-white/10 hover:border-red-500/30"}`}>
                      <button
                        className="w-full flex items-center justify-between p-5 text-left"
                        onClick={() => setExpandedPos(isExpanded ? null : pos.id)}
                      >
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-base text-zinc-900 dark:text-white">{pos.title}</h3>
                            {isFull ? (
                              <span className="text-xs bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-bold uppercase">{t("project_detail", "full")}</span>
                            ) : (
                              <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded font-bold">{available} {t("project_detail", "spots")}</span>
                            )}
                          </div>
                          {pos.shooting_date && (
                            <div className="text-xs text-zinc-500 dark:text-white/40 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {pos.shooting_date}
                            </div>
                          )}
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500 dark:text-white/40 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-500 dark:text-white/40 shrink-0" />}
                      </button>

                      {isExpanded && (
                        <div className="px-5 pb-5 border-t border-zinc-200 dark:border-white/5 pt-4 space-y-4 text-zinc-900 dark:text-white">
                          {pos.description && <p className="text-zinc-600 dark:text-white/60 text-sm">{pos.description}</p>}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-zinc-900 dark:text-white">
                            {pos.age_min && pos.age_max && (
                              <div><span className="text-zinc-400 dark:text-white/30 block mb-0.5">{t("project_detail", "age")}</span><span>{pos.age_min}–{pos.age_max}</span></div>
                            )}
                            {pos.gender && (
                              <div><span className="text-zinc-400 dark:text-white/30 block mb-0.5">{t("project_detail", "gender")}</span><span>{GENDER_LABELS[pos.gender] || pos.gender}</span></div>
                            )}
                            {pos.location && (
                              <div><span className="text-zinc-400 dark:text-white/30 block mb-0.5">{t("project_detail", "location")}</span><span>{pos.location}</span></div>
                            )}
                            {pos.compensation && (
                              <div><span className="text-white/30 block mb-0.5">{t("project_detail", "compensation")}</span><span className="text-green-400 font-semibold">{pos.compensation}</span></div>
                            )}
                          </div>
                          {pos.required_skills?.length > 0 && (
                            <div>
                              <span className="text-zinc-400 dark:text-white/30 text-xs block mb-1">{t("project_detail", "skills")}</span>
                              <div className="flex flex-wrap gap-1">
                                {pos.required_skills.map((s) => <span key={s} className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs px-2 py-0.5 rounded">{s}</span>)}
                              </div>
                            </div>
                          )}
                          {pos.notes && <p className="text-zinc-500 dark:text-white/40 text-xs italic">{pos.notes}</p>}
                          <button
                            onClick={() => setApplyModal(pos)}
                            className={`w-full py-3 rounded-lg text-sm font-bold tracking-wider uppercase transition-all ${
                              isFull
                                ? "bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-white/40 hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white shadow-sm dark:shadow-none"
                                : "text-white shadow-lg shadow-red-600/20 hover:opacity-90"
                            }`}
                            style={!isFull ? { background: gradient } : {}}
                          >
                            {isFull ? t("project_detail", "waitlist") : t("project_detail", "apply")}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* Gallery */}
          {(project.project_gallery || []).length > 0 && (
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight mb-6 flex items-center gap-2">
                <Image className="w-5 h-5 text-red-500" /> Gallery
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {project.project_gallery.map((url, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl overflow-hidden cursor-pointer group relative"
                    onClick={() => setLightboxIndex(i)}
                  >
                    <img src={resolveImageUrl(url)} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl p-5 space-y-4 shadow-sm dark:shadow-none">
            {project.director && (
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-zinc-400 dark:text-white/30 text-xs mb-0.5">{t("project_detail", "director")}</p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">{project.director}</p>
                </div>
              </div>
            )}
            {project.production_company && (
              <div className="flex items-start gap-3">
                <Building className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-zinc-400 dark:text-white/30 text-xs mb-0.5">{t("project_detail", "company")}</p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">{project.production_company}</p>
                </div>
              </div>
            )}
            {project.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-zinc-400 dark:text-white/30 text-xs mb-0.5">{t("project_detail", "location")}</p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">{project.location}</p>
                </div>
              </div>
            )}
            {(project.shooting_start_date || project.shooting_end_date) && (
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-zinc-400 dark:text-white/30 text-xs mb-0.5">{t("project_detail", "shooting")}</p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">{project.shooting_start_date}{project.shooting_end_date ? ` – ${project.shooting_end_date}` : ""}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Lightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        slides={(project.project_gallery || []).map(url => ({ src: resolveImageUrl(url) }))}
      />

      {applyModal && (
        <ApplyModal
          position={isLiveCasting ? undefined : applyModal}
          slots={isLiveCasting ? openSlots : undefined}
          preselectedSlot={isLiveCasting ? applyModal?.slot : undefined}
          roles={isLiveCasting ? positions : undefined}
          project={project}
          onClose={() => setApplyModal(null)}
        />
      )}
    </div>
  );
}