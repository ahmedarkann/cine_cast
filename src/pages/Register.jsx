import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { post, setToken } from '@/api/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, ChevronLeft } from "lucide-react"; // Removed UserPlus as it's not used
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { WebGLShader } from "@/components/ui/web-gl-shader"; // Changed import to WebGLShader
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { usePageMeta } from "@/hooks/usePageMeta";

const gradient = "linear-gradient(135deg, #ef4136, #fbb040)";

export default function Register() {
  const { checkUserAuth } = useAuth();
  usePageMeta({ title: "Create Account" });
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  const cooldownRef = useRef(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    cooldownRef.current = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(cooldownRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(cooldownRef.current);
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await post('/api/auth/register', { email, password });
      setShowOtp(true);
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await post('/api/auth/verify-otp', { email, otpCode });
      if (result?.access_token) {
        setToken(result.access_token);
      }
      await checkUserAuth();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setResendSuccess(false);
    try {
      await post('/api/auth/resend-otp', { email });
      setResendSuccess(true);
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  return (
    <div className="relative min-h-screen grid lg:grid-cols-2 bg-black">
      {/* Back Button */}
      <Link
        to="/"
        className="absolute left-4 top-4 md:left-8 md:top-8 z-50 inline-flex items-center gap-2 text-sm font-medium text-white/50 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to home
      </Link>

      {/* Left Panel: Shader & Branding */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex border-r border-white/10 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <WebGLShader /> {/* Replaced ShaderAnimation with WebGLShader */}
        </div>
        <div className="absolute inset-0 bg-black/40 z-10" />

        <div className="relative z-20 flex h-full items-center justify-center p-4">
          <div className="relative border border-[#27272a] p-2 w-full max-w-md backdrop-blur-sm bg-black/20">
            <div className="relative border border-[#27272a] py-12 px-8 overflow-hidden text-center">
              <div className="mb-6 flex items-center justify-center text-3xl font-black tracking-tighter">
                <span style={{ background: gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>cine</span>
                CAST
              </div>
              <h1 className="mb-4 text-white text-4xl font-extrabold tracking-tighter">Join the Spotlight</h1>
              <p className="text-white/60 text-sm leading-relaxed mb-8">
                Become part of the largest database of performers in Slovakia and start your journey today.
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="relative flex h-3 w-3 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                </span>
                <p className="text-xs text-green-500 font-medium uppercase tracking-widest">Open for New Talents</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Form Area */}
      <div className="flex items-center justify-center py-12 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px] px-6">
          {showOtp ? (
            <>
              <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-white">Verify email</h1>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to <span className="text-white font-medium">{email}</span>
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                  {error}
                </div>
              )}

              {resendSuccess && !error && (
                <div className="p-3 rounded-lg bg-green-500/10 text-green-400 text-sm border border-green-500/20 text-center">
                  New code sent — check your inbox.
                </div>
              )}

              <div className="flex justify-center py-4">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={(v) => { setOtpCode(v); setError(""); }}
                  autoFocus
                >
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot index={0} className="bg-zinc-900 border-white/10 text-white h-12 w-10 md:w-12" />
                    <InputOTPSlot index={1} className="bg-zinc-900 border-white/10 text-white h-12 w-10 md:w-12" />
                    <InputOTPSlot index={2} className="bg-zinc-900 border-white/10 text-white h-12 w-10 md:w-12" />
                    <InputOTPSlot index={3} className="bg-zinc-900 border-white/10 text-white h-12 w-10 md:w-12" />
                    <InputOTPSlot index={4} className="bg-zinc-900 border-white/10 text-white h-12 w-10 md:w-12" />
                    <InputOTPSlot index={5} className="bg-zinc-900 border-white/10 text-white h-12 w-10 md:w-12" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={handleVerify}
                disabled={loading || otpCode.length < 6}
                className="w-full h-11 font-bold uppercase tracking-wider text-white shadow-lg shadow-red-600/20 hover:opacity-90"
                style={{ background: gradient }}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Account
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Didn't receive the code?{" "}
                {resendCooldown > 0 ? (
                  <span className="text-white/30">Resend in {resendCooldown}s</span>
                ) : (
                  <button onClick={handleResend} className="text-primary font-medium hover:underline">
                    Resend code
                  </button>
                )}
              </p>

              <p className="text-center text-xs text-white/30">
                Code expires in 30 minutes.
              </p>
            </>
          ) : (
            <>
              <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-white">Create an account</h1>
                <p className="text-sm text-muted-foreground">
                  Enter your details to register as a performer
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid gap-4 text-zinc-900 dark:text-white">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-white/70">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-zinc-900 border-white/10 text-white h-11"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" title="password" className="text-white/70">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-zinc-900 border-white/10 text-white h-11"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm" className="text-white/70">Confirm Password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-zinc-900 border-white/10 text-white h-11"
                    required
                  />
                </div>
                <Button disabled={loading} className="w-full h-11 font-bold uppercase tracking-wider mt-2 text-white shadow-lg shadow-red-600/20 hover:opacity-90" style={{ background: gradient }}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Get Started
                </Button>
              </form>

              <p className="px-8 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="underline underline-offset-4 hover:text-primary transition-colors font-medium">
                  Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}