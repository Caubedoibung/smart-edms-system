import { Link, useLocation } from "react-router";
import {
    LayoutDashboard,
    PenTool,
    Settings,
    History,
    Users,
    Briefcase,
    ShieldAlert,
    Database,
    FileText,
    Trash2,
    Search,
    Bell,
    Command,
    Moon,
    Sun,
    User,
    Info,
    AlertTriangle,
    CheckCircle
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { UserRole } from "../../lib/types";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
    role: UserRole;
    user: any;
    notifications: any[];
}

export function Sidebar({ role, user, notifications }: SidebarProps) {
    const location = useLocation();
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
    const [showNotifications, setShowNotifications] = useState(false);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Định nghĩa các nhóm menu, lọc bỏ "Tài liệu cá nhân" cho Admin
    const NAV_GROUPS = {
        COMMON: [
            { name: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
            ...(role !== 'ADMIN' ? [{ name: "Tài liệu cá nhân", href: "/dashboard/files", icon: FileText }] : []),
            { name: "Kho phòng ban", href: "/dashboard/department", icon: Briefcase },
            ...(role !== 'ADMIN' ? [{ name: "Thùng rác", href: "/dashboard/recycle-bin", icon: Trash2 }] : []),
        ],
        MANAGER: [
            { name: "Danh sách trình ký", href: "/dashboard/approvals", icon: PenTool, badge: 8 },
            { name: "Quản lý chữ ký", href: "/dashboard/signatures", icon: ShieldAlert },
        ],
        ADMIN: [
            { name: "Quản lý người dùng", href: "/dashboard/users", icon: Users },
            { name: "Quản lý chữ ký", href: "/dashboard/signatures", icon: ShieldAlert },
            { name: "Log hệ thống", href: "/dashboard/audit-logs", icon: History },
            { name: "Kho tài liệu tổng", href: "/dashboard/storage", icon: Database },
            { name: "Cài đặt hệ thống", href: "/dashboard/settings", icon: Settings },
        ]
    };

    const toggleDarkMode = () => {
        const newDark = !isDark;
        setIsDark(newDark);
        if (newDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    };

    const renderLink = (item: any) => {
        const isActive = location.pathname === item.href || (item.href === '/dashboard' && location.pathname === '/');

        return (
            <Link
                key={item.href}
                to={item.href}
                className={cn(
                    "group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-300 relative",
                    isActive
                        ? "bg-primary/10 text-primary font-bold shadow-sm"
                        : "text-muted-foreground hover:bg-white/50 dark:hover:bg-white/5 hover:text-foreground"
                )}
            >
                <div className="flex items-center gap-3">
                    <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary transition-colors")} />
                    <span className="opacity-100">{item.name}</span>
                </div>
                {item.badge && (
                    <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                        {item.badge}
                    </span>
                )}
            </Link>
        );
    };

    return (
        <aside className="relative z-50 glass-panel border-r border-white/20 flex flex-col w-fit min-w-max h-full shrink-0">
            {/* Header Logo */}
            <div className="flex items-center px-6 py-5 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl cyber-gradient flex items-center justify-center shadow-neon shrink-0">
                        <span className="text-white font-black text-xs">EDMS</span>
                    </div>
                    <div>
                        <h1 className="font-black text-lg tracking-tighter leading-none gradient-text uppercase italic">Smart</h1>
                        <p className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase">Enterprise</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions / Header replacements */}
            <div className="px-4 py-4 border-b border-white/10 flex flex-col gap-3 shrink-0">
                <div className="relative group w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input type="text" placeholder="Tìm kiếm..." className="w-full h-9 pl-9 pr-2 rounded-xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm" />
                </div>
                <div className="flex items-center justify-between gap-2 px-1">
                    <button onClick={toggleDarkMode} className="p-2 rounded-xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 hover:border-primary/30 transition-all shadow-sm flex-1 flex justify-center items-center text-muted-foreground hover:text-foreground">
                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                    <div className="relative flex-1">
                        <button onClick={() => setShowNotifications(!showNotifications)} className="w-full p-2 rounded-xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 hover:border-primary/30 transition-all shadow-sm flex justify-center items-center text-muted-foreground hover:text-foreground">
                            <Bell className="w-4 h-4" />
                            {unreadCount > 0 && <span className="absolute top-1.5 right-[30%] w-2 h-2 rounded-full bg-destructive border-[1.5px] border-white animate-pulse" />}
                        </button>
                        
                        {/* Notifications Dropdown */}
                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -10, scale: 0.95 }}
                                    className="absolute left-[calc(100%+24px)] -top-24 w-80 glass-panel rounded-3xl shadow-2xl border border-white/60 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 overflow-visible z-[100]"
                                >
                                    {/* The Triangle Pointer - Centered vertically on the box side */}
                                    <div className="absolute top-[108px] -left-[12px] w-0 h-0 border-y-[12px] border-y-transparent border-r-[12px] border-r-white/95 dark:border-r-slate-900/95 drop-shadow-[-2px_0px_2px_rgba(0,0,0,0.1)]" />

                                    <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-white/5 rounded-t-3xl relative z-10">
                                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-800 dark:text-slate-100">Thông báo</h3>
                                        <span className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{unreadCount} mới</span>
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto scrollbar-hide relative z-10 bg-transparent rounded-b-3xl">
                                        {notifications.length === 0 ? (
                                            <div className="p-10 text-center text-muted-foreground">
                                                <Bell className="w-8 h-8 mx-auto opacity-20 mb-3" />
                                                <p className="text-xs font-bold dark:text-slate-400">Không có thông báo nào</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col">
                                                {notifications.map((notif, index) => (
                                                    <div key={notif.id} className={cn(
                                                        "p-4 border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group",
                                                        index === notifications.length - 1 && "border-0"
                                                    )}>
                                                        <div className="flex gap-3">
                                                            <div className={cn(
                                                                "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                                                                notif.type === 'info' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                                                                notif.type === 'warning' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                                                                notif.type === 'error' ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                                                                "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                                            )}>
                                                                {notif.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                                                                 notif.type === 'error' ? <AlertTriangle className="w-4 h-4" /> :
                                                                 notif.type === 'info' ? <Info className="w-4 h-4" /> :
                                                                 <CheckCircle className="w-4 h-4" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">{notif.title}</p>
                                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                                                                <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 mt-2">{notif.time}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Navigation Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
                <div className="space-y-1">
                    <h2 className="px-3 mb-2 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">Menu Chính</h2>
                    {NAV_GROUPS.COMMON.map(renderLink)}
                </div>

                {role === 'MANAGER' && (
                    <div className="space-y-1">
                        <h2 className="px-3 mb-2 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">Nghiệp vụ</h2>
                        {NAV_GROUPS.MANAGER.map(renderLink)}
                    </div>
                )}

                {role === 'ADMIN' && (
                    <div className="space-y-1">
                        <h2 className="px-3 mb-2 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">Quản trị</h2>
                        {NAV_GROUPS.ADMIN.map(renderLink)}
                    </div>
                )}
            </div>

            {/* User Profile Section */}
            <div className="p-4 border-t border-white/10 shrink-0">
                <div className="flex items-center gap-3 px-2 py-2 rounded-2xl hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                    <div className="relative shrink-0">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-xl object-cover border border-white/20 shadow-sm" />
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-sm">
                                <User className="w-5 h-5" />
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-10"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{user?.name || "Người dùng"}</h4>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest truncate">{user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'MANAGER' ? 'Trưởng phòng' : 'Nhân viên'}</p>
                    </div>
                    <Link to="/dashboard/settings" className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-white/60 dark:hover:bg-white/10 transition-all shrink-0" title="Cài đặt">
                        <Settings className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </aside>
    );
}
