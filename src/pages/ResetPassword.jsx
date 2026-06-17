import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { post } from "@/api/api";
import { Lock, Loader2, ChevronLeft, CheckCircle2, Eye, EyeOff, XCircle } from "lucide-react";
import { WebGLShader } from "@/components/ui/web-gl-shader";

const gradient = "linear-gradient(135deg, #ef4136, #fbb040)";

function StrengthBar({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#ef4136", "#f59e0b", "#3b82f6", "#10b981"];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? colors[score] : "#27272a" }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color: colors[score] || "#52525b" }}>
        {labels[score]}
      </p>
    </div>
  );
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      await post("/api/auth/reset-password", { resetToken, newPassword });
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  const panelContent = (
    <div className="relative z-20 flex h-full items-center justify-center p-4">
      <div className="relative border border-[#27272a] p-2 w-full max-w-md backdrop-blur-sm bg-black/20">
        <div className="relative border border-[#27272a] py-12 px-8 overflow-hidden text-center">
          <div className="mb-6 flex items-center justify-center text-3xl font-black tracking-tighter">
            <span style={{ background: gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>cine</span>
            CAST
          </div>
          <h1 className="mb-4 text-white text-4xl font-extrabold tracking-tighter">Choose a new<br />password</h1>
          <p className="text-white/60 text-sm leading-relaxed">
            Make it strong — at least 8 characters with a mix of letters, numbers, and symbols.
          </p>
        </div>
      </div>
    </div>
  );

  // ── invalid / missing token ──────────────────────────────────────────
  if (!resetToken) {
    return (
      <div className="relative min-h-screen grid lg:grid-cols-2 bg-black">
        <Link to="/login" className="absolute left-4 top-4 md:left-8 md:top-8 z-50 inline-flex items-center gap-2 text-sm font-medium text-white/50 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to login
        </Link>
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex border-r border-white/10 overflow-hidden">
          <div className="absolute inset-0 z-0"><WebGLShader /></div>
          <div className="absolute inset-0 bg-black/40 z-10" />
          {panelContent}
        </div>
        <div className="flex items-center justify-center py-12 lg:p-8">
          <div className="mx-auto flex w-full flex-col items-center justify-center space-y-4 sm:w-[380px] px-6 text-center">
            <XCircle className="w-12 h-12 text-red-400" />
            <h2 className="text-xl font-bold text-white">Invalid reset link</h2>
            <p className="text-sm text-white/40 leading-relaxed">
              This password reset link is missing or has already been used. Please request a new one.
            </p>
            <Link
              to="/forgot-password"
              className="mt-2 h-10 px-6 flex items-center justify-center font-bold uppercase tracking-wider text-white rounded-lg text-sm shadow-lg shadow-red-600/20 hover:opacity-90 transition-opacity"
              style={{ background: gradient }}
            >
              Request new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen grid lg:grid-cols-2 bg-black">
      <Link to="/login" className="absolute left-4 top-4 md:left-8 md:top-8 z-50 inline-flex items-center gap-2 text-sm font-medium text-white/50 hover:text-white transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to login
      </Link>

      {/* Left panel */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex border-r border-white/10 overflow-hidden">
        <div className="absolute inset-0 z-0"><WebGLShader /></div>
        <div className="absolute inset-0 bg-black/40 z-10" />
        {panelContent}
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center py-12 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px] px-6">

          {done ? (
            /* ── success state ── */
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.12)" }}>
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Password updated!</h2>
                <p className="mt-2 text-sm text-white/50 leading-relaxed">
                  Your password has been changed. Redirecting you to login…
                </p>
              </div>
              <Link to="/login" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">
                Go to login now →
              </Link>
            </div>
          ) : (
            /* ── form state ── */
            <>
              <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-white">Set new password</h1>
                <p className="text-sm text-white/40">Choose a password you haven't used before.</p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm border border-red-500/20">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* new password */}
                <div className="space-y-1">
                  <label htmlFor="password" className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    New password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      id="password"
                      type={showPass ? "text" : "password"}
                      autoComplete="new-password"
                      autoFocus
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full h-11 pl-10 pr-10 bg-zinc-900 border border-white/10 rounded-lg text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-500/50 transition-colors"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <StrengthBar password={newPassword} />
                </div>

                {/* confirm password */}
                <div className="space-y-1">
                  <label htmlFor="confirm" className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full h-11 pl-10 pr-10 bg-zinc-900 border border-white/10 rounded-lg text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-500/50 transition-colors"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-white rounded-lg text-sm shadow-lg shadow-red-600/20 hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ background: gradient }}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Updating…" : "Reset password"}
                </button>
              </form>

              <p className="text-center text-sm text-white/30">
                Link expired?{" "}
                <Link to="/forgot-password" className="text-white/60 hover:text-white underline underline-offset-4 transition-colors font-medium">
                  Request a new one
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
