import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { get, post, put, uploadFile, resolveImageUrl } from '@/api/api';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLang } from "@/hooks/useLang";
import { ArrowLeft, Upload, Plus, Trash2, Save, Loader2, Film, Image, Users, Clapperboard, Info, X } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const gradient = "linear-gradient(135deg, #ef4136, #fbb040)";

const TYPES = ["movie", "tv_series", "commercial", "documentary", "music_video", "other", "live_casting"];
const STATUSES = ["draft", "open", "full", "closed", "archived"];
const GENDERS = ["any", "male", "female"];

const createEmptyPosition = () => ({
  title: "",
  description: "",
  location: "",
  shooting_date: "",
  compensation: "",
  spots_total: 1,
  age_min: "",
  age_max: "",
  gender: "any",
  required_skills: "",
  notes: "",
});

export default function AdminProjectEdit() {
  const { id } = useParams();
  const isEdit = id && id !== "new";
  const { t } = useLang();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, authChecked, isLoadingAuth } = useAuth();

  const [form, setForm] = useState({
    name: "",
    type: "movie",
    status: "draft",
    short_description: "",
    full_description: "",
    image_url: "",
    production_company: "",
    director: "",
    location: "",
    shooting_start_date: "",
    shooting_end_date: "",
    // New fields for live casting
    project_gallery: [], // Initialize project gallery
    daily_start_time: "",
    daily_end_time: "",
    slot_duration_minutes: "",
  });

  const [positions, setPositions] = useState([createEmptyPosition()]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const [isDraggingGallery, setIsDraggingGallery] = useState(false);

  // Auth Guard
  useEffect(() => {
    if (authChecked && !isLoadingAuth) {
      if (!user) navigate("/login");
      else if (user.role !== "admin") navigate("/dashboard");
    }
  }, [user, authChecked, isLoadingAuth, navigate]);

  // Fetch Project Data if Editing
  const { data: projectData, isLoading: isLoadingProject } = useQuery({
    queryKey: ['projects', id],
    queryFn: () => get(`/api/projects?id=${id}`).then(res => res[0]),
    enabled: isEdit && authChecked && user?.role === 'admin',
  });

  // Fetch Existing Positions if Editing
  const { data: positionsData, isLoading: isLoadingPositions } = useQuery({
    queryKey: ['positions', 'byProject', id],
    queryFn: () => get(`/api/positions?project_id=${id}`),
    enabled: isEdit && authChecked && user?.role === 'admin',
  });

  useEffect(() => {
    if (projectData) {
      setForm({
        name: projectData.name || "",
        type: projectData.type || "movie",
        status: projectData.status || "draft",
        short_description: projectData.short_description || "",
        full_description: projectData.full_description || "",
        image_url: projectData.image_url || "",
        production_company: projectData.production_company || "",
        director: projectData.director || "",
        location: projectData.location || "",
        shooting_start_date: projectData.shooting_start_date || "",
        shooting_end_date: projectData.shooting_end_date || "",
        daily_start_time: projectData.daily_start_time || "",
        project_gallery: projectData.project_gallery || [], // Populate project gallery
        daily_end_time: projectData.daily_end_time || "",
        slot_duration_minutes: projectData.slot_duration_minutes || "",
      });
    }
    if (positionsData && positionsData.length > 0) {
      setPositions(positionsData.map(p => ({
        ...p,
        required_skills: Array.isArray(p.required_skills) ? p.required_skills.join(", ") : (p.required_skills || "")
      })));
    }
  }, [projectData, positionsData]);

  const calculateSlots = () => {
    const { shooting_start_date, shooting_end_date, daily_start_time, daily_end_time, slot_duration_minutes } = form;
    if (!shooting_start_date || !shooting_end_date || !daily_start_time || !daily_end_time || !slot_duration_minutes) return 0;
    const days = Math.floor((new Date(shooting_end_date) - new Date(shooting_start_date)) / 86400000) + 1;
    if (days <= 0) return 0;
    const [startH, startM] = daily_start_time.split(':').map(Number);
    const [endH, endM] = daily_end_time.split(':').map(Number);
    const dayWindowMins = (endH * 60 + endM) - (startH * 60 + startM);
    if (dayWindowMins <= 0) return 0;
    const slotsPerDay = Math.floor(dayWindowMins / Number(slot_duration_minutes));
    return days * slotsPerDay;
  };

  const handlePositionChange = (index, key, value) => {
    setPositions((current) => current.map((pos, idx) => idx === index ? { ...pos, [key]: value } : pos));
  };

  const addPosition = () => setPositions((current) => [...current, createEmptyPosition()]);
  const removePosition = (index) => setPositions((current) => current.filter((_, idx) => idx !== index));

  const handleSave = async (e) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      let projectId = id;
      if (isEdit) { // Update existing project
        await put(`/api/projects/${id}`, form);
        await post('/api/audit-logs', { action: "update", entity_type: "Project", entity_id: id, details: `Updated: ${form.name}` });
      } else {
        const created = await post('/api/projects', form);
        projectId = created.id;
        await post('/api/audit-logs', { action: "create", entity_type: "Project", entity_id: created.id, details: `Created: ${form.name}` });
      }

      // Prepare positions
      const positionPayloads = positions
        .filter((pos) => pos.title.trim())
        .map((pos) => ({
          ...pos,
          project_id: projectId,
          title: pos.title.trim(),
          description: pos.description?.trim() || "",
          location: pos.location?.trim() || "",
          shooting_date: pos.shooting_date,
          compensation: pos.compensation?.trim() || "",
          spots_total: Number(pos.spots_total) || 1,
          age_min: pos.age_min ? Number(pos.age_min) : null,
          age_max: pos.age_max ? Number(pos.age_max) : null,
          gender: pos.gender,
          required_skills: typeof pos.required_skills === 'string'
            ? pos.required_skills.split(",").map(s => s.trim()).filter(Boolean)
            : (pos.required_skills || []),
          notes: pos.notes?.trim() || "",
        }));

      // Save positions
      await Promise.all(positionPayloads.map((payload) => {
        if (payload.id) return put(`/api/positions/${payload.id}`, payload);
        return post('/api/positions', payload);
      }));

      queryClient.invalidateQueries(['admin', 'projects']);
      queryClient.invalidateQueries(['projects']);
      navigate('/admin?tab=projects');
    } catch (err) {
      setErrors({ form: err.message || t("project_form", "field_required") });
    } finally {
      setSaving(false);
    }
  };

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  const validateImageFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) { alert('Unsupported file type. Please use JPG, PNG, WebP, or GIF.'); return false; }
    if (file.size > 3 * 1024 * 1024) { alert('File is too large. Maximum size is 3 MB.'); return false; }
    return true;
  };

  const uploadGalleryImage = async (file) => {
    if (!file || !validateImageFile(file)) return;
    setUploadingGallery(true);
    try {
      const { file_url } = await uploadFile({ file });
      setForm({ ...form, project_gallery: [...(form.project_gallery || []), file_url] });
    } catch (err) {
      setErrors((prev) => ({ ...prev, gallery: err.message || "Upload failed" }));
    } finally {
      setUploadingGallery(false);
    }
  };

  const uploadImage = async (file) => {
    if (!file || !validateImageFile(file)) return;
    setUploading(true);
    try {
      const { file_url } = await uploadFile({ file });
      setForm({ ...form, image_url: file_url });
    } catch (err) {
      setErrors((prev) => ({ ...prev, cover: err.message || "Upload failed" }));
    } finally {
      setUploading(false);
    }
  };

  if (isEdit && (isLoadingProject || isLoadingPositions)) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-200 dark:border-white/10 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  const inp = "w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-red-500/50 transition-colors placeholder:text-zinc-400 dark:placeholder:text-white/20 shadow-sm dark:shadow-none";
  const inpError = "border-red-500 focus:border-red-500 dark:border-red-500";
  const lbl = "text-xs font-bold text-zinc-500 dark:text-white/40 uppercase tracking-widest block mb-2";
  const errTxt = "text-[11px] font-semibold text-red-500 mt-1.5";

  const fieldClass = (key) => `${inp}${errors[key] ? ` ${inpError}` : ""}`;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Link to="/admin?tab=projects" className="inline-flex items-center gap-2 text-xs text-zinc-500 dark:text-white/50 hover:text-zinc-900 dark:hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> {t("project_form", "back_to_projects")}
            </Link>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase text-zinc-900 dark:text-white">
              {isEdit ? t("project_form", "edit_title") : t("project_form", "create_title")}
            </h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-white disabled:opacity-50 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-lg shadow-red-600/20 hover:opacity-90"
            style={{ background: gradient }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? t("project_form", "update_button") : t("project_form", "publish_button")}
          </button>
        </header>

        {errors.form && (
          <div className="mb-6 px-5 py-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm font-semibold text-red-600 dark:text-red-400">
            {errors.form}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-3xl p-8 space-y-6 shadow-sm dark:shadow-none">
              <h2 className="flex items-center gap-3 text-xl font-bold border-b border-zinc-100 dark:border-white/5 pb-4 tracking-tight uppercase text-zinc-900 dark:text-white">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl text-white shrink-0" style={{ background: gradient }}>
                  <Info className="w-4 h-4" />
                </span>
                {t("project_form", "section_general")}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={lbl}>{t("project_form", "project_name")} *</label>
                  <input
                    required
                    className={fieldClass("name")}
                    value={form.name}
                    onChange={(e) => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
                    placeholder={t("project_form", "project_name_placeholder")}
                  />
                  {errors.name && <p className={errTxt}>{errors.name}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>{t("project_form", "project_type")}</label>
                    <select className={inp + " appearance-none"} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      {TYPES.map((ty) => <option key={ty} value={ty}>{t("common", ty) !== ty ? t("common", ty) : ty.replace('_', ' ').toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>{t("project_form", "status")}</label>
                    <select className={inp + " appearance-none"} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      {STATUSES.map((s) => <option key={s} value={s}>{t("common", s) !== s ? t("common", s) : s.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>
                {form.type === 'live_casting' && (
                  <div className="rounded-2xl border border-red-500/15 bg-gradient-to-br from-red-500/5 to-amber-500/5 overflow-hidden animate-in fade-in zoom-in duration-300">
                    <div className="px-5 pt-5 pb-3 flex items-start gap-3">
                      <span className="flex items-center justify-center w-7 h-7 rounded-lg text-white shrink-0 mt-0.5" style={{ background: gradient }}>
                        <Clapperboard className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <h3 className="text-xs font-black text-red-500 uppercase tracking-widest mb-1">{t("project_form", "live_schedule_title")}</h3>
                        <p className="text-[10px] text-zinc-500 dark:text-white/40">{t("project_form", "live_schedule_hint")}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-5 pb-5">
                      <div>
                        <label className={lbl}>{t("project_form", "start_date")} *</label>
                        <input type="date" required className={fieldClass("shooting_start_date")} value={form.shooting_start_date} onChange={(e) => { setForm({ ...form, shooting_start_date: e.target.value }); if (errors.shooting_start_date) setErrors((p) => ({ ...p, shooting_start_date: undefined })); }} />
                        {errors.shooting_start_date && <p className={errTxt}>{errors.shooting_start_date}</p>}
                      </div>
                      <div>
                        <label className={lbl}>{t("project_form", "end_date")} *</label>
                        <input type="date" required className={fieldClass("shooting_end_date")} value={form.shooting_end_date} onChange={(e) => { setForm({ ...form, shooting_end_date: e.target.value }); if (errors.shooting_end_date) setErrors((p) => ({ ...p, shooting_end_date: undefined })); }} />
                        {errors.shooting_end_date && <p className={errTxt}>{errors.shooting_end_date}</p>}
                      </div>
                      <div>
                        <label className={lbl}>{t("project_form", "daily_start_time")} *</label>
                        <input type="time" required className={fieldClass("daily_start_time")} value={form.daily_start_time} onChange={(e) => { setForm({ ...form, daily_start_time: e.target.value }); if (errors.daily_start_time) setErrors((p) => ({ ...p, daily_start_time: undefined })); }} />
                        {errors.daily_start_time && <p className={errTxt}>{errors.daily_start_time}</p>}
                      </div>
                      <div>
                        <label className={lbl}>{t("project_form", "daily_end_time")} *</label>
                        <input type="time" required className={fieldClass("daily_end_time")} value={form.daily_end_time} onChange={(e) => { setForm({ ...form, daily_end_time: e.target.value }); if (errors.daily_end_time) setErrors((p) => ({ ...p, daily_end_time: undefined })); }} />
                        {errors.daily_end_time && <p className={errTxt}>{errors.daily_end_time}</p>}
                      </div>
                      <div>
                        <label className={lbl}>{t("project_form", "slot_length")} *</label>
                        <input type="number" required min="1" className={fieldClass("slot_duration_minutes")} value={form.slot_duration_minutes} onChange={(e) => { setForm({ ...form, slot_duration_minutes: e.target.value }); if (errors.slot_duration_minutes) setErrors((p) => ({ ...p, slot_duration_minutes: undefined })); }} />
                        {errors.slot_duration_minutes && <p className={errTxt}>{errors.slot_duration_minutes}</p>}
                      </div>
                      <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1 flex items-center">{t("project_form", "total_bookable_slots")} {calculateSlots()}</div>
                    </div>
                  </div>
                )}
                <div>
                  <label className={lbl}>{t("project_form", "short_description")}</label>
                  <textarea rows={2} className={inp + " resize-none"} value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} placeholder={t("project_form", "short_description_placeholder")} />
                </div>
                <div>
                  <label className={lbl}>{t("project_form", "full_description")}</label>
                  <textarea rows={6} className={inp + " resize-none"} value={form.full_description} onChange={(e) => setForm({ ...form, full_description: e.target.value })} placeholder={t("project_form", "full_description_placeholder")} />
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-3xl p-8 space-y-6 shadow-sm dark:shadow-none">
              <h2 className="flex items-center gap-3 text-xl font-bold border-b border-zinc-100 dark:border-white/5 pb-4 tracking-tight uppercase text-zinc-900 dark:text-white">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl text-white shrink-0" style={{ background: gradient }}>
                  <Film className="w-4 h-4" />
                </span>
                {t("project_form", "section_production")}
              </h2>
              <div className="space-y-4">
                <div><label className={lbl}>{t("project_form", "director")}</label><input className={inp} value={form.director} onChange={(e) => setForm({ ...form, director: e.target.value })} /></div>
                <div><label className={lbl}>{t("project_form", "company")}</label><input className={inp} value={form.production_company} onChange={(e) => setForm({ ...form, production_company: e.target.value })} /></div>
                <div><label className={lbl}>{t("project_form", "location")}</label><input className={inp} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              </div>
            </section>

            <section className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-3xl p-8 space-y-6 shadow-sm dark:shadow-none">
              <h2 className="flex items-center gap-3 text-xl font-bold border-b border-zinc-100 dark:border-white/5 pb-4 tracking-tight uppercase text-zinc-900 dark:text-white">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl text-white shrink-0" style={{ background: gradient }}>
                  <Image className="w-4 h-4" />
                </span>
                {t("project_form", "section_cover")}
              </h2>
              <div className="space-y-4">
                {form.image_url ? (
                  <div className="relative aspect-video rounded-2xl overflow-hidden group">
                    <img src={resolveImageUrl(form.image_url)} alt="Project" className="w-full h-full object-cover" />
                    <button onClick={() => setForm({...form, image_url: ""})} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-[10px] uppercase tracking-[0.2em] text-white">{t("project_form", "change_cover")}</button>
                  </div>
                ) : (
                  <label
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingCover(true); }}
                    onDragLeave={() => setIsDraggingCover(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDraggingCover(false); uploadImage(e.dataTransfer.files[0]); }}
                    className={`flex flex-col items-center justify-center aspect-video border-2 border-dashed rounded-2xl cursor-pointer transition-colors group bg-zinc-100 dark:bg-zinc-950/50 ${isDraggingCover ? "border-red-500 bg-red-500/5" : "border-zinc-200 dark:border-white/10 hover:border-red-500/50"}`}
                  >
                    {uploading ? <Loader2 className="w-8 h-8 animate-spin text-red-500" /> : <Upload className="w-8 h-8 text-zinc-300 dark:text-white/20 group-hover:text-red-500 transition-colors mb-2" />}
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest">{t("project_form", "upload_cover")}</span>
                    <span className="text-[10px] text-zinc-400 dark:text-white/20 mt-1">{t("project_form", "upload_cover_hint")}</span>
                    <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml" className="hidden" onChange={(e) => uploadImage(e.target.files[0])} />
                  </label>
                )}
                {errors.cover && <p className={errTxt}>{errors.cover}</p>}
              </div>
            </section>

            <section className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-3xl p-8 space-y-6 shadow-sm dark:shadow-none">
              <h2 className="flex items-center gap-3 text-xl font-bold border-b border-zinc-100 dark:border-white/5 pb-4 tracking-tight uppercase text-zinc-900 dark:text-white">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl text-white shrink-0" style={{ background: gradient }}>
                  <Image className="w-4 h-4" />
                </span>
                {t("project_form", "section_gallery")}
              </h2>
              <div className="space-y-4">
                <label
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingGallery(true); }}
                  onDragLeave={() => setIsDraggingGallery(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDraggingGallery(false); uploadGalleryImage(e.dataTransfer.files[0]); }}
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors bg-zinc-100 dark:bg-zinc-950/50 ${isDraggingGallery ? "border-red-500 bg-red-500/5" : "border-zinc-200 dark:border-white/20 hover:border-red-500/50"}`}
                >
                  {uploadingGallery ? (
                    <Loader2 className="w-6 h-6 border-2 border-white/20 border-t-red-500 rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-zinc-300 dark:text-white/20 mb-2" />
                      <span className="text-sm text-zinc-400 dark:text-white/40">{t("project_form", "upload_gallery_image")}</span>
                      <span className="text-[10px] text-zinc-400 dark:text-white/20 mt-1">{t("project_form", "upload_gallery_hint")}</span>
                    </>
                  )}
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml" className="hidden" onChange={(e) => uploadGalleryImage(e.target.files[0])} disabled={uploadingGallery} />
                </label>
                {errors.gallery && <p className={errTxt}>{errors.gallery}</p>}

                {(form.project_gallery || []).length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {form.project_gallery.map((url, i) => (
                      <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                        <img src={resolveImageUrl(url)} alt={`Gallery image ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => setForm({ ...form, project_gallery: form.project_gallery.filter((_, j) => j !== i) })}
                          className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-zinc-300 dark:text-white/20"><Image className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">{t("project_form", "no_gallery_images")}</p></div>
                )}
              </div>
            </section>
          </div>

          {/* Roles & Positions section - moved outside the General Information section */}
          <div className="lg:col-span-3 space-y-6">
            <section className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-3xl p-8 space-y-6 shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="flex items-center gap-3 text-xl font-bold tracking-tight uppercase text-zinc-900 dark:text-white">
                  <span className="flex items-center justify-center w-9 h-9 rounded-xl text-white shrink-0" style={{ background: gradient }}>
                    <Users className="w-4 h-4" />
                  </span>
                  {t("project_form", "section_roles")}
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-white/60 normal-case tracking-normal">
                    {positions.length}
                  </span>
                </h2>
                <button type="button" onClick={addPosition} className="bg-zinc-200 dark:bg-white/5 hover:bg-zinc-300 dark:hover:bg-white/10 text-zinc-900 dark:text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all flex items-center gap-2">
                  <Plus className="w-4 h-4" /> {t("project_form", "add_role")}
                </button>
              </div>
              <div className="space-y-4">
                {positions.map((pos, index) => (
                  <div key={index} className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-white/5 rounded-3xl p-8 relative group">
                    <button type="button" onClick={() => removePosition(index)} className="absolute top-6 right-6 text-zinc-400 dark:text-white/20 hover:text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className={lbl}>{t("project_form", "role_title")} *</label>
                        <input className={inp} value={pos.title} onChange={(e) => handlePositionChange(index, "title", e.target.value)} placeholder={t("project_form", "role_title_placeholder")} />
                      </div>
                      <div><label className={lbl}>{t("project_form", "spots")}</label><input type="number" min="1" className={inp} value={pos.spots_total} onChange={(e) => handlePositionChange(index, "spots_total", e.target.value)} /></div>
                      <div><label className={lbl}>{t("project_form", "date")}</label><input type="date" className={inp} value={pos.shooting_date} onChange={(e) => handlePositionChange(index, "shooting_date", e.target.value)} /></div>
                      <div><label className={lbl}>{t("project_form", "gender")}</label>
                        <select className={inp} value={pos.gender} onChange={(e) => handlePositionChange(index, "gender", e.target.value)}>
                          {GENDERS.map((g) => <option key={g} value={g} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">{t("common", g) !== g ? t("common", g).toUpperCase() : g.toUpperCase()}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className={lbl}>{t("project_form", "age_min")}</label><input type="number" className={inp} value={pos.age_min} onChange={(e) => handlePositionChange(index, "age_min", e.target.value)} /></div>
                        <div><label className={lbl}>{t("project_form", "age_max")}</label><input type="number" className={inp} value={pos.age_max} onChange={(e) => handlePositionChange(index, "age_max", e.target.value)} /></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
