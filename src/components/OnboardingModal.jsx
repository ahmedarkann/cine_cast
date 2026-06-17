import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { put } from "@/api/api";
import { useAuth } from "@/lib/AuthContext";
import {
  Sparkles, User, Camera, MapPin, Phone, Calendar,
  ChevronRight, CheckCircle2, ArrowRight, Loader2, X
} from "lucide-react";

const gradient = "linear-gradient(135deg, #ef4136, #fbb040)";
const ONBOARD_KEY = "cinecast_onboarded";

export function useOnboarding() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const shouldShow =
    user &&
    !dismissed &&
    !localStorage.getItem(ONBOARD_KEY + "_" + user.id);

  const dismiss = (userId) => {
    localStorage.setItem(ONBOARD_KEY + "_" + userId, "1");
    setDismissed(true);
  };

  return { shouldShow, dismiss };
}

const STEPS = ["welcome", "profile", "done"];

export default function OnboardingModal({ onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: user?.full_name?.split(" ")[0] || "",
    last_name: user?.full_name?.split(" ").slice(1).join(" ") || "",
    phone: user?.phone || "",
    city: user?.city || "",
    birthdate: user?.birthdate || "",
    gender: user?.gender || "",
    bio: user?.bio || "",
  });

  const stepId = STEPS[step];

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await put("/api/auth/me", {
        full_name: `${form.first_name} ${form.last_name}`.trim(),
        phone: form.phone,
        city: form.city,
        birthdate: form.birthdate,
        gender: form.gender,
        bio: form.bio,
      });
      setStep(2);
    } catch {
      setStep(2);
    } finally {
      setSaving(false);
    }
  };

  const handleSkipProfile = () => setStep(2);

  const handleFinish = (goToProjects = false) => {
    onClose();
    if (goToProjects) navigate("/projects");
  };

  const inp = "w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-white/30 focus:outline-none focus:border-red-500/50";
  const lbl = "block text-xs text-zinc-500 dark:text-white/40 mb-1 font-medium";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

        {/* Step indicator */}
        <div className="flex gap-1 p-4 pb-0">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full transition-all duration-500"
              style={{ background: i <= step ? gradient : undefined }}
              {...(i > step ? { className: "h-1 flex-1 rounded-full bg-zinc-200 dark:bg-white/10" } : {})}
            />
          ))}
        </div>

        {/* Skip button (except done) */}
        {stepId !== "done" && (
          <button
            onClick={() => stepId === "welcome" ? setStep(1) : handleSkipProfile()}
            className="absolute top-6 right-5 text-zinc-400 dark:text-white/25 hover:text-zinc-600 dark:hover:text-white transition-colors"
            title="Skip"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="p-8">
          {/* ── STEP 0: WELCOME ── */}
          {stepId === "welcome" && (
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                style={{ background: gradient }}
              >
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">
                Welcome to cineCAST
                {user?.full_name?.split(" ")[0] ? `, ${user.full_name.split(" ")[0]}` : ""}!
              </h2>
              <p className="text-zinc-500 dark:text-white/50 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                Your casting profile is almost ready. Let's take 2 minutes to set up your profile so casting directors can find you.
              </p>

              <div className="space-y-3 text-left mb-8">
                {[
                  { icon: User, label: "Complete your casting profile" },
                  { icon: Camera, label: "Add photos to your gallery" },
                  { icon: ArrowRight, label: "Apply to open productions" },
                ].map(({ icon: Icon, label }, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-zinc-600 dark:text-white/60">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-zinc-500 dark:text-white/40" />
                    </div>
                    {label}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full py-3 rounded-xl text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{ background: gradient }}
              >
                Let's get started <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── STEP 1: PROFILE ── */}
          {stepId === "profile" && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-1">Your casting profile</h2>
                <p className="text-zinc-500 dark:text-white/40 text-sm">Fill in what you can — you can always update this later.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>First name</label>
                    <input
                      className={inp}
                      placeholder="Jana"
                      value={form.first_name}
                      onChange={e => setForm({ ...form, first_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={lbl}>Last name</label>
                    <input
                      className={inp}
                      placeholder="Nováková"
                      value={form.last_name}
                      onChange={e => setForm({ ...form, last_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}><Phone className="w-3 h-3 inline mr-1" />Phone</label>
                    <input
                      className={inp}
                      placeholder="+421 900 000 000"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={lbl}><MapPin className="w-3 h-3 inline mr-1" />City</label>
                    <input
                      className={inp}
                      placeholder="Bratislava"
                      value={form.city}
                      onChange={e => setForm({ ...form, city: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}><Calendar className="w-3 h-3 inline mr-1" />Date of birth</label>
                    <input
                      type="date"
                      className={inp}
                      value={form.birthdate}
                      onChange={e => setForm({ ...form, birthdate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={lbl}>Gender</label>
                    <select
                      className={inp}
                      value={form.gender}
                      onChange={e => setForm({ ...form, gender: e.target.value })}
                    >
                      <option value="">Select…</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non_binary">Non-binary</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={lbl}>Short bio</label>
                  <textarea
                    className={inp + " resize-none"}
                    rows={3}
                    placeholder="Tell casting directors a bit about yourself…"
                    value={form.bio}
                    onChange={e => setForm({ ...form, bio: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSkipProfile}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 text-sm font-semibold text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm flex items-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: gradient }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Save & continue
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: DONE ── */}
          {stepId === "done" && (
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ background: gradient }}
              >
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">You're all set!</h2>
              <p className="text-zinc-500 dark:text-white/50 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                Your profile is ready. Start browsing open productions and apply for roles that fit you.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleFinish(true)}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{ background: gradient }}
                >
                  Browse open productions <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleFinish(false)}
                  className="w-full py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 text-sm font-semibold text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  Go to dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
