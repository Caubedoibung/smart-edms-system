
import { Search, Bell, Command, User as     Moon, Sun, ChevronRight, Home, Info, AlertTriangle, CheckCircle } from "lucide-react";

import { useState } from "react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
    user: any;
    currentFolderId?: string | null;
    onBreadcrumbClick: (id: string | null) => void;
    isVisible: boolean;
}

export function Header({ user, currentFolderId, onBreadcrumbClick, isVisible }: HeaderProps) {
    const [isDark, setIsDark] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const getBreadcrumbs = () => {
        const paths: any[] = [];
        let currId = currentFolderId;
        while (currId && currId !== 'dept_root') {
            const folder: any = ([] as any[]).find(f => f.id === currId);
            if (folder) {
                paths.unshift(folder);
                currId = folder.parentId;
            } else break;
        }
        return paths;
    };

    const breadcrumbs = getBreadcrumbs();

    const toggleDarkMode = () => {
        const newDark = !isDark;
        setIsDark(newDark);
        if (newDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    };

    return (
        <header className={cn(
            "fixed top-0 right-0 z-40 glass-panel border-b border-white/20 flex items-center justify-between px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl transition-all duration-500 ease-[0.23,1,0.32,1]",
            isVisible ? "h-[var(--header-height)] opacity-100 translate-y-0" : "h-0 opacity-0 -translate-y-full overflow-hidden",
            "left-0" // We'll manage the left margin in MainLayout
        )}>
            
            <div className="flex items-center gap-4 min-w-0 flex-1">
                <nav className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 overflow-hidden">
                    <button onClick={() => onBreadcrumbClick(null)} className="flex items-center gap-1.5 hover:text-primary transition-colors shrink-0">
                        <Home className="w-3.5 h-3.5" />
                        <span>Kho số</span>
                    </button>
                    {breadcrumbs.length > 0 && <ChevronRight className="w-3 h-3 shrink-0 opacity-40" />}
                    {breadcrumbs.map((folder, idx) => (
                        <div key={folder.id} className="flex items-center gap-2 min-w-0">
                            <button onClick={() => onBreadcrumbClick(folder.id)} className={cn("truncate hover:text-primary transition-colors", idx === breadcrumbs.length - 1 ? "text-primary font-black" : "")}>
                                {folder.name}
                            </button>
                            {idx < breadcrumbs.length - 1 && <ChevronRight className="w-3 h-3 shrink-0 opacity-40" />}
                        </div>
                    ))}
                </nav>
            </div>

            <div className="flex-[2] max-w-2xl mx-6 hidden md:block">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input type="text" placeholder="Tìm nhanh... (Ctrl + K)" className="w-full h-12 pl-12 pr-16 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" />
                    <div className="absolute inset-y-0 right-4 flex items-center"><kbd className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 text-[10px] font-black text-muted-foreground"><Command className="w-2.5 h-2.5" /> K</kbd></div>
                </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4 shrink-0">
                <button onClick={toggleDarkMode} className="p-2.5 rounded-xl hover:bg-primary/10 transition-all">{isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
                <div className="relative">
                    <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2.5 rounded-xl bg-white/60 dark:bg-white/10 border border-white/40 dark:border-white/20 hover:border-primary/30 transition-all shadow-sm">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-destructive border-2 border-white animate-pulse" />
                    </button>

                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-4 w-80 lg:w-96 glass-panel rounded-2xl shadow-2xl border-white/60 bg-white/95 overflow-hidden z-[100]"
                            >
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <h3 className="font-black text-sm uppercase tracking-widest text-slate-800">Thông báo</h3>
                                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{0} mới</span>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                                    {/* eslint-disable-next-line no-constant-condition */}
                                    {false ? (
                                        <div className="p-8 text-center text-muted-foreground">
                                            <Bell className="w-8 h-8 mx-auto opacity-20 mb-3" />
                                            <p className="text-xs font-bold">Không có thông báo nào</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col">
                                            {([] as any[]).map((notif, index) => (
                                                <div key={notif.id} className={cn(
                                                    "p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group",
                                                    index === 0 - 1 && "border-0"
                                                )}>
                                                    <div className="flex gap-3">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                                            notif.type === 'info' ? "bg-blue-100 text-blue-600" :
                                                            notif.type === 'warning' ? "bg-amber-100 text-amber-600" :
                                                            notif.type === 'error' ? "bg-red-100 text-red-600" :
                                                            "bg-green-100 text-green-600"
                                                        )}>
                                                            {notif.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                                                             notif.type === 'error' ? <AlertTriangle className="w-4 h-4" /> :
                                                             notif.type === 'info' ? <Info className="w-4 h-4" /> :
                                                             <CheckCircle className="w-4 h-4" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-800 group-hover:text-primary transition-colors">{notif.title}</p>
                                                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                                                            <p className="text-[9px] font-black uppercase text-slate-400 mt-2">{notif.time}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 bg-slate-50/80 border-t border-slate-100 text-center">
                                    <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Xem tất cả</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className="flex items-center gap-3 pl-2 lg:pl-4 border-l border-white/10">
                    <div className="w-10 h-10 rounded-2xl p-0.5 cyber-gradient shadow-md ring-2 ring-white/50 hover:scale-105 transition-transform cursor-pointer">
                        <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover rounded-[14px]" />
                    </div>
                </div>
            </div>
        </header>
    );
}
