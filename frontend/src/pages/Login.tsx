import { useState } from "react";
import { useNavigate } from "react-router";
import {
  FileText,
  Lock,
  Mail,
  Shield,
  Sparkles,
  Eye,
  EyeOff,
  ArrowRight,
  Zap,
  Loader2,
} from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const resp = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || `Login failed: ${resp.status}`);
      }

      const data = await resp.json();
      // Save token and auth flag
      if (data && data.token) {
        sessionStorage.setItem("authToken", data.token);
        sessionStorage.setItem("isAuthenticated", "true");
        navigate("/dashboard");
      } else {
        throw new Error("Invalid login response");
      }
    } catch (err: any) {
      // Minimal error handling: show alert (can be replaced with UI feedback)
      alert(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.1)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#111827_1px,transparent_1px),linear-gradient(to_bottom,#111827_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 dark:bg-primary/15 rounded-full blur-[120px] opacity-40" />

      {/* Content container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Branding */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-3 mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl blur-xl opacity-50" />
                <div className="relative w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground">E-DMS</h1>
                <p className="text-sm text-muted-foreground">
                  Enterprise Document Management
                </p>
              </div>
            </div>

            <h2 className="text-5xl font-bold mb-6 leading-tight">
              <span className="text-foreground">The Ferrari of</span>
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Document Management
              </span>
            </h2>

            <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
              Experience luxury-grade document control with holographic
              interfaces, blockchain verification, and lightning-fast
              performance designed for C-level executives.
            </p>

            {/* Feature highlights */}
            <div className="space-y-4">
              {[
                { icon: Shield, text: "Blockchain-verified signatures" },
                { icon: Zap, text: "Real-time synchronization" },
                { icon: Sparkles, text: "AI-powered document analysis" },
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-foreground/80 group-hover:text-foreground transition-colors font-medium">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Login card */}
          <div className="relative">
            {/* Decorative glow */}
            <div className="absolute -inset-4 bg-gradient-to-br from-primary/15 to-accent/15 rounded-3xl blur-3xl opacity-40" />

            {/* Login card */}
            <div className="relative bg-surface/95 dark:bg-surface/40 backdrop-blur-2xl border-2 border-border rounded-3xl p-8 lg:p-10 shadow-2xl">
              {/* Mobile logo */}
              <div className="lg:hidden flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">E-DMS</h1>
                  <p className="text-xs text-muted-foreground">
                    Enterprise Document Management
                  </p>
                </div>
              </div>

              {/* Header */}
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-foreground mb-2">
                  Welcome back
                </h3>
                <p className="text-muted-foreground">
                  Sign in to access your document vault
                </p>
              </div>

              {/* Login form */}
              <form onSubmit={handleLogin} className="space-y-6">
                {/* Email input */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-foreground mb-2"
                  >
                    Email address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-4 w-5 h-5 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-background border-2 border-border rounded-xl px-12 py-3.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors font-medium"
                      placeholder="your.email@company.com"
                    />
                  </div>
                </div>

                {/* Password input */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-foreground mb-2"
                  >
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-4 w-5 h-5 text-muted-foreground" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-background border-2 border-border rounded-xl px-12 py-3.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors font-medium"
                      placeholder="••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember me & Forgot password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-2 border-border bg-background text-primary focus:ring-primary focus:ring-offset-0"
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-primary hover:text-accent transition-colors font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative w-full group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="relative bg-gradient-to-r from-primary to-accent rounded-xl px-6 py-4 flex items-center justify-center gap-2 font-bold text-white shadow-lg">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign in to E-DMS</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </button>
              </form>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-border text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button className="text-primary hover:text-accent transition-colors font-bold">
                    Request access
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </div>
  );
}
