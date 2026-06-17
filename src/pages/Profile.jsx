import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { get, put, post, uploadFile } from "@/api/api";
import { useLang } from "@/hooks/useLang";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Plus, X, Upload, Image, Camera, CheckCircle, User, Palette, Sparkles, FileText, ShieldCheck, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { TubelightNavbar } from "@/components/ui/tubelight-navbar";

const TABS = [
  { key: "tab_personal", icon: User },
  { key: "tab_details", icon: Palette },
  { key: "tab_gallery", icon: Image },
  { key: "tab_security", icon: ShieldCheck },
];
const gradient = "linear-gradient(135deg, #ef4136, #fbb040)";
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

function PasswordStrengthBar({ password }) {
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)];
  const score = checks.filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#ef4136", "#f59e0b", "#3b82f6", "#10b981"];
  if (!password) return null;
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[1,2,3,4].map((i) => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? colors[score] : "rgba(113,113,122,0.2)" }} />
        ))}
      </div>
      <p className="text-xs" style={{ color: colors[score] || "#71717a" }}>{labels[score]}</p>
    </div>
  );
}

function SecurityTab() {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const inp = "w-full h-10 pl-9 pr-10 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-white/20 focus:outline-none focus:border-red-500/50 transition-colors";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(false);
    if (newPass.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (newPass !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true);
    try {
      await post("/api/auth/change-password", { currentPassword: current, newPassword: newPass });
      setSuccess(true);
      setCurrent(""); setNewPass(""); setConfirm("");
    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ id, label, value, onChange, show, onToggle, placeholder }) => (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-semibold text-zinc-500 dark:text-white/40 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-white/20" />
        <input id={id} type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "••••••••"} required className={inp} />
        <button type="button" tabIndex={-1} onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-white/20 hover:text-zinc-700 dark:hover:text-white/60 transition-colors">
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-red-500" /> Change Password
        </h3>
        <p className="text-sm text-zinc-400 dark:text-white/30 mt-1">
          Choose a strong password you haven't used before.
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-sm font-medium">
          <CheckCircle className="w-4 h-4 shrink-0" /> Password updated successfully.
        </div>
      )}
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field id="current" label="Current password" value={current} onChange={setCurrent} show={showCurrent} onToggle={() => setShowCurrent(v => !v)} />
        <div className="space-y-1">
          <Field id="new" label="New password" value={newPass} onChange={setNewPass} show={showNew} onToggle={() => setShowNew(v => !v)} />
          <PasswordStrengthBar password={newPass} />
        </div>
        <div className="space-y-1">
          <Field id="confirm" label="Confirm new password" value={confirm} onChange={setConfirm} show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
          {confirm && newPass !== confirm && (
            <p className="text-xs text-red-400">Passwords don't match</p>
          )}
        </div>
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold uppercase tracking-wide transition-all hover:opacity-90 disabled:opacity-50 shadow-lg shadow-red-600/20"
          style={{ background: gradient }}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</> : "Update Password"}
        </button>
      </form>
    </div>
  );
}

export default function Profile() {
  const { t } = useLang();
  usePageMeta({ title: "My Profile" });
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("tab_personal");
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newLang, setNewLang] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const queryClient = useQueryClient();
  const { user, isLoadingAuth } = useAuth();

  const { data: userData, isLoading: isLoadingUser, isError: isUserError } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => get('/api/auth/me'),
    enabled: !isLoadingAuth && !!user,
  });

  useEffect(() => {
    if (userData) {
      setForm(prev => ({
        first_name: userData.full_name?.split(" ")[0] || "",
        last_name: userData.full_name?.split(" ").slice(1).join(" ") || "",
        phone: userData.phone ?? prev.phone ?? "",
        bio: userData.bio ?? prev.bio ?? "",
        city: userData.city ?? prev.city ?? "",
        country: userData.country ?? prev.country ?? "",
        birthdate: userData.birthdate ?? prev.birthdate ?? "",
        gender: userData.gender ?? prev.gender ?? "",
        height: userData.height ?? prev.height ?? "",
        weight: userData.weight ?? prev.weight ?? "",
        hair_color: userData.hair_color ?? prev.hair_color ?? "",
        eye_color: userData.eye_color ?? prev.eye_color ?? "",
        clothing_size: userData.clothing_size ?? prev.clothing_size ?? "",
        shoe_size: userData.shoe_size ?? prev.shoe_size ?? "",
        skills: userData.skills ?? prev.skills ?? [],
        languages: userData.languages ?? prev.languages ?? [],
        experience: userData.experience ?? prev.experience ?? "",
        gallery: userData.gallery ?? prev.gallery ?? [],
        profile_image_url: userData.profile_image_url || "",
      }));
    } else if (!isLoadingUser && isUserError) {
      navigate("/login");
    }
  }, [userData, isLoadingUser, isUserError, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await put('/api/auth/me', {
        ...form,
        full_name: `${form.first_name} ${form.last_name}`.trim(),
      });
      setForm(prev => ({ ...prev, ...response }));
      queryClient.invalidateQueries(['user', 'me']);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !form.skills?.includes(newSkill.trim())) {
      setForm({ ...form, skills: [...(form.skills || []), newSkill.trim()] });
      setNewSkill("");
    }
  };

  const addLanguage = () => {
    if (newLang.trim() && !form.languages?.includes(newLang.trim())) {
      setForm({ ...form, languages: [...(form.languages || []), newLang.trim()] });
      setNewLang("");
    }
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await uploadFile({ file });
      setForm(prev => ({ ...prev, gallery: [...(prev.gallery || []), file_url] }));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const uploadProfileImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingProfileImage(true);
    try {
      const { file_url } = await uploadFile({ file });
      setForm(prev => ({ ...prev, profile_image_url: file_url }));
      await put('/api/auth/me', { profile_image_url: file_url });
      queryClient.invalidateQueries(['user', 'me']);
    } catch {
      alert("Upload failed");
    } finally {
      setUploadingProfileImage(false);
    }
  };

  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${BACKEND_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const inp = "w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-colors";
  const lbl = "text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 block mb-1.5";

  const fullName = `${form.first_name || ''} ${form.last_name || ''}`.trim();
  const initials = (fullName || user?.email || '?').slice(0, 2).toUpperCase();

  const completionFields = ['first_name', 'last_name', 'phone', 'city', 'birthdate', 'gender', 'bio', 'profile_image_url'];
  const completionPct = Math.round((completionFields.filter(f => form[f]).length / completionFields.length) * 100);

  if (isLoadingAuth || isLoadingUser || !user) return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-zinc-200 dark:border-white/10 border-t-red-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-10">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-red-500 mb-1">
              {user?.role === 'admin' ? 'Admin' : 'Actor'}
            </p>
            <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
              {t("profile", "title")}
            </h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 text-white disabled:opacity-50 px-5 py-2.5 rounded-xl text-sm font-bold tracking-wider uppercase transition-all shadow-lg shadow-red-600/20 hover:opacity-90 active:scale-95"
            style={{ background: gradient }}
          >
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {saved ? t("profile", "saved") : saving ? t("profile", "saving") : t("profile", "save")}
            </span>
          </button>
        </div>

        {/* ── PROFILE SUMMARY CARD ── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-2xl p-5 mb-6 shadow-sm dark:shadow-none flex items-center gap-5">
          <label className="relative cursor-pointer shrink-0 group">
            {form.profile_image_url ? (
              <img
                src={resolveImageUrl(form.profile_image_url)}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover ring-2 ring-red-500/20"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white font-black text-xl"
                style={{ background: gradient }}
              >
                {initials}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingProfileImage
                ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Camera className="w-5 h-5 text-white" />}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={uploadProfileImage} disabled={uploadingProfileImage} />
          </label>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-zinc-900 dark:text-white truncate text-lg leading-tight">
              {fullName || user?.email || 'Your Name'}
            </p>
            {(form.city || form.country) && (
              <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">
                {[form.city, form.country].filter(Boolean).join(', ')}
              </p>
            )}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                  Profile {completionPct}% complete
                </span>
              </div>
              <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%`, background: gradient }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <TubelightNavbar
          className="mb-6"
          layoutId="profile-tab-lamp"
          items={TABS.map((tab) => ({ key: tab.key, label: t("profile", tab.key), icon: tab.icon }))}
          activeKey={activeTab}
          onChange={setActiveTab}
        />

        {/* ── PERSONAL ── */}
        {activeTab === "tab_personal" && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm dark:shadow-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={lbl}>{t("profile", "first_name")}</label>
                <input className={inp} value={form.first_name || ""} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>{t("profile", "last_name")}</label>
                <input className={inp} value={form.last_name || ""} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>{t("profile", "email")}</label>
                <input className={`${inp} opacity-50 cursor-not-allowed`} value={user.email || ""} readOnly />
              </div>
              <div>
                <label className={lbl}>{t("profile", "phone")}</label>
                <input type="tel" className={inp} value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>{t("profile", "city")}</label>
                <input className={inp} value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>{t("profile", "country")}</label>
                <input className={inp} value={form.country || ""} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>{t("profile", "birthdate")}</label>
                <input type="date" className={inp} value={form.birthdate || ""} onChange={(e) => setForm({ ...form, birthdate: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>{t("profile", "gender")}</label>
                <select
                  className={inp}
                  value={form.gender || ""}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="">—</option>
                  <option value="male">Male / Muž</option>
                  <option value="female">Female / Žena</option>
                  <option value="other">Other / Iné</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={lbl}>{t("profile", "bio")}</label>
                <textarea
                  rows={4}
                  className={`${inp} resize-none`}
                  value={form.bio || ""}
                  placeholder="Write a short bio about yourself..."
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── DETAILS (Appearance + Skills & Languages + Experience merged) ── */}
        {activeTab === "tab_details" && (
          <div className="space-y-4">

            {/* Appearance */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm dark:shadow-none">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-white/30 mb-4">{t("profile", "tab_appearance")}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                <div>
                  <label className={lbl}>{t("profile", "height")} (cm)</label>
                  <input type="number" className={inp} placeholder="175" value={form.height || ""} onChange={(e) => setForm({ ...form, height: e.target.value })} />
                </div>
                <div>
                  <label className={lbl}>{t("profile", "weight")} (kg)</label>
                  <input type="number" className={inp} placeholder="70" value={form.weight || ""} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                </div>
                <div>
                  <label className={lbl}>{t("profile", "hair_color")}</label>
                  <input className={inp} placeholder="Brown" value={form.hair_color || ""} onChange={(e) => setForm({ ...form, hair_color: e.target.value })} />
                </div>
                <div>
                  <label className={lbl}>{t("profile", "eye_color")}</label>
                  <input className={inp} placeholder="Blue" value={form.eye_color || ""} onChange={(e) => setForm({ ...form, eye_color: e.target.value })} />
                </div>
                <div>
                  <label className={lbl}>{t("profile", "clothing_size")}</label>
                  <input className={inp} placeholder="M" value={form.clothing_size || ""} onChange={(e) => setForm({ ...form, clothing_size: e.target.value })} />
                </div>
                <div>
                  <label className={lbl}>{t("profile", "shoe_size")}</label>
                  <input className={inp} placeholder="42" value={form.shoe_size || ""} onChange={(e) => setForm({ ...form, shoe_size: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm dark:shadow-none">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-white/30 mb-4">{t("profile", "skills")}</p>
              <div className="flex gap-2 mb-4">
                <input className={`${inp} flex-1`} placeholder={t("profile", "add_skill")} value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSkill()} />
                <button type="button" onClick={addSkill}
                  className="text-white px-4 py-2.5 rounded-xl font-bold flex items-center transition-all shadow-lg shadow-red-600/20 hover:opacity-90 shrink-0"
                  style={{ background: gradient }}><Plus className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(form.skills || []).length === 0 && <p className="text-sm text-zinc-400 dark:text-zinc-500">No skills added yet.</p>}
                {(form.skills || []).map((s) => (
                  <span key={s} className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-sm px-3 py-1.5 rounded-full flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                    {s}
                    <button onClick={() => setForm({ ...form, skills: form.skills.filter((x) => x !== s) })}>
                      <X className="w-3 h-3 text-zinc-400 hover:text-red-500 transition-colors" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm dark:shadow-none">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-white/30 mb-4">{t("profile", "languages")}</p>
              <div className="flex gap-2 mb-4">
                <input className={`${inp} flex-1`} placeholder={t("profile", "add_language")} value={newLang}
                  onChange={(e) => setNewLang(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLanguage()} />
                <button type="button" onClick={addLanguage}
                  className="text-white px-4 py-2.5 rounded-xl font-bold flex items-center transition-all shadow-lg shadow-red-600/20 hover:opacity-90 shrink-0"
                  style={{ background: gradient }}><Plus className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(form.languages || []).length === 0 && <p className="text-sm text-zinc-400 dark:text-zinc-500">No languages added yet.</p>}
                {(form.languages || []).map((l) => (
                  <span key={l} className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-sm px-3 py-1.5 rounded-full flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                    {l}
                    <button onClick={() => setForm({ ...form, languages: form.languages.filter((x) => x !== l) })}>
                      <X className="w-3 h-3 text-zinc-400 hover:text-red-500 transition-colors" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm dark:shadow-none">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-white/30 mb-4">{t("profile", "experience")}</p>
              <textarea
                rows={10}
                className={`${inp} resize-none`}
                value={form.experience || ""}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                placeholder="List your film/TV experience, training, special skills..."
              />
            </div>

          </div>
        )}

        {/* ── SECURITY ── */}
        {activeTab === "tab_security" && <SecurityTab />}

        {/* ── GALLERY ── */}
        {activeTab === "tab_gallery" && (
          <div className="space-y-5">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t("profile", "gallery_hint")}
            </p>

            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-red-500/50 dark:hover:border-red-500/40 rounded-2xl cursor-pointer transition-colors bg-white dark:bg-zinc-900">
              {uploadingPhoto ? (
                <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-600 border-t-red-500 rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-6 h-6 text-zinc-400 dark:text-zinc-500 mb-2" />
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {t("profile", "upload_photo")}
                  </span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} disabled={uploadingPhoto} />
            </label>

            {(form.gallery || []).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {form.gallery.map((url, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <img src={resolveImageUrl(url)} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setForm({ ...form, gallery: form.gallery.filter((_, j) => j !== i) })}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 rounded-full p-1.5 transition-all md:opacity-0 md:group-hover:opacity-100"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4">
                  <Image className="w-7 h-7 text-zinc-300 dark:text-zinc-600" />
                </div>
                <p className="text-sm text-zinc-400 dark:text-zinc-500">No photos uploaded yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
