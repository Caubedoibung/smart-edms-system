import { Link, useLocation } from "react-router";
import { cn } from "../../lib/utils";
import type { UserRole } from "../../lib/types";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gooeyToast as toast } from "goey-toast";
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
    Moon,
    Sun,
    User,
    CheckCircle2,
    AlertCircle,
    Info,
    Check
} from "lucide-react";

interface SidebarProps {
    role: UserRole;
    user: any;
    notifications: any[];
}

export function Sidebar({ role, user, notifications }: SidebarProps) {
    const location = useLocation();
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
    const [showNotifications, setShowNotifications] = useState(false);

    // Click outside to close notifications
    useEffect(() => {
        if (!showNotifications) return;
        const handleClick = () => setShowNotifications(false);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [showNotifications]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

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
            {/* Header Section: Logo + Theme + Notifications */}
            <div className="px-4 py-5 space-y-4 border-b border-white/10 shrink-0">
                <div className="flex items-center justify-between gap-4 px-2">
                    {/* Shrunken Logo */}
                    <div className="flex items-center gap-2 mr-2">
                        <div className="w-8 h-8 rounded-lg cyber-gradient flex items-center justify-center shadow-neon shrink-0">
                            <span className="text-white font-black text-[10px]">E</span>
                        </div>
                        <div>
                            <h1 className="font-black text-sm tracking-tighter leading-none gradient-text uppercase italic">Smart</h1>
                            <p className="text-[8px] font-bold text-muted-foreground tracking-[0.1em] uppercase opacity-60 leading-none">EDMS</p>
                        </div>
                    </div>

                    {/* Circular Actions */}
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={toggleDarkMode} 
                            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all shadow-sm"
                        >
                            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                        </button>
                        
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button 
                                onClick={() => setShowNotifications(!showNotifications)} 
                                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all shadow-sm"
                            >
                                <Bell className="w-3.5 h-3.5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-destructive border-[1.5px] border-white dark:border-slate-900 animate-pulse" />
                                )}
                            </button>
                            
                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: -10, scale: 0.95 }}
                                        className="absolute left-[calc(100%+24px)] top-0 w-80 glass-panel rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-2 border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-slate-900/98 overflow-visible z-[100]"
                                    >
                                        {/* The Triangle Pointer - Positioned at the top header area */}
                                        <div className="absolute top-[14px] -left-[14px] w-0 h-0 border-y-[10px] border-y-transparent border-r-[14px] border-r-slate-200 dark:border-r-slate-800" />
                                        <div className="absolute top-[14px] -left-[11px] w-0 h-0 border-y-[10px] border-y-transparent border-r-[14px] border-r-white dark:border-r-slate-900 z-10" />

                                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-white/5 rounded-t-3xl relative z-20">
                                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-800 dark:text-slate-100">Thông báo</h3>
                                            <span className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{unreadCount} mới</span>
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto scrollbar-hide p-2 relative z-20">
                                            {notifications.length === 0 ? (
                                                <div className="text-center text-muted-foreground p-6">
                                                    <Bell className="w-8 h-8 mx-auto opacity-20 mb-3" />
                                                    <p className="text-xs font-bold dark:text-slate-400">Không có thông báo mới</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {notifications.map(n => (
                                                        <div key={n.id} className={cn(
                                                            "p-3 rounded-2xl transition-colors hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer flex gap-3",
                                                            !n.isRead ? "bg-slate-50 dark:bg-white/5" : "opacity-70"
                                                        )}>
                                                            <div className={cn(
                                                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                                                n.type === 'info' ? "bg-blue-100 text-blue-600" :
                                                                n.type === 'warning' ? "bg-amber-100 text-amber-600" :
                                                                n.type === 'error' ? "bg-red-100 text-red-600" :
                                                                "bg-green-100 text-green-600"
                                                            )}>
                                                                {n.type === 'info' && <Info className="w-4 h-4" />}
                                                                {n.type === 'warning' && <AlertCircle className="w-4 h-4" />}
                                                                {n.type === 'error' && <ShieldAlert className="w-4 h-4" />}
                                                                {n.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start mb-0.5">
                                                                    <h4 className={cn("text-sm truncate", !n.isRead ? "font-bold text-slate-800 dark:text-slate-200" : "font-semibold text-slate-600 dark:text-slate-400")}>{n.title}</h4>
                                                                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5 ml-2"></span>}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{n.message}</p>
                                                                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase mt-1">{n.time}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="p-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                                                        <button 
                                                            onClick={() => {
                                                                setShowNotifications(false);
                                                                toast.success("Đã đánh dấu đọc tất cả");
                                                            }}
                                                            className="w-full py-2.5 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <Check className="w-4 h-4" /> Đánh dấu đã đọc
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Search Bar - Moved right below logo */}
                <div className="px-2">
                    <div className="relative group w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm nhanh..." 
                            className="w-full h-8 pl-9 pr-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm" 
                        />
                    </div>
                </div>
            </div>

            {/* Navigation Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
                <div className="space-y-1">
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
