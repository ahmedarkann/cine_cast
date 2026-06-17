import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { post, setToken } from '@/api/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, ChevronLeft } from "lucide-react"; // Removed LogIn as it's not used
import { WebGLShader } from "@/components/ui/web-gl-shader"; // Changed import to WebGLShader
import { useAuth } from "@/lib/AuthContext";
import { usePageMeta } from "@/hooks/usePageMeta";

const gradient = "linear-gradient(135deg, #ef4136, #fbb040)";

export default function Login() {
  const { isAuthenticated, checkUserAuth } = useAuth();
  usePageMeta({ title: "Sign In" });
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/profile");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await post('/api/auth/login', { email, password }); // Using the 'post' function from api.js
      setToken(result.access_token);
      
      // Refresh auth state and navigate smoothly
      await checkUserAuth();
      navigate("/profile");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
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
              <h1 className="mb-4 text-white text-4xl font-extrabold tracking-tighter">Connecting Talent</h1>
              <p className="text-white/60 text-sm leading-relaxed mb-8">
                Unleashing creativity through bold visuals and limitless possibilities in the world of cinema.
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="relative flex h-3 w-3 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                </span>
                <p className="text-xs text-green-500 font-medium uppercase tracking-widest">Available for New Projects</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="flex items-center justify-center py-12 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px] px-6">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
              {error}
            </div>
          )}

          <div className="grid gap-6">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-white/70">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      placeholder="name@example.com"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      disabled={loading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-zinc-900 border-white/10 text-white h-11"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" title="password" className="text-white/70">Password</Label>
                    <Link to="/forgot-password" size="sm" className="text-xs text-primary hover:underline font-medium">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      placeholder="••••••••"
                      type="password"
                      disabled={loading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-zinc-900 border-white/10 text-white h-11"
                      required
                    />
                  </div>
                </div>
                <Button disabled={loading} className="h-11 font-bold uppercase tracking-wider text-white shadow-lg shadow-red-600/20 hover:opacity-90" style={{ background: gradient }}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </div>
            </form>
          </div>

          <p className="px-8 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="underline underline-offset-4 hover:text-primary transition-colors font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
