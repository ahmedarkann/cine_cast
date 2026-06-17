import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { get, post, del, resolveImageUrl } from "@/api/api";
import { useQuery } from "@tanstack/react-query";
import { useLang } from "@/hooks/useLang";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import {
  User, Mail, Phone, MapPin, Film, CheckCircle, XCircle, Clock,
  AlertCircle, Image, ChevronLeft, Ruler, Sparkles,
  BadgeCheck, Inbox, FileText, IdCard, Lock, Eye, EyeOff, ShieldCheck, Loader2,
} from "lucide-react";
import { useState as useLocalState } from "react";
import { useAuth } from "@/lib/AuthContext";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-400/10 border-yellow-200 dark:border-yellow-400/20", icon: Clock },
  accepted: { label: "Accepted", color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-400/10 border-green-200 dark:border-green-400/20", icon: CheckCircle },
  rejected: { label: "Rejected", color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-400/10 border-red-200 dark:border-red-400/20", icon: XCircle },
  waitlist: { label: "Waitlist", color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-400/10 border-blue-200 dark:border-blue-400/20", icon: AlertCircle },
  cancelled: { label: "Cancelled", color: "text-zinc-500 dark:text-white/30 bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/10", icon: XCircle },
};

function computeAge(birthdate) {
  if (!birthdate) return null;
  const dob = new Date(birthdate);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

function InfoField({ label, value }) {
  return (
    <div>
      <span className="text-zinc-500 dark:text-white/40 block text-xs uppercase tracking-wide mb-1">{label}</span>
      <p className="font-semibold text-zinc-900 dark:text-white">{value}</p>
    </div>
  );
}

function SectionCard({ icon: Icon, title, accent, children }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-none">
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

const gradient = "linear-gradient(135deg, #ef4136, #fbb040)";

function AdminSetPasswordCard({ userId }) {
  const [newPass, setNewPass] = useLocalState("");
  const [show, setShow] = useLocalState(false);
  const [loading, setLoading] = useLocalState(false);
  const [success, setSuccess] = useLocalState(false);
  const [error, setError] = useLocalState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(false);
    if (newPass.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      await post(`/api/users/${userId}/set-password`, { newPassword: newPass });
      setSuccess(true); setNewPass("");
    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard icon={ShieldCheck} title="Set Password" accent="bg-red-500/10 text-red-600 dark:text-red-400">
      <p className="text-sm text-zinc-500 dark:text-white/40 mb-4">
        As an admin you can set a new password for this user without requiring their current one.
      </p>
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-sm font-medium mb-4">
          <CheckCircle className="w-4 h-4 shrink-0" /> Password updated successfully.
        </div>
      )}
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm mb-4">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-zinc-500 dark:text-white/40 uppercase tracking-wider">New password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-white/20" />
            <input
              type={show ? "text" : "password"}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Min. 8 characters"
              required
              className="w-full h-10 pl-9 pr-10 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-white/20 focus:outline-none focus:border-red-500/50 transition-colors"
            />
            <button type="button" tabIndex={-1} onClick={() => setShow(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-white/20 hover:text-zinc-700 dark:hover:text-white/60 transition-colors">
              {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="h-10 px-5 flex items-center gap-2 rounded-lg text-white text-sm font-bold uppercase tracking-wide transition-all hover:opacity-90 disabled:opacity-50 shadow-lg shadow-red-600/20 whitespace-nowrap"
          style={{ background: gradient }}>
          {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : "Set Password"}
        </button>
      </form>
    </SectionCard>
  );
}

export default function AdminUserDetail() {
  const { userId } = useParams();
  const { t } = useLang();
  const navigate = useNavigate();
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState("profile");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user: currentUser, isLoadingAuth, authChecked } = useAuth();

  const GENDER_LABELS = {
    any: t("admin", "gender_any"),
    male: t("admin", "gender_male"),
    female: t("admin", "gender_female"),
  };

  // Redirect if not admin
  useEffect(() => {
    if (authChecked && !isLoadingAuth && currentUser?.role !== 'admin') {
      navigate('/dashboard');
    } else if (authChecked && !isLoadingAuth && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, isLoadingAuth, authChecked, navigate]);

  const { data: userDetail, isLoading: isLoadingUserDetail, isError: isUserError, error: userError } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => get(`/api/users/${userId}`),
    enabled: !!userId && currentUser?.role === 'admin',
  });

  const { data: applicationsData, isLoading: isLoadingApplications } = useQuery({
    queryKey: ['applications', 'user', userId],
    queryFn: () => get(`/api/applications?user_id=${userId}&sort=-created_at`),
    enabled: !!userId && currentUser?.role === 'admin',
  });

  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects', 'all'],
    queryFn: () => get('/api/projects'),
    enabled: !!userId && currentUser?.role === 'admin',
  });

  const { data: positionsData, isLoading: isLoadingPositions } = useQuery({
    queryKey: ['positions', 'all'],
    queryFn: () => get('/api/positions'),
    enabled: !!userId && currentUser?.role === 'admin',
  });

  const isLoading = isLoadingUserDetail || isLoadingApplications || isLoadingProjects || isLoadingPositions || isLoadingAuth;

  const getProject = (id) => projectsData?.find((p) => p.id === id);
  const getPosition = (id) => positionsData?.find((p) => p.id === id);

  const filteredApps = applicationsData?.filter((app) => {
    const project = getProject(app.project_id);
    const position = getPosition(app.position_id);
    const matchSearch = project?.name?.toLowerCase().includes(search.toLowerCase()) ||
                       position?.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || app.status === statusFilter;
    return matchSearch && matchStatus;
  }) || [];

  const handleDeleteUser = async () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleting(true);
    try {
      await del(`/api/admin/users/${userId}`);
      navigate("/admin/users");
    } catch {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-200 dark:border-white/10 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (isUserError && userError.status === 404) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center text-zinc-500 dark:text-white/50">
        {t("admin", "user_not_found")} <Link to="/admin/users" className="ml-2 text-red-500 dark:text-red-400 hover:underline">{t("admin", "back_to_users")}</Link>
      </div>
    );
  }

  const age = computeAge(userDetail.birthdate);
  const na = t("admin", "not_available");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/admin/users" className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-white/50 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <ChevronLeft className="w-3 h-3" /> {t("admin", "back_to_users")}
          </Link>
          {userDetail && userDetail.role !== "admin" && (
            <button
              onClick={handleDeleteUser}
              disabled={deleting}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${deleteConfirm ? "bg-red-600 text-white shadow-lg shadow-red-600/30 animate-pulse" : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20"}`}
            >
              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
              {deleteConfirm ? "Confirm Delete" : "Delete User"}
            </button>
          )}
        </div>

        {/* Profile summary header */}
        <div className="relative overflow-hidden rounded-2xl mb-8 border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm dark:shadow-none">
          <div className="h-20 sm:h-24 w-full" style={{ background: "linear-gradient(135deg, #ef4136, #fbb040)" }} />
          <div className="px-6 sm:px-8 pb-6 -mt-10 sm:-mt-12 flex flex-col sm:flex-row sm:items-end gap-5">
            {userDetail.profile_image_url ? (
              <img
                src={resolveImageUrl(userDetail.profile_image_url)}
                alt="Profile"
                className="w-24 h-24 rounded-2xl object-cover cursor-pointer border-4 border-white dark:border-zinc-900 shadow-md shrink-0"
                onClick={() => setLightboxIndex(0)}
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center shrink-0 border-4 border-white dark:border-zinc-900 shadow-md bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-white/30">
                <User className="w-10 h-10" />
              </div>
            )}
            <div className="flex-1 min-w-0 pt-2 sm:pt-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-zinc-900 dark:text-white truncate">
                  {userDetail.full_name || userDetail.email}
                </h1>
                {userDetail.role === "admin" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                    <BadgeCheck className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-white/50">
                <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{userDetail.email}</span>
                {userDetail.phone && <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{userDetail.phone}</span>}
                {userDetail.city && <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{userDetail.city}{userDetail.country ? `, ${userDetail.country}` : ""}</span>}
              </div>
            </div>
            <div className="flex gap-3 sm:gap-4 shrink-0 sm:pt-0">
              {age != null && (
                <div className="text-center px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 min-w-[64px]">
                  <div className="text-lg font-black leading-none">{age}</div>
                  <div className="text-[10px] uppercase text-zinc-500 dark:text-white/40 mt-1">{t("admin", "years_old")}</div>
                </div>
              )}
              {userDetail.created_at && (
                <div className="text-center px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 min-w-[88px]">
                  <div className="text-sm font-bold leading-none">{new Date(userDetail.created_at).toLocaleDateString()}</div>
                  <div className="text-[10px] uppercase text-zinc-500 dark:text-white/40 mt-1">{t("admin", "member_since")}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-1 mb-8 bg-zinc-200/70 dark:bg-zinc-900 p-1.5 rounded-xl w-fit overflow-x-auto border border-zinc-200 dark:border-white/5">
          <button onClick={() => setActiveTab("profile")}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold uppercase transition-all duration-200 whitespace-nowrap ${activeTab === "profile" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"}`}>
            <User className="w-4 h-4" /> {t("nav", "profile")}
          </button>
          <button onClick={() => setActiveTab("applications")}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold uppercase transition-all duration-200 whitespace-nowrap ${activeTab === "applications" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"}`}>
            <Film className="w-4 h-4" /> {t("admin", "tab_applications")}
          </button>
        </div>

        {activeTab === "profile" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <SectionCard icon={IdCard} title={t("profile", "tab_personal")} accent="bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                  <InfoField label={t("admin", "full_name")} value={userDetail.full_name || na} />
                  <InfoField label={t("admin", "email")} value={userDetail.email} />
                  <InfoField label={t("admin", "phone")} value={userDetail.phone || na} />
                  <InfoField label={t("admin", "city")} value={userDetail.city || na} />
                  <InfoField label={t("admin", "country")} value={userDetail.country || na} />
                  <InfoField label={t("admin", "birthdate")} value={userDetail.birthdate || na} />
                  <InfoField label={t("admin", "gender")} value={GENDER_LABELS[userDetail.gender] || na} />
                </div>
                {userDetail.bio && (
                  <div className="pt-5 mt-5 border-t border-zinc-100 dark:border-white/5">
                    <span className="text-zinc-500 dark:text-white/40 block text-xs uppercase tracking-wide mb-1">{t("admin", "bio")}</span>
                    <p className="text-sm leading-relaxed text-zinc-700 dark:text-white/80">{userDetail.bio}</p>
                  </div>
                )}
              </SectionCard>

              <SectionCard icon={Ruler} title={t("profile", "tab_appearance")} accent="bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                  <InfoField label={t("admin", "height")} value={userDetail.height ? `${userDetail.height} cm` : na} />
                  <InfoField label={t("admin", "weight")} value={userDetail.weight ? `${userDetail.weight} kg` : na} />
                  <InfoField label={t("admin", "hair_color")} value={userDetail.hair_color || na} />
                  <InfoField label={t("admin", "eye_color")} value={userDetail.eye_color || na} />
                  <InfoField label={t("admin", "clothing_size")} value={userDetail.clothing_size || na} />
                  <InfoField label={t("admin", "shoe_size")} value={userDetail.shoe_size || na} />
                </div>
              </SectionCard>

              {(userDetail.skills?.length > 0 || userDetail.languages?.length > 0) && (
                <SectionCard icon={Sparkles} title={t("profile", "tab_skills")} accent="bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <div className="space-y-5">
                    {userDetail.skills?.length > 0 && (
                      <div>
                        <span className="text-zinc-500 dark:text-white/40 block text-xs uppercase tracking-wide mb-2">{t("admin", "skills")}</span>
                        <div className="flex flex-wrap gap-2">
                          {userDetail.skills.map((s) => <span key={s} className="bg-purple-50 dark:bg-purple-400/10 border border-purple-200 dark:border-purple-400/20 text-sm px-3 py-1 rounded-full text-purple-700 dark:text-purple-300 font-medium">{s}</span>)}
                        </div>
                      </div>
                    )}
                    {userDetail.languages?.length > 0 && (
                      <div>
                        <span className="text-zinc-500 dark:text-white/40 block text-xs uppercase tracking-wide mb-2">{t("admin", "languages")}</span>
                        <div className="flex flex-wrap gap-2">
                          {userDetail.languages.map((l) => <span key={l} className="bg-blue-50 dark:bg-blue-400/10 border border-blue-200 dark:border-blue-400/20 text-sm px-3 py-1 rounded-full text-blue-700 dark:text-blue-300 font-medium">{l}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

              {userDetail.experience && (
                <SectionCard icon={FileText} title={t("profile", "tab_experience")} accent="bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-white/70 whitespace-pre-line">{userDetail.experience}</p>
                </SectionCard>
              )}
            </div>

            {/* Gallery */}
            <div className="space-y-6">
              <SectionCard icon={Image} title={t("profile", "tab_gallery")} accent="bg-pink-500/10 text-pink-600 dark:text-pink-400">
                {(userDetail.gallery || []).length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {userDetail.gallery.map((url, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setLightboxIndex(userDetail.profile_image_url ? i + 1 : i)}
                      >
                        <img src={resolveImageUrl(url)} alt={`Gallery image ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 px-2 rounded-xl border-2 border-dashed border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02]">
                    <Image className="w-9 h-9 mx-auto mb-3 text-zinc-300 dark:text-white/15" />
                    <p className="text-sm text-zinc-400 dark:text-white/30">{t("admin", "no_photos")}</p>
                  </div>
                )}
              </SectionCard>

            {/* ── set password ── */}
            <AdminSetPasswordCard userId={userId} />
            </div>
          </div>
        ) : (
          <SectionCard icon={Film} title={t("admin", "user_applications_title")} accent="bg-red-500/10 text-red-600 dark:text-red-400">
            {applicationsData?.length === 0 ? (
              <div className="text-center py-14 px-2 rounded-xl border-2 border-dashed border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02]">
                <Inbox className="w-10 h-10 mx-auto mb-3 text-zinc-300 dark:text-white/15" />
                <p className="text-sm text-zinc-400 dark:text-white/30">{t("admin", "no_user_applications")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applicationsData?.map((app) => {
                  const project = getProject(app.project_id);
                  const position = getPosition(app.position_id);
                  const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                  const Icon = cfg.icon;
                  return (
                    <div key={app.id} className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-white/5 rounded-xl p-4 flex items-center gap-4">
                      {project?.image_url ? (
                        <img src={resolveImageUrl(project.image_url)} alt={project.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0 text-zinc-400 dark:text-white/20"><Film className="w-6 h-6" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate text-zinc-900 dark:text-white">{project?.name || t("admin", "unknown_project")}</h3>
                        <p className="text-zinc-500 dark:text-white/50 text-sm truncate">{position?.title || t("admin", "unknown_position")}</p>
                        <p className="text-zinc-400 dark:text-white/30 text-xs mt-0.5">{new Date(app.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${cfg.color} shrink-0`}>
                        <Icon className="w-3 h-3" />{cfg.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        )}

        <Lightbox
          index={lightboxIndex >= 0 ? lightboxIndex : -1}
          open={lightboxIndex >= 0}
          close={() => setLightboxIndex(-1)}
          slides={[
            ...(userDetail.profile_image_url ? [{ src: resolveImageUrl(userDetail.profile_image_url) }] : []),
            ...(userDetail.gallery || []).map(url => ({ src: resolveImageUrl(url) }))
          ]}
        />
      </div>
    </div>
  );
}
