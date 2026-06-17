import { useState, useEffect } from "react";
import { get, post } from '@/api/api';
import { useQueryClient } from "@tanstack/react-query";
import { useLang } from "@/hooks/useLang";
import { X, CheckCircle, Clock } from "lucide-react";

const gradient = "linear-gradient(135deg, #ef4136, #fbb040)";

export default function ApplyModal({ position, slots, preselectedSlot, roles, project, onClose }) {
  const { t } = useLang();
  const queryClient = useQueryClient();
  const isLiveCasting = Array.isArray(slots);

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [selectedSlotId, setSelectedSlotId] = useState(preselectedSlot?.id || "");
  const [selectedPositionId, setSelectedPositionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const isFull = !isLiveCasting && position.spots_total > 0 && Math.max(0, (position.spots_total || 0) - (position.spots_filled || 0)) === 0;

  useEffect(() => {
    get('/api/auth/me').then((u) => { // Using the 'get' function from api.js
      setUser(u);
      setForm((f) => ({ ...f, name: u.full_name || "", email: u.email || "" }));
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await post('/api/applications', {
        project_id: project.id,
        position_id: isLiveCasting ? selectedPositionId : position.id,
        slot_id: isLiveCasting ? selectedSlotId : undefined,
        user_id: user?.id || "",
        is_guest: !user,
        applicant_name: form.name,
        applicant_email: form.email,
        applicant_phone: form.phone,
        message: form.message,
        status: isLiveCasting ? "pending" : (isFull ? "waitlist" : "pending"),
      });
      if (isLiveCasting) queryClient.invalidateQueries(['casting-slots', 'byProject', project.id]);
      setSuccess(true);
    } catch (err) {
      if (err?.status === 409) {
        setError(err?.response?.message || "You have already applied to this project.");
        if (isLiveCasting) queryClient.invalidateQueries(['casting-slots', 'byProject', project.id]);
      } else {
        setError(err?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRole = isLiveCasting ? roles.find((r) => r.id === selectedPositionId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 text-zinc-900 dark:text-white">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white">
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">{t("apply", "success")}</h3>
            <p className="text-zinc-500 dark:text-white/50 text-sm mb-2">{isLiveCasting ? selectedRole?.title : position.title}</p>
            {isLiveCasting && preselectedSlot && (
              <p className="text-sm font-semibold text-green-400 flex items-center justify-center gap-1.5 mt-1">
                <Clock className="w-4 h-4" /> {preselectedSlot.slot_date} · {preselectedSlot.start_time}–{preselectedSlot.end_time}
              </p>
            )}
            {!isLiveCasting && isFull && <p className="text-yellow-400 text-xs">Added to waitlist.</p>}
            <button onClick={onClose} className="mt-6 bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 text-zinc-900 dark:text-white px-6 py-2 rounded-lg text-sm transition-colors shadow-sm dark:shadow-none">
              {t("common", "close")}
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-1 text-zinc-900 dark:text-white">{t("apply", "title")}</h2>
            <p className="text-zinc-500 dark:text-white/40 text-sm mb-5">
              {isLiveCasting ? project.name : `${position.title} — ${project.name}`}
            </p>
            {!isLiveCasting && isFull && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4 text-yellow-400 text-xs">
                This position is full. Submitting will place you on the waitlist.
              </div>
            )}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-red-500 text-xs">
                {error}
              </div>
            )}
            {!user && (
              <div className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg p-3 mb-4 text-zinc-600 dark:text-white/50 text-xs shadow-sm dark:shadow-none">
                {t("apply", "guest_note")}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isLiveCasting && (
                <>
                  {/* Slot — show pre-selected chip or fallback dropdown */}
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-white/40 block mb-1">Time Slot *</label>
                    {preselectedSlot ? (
                      <div className="flex items-center gap-2 bg-green-50 dark:bg-green-500/10 border border-green-400/30 rounded-lg px-4 py-2.5">
                        <Clock className="w-4 h-4 text-green-500 shrink-0" />
                        <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                          {preselectedSlot.slot_date} · {preselectedSlot.start_time}–{preselectedSlot.end_time}
                        </span>
                      </div>
                    ) : (
                      <select required value={selectedSlotId} onChange={(e) => setSelectedSlotId(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-red-500/50 shadow-sm dark:shadow-none">
                        <option value="" disabled>Select a slot...</option>
                        {slots.map((s) => (
                          <option key={s.id} value={s.id}>{s.slot_date} · {s.start_time}–{s.end_time}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  {/* Role */}
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-white/40 block mb-1">Role *</label>
                    <select required value={selectedPositionId} onChange={(e) => setSelectedPositionId(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-red-500/50 shadow-sm dark:shadow-none">
                      <option value="" disabled>Select a role...</option>
                      {roles.map((r) => {
                        const full = r.spots_total > 0 && Math.max(0, (r.spots_total || 0) - (r.spots_filled || 0)) === 0;
                        return <option key={r.id} value={r.id} disabled={full}>{r.title}{full ? " (full)" : ""}</option>;
                      })}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="text-xs text-zinc-500 dark:text-white/40 block mb-1">{t("apply", "name")} *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-red-500/50 shadow-sm dark:shadow-none" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 dark:text-white/40 block mb-1">{t("apply", "email")} *</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-red-500/50 shadow-sm dark:shadow-none" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 dark:text-white/40 block mb-1">{t("apply", "phone")}</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-red-500/50 shadow-sm dark:shadow-none" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 dark:text-white/40 block mb-1">{t("apply", "message")}</label>
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-red-500/50 resize-none shadow-sm dark:shadow-none" />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full disabled:opacity-50 text-white font-bold py-3 rounded-lg text-sm tracking-wider uppercase transition-all shadow-lg shadow-red-600/20 hover:opacity-90"
                style={{ background: gradient }}>
                {submitting ? t("apply", "submitting") : (!isLiveCasting && isFull ? t("project_detail", "waitlist") : t("apply", "submit"))}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
