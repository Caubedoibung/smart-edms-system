import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Users, 
    HardDrive, 
    Clock, 
    CheckCircle2, 
    FileText,
    Search,
    Filter,
    Eye,
    Zap,
    Download,
    ShieldAlert,
    X,
    Heart,
    MessageCircle,
    Send,
    MoreHorizontal,
    User,
    History,
    AtSign,
    TrendingUp,
    PieChart as PieChartIcon,
    BarChart3
} from "lucide-react";

import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    BarChart, Bar, 
} from 'recharts';

import { cn } from "../lib/utils";
import { SignerWorkspace } from "./SignerWorkspace";
import { getDashboardOverview, getSystemHealth, getDashboardStorage } from "../services/adminService";
import { getAuditLogs } from "../services/auditService";
import { getPosts, createPost, toggleLike, addComment } from "../services/feedService";
import { initSocket, disconnectSocket } from "../services/socketService";
import { gooeyToast as toast } from "goey-toast";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// --- Helper: Get User ID ---
const getUserId = (user: any): string | number => {
    if (!user) return 0;
    return user.id || user._id || 0;
};

// --- 1. ADMIN DASHBOARD ---
export function AdminDashboard({ onNavigate }: { user?: any, onNavigate: (path: string) => void }) {
    const [overview, setOverview] = useState({ totalFolders: 0, totalDocuments: 0, statusBreakdown: {} as any });
    const [storage, setStorage] = useState({ usedBytes: 0, usedGb: 0 });
    const [logs, setLogs] = useState<any[]>([]);
    const [health, setHealth] = useState<any>({ database: "OPTIMAL", "spring-boot": "OPTIMAL", minio: "OPTIMAL" });
    const [totalUsers, setTotalUsers] = useState(0);
    
    // Analytics State
    const [activityData, setActivityData] = useState<any[]>([]);
    const [storageByDept, setStorageByDept] = useState<any[]>([]);

    // Social Feed State
    const [posts, setPosts] = useState<any[]>([]);
    const [newPostContent, setNewPostContent] = useState("");

    useEffect(() => {
        getDashboardOverview().then(res => setOverview(res.data)).catch(console.error);
        getDashboardStorage().then(res => setStorage(res.data)).catch(console.error);
        getSystemHealth().then(res => setHealth(res.data)).catch(console.error);
        
        // Fetch new analytics data
        import("../services/adminService").then(m => {
            // Attempt to get activity stats, fallback to deriving from logs
            m.getActivityStats().then(res => setActivityData(res.data)).catch(() => {
                getAuditLogs({ limit: 100 }).then(auditRes => {
                    const logsData = Array.isArray(auditRes.data) ? auditRes.data : (auditRes.data as any)?.data || [];
                    const last7Days = Array.from({ length: 7 }, (_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
                    }).reverse();

                    const stats = last7Days.map(date => {
                        const dayLogs = logsData.filter((l: any) => 
                            new Date(l.timestamp || l.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) === date
                        );
                        return {
                            name: date,
                            uploads: dayLogs.filter((l: any) => l.action?.includes("UPLOAD")).length,
                            signs: dayLogs.filter((l: any) => l.action?.includes("SIGN")).length
                        };
                    });
                    setActivityData(stats);
                }).catch(() => setActivityData([]));
            });

            m.getStorageByDept().then(res => setStorageByDept(res.data)).catch(() => {
                // If API not ready, we show empty or let the chart handle empty array
                setStorageByDept([]);
            });
        });

        getAuditLogs({ limit: 6 }).then(res => {
            const auditData = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
            setLogs(auditData);
        }).catch(console.error);
        getPosts().then(res => setPosts(res.data || [])).catch(console.error);
        import("../services/userService").then(m => m.getOrgChart()).then(res => {
            if (Array.isArray(res.data)) setTotalUsers(res.data.length);
        }).catch(console.error);
    }, []);

    const statusData = [
        { name: 'Đang soạn', value: overview.statusBreakdown?.DRAFT || 0 },
        { name: 'Chờ duyệt', value: overview.statusBreakdown?.WAITING || 0 },
        { name: 'Đã ký', value: overview.statusBreakdown?.SIGNED || 0 },
        { name: 'Đã duyệt', value: overview.statusBreakdown?.APPROVED || 0 },
    ].filter(v => v.value > 0);

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!newPostContent.trim()) return;
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const authorId = getUserId(storedUser);
        
        if (authorId === 0) {
            toast.error("Lỗi xác thực", { description: "Không tìm thấy ID nhân viên. Vui lòng tải lại trang." });
            return;
        }

        try {
            const res = await createPost({ 
                content: newPostContent, 
                role: "ROLE_ADMIN",
                authorId: authorId,
                authorName: storedUser.fullName || storedUser.username,
                avatar: storedUser.avatar
            });
            if (res.data) setPosts([res.data, ...posts]);
            setNewPostContent("");
            toast.success("Đã đăng bảng tin");
        } catch (err) {
            console.error(err);
            toast.error("Không thể đăng bài");
        }
    };

    return (
        <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {[
                    { label: "Tổng lưu trữ", val: `${storage?.usedGb || 0} GB`, icon: HardDrive, color: "text-primary", bg: "bg-primary/10", border: "border-l-primary" },
                    { label: "Người dùng hệ thống", val: totalUsers, icon: Users, color: "text-accent", bg: "bg-accent/10", border: "border-l-accent" },
                    { label: "Tài liệu đã ký", val: overview?.statusBreakdown?.SIGNED || 0, icon: CheckCircle2, color: "text-success", bg: "bg-success/10", border: "border-l-success" },
                    { label: "Tiến trình chờ", val: overview?.statusBreakdown?.WAITING || 0, icon: Clock, color: "text-warning", bg: "bg-warning/10", border: "border-l-warning" }
                ].map((s, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn("glass-panel p-6 rounded-[32px] border-l-4 shadow-xl bg-white/40 dark:bg-white/5", s.border)}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn("p-3 rounded-2xl", s.bg, s.color)}>
                                <s.icon className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-success uppercase tracking-tighter">Realtime</span>
                        </div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{s.label}</p>
                        <h3 className="text-2xl font-black mt-1 gradient-text">{s.val}</h3>
                    </motion.div>
                ))}
            </div>

            {/* Analytics Spotlight */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-3 lg:col-span-1 glass-panel p-8 rounded-[40px] bg-white/60 dark:bg-white/5 border-white/40 shadow-xl min-h-[400px]">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black uppercase italic gradient-text flex items-center gap-3">
                                <TrendingUp className="w-6 h-6 text-primary" /> Hoạt động hệ thống
                            </h3>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1 ml-9">Thống kê tương tác 7 ngày gần nhất</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase">
                                <div className="w-2 h-2 rounded-full bg-primary" /> Tải file
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-[10px] font-black uppercase">
                                <div className="w-2 h-2 rounded-full bg-success" /> Ký duyệt
                            </div>
                        </div>
                    </div>
                    
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={activityData}>
                                <defs>
                                    <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorSigns" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 900, fill: '#888'}}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 900, fill: '#888'}}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800, fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="uploads" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorUploads)" />
                                <Area type="monotone" dataKey="signs" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorSigns)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution & Storage Charts */}
                <div className="glass-panel p-8 rounded-[40px] bg-white/60 dark:bg-white/5 border-white/40 shadow-xl">
                    <h3 className="text-lg font-black uppercase tracking-tighter mb-8 flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-accent" /> Phân bổ tài liệu
                    </h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData.length > 0 ? statusData : [{name: 'Trống', value: 1}]}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {statusData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend 
                                    verticalAlign="bottom" 
                                    align="center"
                                    iconType="circle"
                                    formatter={(value) => <span className="text-[10px] font-black uppercase text-muted-foreground ml-1">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-[40px] bg-white/60 dark:bg-white/5 border-white/40 shadow-xl">
                    <h3 className="text-lg font-black uppercase tracking-tighter mb-8 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-warning" /> Dung lượng theo bộ phận
                    </h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={storageByDept}>
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 9, fontWeight: 900, fill: '#888'}}
                                />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-[40px] bg-white/60 dark:bg-white/5 border-white/40 shadow-xl">
                    <h3 className="text-lg font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-primary" /> Trạng thái Server
                    </h3>
                    <div className="space-y-4">
                        {[
                            { label: "Database", status: health?.database === 'UP' ? "OPTIMAL" : (health?.database || "CHECKING") },
                            { label: "Backend", status: health?.["spring-boot"] === 'UP' ? "OPTIMAL" : (health?.["spring-boot"] || "CHECKING") },
                            { label: "MinIO", status: health?.minio === 'UP' ? "OPTIMAL" : (health?.minio || "CHECKING") }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10">
                                <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase">{item.label}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-success uppercase">{item.status}</span>
                                    <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Social Feed Section (Now more compact) */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="glass-panel p-8 rounded-[40px] bg-white/60 dark:bg-white/5 border-white/40 shadow-xl">
                        <h3 className="text-xl font-black italic uppercase gradient-text mb-6 flex items-center gap-3">
                            <AtSign className="w-6 h-6 text-primary" /> Bảng tin nội bộ
                        </h3>
                        
                        <form onSubmit={handleCreatePost} className="relative mb-8 group">
                            <textarea 
                                value={newPostContent}
                                onChange={e => setNewPostContent(e.target.value)}
                                placeholder="Thông báo điều gì đó cho toàn thể nhân viên..." 
                                className="w-full bg-white/50 dark:bg-slate-900/50 border border-white/60 dark:border-white/10 rounded-3xl p-6 pt-6 pb-16 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-inner min-h-[120px] resize-none dark:text-slate-200"
                            />
                            <button type="submit" disabled={!newPostContent.trim()} className="absolute bottom-4 right-4 px-6 py-2.5 rounded-2xl cyber-gradient text-white text-[10px] font-black uppercase shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                                ĐĂNG TIN
                            </button>
                        </form>

                        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                            {posts.length === 0 ? (
                                <div className="text-center py-10 opacity-40">Chưa có bài đăng nào.</div>
                            ) : (
                                posts.map(post => (
                                    <div key={post._id} className="p-6 rounded-3xl bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 hover:shadow-xl transition-all group">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden border-2 border-white dark:border-slate-800">
                                                {post.avatar ? <img src={post.avatar} alt="AV" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-primary" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="font-black text-sm dark:text-slate-200">{post.authorName} <span className="text-[10px] font-bold text-primary/60 ml-2 uppercase tracking-tighter bg-primary/5 px-2 py-0.5 rounded-md">ADMIN</span></h4>
                                                    <span className="text-[10px] font-bold text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line">{post.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Audit Mini */}
                <div className="space-y-6">
                    <div className="glass-panel p-8 rounded-[40px] bg-white/60 dark:bg-white/5 border-white/40 shadow-xl">
                        <h3 className="text-lg font-black uppercase tracking-tighter mb-6">Hoạt động mới nhất</h3>
                        <div className="space-y-4">
                            {(Array.isArray(logs) ? logs : []).slice(0, 6).map((log, i) => (
                                <div key={i} className="flex gap-3 pb-4 border-b border-white/40 dark:border-white/10 last:border-0 last:pb-0">
                                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                                        <History className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                                            <span className="text-primary font-black">{log.actorName || 'SYS'}:</span> {log.action}
                                        </p>
                                        <p className="text-[9px] font-black text-muted-foreground uppercase mt-0.5">{new Date(log.timestamp || log.createdAt).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => onNavigate('/dashboard/audit-logs')} className="w-full mt-6 py-3 rounded-2xl bg-slate-100 dark:bg-white/10 hover:bg-primary hover:text-white transition-all text-[10px] font-black uppercase tracking-widest dark:text-slate-300">
                            XEM TẤT CẢ LOG
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- 2. MANAGER DASHBOARD ---
export function ManagerDashboard({ user, onNavigate }: { user: any, onNavigate: (path: string) => void }) {
    const safeUser = user || { id: 'guest', name: 'Quản lý' };
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [files, setFiles] = useState<any[]>([]);
    const [signedFiles, setSignedFiles] = useState<any[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [showQuickSignModal, setShowQuickSignModal] = useState(false);
    
    // Filters state
    const [searchTerm, setSearchTerm] = useState("");

    // Quick Sign State
    const [selectedForQuickSign, setSelectedForQuickSign] = useState<string[]>([]);

    // View Modal State
    const [viewFileId, setViewFileId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const [pendingRes, signedRes, orgRes] = await Promise.all([
                import("../services/documentService").then(m => m.getPendingApprovals()),
                import("../services/documentService").then(m => m.searchDocuments({ status: "SIGNED" as any, size: 5 })),
                import("../services/userService").then(m => m.getOrgChart())
            ]);
            
            setFiles(Array.isArray(pendingRes.data) ? pendingRes.data : []);
            setSignedFiles(signedRes.data?.content || []);
            
            // Map contacts from org chart
            if (Array.isArray(orgRes.data)) {
                const staff = orgRes.data.map((u: any) => ({
                    id: String(u.id),
                    name: u.fullName || u.username,
                    role: u.jobTitle || u.role,
                    isOnline: false // Default to false until presence system is integrated
                })).filter((u: any) => u.id !== String(safeUser.id));
                setContacts(staff);
            }
        } catch (err) {
            console.error("ManagerDashboard fetchData err:", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSignSuccess = () => {
        toast.success("Ký duyệt thành công");
        fetchData();
    };

    const handleQuickSignConfirm = () => {
        toast.info("Tính năng ký hàng loạt đang được phát triển");
        setSelectedForQuickSign([]);
        setShowQuickSignModal(false);
    };

    const toggleQuickSignSelect = (id: string) => {
        setSelectedForQuickSign(prev => prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]);
    };

    const filteredFiles = files.filter(f => {
        const name = f.name || f.originalName || "";
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const fileToView = [...files, ...signedFiles].find(f => String(f.id) === viewFileId);

    const handleDownload = async (file: any) => {
        try {
            const docService = await import("../services/documentService");
            const res = await docService.getDocumentStreamUrl(file.id);
            const blob = new Blob([res.data], { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.name || file.originalName || "document.pdf");
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            toast.error("Không thể tải file");
        }
    };

    // --- Chat & Feed State ---
    const [posts, setPosts] = useState<any[]>([]);
    const [newPostContent, setNewPostContent] = useState("");
    const [newCommentText, setNewCommentText] = useState("");
    const [activeCommentPostId, setActiveCommentPostId] = useState<number | string | null>(null);

    const [contacts, setContacts] = useState<any[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);

    // Use onNavigate to avoid unused parameter warning
    const handleViewLogs = () => onNavigate('/dashboard/audit-logs');
    console.log("Chat system ready:", !!activeChatId || !!handleViewLogs);

    useEffect(() => {
        getPosts().then(res => setPosts(res.data || [])).catch(console.error);

        const socket = initSocket(safeUser.id);
        if (socket) {
            socket.on("NEW_POST", (post) => {
                setPosts(prev => [post, ...prev]);
            });
        }
        return () => disconnectSocket();
    }, [safeUser.id]);

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!newPostContent.trim()) return;
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const authorId = getUserId(storedUser);

        if (authorId === 0) {
            toast.error("Lỗi xác thực", { description: "Không tìm thấy ID nhân viên. Vui lòng tải lại trang." });
            return;
        }

        try {
            const res = await createPost({ 
                content: newPostContent, 
                role: "ROLE_MANAGER",
                authorId: authorId,
                authorName: storedUser.fullName || storedUser.username,
                avatar: storedUser.avatar
            });
            if (res.data) setPosts([res.data, ...posts]);
            setNewPostContent("");
            toast.success("Đã đăng bảng tin");
        } catch (err) {
            console.error(err);
            toast.error("Lỗi: Không thể đăng bài");
        }
    };

    const handleLike = async (postId: number | string) => {
        const userId = getUserId(safeUser);
        try {
            await toggleLike(postId, userId);
            setPosts(prev => prev.map(p => {
                if(p._id !== postId && p.id !== postId) return p;
                const isLiked = !(p.likes || []).includes(userId);
                const newLikes = isLiked ? [...(p.likes || []), userId] : (p.likes || []).filter((id:any) => id !== userId);
                return { ...p, likes: newLikes };
            }));
        } catch(err) {
            console.error(err);
        }
    };

    const handleSendComment = async (postId: number | string) => {
        if (!newCommentText.trim()) return;
        const userId = getUserId(safeUser);
        try {
            const res = await addComment(postId, { userId: userId, userName: safeUser.fullName || safeUser.username, content: newCommentText });
            if (res.data) {
                setPosts(prev => prev.map(p => (p._id === postId || p.id === postId) ? res.data : p));
            }
            setNewCommentText("");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700 pb-20">
            <AnimatePresence>
                {selectedFileId && (
                    <div className="fixed inset-0 z-[999]">
                        <SignerWorkspace 
                            fileId={selectedFileId} 
                            onClose={() => setSelectedFileId(null)} 
                            onSignSuccess={handleSignSuccess}
                        />
                    </div>
                )}

                {showFilters && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="glass-panel p-6 rounded-3xl shadow-sm border-white/60 mb-6 overflow-hidden bg-white/40 dark:bg-white/5"
                    >
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tìm kiếm tên tài liệu</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input 
                                        type="text" 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Nhập từ khóa..." 
                                        className="w-full bg-white/50 dark:bg-slate-900/50 border border-white/40 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-slate-200"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {showQuickSignModal && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl glass-panel rounded-[40px] p-8 lg:p-10 border-white/60 shadow-[0_32px_128px_rgba(0,0,0,0.4)] bg-white/95 dark:bg-slate-900/95 flex flex-col max-h-[80vh]"
                        >
                            <div className="flex justify-between items-center mb-6 shrink-0">
                                <div>
                                    <h3 className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-2 dark:text-white">
                                        <Zap className="w-6 h-6 text-primary" /> Ký nhanh hàng loạt
                                    </h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Chọn các tài liệu bạn muốn áp dụng chữ ký mặc định</p>
                                </div>
                                <button onClick={() => setShowQuickSignModal(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-all">
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-[300px]">
                                {files.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p className="font-bold">Không có tài liệu nào chờ duyệt.</p>
                                    </div>
                                ) : (
                                    files.map(file => (
                                        <div 
                                            key={file.id} 
                                            onClick={() => toggleQuickSignSelect(String(file.id))}
                                            className={cn(
                                                "p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4",
                                                selectedForQuickSign.includes(String(file.id)) ? "border-primary bg-primary/5" : "border-transparent bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors",
                                                selectedForQuickSign.includes(String(file.id)) ? "bg-primary border-primary text-white" : "border-slate-300"
                                            )}>
                                                {selectedForQuickSign.includes(String(file.id)) && <CheckCircle2 className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm dark:text-slate-200">{file.name || file.originalName}</h4>
                                                <p className="text-[10px] text-muted-foreground uppercase">{new Date(file.updatedAt || file.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="flex gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-white/10 shrink-0">
                                <button onClick={() => setShowQuickSignModal(false)} className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5 transition-all tracking-widest">Hủy</button>
                                <button 
                                    onClick={handleQuickSignConfirm} 
                                    disabled={selectedForQuickSign.length === 0}
                                    className="flex-[2] cyber-gradient py-4 rounded-2xl text-white font-black text-[10px] uppercase shadow-neon hover:scale-[1.02] active:scale-95 transition-all tracking-widest disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    Xác nhận ký ({selectedForQuickSign.length}) tài liệu
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {viewFileId && fileToView && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-4xl h-[85vh] glass-panel rounded-[40px] overflow-hidden border-white/60 shadow-[0_32px_128px_rgba(0,0,0,0.4)] bg-white dark:bg-slate-900 flex flex-col"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 text-primary rounded-xl"><FileText className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="font-black text-lg dark:text-white">{fileToView.name || fileToView.originalName}</h3>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Trạng thái: <span className={cn(fileToView.status === 'SIGNED' ? "text-success" : "text-warning")}>{fileToView.status}</span></p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleDownload(fileToView)} className="p-3 bg-primary text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                        <Download className="w-4 h-4" /> <span className="text-[10px] font-black uppercase hidden sm:inline">Tải Xuống</span>
                                    </button>
                                    <button onClick={() => setViewFileId(null)} className="p-3 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-all bg-slate-100 dark:bg-white/5">
                                        <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-200/50 dark:bg-slate-950/50 flex items-center justify-center p-8 overflow-auto">
                                <iframe 
                                    src={`https://pseudoeconomical-loise-interpolable.ngrok-free.dev/api/documents/${fileToView.id}/view`} 
                                    className="w-full h-full rounded-xl shadow-xl border-0 bg-white" 
                                    title="PDF Viewer" 
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic gradient-text">Trung tâm Phê duyệt</h2>
                    <p className="text-sm text-muted-foreground font-medium">Chào sếp <span className="text-primary font-black uppercase">{safeUser.fullName || safeUser.username}</span>. Bạn có tài liệu mới.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => setShowFilters(!showFilters)} className={cn("flex-1 sm:flex-none glass-panel px-5 py-3 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 transition-all shadow-sm", showFilters ? "bg-white dark:bg-white/10 border-primary text-primary" : "bg-white/40 dark:bg-white/5 border-white/60 hover:bg-white")}>
                        <Filter className="w-4 h-4" /> LỌC YÊU CẦU
                    </button>
                    <button onClick={() => setShowQuickSignModal(true)} className="flex-1 sm:flex-none cyber-gradient px-6 py-3 rounded-2xl text-[10px] font-black text-white flex items-center justify-center gap-2 shadow-neon hover:scale-105 transition-all">
                        <Zap className="w-4 h-4 fill-white" /> KÝ NHANH
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-4">
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Danh sách đợi duyệt ({filteredFiles.length})</h3>
                    {filteredFiles.length === 0 ? (
                        <div className="glass-panel p-12 rounded-[32px] text-center border-dashed border-2 border-white/60 bg-white/20">
                            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
                            <p className="font-bold text-lg dark:text-slate-200">Tuyệt vời! Đã duyệt xong hết.</p>
                            <p className="text-sm text-muted-foreground">Không có tài liệu nào cần bạn xử lý lúc này.</p>
                        </div>
                    ) : (
                        filteredFiles.map(file => (
                            <div key={file.id} className="glass-panel p-6 rounded-[32px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-primary/40 transition-all shadow-xl bg-white/40 dark:bg-white/5">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                        <FileText className="w-7 h-7" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-base dark:text-slate-200 truncate max-w-[200px] md:max-w-md">{file.name || file.originalName}</h4>
                                        <div className="flex items-center gap-3 mt-1 opacity-60">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">UID: {file.createdBy || file.userId}</span>
                                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(file.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedFileId(String(file.id))} className="flex-1 w-full sm:w-auto sm:flex-none px-8 py-3 rounded-xl cyber-gradient text-white text-[10px] font-black shadow-neon transition-all">
                                    MỞ TRÌNH KÝ
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="space-y-6">
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Đã ký gần đây</h3>
                    {(Array.isArray(signedFiles) ? signedFiles : []).slice(0, 5).map(file => (
                        <div key={file.id} className="glass-panel p-5 rounded-[24px] border-l-4 border-l-success shadow-lg bg-white/60 dark:bg-white/5 transition-transform hover:translate-x-1">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-start gap-3 text-success">
                                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span className="text-xs font-bold line-clamp-2 leading-tight dark:text-slate-300">{file.name || file.originalName}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200/50 dark:border-white/10">
                                <button onClick={() => setViewFileId(String(file.id))} className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[9px] font-black uppercase transition-colors flex items-center justify-center gap-1.5 dark:text-slate-300">
                                    <Eye className="w-3 h-3" /> Xem
                                </button>
                                <button onClick={() => handleDownload(file)} className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-primary hover:text-white text-primary transition-colors">
                                    <Download className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {signedFiles.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">Chưa có tài liệu nào được ký.</p>
                    )}
                </div>
            </div>

            {/* --- MANAGER NEWS FEED & CHAT --- */}
            <div className="pt-8 mt-8 border-t border-slate-200/50 dark:border-white/10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-3xl font-black tracking-tighter uppercase italic gradient-text">Bảng Tin & Giao Tiếp</h2>
                        <p className="text-sm text-muted-foreground font-medium mt-1">Quản lý thông báo và trao đổi trực tiếp với nhân viên</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass-panel p-6 rounded-[32px] bg-white/60 dark:bg-white/5 shadow-lg border-primary/20">
                            <form onSubmit={handleCreatePost} className="flex flex-col gap-3">
                                <textarea
                                    value={newPostContent}
                                    onChange={e => setNewPostContent(e.target.value)}
                                    placeholder="Đăng thông báo mới cho phòng ban..."
                                    className="w-full bg-white/80 dark:bg-slate-900/50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/30 resize-none min-h-[100px] shadow-inner dark:text-slate-200"
                                />
                                <div className="flex justify-end pt-2 border-t border-white/50 dark:border-white/10">
                                    <button type="submit" disabled={!newPostContent.trim()} className="px-6 py-2.5 rounded-xl cyber-gradient text-white text-xs font-black uppercase shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">
                                        <Send className="w-4 h-4" /> Đăng Thông Báo
                                    </button>
                                </div>
                            </form>
                        </div>

                        {posts.map(post => (
                            <div key={post._id || post.id} className="glass-panel rounded-[32px] p-0 overflow-hidden shadow-xl bg-white/60 dark:bg-white/5 border-white/40 dark:border-white/10">
                                <div className="p-6 flex justify-between items-start border-b border-white/40 dark:border-white/10 bg-white/20 dark:bg-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-black text-xl shadow-lg">
                                            {(post.authorName || post.author || '?').charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-base dark:text-slate-200">{post.authorName || post.author}</h4>
                                            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground mt-0.5">
                                                <span className="text-primary/70">{post.role === 'ROLE_ADMIN' ? 'Admin' : 'Quản lý'}</span>
                                                <span>•</span>
                                                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-full transition-colors">
                                        <MoreHorizontal className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>
                                <div className="p-6 text-sm leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300 font-medium">{post.content}</div>
                                <div className="px-6 py-4 flex items-center gap-6 border-t border-slate-100/50 dark:border-white/10">
                                    <button onClick={() => handleLike(post._id || post.id)} className={cn("flex items-center gap-2 text-xs font-black uppercase transition-all", (post.likes || []).includes(getUserId(safeUser)) ? "text-pink-500" : "text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200")}>
                                        <Heart className={cn("w-5 h-5", (post.likes || []).includes(getUserId(safeUser)) ? "fill-pink-500 scale-110" : "")} /> 
                                        {(post.likes || []).length} Yêu Thích
                                    </button>
                                    <button onClick={() => setActiveCommentPostId(activeCommentPostId === (post._id || post.id) ? null : (post._id || post.id))} className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground hover:text-primary transition-all">
                                        <MessageCircle className="w-5 h-5" /> {(post.comments || []).length} Bình Luận
                                    </button>
                                </div>
                                <AnimatePresence>
                                    {activeCommentPostId === (post._id || post.id) && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-slate-50/50 dark:bg-white/5 border-t border-slate-100/50 dark:border-white/10 overflow-hidden">
                                            <div className="p-6 space-y-4">
                                                {(post.comments || []).map((cmt: any, i: number) => (
                                                    <div key={i} className="flex gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center shrink-0 font-bold text-xs text-slate-500 dark:text-slate-400">{(cmt.userName || cmt.author || '?').charAt(0)}</div>
                                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none shadow-sm flex-1">
                                                            <div className="flex justify-between items-end mb-1">
                                                                <h5 className="font-bold text-xs dark:text-slate-200">{cmt.userName || cmt.author}</h5>
                                                                <span className="text-[9px] text-muted-foreground uppercase">{new Date(cmt.createdAt).toLocaleTimeString()}</span>
                                                            </div>
                                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{cmt.content || cmt.text}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="flex gap-2 pt-2 mt-4 border-t border-slate-200/50 dark:border-white/10">
                                                    <input type="text" value={newCommentText} onChange={e => setNewCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendComment(post._id || post.id)} placeholder="Viết bình luận..." className="flex-1 bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 shadow-inner dark:text-slate-200"/>
                                                    <button onClick={() => handleSendComment(post._id || post.id)} className="p-2.5 bg-primary text-white rounded-xl shadow-md hover:scale-105 transition-transform"><Send className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-6">
                        <div className="glass-panel p-6 rounded-[32px] bg-white/40 dark:bg-white/5 shadow-xl border-white/60 dark:border-white/10">
                            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-6">Nhân Viên Trực Tuyến</h3>
                            <div className="space-y-4">
                                {contacts.map(contact => (
                                    <div key={contact.id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400">{(contact.name || '?').charAt(0)}</div>
                                                {contact.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-white dark:border-slate-900 rounded-full shadow-sm" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold leading-none mb-1 dark:text-slate-200">{contact.name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">{contact.role}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setActiveChatId(contact.id)} className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100"><MessageCircle className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- 3. STAFF DASHBOARD ---
export function StaffDashboard({ user, onNavigate }: { user: any, onNavigate: (path: string) => void }) {
    const safeUser = user || { id: 'guest', name: 'Nhân viên' };
    const [posts, setPosts] = useState<any[]>([]);
    const [newCommentText, setNewCommentText] = useState("");
    const [activeCommentPostId, setActiveCommentPostId] = useState<number | string | null>(null);
    const [contacts, setContacts] = useState<any[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);

    // Use onNavigate and activeChatId to avoid unused variable errors
    const handleAction = () => {
        console.log("Dashboard action:", !!onNavigate || !!activeChatId);
    };
    useEffect(() => {
        handleAction();
    }, []);

    useEffect(() => {
        getPosts().then(res => setPosts(res.data || [])).catch(console.error);
        import("../services/userService").then(m => m.getOrgChart()).then(orgRes => {
            if (Array.isArray(orgRes.data)) {
                const staff = orgRes.data.map((u: any) => ({
                    id: String(u.id),
                    name: u.fullName || u.username,
                    role: u.jobTitle || u.role,
                    isOnline: Math.random() > 0.5
                })).filter((u: any) => u.id !== String(safeUser.id));
                setContacts(staff);
            }
        }).catch(console.error);
        const socket = initSocket(safeUser.id);
        if (socket) {
            socket.on("NEW_POST", (post) => setPosts(prev => [post, ...prev]));
        }
        return () => disconnectSocket();
    }, [safeUser.id]);

    const handleLike = async (postId: number | string) => {
        const userId = getUserId(safeUser);
        try {
            await toggleLike(postId, userId);
            setPosts(prev => prev.map(p => {
                if(p._id !== postId && p.id !== postId) return p;
                const isLiked = !(p.likes || []).includes(userId);
                const newLikes = isLiked ? [...(p.likes || []), userId] : (p.likes || []).filter((id:any) => id !== userId);
                return { ...p, likes: newLikes };
            }));
        } catch(err) { console.error(err); }
    };

    const handleSendComment = async (postId: number | string) => {
        if (!newCommentText.trim()) return;
        const userId = getUserId(safeUser);
        try {
            const res = await addComment(postId, { userId: userId, userName: safeUser.fullName || safeUser.username, content: newCommentText });
            if (res.data) setPosts(prev => prev.map(p => (p._id === postId || p.id === postId) ? res.data : p));
            setNewCommentText("");
        } catch (err) { console.error(err); }
    };

    return (
        <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700 pb-32">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40 dark:bg-white/5 glass-panel p-8 rounded-[40px] shadow-sm border-white/40 dark:border-white/10">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic gradient-text">Bảng Tin Nội Bộ</h2>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Tin tức và thông báo mới nhất từ ban quản trị</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {posts.map(post => (
                        <div key={post._id || post.id} className="glass-panel rounded-[32px] p-0 overflow-hidden shadow-xl bg-white/60 dark:bg-white/5 border-white/40 dark:border-white/10">
                            <div className="p-6 flex justify-between items-start border-b border-white/40 dark:border-white/10 bg-white/20 dark:bg-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-black text-xl shadow-lg">{(post.authorName || post.author || '?').charAt(0)}</div>
                                    <div>
                                        <h4 className="font-bold text-base dark:text-slate-200">{post.authorName || post.author}</h4>
                                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground mt-0.5">
                                            <span className="text-primary/70">{post.role === 'ROLE_ADMIN' ? 'Admin' : 'Quản lý'}</span>
                                            <span>•</span>
                                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 text-sm leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300 font-medium">{post.content}</div>
                            <div className="px-6 py-4 flex items-center gap-6 border-t border-slate-100/50 dark:border-white/10">
                                <button onClick={() => handleLike(post._id || post.id)} className={cn("flex items-center gap-2 text-xs font-black uppercase transition-all", (post.likes || []).includes(getUserId(safeUser)) ? "text-pink-500" : "text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200")}>
                                    <Heart className={cn("w-5 h-5", (post.likes || []).includes(getUserId(safeUser)) ? "fill-pink-500 scale-110" : "")} /> 
                                    {(post.likes || []).length} Yêu Thích
                                </button>
                                <button onClick={() => setActiveCommentPostId(activeCommentPostId === (post._id || post.id) ? null : (post._id || post.id))} className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground hover:text-primary transition-all">
                                    <MessageCircle className="w-5 h-5" /> {(post.comments || []).length} Bình Luận
                                </button>
                            </div>
                            <AnimatePresence>
                                {activeCommentPostId === (post._id || post.id) && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-slate-50/50 dark:bg-white/5 border-t border-slate-100/50 dark:border-white/10 overflow-hidden">
                                        <div className="p-6 space-y-4">
                                            {(post.comments || []).map((cmt: any, i: number) => (
                                                <div key={i} className="flex gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center shrink-0 font-bold text-xs text-slate-500">{(cmt.userName || cmt.author || '?').charAt(0)}</div>
                                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none shadow-sm flex-1">
                                                        <div className="flex justify-between items-end mb-1">
                                                            <h5 className="font-bold text-xs dark:text-slate-200">{cmt.userName || cmt.author}</h5>
                                                            <span className="text-[9px] text-muted-foreground uppercase">{new Date(cmt.createdAt).toLocaleTimeString()}</span>
                                                        </div>
                                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{cmt.content || cmt.text}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="flex gap-2 pt-2 mt-4 border-t border-slate-200/50 dark:border-white/10">
                                                <input type="text" value={newCommentText} onChange={e => setNewCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendComment(post._id || post.id)} placeholder="Viết bình luận..." className="flex-1 bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 shadow-inner dark:text-slate-200"/>
                                                <button onClick={() => handleSendComment(post._id || post.id)} className="p-2.5 bg-primary text-white rounded-xl shadow-md hover:scale-105 transition-transform"><Send className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>

                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-[32px] bg-white/40 dark:bg-white/5 shadow-xl border-white/60 dark:border-white/10">
                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-6">Nhân Viên Trực Tuyến</h3>
                        <div className="space-y-4">
                            {contacts.map(contact => (
                                <div key={contact.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400">{(contact.name || '?').charAt(0)}</div>
                                            {contact.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-white dark:border-slate-900 rounded-full shadow-sm" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold leading-none mb-1 dark:text-slate-200">{contact.name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">{contact.role}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setActiveChatId(contact.id)} className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100"><MessageCircle className="w-4 h-4" /></button>
                                </div>
                            ))}
                            {contacts.length === 0 && <p className="text-xs text-muted-foreground italic text-center py-4">Chưa có ai online.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
