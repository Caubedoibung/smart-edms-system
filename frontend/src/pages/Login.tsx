import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
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
    Zap
} from "lucide-react";

// Floating particle component
const FloatingParticle = ({ delay }: { delay: number }) => {
    const [randomX] = useState(() => Math.random() * 100);
    const [randomDuration] = useState(() => 20 + Math.random() * 20);

    return (
        <motion.div
            className="absolute w-1 h-1 bg-primary-from rounded-full"
            style={{
                left: `${randomX}%`,
                bottom: -20,
            }}
            animate={{
                y: [0, -800],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
            }}
            transition={{
                duration: randomDuration,
                repeat: Infinity,
                delay: delay,
                ease: "linear",
            }}
        />
    );
};

// 3D rotating ring component
const HolographicRing = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                animate={{
                    rotateY: [0, 360],
                    rotateX: [0, 20, 0],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                }}
                style={{
                    transformStyle: "preserve-3d",
                }}
            >
                <div className="w-[600px] h-[600px] border-2 border-primary-from/10 rounded-full blur-sm" />
                <div className="absolute inset-8 border-2 border-primary-to/10 rounded-full blur-sm" />
                <div className="absolute inset-16 border-2 border-primary-from/10 rounded-full blur-sm" />
            </motion.div>
        </div>
    );
};

export function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Mouse tracking for 3D tilt effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const rotateX = useTransform(mouseY, [-300, 300], [15, -15]);
    const rotateY = useTransform(mouseX, [-300, 300], [-15, 15]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const rect = document.getElementById("login-card")?.getBoundingClientRect();
            if (rect) {
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                mouseX.set(e.clientX - centerX);
                mouseY.set(e.clientY - centerY);
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate login delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Store auth state for this session (in real app, this would be handled by auth system)
        sessionStorage.setItem("isAuthenticated", "true");

        // Navigate to dashboard
        navigate("/dashboard");
        setIsLoading(false);
    };

    const springConfig = { damping: 20, stiffness: 300 };

    return (
        <div className="min-h-screen bg-background overflow-hidden relative transition-colors duration-300">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />

            {/* Grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.1)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#111827_1px,transparent_1px),linear-gradient(to_bottom,#111827_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden">
                {Array.from({ length: 30 }).map((_, i) => (
                    <FloatingParticle key={i} delay={i * 0.5} />
                ))}
            </div>

            {/* 3D Holographic rings */}
            <HolographicRing />

            {/* Radial glow effect */}
            <motion.div
                className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 dark:bg-primary-from/20 rounded-full blur-[120px]"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Content container */}
            <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
                <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">

                    {/* Left side - Branding */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ ...springConfig, delay: 0.2 }}
                        className="hidden lg:block"
                    >
                        <motion.div
                            animate={{
                                y: [0, -10, 0],
                            }}
                            transition={{
                                duration: 6,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <div className="relative">
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl blur-xl"
                                        animate={{
                                            opacity: [0.5, 1, 0.5],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                        }}
                                    />
                                    <div className="relative w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center">
                                        <FileText className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold text-foreground">
                                        E-DMS
                                    </h1>
                                    <p className="text-sm text-muted-foreground">Enterprise Document Management</p>
                                </div>
                            </div>

                            <h2 className="text-5xl font-bold mb-6 leading-tight">
                                <span className="text-foreground">
                                    The Ferrari of
                                </span>
                                <br />
                                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                    Document Management
                                </span>
                            </h2>

                            <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
                                Experience luxury-grade document control with holographic interfaces,
                                blockchain verification, and lightning-fast performance designed for C-level executives.
                            </p>

                            {/* Feature highlights */}
                            <div className="space-y-4">
                                {[
                                    { icon: Shield, text: "Blockchain-verified signatures" },
                                    { icon: Zap, text: "Real-time synchronization" },
                                    { icon: Sparkles, text: "AI-powered document analysis" },
                                ].map((feature, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ ...springConfig, delay: 0.4 + index * 0.1 }}
                                        className="flex items-center gap-3 group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
                                            <feature.icon className="w-5 h-5 text-primary" />
                                        </div>
                                        <span className="text-foreground/80 group-hover:text-foreground transition-colors font-medium">
                                            {feature.text}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Right side - Login card */}
                    <motion.div
                        id="login-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={springConfig}
                        style={{
                            rotateX,
                            rotateY,
                            transformStyle: "preserve-3d",
                        }}
                        className="relative"
                    >
                        {/* Holographic glow */}
                        <motion.div
                            className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl"
                            animate={{
                                opacity: [0.3, 0.6, 0.3],
                                scale: [1, 1.05, 1],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />

                        {/* Login card */}
                        <div className="relative bg-surface/95 dark:bg-surface/40 backdrop-blur-2xl border-2 border-border rounded-3xl p-8 lg:p-10 shadow-2xl">
                            {/* Mobile logo */}
                            <div className="lg:hidden flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground">E-DMS</h1>
                                    <p className="text-xs text-muted-foreground">Enterprise Document Management</p>
                                </div>
                            </div>

                            {/* Header */}
                            <div className="mb-8">
                                <motion.h3
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-3xl font-bold text-foreground mb-2"
                                >
                                    Welcome back
                                </motion.h3>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-muted-foreground"
                                >
                                    Sign in to access your document vault
                                </motion.p>
                            </div>

                            {/* Login form */}
                            <form onSubmit={handleLogin} className="space-y-6">
                                {/* Email input */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ ...springConfig, delay: 0.5 }}
                                >
                                    <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                                        Email address
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                        <div className="relative flex items-center">
                                            <Mail className="absolute left-4 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
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
                                </motion.div>

                                {/* Password input */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ ...springConfig, delay: 0.6 }}
                                >
                                    <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                                        Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                        <div className="relative flex items-center">
                                            <Lock className="absolute left-4 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
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
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-5 h-5" />
                                                ) : (
                                                    <Eye className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Remember me & Forgot password */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.7 }}
                                    className="flex items-center justify-between"
                                >
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
                                </motion.div>

                                {/* Submit button */}
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ ...springConfig, delay: 0.8 }}
                                    type="submit"
                                    disabled={isLoading}
                                    className="relative w-full group"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity"
                                        animate={{
                                            opacity: isLoading ? [0.5, 1, 0.5] : 0.5,
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: isLoading ? Infinity : 0,
                                        }}
                                    />
                                    <div className="relative bg-gradient-to-r from-primary to-accent rounded-xl px-6 py-4 flex items-center justify-center gap-2 font-bold text-white shadow-lg">
                                        {isLoading ? (
                                            <>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                                />
                                                <span>Signing in...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Sign in to E-DMS</span>
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </div>
                                </motion.button>
                            </form>

                            {/* Footer */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.9 }}
                                className="mt-8 pt-6 border-t border-border text-center"
                            >
                                <p className="text-sm text-muted-foreground">
                                    Don't have an account?{" "}
                                    <button className="text-primary hover:text-accent transition-colors font-bold">
                                        Request access
                                    </button>
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Bottom decorative elements */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>
    );
}
