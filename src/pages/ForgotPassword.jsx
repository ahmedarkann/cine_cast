import React, { useState } from "react";
import { Link } from "react-router-dom";
import { post } from "@/api/api";
import { Mail, Loader2, ChevronLeft, CheckCircle2 } from "lucide-react";
import { WebGLShader } from "@/components/ui/web-gl-shader";

const gradient = "linear-gradient(135deg, #ef4136, #fbb040)";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await post("/api/auth/reset-password-request", { email });
    } catch {
      // intentionally swallowed — always show success to prevent enumeration
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <div className="relative min-h-screen grid lg:grid-cols-2 bg-black">
      {/* Back */}
      <Link
        to="/login"
        className="absolute left-4 top-4 md:left-8 md:top-8 z-50 inline-flex items-center gap-2 text-sm font-medium text-white/50 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to login
      </Link>

      {/* Left panel — shader + branding */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex border-r border-white/10 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <WebGLShader />
        </div>
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div className="relative z-20 flex h-full items-center justify-center p-4">
          <div className="relative border border-[#27272a] p-2 w-full max-w-md backdrop-blur-sm bg-black/20">
            <div className="relative border border-[#27272a] py-12 px-8 overflow-hidden text-center">
              <div className="mb-6 flex items-center justify-center text-3xl font-black tracking-tighter">
                <span style={{ background: gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>cine</span>
                CAST
              </div>
              <h1 className="mb-4 text-white text-4xl font-extrabold tracking-tighter">Forgot your<br />password?</h1>
              <p className="text-white/60 text-sm leading-relaxed">
                No worries — happens to the best of us. Enter your email and we'll send you a secure link to create a new one.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center py-12 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px] px-6">

          {sent ? (
            /* ── success state ── */
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(239,65,54,0.12)" }}>
                <CheckCircle2 className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Check your inbox</h2>
                <p className="mt-2 text-sm text-white/50 leading-relaxed">
                  If an account exists for <span className="text-white font-medium">{email}</span>, you'll receive a password reset link shortly.
                </p>
                <p className="mt-1 text-xs text-white/30">The link expires in 1 hour. Check your spam folder if you don't see it.</p>
              </div>
              <Link
                to="/login"
                className="mt-2 text-sm font-semibold text-white/60 hover:text-white transition-colors"
              >
                ← Back to login
              </Link>
            </div>
          ) : (
            /* ── form state ── */
            <>
              <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-white">Reset your password</h1>
                <p className="text-sm text-white/40">
                  Enter the email linked to your account and we'll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm border border-red-500/20">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full h-11 pl-10 pr-4 bg-zinc-900 border border-white/10 rounded-lg text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-500/50 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-white rounded-lg text-sm shadow-lg shadow-red-600/20 hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ background: gradient }}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <p className="text-center text-sm text-white/30">
                Remember it after all?{" "}
                <Link to="/login" className="text-white/60 hover:text-white underline underline-offset-4 transition-colors font-medium">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
